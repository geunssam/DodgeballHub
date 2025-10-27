# 🏐 DodgeballHub - Phase 4: Firebase 마이그레이션 (상세)

## 📌 Phase 4 개요

**목표**: Mock Data → Firebase 완전 전환 및 프로덕션 배포
**기간**: 1주
**의존성**: Phase 1, 2, 3 완료 필수

---

## 🎯 Phase 4 완료 조건

- [ ] Firebase 프로젝트 생성 및 설정
- [ ] Firestore 데이터베이스 생성
- [ ] Security Rules 설정
- [ ] Authentication 연동
- [ ] Mock Data → Firebase SDK 교체
- [ ] 실시간 리스너 설정
- [ ] Vercel 배포
- [ ] E2E 테스트

---

## 📋 Step별 상세 계획

---

## Step 4-1: Firebase 프로젝트 설정

**예상 소요 시간**: 2시간

### 작업 내용

#### 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `dodgeball-hub`
4. Google Analytics 활성화 (선택)
5. 프로젝트 생성 완료

#### 2. Firebase SDK 설치

```bash
cd ~/Desktop/DodgeballHub/dodgeball-app
npm install firebase
```

#### 3. Firebase 설정 파일 생성 (`lib/firebase.ts`)

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// 서비스 인스턴스
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
```

#### 4. 환경 변수 설정 (`.env.local`)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 체크리스트
- [ ] Firebase 프로젝트 생성
- [ ] Firebase SDK 설치
- [ ] `lib/firebase.ts` 설정
- [ ] `.env.local` 환경 변수 설정
- [ ] `.gitignore`에 `.env.local` 추가

---

## Step 4-2: Firestore 데이터베이스 생성

**예상 소요 시간**: 1시간

### 작업 내용

#### 1. Firestore 데이터베이스 생성

1. Firebase Console → Firestore Database
2. "데이터베이스 만들기" 클릭
3. **테스트 모드로 시작** (나중에 Security Rules 설정)
4. 위치: `asia-northeast3 (서울)` 선택
5. 데이터베이스 생성 완료

#### 2. 컬렉션 구조 확인

Firebase Console에서 다음 컬렉션들이 자동 생성되도록 준비:

- `teachers`
- `classes`
- `students`
- `teams`
- `games`
- `customBadges`

### 체크리스트
- [ ] Firestore 데이터베이스 생성
- [ ] 서울 리전 선택
- [ ] 테스트 모드로 시작

---

## Step 4-3: Security Rules 설정

**예상 소요 시간**: 2시간

### 작업 내용

#### Firestore Security Rules

Firebase Console → Firestore → 규칙 탭에서 다음 규칙 설정:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 헬퍼 함수
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(teacherId) {
      return isSignedIn() && request.auth.uid == teacherId;
    }

    // Teachers 컬렉션
    match /teachers/{teacherId} {
      allow read: if isSignedIn();
      allow write: if isOwner(teacherId);
    }

    // Classes 컬렉션
    match /classes/{classId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isOwner(resource.data.teacherId);
    }

    // Students 컬렉션
    match /students/{studentId} {
      // 교사는 자기 학급 학생만 접근
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }

    // Teams 컬렉션
    match /teams/{teamId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }

    // Games 컬렉션
    match /games/{gameId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }

    // Custom Badges 컬렉션
    match /customBadges/{badgeId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
  }
}
```

### 체크리스트
- [ ] Security Rules 설정
- [ ] 교사만 데이터 수정 가능하도록 제한
- [ ] 규칙 테스트 (Firestore 규칙 시뮬레이터)

---

## Step 4-4: Firebase Authentication 연동

**예상 소요 시간**: 3시간

### 작업 내용

#### 1. Authentication 활성화

1. Firebase Console → Authentication
2. "시작하기" 클릭
3. 로그인 방법 → "이메일/비밀번호" 활성화
4. 저장

#### 2. Auth 서비스 생성 (`lib/authService.ts`)

