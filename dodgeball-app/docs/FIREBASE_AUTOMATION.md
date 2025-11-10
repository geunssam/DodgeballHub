# 🔥 Firebase 자동화 마이그레이션 가이드

**작성일**: 2025-11-09
**목적**: Phase 7에서 Firebase CLI/MCP를 활용한 자동 설정

---

## 🎯 Phase 7 목표

localStorage → Firebase Firestore 자동 마이그레이션

**자동화 가능 항목**:
1. ✅ Firebase 프로젝트 생성
2. ✅ Firestore 보안 규칙 작성 및 배포
3. ✅ Firestore 인덱스 설정
4. ✅ 서비스 레이어 코드 생성
5. ✅ 데이터 마이그레이션 스크립트

---

## 📦 사전 준비

### 1. Firebase CLI 설치

```bash
# Firebase CLI 설치
npm install -g firebase-tools

# 버전 확인
firebase --version

# Firebase 로그인
firebase login
```

### 2. 환경 변수 준비

`.env.local` 파일 생성:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## 🚀 Step 1: Firebase 프로젝트 초기화

### 자동 초기화 스크립트

**파일**: `scripts/firebase-init.sh`

```bash
#!/bin/bash

echo "🔥 Firebase 프로젝트 초기화 시작..."

# Firebase 프로젝트 초기화
firebase init

# Firestore 선택
# - Firestore: Configure security rules and indexes
# - Authentication (선택)
# - Hosting (Vercel 사용 시 선택 안함)

# 기본 설정
# - firestore.rules: y
# - firestore.indexes.json: y
# - 기존 파일 덮어쓰기: n (이미 작성한 경우)

echo "✅ Firebase 초기화 완료"
```

### 실행

```bash
chmod +x scripts/firebase-init.sh
./scripts/firebase-init.sh
```

---

## 🔒 Step 2: Firestore 보안 규칙 작성

### `firestore.rules`