```typescript
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Teacher } from '@/types';

/**
 * 교사 회원가입
 */
export async function signUpTeacher(email: string, password: string, name: string): Promise<User> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Firestore에 교사 정보 저장
    await setDoc(doc(db, 'teachers', user.uid), {
      id: user.uid,
      email,
      name,
      createdAt: new Date().toISOString()
    });

    return user;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

/**
 * 교사 로그인
 */
export async function signInTeacher(email: string, password: string): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

/**
 * 로그아웃
 */
export async function signOutTeacher(): Promise<void> {
  await signOut(auth);
}

/**
 * 현재 로그인한 교사 정보 가져오기
 */
export async function getCurrentTeacher(): Promise<Teacher | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const teacherDoc = await getDoc(doc(db, 'teachers', user.uid));
  if (!teacherDoc.exists()) return null;

  return teacherDoc.data() as Teacher;
}

/**
 * 인증 상태 변화 리스너
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
```

#### 3. Auth Context 생성 (`contexts/AuthContext.tsx`)

```typescript
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange } from '@/lib/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

#### 4. 로그인 페이지 업데이트

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInTeacher } from '@/lib/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TeacherLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      await signInTeacher(email, password);
      router.push('/teacher/dashboard');
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center">교사 로그인</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block mb-2">이메일</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-2">비밀번호</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button onClick={handleLogin} className="w-full">
            로그인
          </Button>
        </div>
      </div>
    </main>
  );
}
```

### 체크리스트
- [ ] Firebase Authentication 활성화
- [ ] `authService.ts` 구현
- [ ] AuthContext 생성
- [ ] 로그인/회원가입 페이지 연동
- [ ] 로그아웃 기능

---

## Step 4-5: Mock Data → Firebase SDK 교체

**예상 소요 시간**: 4시간

### 작업 내용

#### `lib/firebaseService.ts` 생성 (Mock Data Service 대체)

```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Class, Student, Team, Game, CustomBadge } from '@/types';

// ===== Classes =====
export async function getClasses(teacherId: string): Promise<Class[]> {
  const q = query(
    collection(db, 'classes'),
    where('teacherId', '==', teacherId),
    where('isArchived', '==', false)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
}

export async function getClassById(id: string): Promise<Class | null> {
  const docRef = doc(db, 'classes', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Class;
}

export async function createClass(data: Omit<Class, 'id' | 'createdAt'>): Promise<Class> {
  const docRef = await addDoc(collection(db, 'classes'), {
    ...data,
    createdAt: Timestamp.now().toDate().toISOString()
  });

  const newDoc = await getDoc(docRef);
  return { id: newDoc.id, ...newDoc.data() } as Class;
}

// ===== Students =====
export async function getStudents(classId: string): Promise<Student[]> {
  const q = query(
    collection(db, 'students'),
    where('classId', '==', classId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
}

export async function getStudentById(id: string): Promise<Student | null> {
  const docRef = doc(db, 'students', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Student;
}

export async function getStudentByAccessCode(code: string): Promise<Student | null> {
  const q = query(
    collection(db, 'students'),
    where('accessCode', '==', code)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Student;
}

export async function createStudent(data: Omit<Student, 'id' | 'createdAt'>): Promise<Student> {
  const docRef = await addDoc(collection(db, 'students'), {
    ...data,
    createdAt: Timestamp.now().toDate().toISOString()
  });

  const newDoc = await getDoc(docRef);
  return { id: newDoc.id, ...newDoc.data() } as Student;
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<Student> {
  const docRef = doc(db, 'students', id);
  await updateDoc(docRef, data);

  const updated = await getDoc(docRef);
  return { id: updated.id, ...updated.data() } as Student;
}

// ===== Teams =====
export async function getTeams(classId: string): Promise<Team[]> {
  const q = query(
    collection(db, 'teams'),
    where('classId', '==', classId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
}

export async function createTeam(data: Omit<Team, 'id' | 'createdAt'>): Promise<Team> {
  const docRef = await addDoc(collection(db, 'teams'), {
    ...data,
    createdAt: Timestamp.now().toDate().toISOString()
  });

  const newDoc = await getDoc(docRef);
  return { id: newDoc.id, ...newDoc.data() } as Team;
}

// ===== Games =====
export async function getGames(classId: string): Promise<Game[]> {
  const q = query(
    collection(db, 'games'),
    where('classId', '==', classId),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
}

export async function getGameById(id: string): Promise<Game | null> {
  const docRef = doc(db, 'games', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Game;
}

export async function createGame(data: Omit<Game, 'id' | 'createdAt'>): Promise<Game> {
  const docRef = await addDoc(collection(db, 'games'), {
    ...data,
    createdAt: Timestamp.now().toDate().toISOString()
  });

  const newDoc = await getDoc(docRef);
  return { id: newDoc.id, ...newDoc.data() } as Game;
}

export async function updateGame(id: string, data: Partial<Game>): Promise<Game> {
  const docRef = doc(db, 'games', id);
  await updateDoc(docRef, data);

  const updated = await getDoc(docRef);
  return { id: updated.id, ...updated.data() } as Game;
}

// ===== Custom Badges =====
export async function getCustomBadges(teacherId: string): Promise<CustomBadge[]> {
  const q = query(
    collection(db, 'customBadges'),
    where('teacherId', '==', teacherId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomBadge));
}

export async function createCustomBadge(data: Omit<CustomBadge, 'id' | 'createdAt'>): Promise<CustomBadge> {
  const docRef = await addDoc(collection(db, 'customBadges'), {
    ...data,
    createdAt: Timestamp.now().toDate().toISOString()
  });

  const newDoc = await getDoc(docRef);
  return { id: newDoc.id, ...newDoc.data() } as CustomBadge;
}
```

#### Import 교체

모든 파일에서:

```typescript
// Before (Mock)
import { getStudents, updateStudent } from '@/lib/dataService';

// After (Firebase)
import { getStudents, updateStudent } from '@/lib/firebaseService';
```

### 체크리스트
- [ ] `firebaseService.ts` 구현
- [ ] 모든 CRUD 함수 Firebase로 변경
- [ ] Import 구문 교체
- [ ] 기존 기능 정상 작동 확인

---

## Step 4-6: Vercel 배포

**예상 소요 시간**: 2시간

### 작업 내용

#### 1. Vercel 프로젝트 생성

1. [Vercel](https://vercel.com/) 로그인
2. "New Project" 클릭
3. GitHub 리포지토리 연결
4. 프로젝트 이름: `dodgeball-hub`
5. Framework Preset: Next.js
6. 배포

#### 2. 환경 변수 설정

Vercel 프로젝트 설정 → Environment Variables에서 추가:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

#### 3. 배포 완료

- Production URL 확인
- 커스텀 도메인 연결 (선택)

### 체크리스트
- [ ] Vercel 프로젝트 생성
- [ ] GitHub 리포지토리 연결
- [ ] 환경 변수 설정
- [ ] 배포 성공 확인
- [ ] Production URL 테스트

---

## ✅ Phase 4 최종 체크리스트

- [ ] Firebase 프로젝트 생성
- [ ] Firestore 데이터베이스 생성
- [ ] Security Rules 설정
- [ ] Authentication 활성화
- [ ] `firebaseService.ts` 구현
- [ ] Mock Data → Firebase 완전 교체
- [ ] 로그인/회원가입 연동
- [ ] Vercel 배포 성공
- [ ] Production 환경 테스트
- [ ] 모든 기능 정상 작동

---

## 🎉 프로젝트 완료!

축하합니다! DodgeballHub의 모든 Phase가 완료되었습니다.

### 다음 단계 (선택사항)
- PWA 변환 (오프라인 지원)
- 이미지 업로드 (학생 프로필 사진)
- 푸시 알림 (경기 시작 알림)
- 통계 대시보드 (Chart.js)

---

**작성일**: 2025-10-21
**버전**: 1.0