**파일**: `firestore.rules`

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // 헬퍼 함수: 인증된 사용자 확인
    function isAuthenticated() {
      return request.auth != null;
    }

    // 헬퍼 함수: 문서 소유자 확인
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // 헬퍼 함수: 읽기 권한 확인 (공유된 경우)
    function hasReadPermission(userId) {
      return isOwner(userId) ||
        exists(/databases/$(database)/documents/users/$(userId)/sharedWith/$(request.auth.uid));
    }

    // 헬퍼 함수: 쓰기 권한 확인 (공유된 경우)
    function hasWritePermission(userId) {
      return isOwner(userId) ||
        (exists(/databases/$(database)/documents/users/$(userId)/sharedWith/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(userId)/sharedWith/$(request.auth.uid)).data.canWrite == true);
    }

    // 사용자 프로필
    match /users/{userId} {
      allow read: if isAuthenticated() && (isOwner(userId) || hasReadPermission(userId));
      allow write: if isAuthenticated() && (isOwner(userId) || hasWritePermission(userId));

      // 학급
      match /classes/{classId} {
        allow read: if isAuthenticated() && (isOwner(userId) || hasReadPermission(userId));
        allow write: if isAuthenticated() && (isOwner(userId) || hasWritePermission(userId));

        // 학생
        match /students/{studentId} {
          allow read: if isAuthenticated() && (isOwner(userId) || hasReadPermission(userId));
          allow write: if isAuthenticated() && (isOwner(userId) || hasWritePermission(userId));
        }
      }

      // 팀
      match /teams/{teamId} {
        allow read: if isAuthenticated() && (isOwner(userId) || hasReadPermission(userId));
        allow write: if isAuthenticated() && (isOwner(userId) || hasWritePermission(userId));
      }

      // 진행 중 경기
      match /games/{gameId} {
        allow read: if isAuthenticated() && (isOwner(userId) || hasReadPermission(userId));
        allow write: if isAuthenticated() && (isOwner(userId) || hasWritePermission(userId));
      }

      // 완료된 경기
      match /finishedGames/{gameId} {
        allow read: if isAuthenticated() && (isOwner(userId) || hasReadPermission(userId));
        allow write: if isAuthenticated() && (isOwner(userId) || hasWritePermission(userId));
      }

      // 배지
      match /playerBadges/{playerId} {
        allow read: if isAuthenticated() && (isOwner(userId) || hasReadPermission(userId));
        allow write: if isAuthenticated() && (isOwner(userId) || hasWritePermission(userId));
      }

      // 커스텀 배지
      match /customBadges/{badgeId} {
        allow read: if isAuthenticated() && (isOwner(userId) || hasReadPermission(userId));
        allow write: if isAuthenticated() && (isOwner(userId) || hasWritePermission(userId));
      }

      // 공유 대상 목록
      match /sharedWith/{sharedUserId} {
        allow read: if isAuthenticated() && isOwner(userId);
        allow write: if isAuthenticated() && isOwner(userId);
      }

      // 설정
      match /settings/gameDefaults {
        allow read: if isAuthenticated() && (isOwner(userId) || hasReadPermission(userId));
        allow write: if isAuthenticated() && (isOwner(userId) || hasWritePermission(userId));
      }
    }

    // 학생 코드 매핑 (읽기 전용)
    match /studentCodes/{code} {
      allow read: if true;  // 학생이 코드로 로그인할 수 있도록
      allow write: if false;  // 교사만 생성 가능 (Cloud Function 사용)
    }

    // 권한 요청 (향후 공유 시스템용)
    match /permissions/{permissionId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
  }
}
```

### 배포

```bash
firebase deploy --only firestore:rules
```

---

## 📑 Step 3: Firestore 인덱스 설정

### `firestore.indexes.json`

**파일**: `firestore.indexes.json`

```json
{
  "indexes": [
    {
      "collectionGroup": "students",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "classId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "games",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "teacherId", "order": "ASCENDING" },
        { "fieldPath": "isCompleted", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "finishedGames",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "teacherId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "teams",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "teacherId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "playerBadges",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "playerId", "order": "ASCENDING" },
        { "fieldPath": "awardedAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### 배포

```bash
firebase deploy --only firestore:indexes
```

---

## 🔧 Step 4: Firebase 서비스 레이어 작성

### 4.1 Firebase 초기화

**파일**: `lib/firebase.ts`

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
```

---

### 4.2 Firestore 서비스 레이어

**파일**: `lib/firestoreService.ts`

```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Teacher, Class, Student, Team, Game, CustomBadge } from '@/types';

// 컬렉션 참조
const getUserRef = (userId: string) => doc(db, 'users', userId);
const getClassesRef = (userId: string) => collection(db, 'users', userId, 'classes');
const getStudentsRef = (userId: string) => collection(db, 'users', userId, 'students');
const getTeamsRef = (userId: string) => collection(db, 'users', userId, 'teams');
const getGamesRef = (userId: string) => collection(db, 'users', userId, 'games');

// ==================== 학급 관리 ====================

export async function getAllClasses(userId: string): Promise<Class[]> {
  const q = query(getClassesRef(userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
}

export async function getClassById(userId: string, classId: string): Promise<Class | null> {
  const docRef = doc(getClassesRef(userId), classId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Class : null;
}

export async function createClass(userId: string, data: Omit<Class, 'id'>): Promise<string> {
  const docRef = doc(getClassesRef(userId));
  await setDoc(docRef, {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateClass(userId: string, classId: string, data: Partial<Class>): Promise<void> {
  const docRef = doc(getClassesRef(userId), classId);
  await updateDoc(docRef, data);
}

export async function deleteClass(userId: string, classId: string): Promise<void> {
  const docRef = doc(getClassesRef(userId), classId);
  await deleteDoc(docRef);
}

// ==================== 학생 관리 ====================

export async function getAllStudents(userId: string): Promise<Student[]> {
  const q = query(getStudentsRef(userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
}

export async function getStudentsByClassId(userId: string, classId: string): Promise<Student[]> {
  const q = query(
    getStudentsRef(userId),
    where('classId', '==', classId),
    orderBy('number', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
}

export async function createStudent(userId: string, data: Omit<Student, 'id'>): Promise<string> {
  const docRef = doc(getStudentsRef(userId));
  await setDoc(docRef, {
    ...data,
    createdAt: Timestamp.now(),
  });

  // 학생 코드 매핑 추가
  if (data.accessCode) {
    const codeRef = doc(db, 'studentCodes', data.accessCode);
    await setDoc(codeRef, {
      studentId: docRef.id,
      userId,
    });
  }

  return docRef.id;
}

// ... (나머지 CRUD 함수들)

// ==================== 실시간 리스너 ====================

export function subscribeToClasses(
  userId: string,
  callback: (classes: Class[]) => void
): () => void {
  const q = query(getClassesRef(userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const classes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
    callback(classes);
  });
}

export function subscribeToStudents(
  userId: string,
  callback: (students: Student[]) => void
): () => void {
  const q = query(getStudentsRef(userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
    callback(students);
  });
}

// ... (나머지 구독 함수들)
```

---

### 4.3 인증 서비스

**파일**: `lib/authService.ts`

```typescript
import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function logout() {
  await signOut(auth);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export function onAuthStateChanged(callback: (user: any) => void) {
  return auth.onAuthStateChanged(callback);
}
```

---

### 4.4 AuthContext

**파일**: `contexts/AuthContext.tsx`

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithGoogle, logout } from '@/lib/authService';
import type { User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    await signInWithGoogle();
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## 🔄 Step 5: 데이터 마이그레이션 스크립트

### 마이그레이션 스크립트

**파일**: `scripts/migrate-to-firebase.ts`

```typescript
import { db } from '../lib/firebase';
import { STORAGE_KEYS } from '../lib/mockData';
import { createClass, createStudent, createTeam, createGame } from '../lib/firestoreService';

async function migrateLocalStorageToFirestore(userId: string) {
  console.log('🔄 마이그레이션 시작...');

  try {
    // 1. 학급 마이그레이션
    const classes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES) || '[]');
    console.log(`📚 학급 ${classes.length}개 마이그레이션 중...`);

    const classIdMap = new Map<string, string>();
    for (const cls of classes) {
      const newId = await createClass(userId, {
        ...cls,
        teacherId: userId,
      });
      classIdMap.set(cls.id, newId);
    }

    // 2. 학생 마이그레이션
    const students = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
    console.log(`👥 학생 ${students.length}명 마이그레이션 중...`);

    const studentIdMap = new Map<string, string>();
    for (const student of students) {
      const newClassId = classIdMap.get(student.classId);
      const newId = await createStudent(userId, {
        ...student,
        classId: newClassId || student.classId,
      });
      studentIdMap.set(student.id, newId);
    }

    // 3. 팀 마이그레이션
    const teams = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS) || '[]');
    console.log(`⚽ 팀 ${teams.length}개 마이그레이션 중...`);

    for (const team of teams) {
      await createTeam(userId, {
        ...team,
        teacherId: userId,
        members: team.members.map((m: any) => ({
          ...m,
          studentId: studentIdMap.get(m.studentId) || m.studentId,
        })),
      });
    }

    // 4. 경기 마이그레이션
    const games = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAMES) || '[]');
    console.log(`🏐 경기 ${games.length}개 마이그레이션 중...`);

    for (const game of games) {
      await createGame(userId, {
        ...game,
        teacherId: userId,
        records: game.records.map((r: any) => ({
          ...r,
          studentId: studentIdMap.get(r.studentId) || r.studentId,
        })),
      });
    }

    console.log('✅ 마이그레이션 완료!');
    console.log('📊 통계:', {
      학급: classes.length,
      학생: students.length,
      팀: teams.length,
      경기: games.length,
    });

    return true;
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    return false;
  }
}

export default migrateLocalStorageToFirestore;
```

---

## ✅ Phase 7 체크리스트

### Firebase 프로젝트 설정
- [ ] Firebase CLI 설치
- [ ] `firebase login` 실행
- [ ] `firebase init` 실행
- [ ] Firebase 프로젝트 생성 (콘솔)

### 보안 규칙 및 인덱스
- [ ] `firestore.rules` 작성
- [ ] `firestore.indexes.json` 작성
- [ ] `firebase deploy --only firestore:rules` 실행
- [ ] `firebase deploy --only firestore:indexes` 실행

### 코드 작성
- [ ] `lib/firebase.ts` - Firebase 초기화
- [ ] `lib/firestoreService.ts` - Firestore CRUD
- [ ] `lib/authService.ts` - 인증 서비스
- [ ] `contexts/AuthContext.tsx` - 인증 Context
- [ ] `contexts/GameContext.tsx` - 실시간 리스너

### 데이터 마이그레이션
- [ ] `scripts/migrate-to-firebase.ts` 작성
- [ ] 마이그레이션 스크립트 실행
- [ ] 데이터 검증

### 테스트
- [ ] Google 로그인 테스트
- [ ] 학급 생성/수정/삭제 테스트
- [ ] 학생 생성/수정/삭제 테스트
- [ ] 실시간 동기화 테스트
- [ ] 보안 규칙 테스트

---

## 🎉 마이그레이션 완료 후

1. **localStorage 데이터 백업**
   ```bash
   # 브라우저 콘솔에서
   const backup = {};
   for (let key in localStorage) {
     backup[key] = localStorage[key];
   }
   console.log(JSON.stringify(backup));
   ```

2. **Firebase 사용으로 전환**
   - `lib/dataService.ts`에서 `lib/firestoreService.ts`로 임포트 변경
   - 모든 컴포넌트에서 Firestore 서비스 사용

3. **실시간 동기화 활성화**
   - `GameContext`에서 실시간 리스너 설정
   - 여러 기기에서 동시 접속 테스트

---

**마지막 업데이트**: 2025-11-09
