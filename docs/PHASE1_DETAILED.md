# 🏐 DodgeballHub - Phase 1: MVP (프론트엔드 완성)

## 📌 Phase 1 개요

**목표**: Firebase 없이 완전히 작동하는 프론트엔드 완성
**기간**: 2-3주
**데이터 전략**: Mock Data (Firestore 구조와 완전히 동일하게 설계)
**핵심 원칙**: 마이그레이션 없이 Phase 4에서 import만 교체

---

## 🎯 Phase 1 완료 조건

- [x] Next.js 14 프로젝트 생성 및 초기 설정
- [x] Mock Data로 모든 기능 정상 작동
- [x] Firestore 구조와 100% 동일한 데이터 구조
- [x] 교사/학생 Mock 인증 시스템
- [x] 학급 및 학생 관리 CRUD
- [x] 드래그앤드롭 팀 편성
- [x] 경기 설정 (타이머, 사운드, 공 추가)
- [x] 피구 코트 UI (양쪽 내야/외야)
- [x] 실시간 하트 연동 (코트 ↔ 라인업)
- [x] 스탯 기록 시스템
- [x] 학생 페이지 (접근 코드 조회)
- [x] 모바일 반응형 레이아웃

---

## 📂 폴더 구조

```
dodgeball-app/
├── app/
│   ├── layout.tsx                 # 루트 레이아웃
│   ├── page.tsx                   # 홈 페이지 (교사/학생 선택)
│   ├── teacher/
│   │   ├── login/
│   │   │   └── page.tsx          # 교사 로그인 (Mock)
│   │   ├── dashboard/
│   │   │   └── page.tsx          # 교사 대시보드
│   │   ├── class/
│   │   │   ├── [classId]/
│   │   │   │   ├── page.tsx      # 학급 상세
│   │   │   │   ├── students/
│   │   │   │   │   └── page.tsx  # 학생 관리
│   │   │   │   └── game/
│   │   │   │       ├── setup/
│   │   │   │       │   └── page.tsx  # 경기 설정
│   │   │   │       └── play/
│   │   │   │           └── page.tsx  # 경기 진행
│   │   └── create-class/
│   │       └── page.tsx          # 학급 생성
│   └── student/
│       └── page.tsx               # 학생 페이지 (접근 코드)
├── components/
│   ├── ui/                        # shadcn/ui 컴포넌트
│   ├── teacher/
│   │   ├── ClassCard.tsx
│   │   ├── StudentCard.tsx
│   │   ├── TeamEditor.tsx
│   │   ├── GameSettings.tsx
│   │   ├── GameTimer.tsx
│   │   ├── DodgeballCourt.tsx
│   │   ├── ScoreBoard.tsx
│   │   ├── TeamLineup.tsx
│   │   └── QuickInputButtons.tsx
│   └── student/
│       ├── StudentDashboard.tsx
│       ├── BadgeCollection.tsx
│       └── StatsDisplay.tsx
├── lib/
│   ├── mockData.ts                # Mock Data (Firestore 구조 동일)
│   ├── dataService.ts             # 데이터 CRUD 함수 (추후 Firebase로 교체)
│   ├── soundService.ts            # 사운드 재생 로직
│   └── utils.ts                   # 유틸리티 함수
├── types/
│   └── index.ts                   # TypeScript 인터페이스 (Firestore와 동일)
├── hooks/
│   ├── useStudents.ts
│   ├── useGame.ts
│   └── useTimer.ts
└── public/
    └── sounds/                    # 커스텀 사운드 파일 저장소
```

---

## 📋 Step별 상세 계획

---

## Step 1-1: 프로젝트 초기 설정

**예상 소요 시간**: 1시간

### 작업 내용

#### 1. Next.js 14 프로젝트 생성
```bash
cd ~/Desktop/DodgeballHub
npx create-next-app@latest dodgeball-app --typescript --tailwind --app --no-src-dir
cd dodgeball-app
```

**설정 옵션**:
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ App Router
- ✅ No `src` directory
- ✅ Import alias (`@/*`)

#### 2. shadcn/ui 설치 및 확인
```bash
npx shadcn-ui@latest init
```

**필요한 컴포넌트 설치**:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add slider
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add select
```

#### 3. dnd-kit 설치
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

#### 4. 추가 패키지 설치
```bash
npm install date-fns           # 날짜 처리
npm install zustand            # 상태 관리 (선택사항)
npm install lucide-react       # 아이콘
```

#### 5. 폴더 구조 생성
```bash
mkdir -p components/ui
mkdir -p components/teacher
mkdir -p components/student
mkdir -p lib
mkdir -p types
mkdir -p hooks
mkdir -p public/sounds
```

### 체크리스트
- [ ] Next.js 14 프로젝트 생성 완료
- [ ] Tailwind CSS 정상 작동 확인
- [ ] shadcn/ui 컴포넌트 설치 완료
- [ ] dnd-kit 설치 완료
- [ ] 폴더 구조 생성 완료
- [ ] `npm run dev` 로컬 서버 정상 실행

---

## Step 1-2: TypeScript 타입 정의 (Firestore 구조 동일)

**예상 소요 시간**: 1시간

### 작업 내용

#### `types/index.ts` 생성

```typescript
// ===== 교사 =====
export interface Teacher {
  id: string;
  email: string;
  name: string;
  createdAt: string; // ISO 8601 형식
}

// ===== 학급 =====
export interface Class {
  id: string;
  teacherId: string;
  name: string;              // "5학년 3반"
  year: number;              // 2025
  isArchived: boolean;
  createdAt: string;
}

// ===== 학생 =====
export interface StudentStats {
  outs: number;
  passes: number;
  sacrifices: number;
  cookies: number;
  gamesPlayed: number;
  totalScore: number;
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  awardedAt: string;         // ISO 8601
  isAuto: boolean;
  reason?: string;
}

export interface Student {
  id: string;
  classId: string;
  name: string;
  number: number;            // 학생 번호
  classNumber: number;       // 반 번호
  accessCode: string;        // "3-5-김철수"
  stats: StudentStats;
  badges: Badge[];
  createdAt: string;
}

// ===== 팀 =====
export interface Team {
  id: string;
  classId: string;
  name: string;              // "팀 A"
  color: string;             // "red", "blue", etc.
  createdAt: string;
}

// ===== 경기 =====
export type OuterCourtRule =
  | "normal_catch_attack_right"       // 일반 옵션
  | "catch_revive_teammate"           // 공 잡으면 팀원 부활
  | "catch_self_life"                 // 공 잡으면 본인 하트 +1
  | "outer_hit_revive_self"           // 외야에서 아웃시키면 본인 부활
  | "outer_hit_revive_teammate";      // 외야에서 아웃시키면 팀원 부활

export interface BallAddition {
  minutesBefore: number;
}

export interface GameSettings {
  useOuterCourt: boolean;
  outerCourtRules: OuterCourtRule[];
  ballAdditions: BallAddition[];
}

export interface TeamMember {
  studentId: string;
  initialLives: number;
  currentLives: number;
  isInOuterCourt: boolean;
  position: "inner" | "outer";
}

export interface GameTeam {
  teamId: string;
  name: string;
  color: string;
  members: TeamMember[];
}

export interface GameRecord {
  studentId: string;
  outs: number;
  passes: number;
  sacrifices: number;
  cookies: number;
}

export interface Game {
  id: string;
  classId: string;
  date: string;              // ISO 8601
  duration: number;          // 분
  settings: GameSettings;
  currentBalls: number;
  teams: GameTeam[];
  records: GameRecord[];
  winner?: string;           // teamId
  isCompleted: boolean;
  createdAt: string;
}

// ===== 커스텀 배지 =====
export interface CustomBadge {
  id: string;
  teacherId: string;
  name: string;
  emoji: string;
  description: string;
  createdAt: string;
}

// ===== 자동 배지 조건 =====
export interface AutoBadgeCondition {
  id: string;
  name: string;
  emoji: string;
  condition: (stats: StudentStats) => boolean;
}
```

### 체크리스트
- [ ] `types/index.ts` 파일 생성
- [ ] 모든 인터페이스 Firestore 스키마와 일치 확인
- [ ] TypeScript strict mode 에러 없음

---

## Step 1-3: Mock Data 생성

**예상 소요 시간**: 1.5시간

### 작업 내용

#### `lib/mockData.ts` 생성

```typescript
import { Teacher, Class, Student, Team, Game, CustomBadge } from '@/types';

// ===== 교사 Mock Data =====
export const mockTeachers: Teacher[] = [
  {
    id: "teacher1",
    email: "teacher@school.com",
    name: "김교사",
    createdAt: new Date().toISOString()
  }
];

// ===== 학급 Mock Data =====
export const mockClasses: Class[] = [
  {
    id: "class1",
    teacherId: "teacher1",
    name: "5학년 3반",
    year: 2025,
    isArchived: false,
    createdAt: new Date().toISOString()
  }
];

// ===== 학생 Mock Data =====
export const mockStudents: Student[] = [
  {
    id: "student1",
    classId: "class1",
    name: "김철수",
    number: 5,
    classNumber: 3,
    accessCode: "3-5-김철수",
    stats: {
      outs: 12,
      passes: 8,
      sacrifices: 5,
      cookies: 15,
      gamesPlayed: 7,
      totalScore: 47 // (12*2) + (8*1) + (5*1.5) + (15*0.5)
    },
    badges: [],
    createdAt: new Date().toISOString()
  },
  {
    id: "student2",
    classId: "class1",
    name: "이영희",
    number: 7,
    classNumber: 3,
    accessCode: "3-7-이영희",
    stats: {
      outs: 5,
      passes: 15,
      sacrifices: 12,
      cookies: 8,
      gamesPlayed: 7,
      totalScore: 47
    },
    badges: [],
    createdAt: new Date().toISOString()
  },
  // 추가 학생 20명...
];

// ===== 팀 Mock Data =====
export const mockTeams: Team[] = [
  {
    id: "team1",
    classId: "class1",
    name: "팀 A",
    color: "red",
    createdAt: new Date().toISOString()
  },
  {
    id: "team2",
    classId: "class1",
    name: "팀 B",
    color: "blue",
    createdAt: new Date().toISOString()
  }
];

// ===== 경기 Mock Data =====
export const mockGames: Game[] = [];

// ===== 커스텀 배지 Mock Data =====
export const mockCustomBadges: CustomBadge[] = [];

// ===== LocalStorage 키 =====
export const STORAGE_KEYS = {
  TEACHERS: 'dodgeball_teachers',
  CLASSES: 'dodgeball_classes',
  STUDENTS: 'dodgeball_students',
  TEAMS: 'dodgeball_teams',
  GAMES: 'dodgeball_games',
  CUSTOM_BADGES: 'dodgeball_custom_badges',
  CURRENT_TEACHER: 'dodgeball_current_teacher'
};

// ===== 초기화 함수 =====
export function initializeMockData() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.TEACHERS)) {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(mockTeachers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(mockClasses));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(mockStudents));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TEAMS)) {
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(mockTeams));
  }
  if (!localStorage.getItem(STORAGE_KEYS.GAMES)) {
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(mockGames));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOM_BADGES)) {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_BADGES, JSON.stringify(mockCustomBadges));
  }
}
```

### 체크리스트
- [ ] `lib/mockData.ts` 파일 생성
- [ ] 최소 20명 학생 Mock Data 생성
- [ ] LocalStorage 초기화 함수 작성
- [ ] Mock Data 구조가 Firestore와 100% 일치

---

## Step 1-4: 데이터 서비스 레이어 (Firebase 준비)

**예상 소요 시간**: 2시간

### 작업 내용

#### `lib/dataService.ts` 생성

```typescript
import { Teacher, Class, Student, Team, Game, CustomBadge } from '@/types';
import { STORAGE_KEYS } from './mockData';

// ===== Helper Functions =====
function getFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ===== Teachers =====
export async function getTeachers(): Promise<Teacher[]> {
  return getFromStorage<Teacher>(STORAGE_KEYS.TEACHERS);
}

export async function getTeacherById(id: string): Promise<Teacher | null> {
  const teachers = await getTeachers();
  return teachers.find(t => t.id === id) || null;
}

// ===== Classes =====
export async function getClasses(teacherId: string): Promise<Class[]> {
  const classes = getFromStorage<Class>(STORAGE_KEYS.CLASSES);
  return classes.filter(c => c.teacherId === teacherId && !c.isArchived);
}

export async function getClassById(id: string): Promise<Class | null> {
  const classes = getFromStorage<Class>(STORAGE_KEYS.CLASSES);
  return classes.find(c => c.id === id) || null;
}

export async function createClass(data: Omit<Class, 'id' | 'createdAt'>): Promise<Class> {
  const classes = getFromStorage<Class>(STORAGE_KEYS.CLASSES);
  const newClass: Class = {
    ...data,
    id: `class_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  classes.push(newClass);
  saveToStorage(STORAGE_KEYS.CLASSES, classes);
  return newClass;
}

// ===== Students =====
export async function getStudents(classId: string): Promise<Student[]> {
  const students = getFromStorage<Student>(STORAGE_KEYS.STUDENTS);
  return students.filter(s => s.classId === classId);
}

export async function getStudentById(id: string): Promise<Student | null> {
  const students = getFromStorage<Student>(STORAGE_KEYS.STUDENTS);
  return students.find(s => s.id === id) || null;
}

export async function getStudentByAccessCode(code: string): Promise<Student | null> {
  const students = getFromStorage<Student>(STORAGE_KEYS.STUDENTS);
  return students.find(s => s.accessCode === code) || null;
}

export async function createStudent(data: Omit<Student, 'id' | 'createdAt'>): Promise<Student> {
  const students = getFromStorage<Student>(STORAGE_KEYS.STUDENTS);
  const newStudent: Student = {
    ...data,
    id: `student_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  students.push(newStudent);
  saveToStorage(STORAGE_KEYS.STUDENTS, students);
  return newStudent;
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<Student> {
  const students = getFromStorage<Student>(STORAGE_KEYS.STUDENTS);
  const index = students.findIndex(s => s.id === id);
  if (index === -1) throw new Error('Student not found');

  students[index] = { ...students[index], ...data };
  saveToStorage(STORAGE_KEYS.STUDENTS, students);
  return students[index];
}

// ===== Teams =====
export async function getTeams(classId: string): Promise<Team[]> {
  const teams = getFromStorage<Team>(STORAGE_KEYS.TEAMS);
  return teams.filter(t => t.classId === classId);
}

export async function createTeam(data: Omit<Team, 'id' | 'createdAt'>): Promise<Team> {
  const teams = getFromStorage<Team>(STORAGE_KEYS.TEAMS);
  const newTeam: Team = {
    ...data,
    id: `team_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  teams.push(newTeam);
  saveToStorage(STORAGE_KEYS.TEAMS, teams);
  return newTeam;
}

// ===== Games =====
export async function getGames(classId: string): Promise<Game[]> {
  const games = getFromStorage<Game>(STORAGE_KEYS.GAMES);
  return games.filter(g => g.classId === classId);
}

export async function createGame(data: Omit<Game, 'id' | 'createdAt'>): Promise<Game> {
  const games = getFromStorage<Game>(STORAGE_KEYS.GAMES);
  const newGame: Game = {
    ...data,
    id: `game_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  games.push(newGame);
  saveToStorage(STORAGE_KEYS.GAMES, games);
  return newGame;
}

export async function updateGame(id: string, data: Partial<Game>): Promise<Game> {
  const games = getFromStorage<Game>(STORAGE_KEYS.GAMES);
  const index = games.findIndex(g => g.id === id);
  if (index === -1) throw new Error('Game not found');

  games[index] = { ...games[index], ...data };
  saveToStorage(STORAGE_KEYS.GAMES, games);
  return games[index];
}

// ===== Custom Badges =====
export async function getCustomBadges(teacherId: string): Promise<CustomBadge[]> {
  const badges = getFromStorage<CustomBadge>(STORAGE_KEYS.CUSTOM_BADGES);
  return badges.filter(b => b.teacherId === teacherId);
}

export async function createCustomBadge(data: Omit<CustomBadge, 'id' | 'createdAt'>): Promise<CustomBadge> {
  const badges = getFromStorage<CustomBadge>(STORAGE_KEYS.CUSTOM_BADGES);
  const newBadge: CustomBadge = {
    ...data,
    id: `badge_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  badges.push(newBadge);
  saveToStorage(STORAGE_KEYS.CUSTOM_BADGES, badges);
  return newBadge;
}
```

**중요**: Phase 4에서 이 파일만 Firebase SDK로 교체하면 전체 앱이 Firebase와 연동됩니다!

### 체크리스트
- [ ] `lib/dataService.ts` 파일 생성
- [ ] CRUD 함수 모두 구현
- [ ] async/await 사용 (Firebase 대비)
- [ ] 에러 처리 추가

---

## Step 1-5: 인증 UI (Mock)

**예상 소요 시간**: 2시간

### 작업 내용

#### 1. 홈 페이지 (`app/page.tsx`)
```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold text-white">🏐 DodgeballHub</h1>
        <p className="text-xl text-white/90">초등학교 피구 경기 관리 시스템</p>

        <div className="flex gap-4">
          <Link href="/teacher/login">
            <Button size="lg" className="text-lg px-8 py-6">
              교사 로그인
            </Button>
          </Link>

          <Link href="/student">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-white">
              학생 페이지
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
```

#### 2. 교사 로그인 페이지 (`app/teacher/login/page.tsx`)
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { STORAGE_KEYS } from '@/lib/mockData';

export default function TeacherLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('teacher@school.com');
  const [password, setPassword] = useState('password');

  const handleLogin = () => {
    // Mock 로그인 (Phase 4에서 Firebase Auth로 교체)
    if (email === 'teacher@school.com' && password === 'password') {
      localStorage.setItem(STORAGE_KEYS.CURRENT_TEACHER, 'teacher1');
      router.push('/teacher/dashboard');
    } else {
      alert('로그인 실패!');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center">교사 로그인</h1>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button onClick={handleLogin} className="w-full">
            로그인
          </Button>
        </div>

        <p className="text-sm text-gray-500 text-center">
          Mock 계정: teacher@school.com / password
        </p>
      </div>
    </main>
  );
}
```

#### 3. 학생 접근 코드 입력 페이지 (`app/student/page.tsx`)
```typescript
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getStudentByAccessCode } from '@/lib/dataService';

export default function StudentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [student, setStudent] = useState(null);

  const handleSubmit = async () => {
    const foundStudent = await getStudentByAccessCode(code);
    if (foundStudent) {
      setStudent(foundStudent);
    } else {
      alert('접근 코드를 찾을 수 없습니다!');
    }
  };

  if (student) {
    return <StudentDashboard student={student} />;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center">학생 페이지</h1>

        <div className="space-y-4">
          <div>
            <Label htmlFor="code">접근 코드</Label>
            <Input
              id="code"
              placeholder="예: 3-5-김철수"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full">
            입장하기
          </Button>
        </div>

        <p className="text-sm text-gray-500 text-center">
          선생님께 받은 접근 코드를 입력하세요
        </p>
      </div>
    </main>
  );
}
```

### 체크리스트
- [ ] 홈 페이지 UI 완성
- [ ] 교사 로그인 페이지 완성
- [ ] 학생 접근 코드 페이지 완성
- [ ] Mock 인증 정상 작동
- [ ] 라우팅 정상 작동

---

## Step 1-6: 학급 및 학생 관리 UI

**예상 소요 시간**: 3시간

### 작업 내용

#### 1. 교사 대시보드 (`app/teacher/dashboard/page.tsx`)
- 학급 목록 카드 표시
- 학급 생성 버튼
- 로그아웃 버튼

#### 2. 학급 생성 페이지 (`app/teacher/create-class/page.tsx`)
- 학급명 입력 폼
- 연도 자동 설정 (2025)
- 생성 완료 후 대시보드로 리다이렉트

#### 3. 학생 관리 페이지 (`app/teacher/class/[classId]/students/page.tsx`)
- 학생 등록 폼 (반번호, 학생번호, 이름)
- 접근 코드 자동 생성 및 표시
- 학생 목록 그리드 레이아웃 (카드 형태)
- 각 카드: 이름, 번호, 대표 배지 1개 표시

### 컴포넌트

#### `components/teacher/StudentCard.tsx`
```typescript
import { Student } from '@/types';
import { Card } from '@/components/ui/card';

interface StudentCardProps {
  student: Student;
  onClick?: () => void;
}

export function StudentCard({ student, onClick }: StudentCardProps) {
  const topBadge = student.badges[0]; // 대표 배지

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl">👤</div>
        <div className="flex-1">
          <p className="font-bold">{student.name}</p>
          <p className="text-sm text-gray-500">
            {student.classNumber}반 {student.number}번
          </p>
        </div>
        {topBadge && (
          <div className="text-2xl" title={topBadge.name}>
            {topBadge.emoji}
          </div>
        )}
      </div>
    </Card>
  );
}
```

### 체크리스트
- [ ] 교사 대시보드 완성
- [ ] 학급 생성 기능 작동
- [ ] 학생 등록 기능 작동
- [ ] 접근 코드 자동 생성 확인
- [ ] 학생 카드 그리드 레이아웃 완성

---

## Step 1-7: 드래그앤드롭 팀 편성

**예상 소요 시간**: 4시간

### 작업 내용

#### 1. dnd-kit 설정
- Droppable 영역: 학급 전체, 팀 A, 팀 B...
- Draggable 요소: 학생 카드

#### 2. 팀 편성 UI (`components/teacher/TeamEditor.tsx`)
```typescript
import { useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { Student, Team } from '@/types';

export function TeamEditor({ students, teams }: { students: Student[], teams: Team[] }) {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  // assignments: { studentId: teamId }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const studentId = active.id as string;
    const teamId = over.id as string;

    setAssignments(prev => ({
      ...prev,
      [studentId]: teamId
    }));
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {/* 학급 전체 영역 */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-2">학급 전체</h3>
        <div className="grid grid-cols-4 gap-3">
          {students.filter(s => !assignments[s.id]).map(student => (
            <DraggableStudentCard key={student.id} student={student} />
          ))}
        </div>
      </div>

      {/* 팀 영역 */}
      {teams.map(team => (
        <DroppableTeamArea
          key={team.id}
          team={team}
          students={students.filter(s => assignments[s.id] === team.id)}
        />
      ))}
    </DndContext>
  );
}
```

#### 3. 랜덤 팀 편성
```typescript
function randomTeamAssignment(students: Student[], teamsCount: number, playersPerTeam: number) {
  const available = [...students];
  const assignments: Record<string, string> = {};

  for (let i = 0; i < teamsCount; i++) {
    for (let j = 0; j < playersPerTeam; j++) {
      const randomIndex = Math.floor(Math.random() * available.length);
      const student = available.splice(randomIndex, 1)[0];
      assignments[student.id] = `team${i + 1}`;
    }
  }

  return assignments;
}
```

### 체크리스트
- [ ] dnd-kit 드래그앤드롭 작동
- [ ] 학생 카드를 팀 영역으로 이동 가능
- [ ] 팀별 인원수 실시간 표시
- [ ] 랜덤 팀 편성 기능 작동
- [ ] 모바일 터치 지원 확인

---

## Step 1-8: 경기 설정 UI

**예상 소요 시간**: 3시간

### 작업 내용

#### `app/teacher/class/[classId]/game/setup/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { GameSettings, BallAddition } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

export default function GameSetupPage() {
  const [duration, setDuration] = useState(10); // 분
  const [ballAdditions, setBallAdditions] = useState<BallAddition[]>([
    { minutesBefore: 3 }
  ]);
  const [outerCourtRules, setOuterCourtRules] = useState<string[]>([
    'normal_catch_attack_right'
  ]);

  const addBallAddition = () => {
    setBallAdditions([...ballAdditions, { minutesBefore: 1 }]);
  };

  const removeBallAddition = (index: number) => {
    setBallAdditions(ballAdditions.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">경기 설정</h1>

      {/* 경기 시간 */}
      <div>
        <label className="block font-bold mb-2">경기 시간 (분)</label>
        <Input
          type="number"
          min={1}
          max={60}
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
        />
      </div>

      {/* 공 추가 설정 */}
      <div>
        <label className="block font-bold mb-2">공 추가 설정</label>
        {ballAdditions.map((addition, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <Input
              type="number"
              value={addition.minutesBefore}
              onChange={(e) => {
                const newAdditions = [...ballAdditions];
                newAdditions[index].minutesBefore = parseInt(e.target.value);
                setBallAdditions(newAdditions);
              }}
            />
            <span className="self-center">분 전</span>
            <Button variant="outline" onClick={() => removeBallAddition(index)}>
              삭제
            </Button>
          </div>
        ))}
        <Button variant="outline" onClick={addBallAddition}>
          + 공 추가 타이밍 추가
        </Button>
      </div>

      {/* 외야 규칙 */}
      <div>
        <label className="block font-bold mb-2">외야 규칙</label>
        <div className="space-y-2">
          <Checkbox
            label="일반 옵션 (던진 공 잡으면 공격권만 소유)"
            checked={outerCourtRules.includes('normal_catch_attack_right')}
            onCheckedChange={(checked) => {
              // 체크박스 로직
            }}
          />
          {/* 나머지 규칙들... */}
        </div>
      </div>

      <Button onClick={handleStartGame} size="lg" className="w-full">
        경기 시작
      </Button>
    </div>
  );
}
```

### 체크리스트
- [ ] 경기 시간 설정 UI 완성
- [ ] 공 추가 타이밍 N개 추가/삭제 기능
- [ ] 외야 규칙 다중 선택 UI
- [ ] 각 학생별 하트 개수 설정 UI
- [ ] 경기 시작 버튼 작동

---

## Step 1-9: 타이머 & 사운드 시스템

**예상 소요 시간**: 4시간

### 작업 내용

#### 1. 타이머 컴포넌트 (`components/teacher/GameTimer.tsx`)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { playBeep, playCountdownBeep } from '@/lib/soundService';

interface GameTimerProps {
  duration: number; // 초 단위
  ballAdditions: { minutesBefore: number }[];
  onBallAddition: () => void;
  onGameEnd: () => void;
}

export function GameTimer({ duration, ballAdditions, onBallAddition, onGameEnd }: GameTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const [triggeredAdditions, setTriggeredAdditions] = useState<number[]>([]);

  useEffect(() => {
    if (isPaused || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        const newTime = prev - 1;

        // 공 추가 타이밍 체크
        ballAdditions.forEach((addition, index) => {
          const triggerTime = addition.minutesBefore * 60;
          if (newTime === triggerTime && !triggeredAdditions.includes(index)) {
            playBeep();
            onBallAddition();
            setTriggeredAdditions([...triggeredAdditions, index]);
          }
        });

        // 종료 10초 전 연속 비프음
        if (newTime <= 10 && newTime > 0) {
          playCountdownBeep();
        }

        // 경기 종료
        if (newTime === 0) {
          onGameEnd();
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, remainingSeconds, ballAdditions, triggeredAdditions]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-center space-y-4">
      <div className="text-6xl font-bold">
        ⏱️ {formatTime(remainingSeconds)}
      </div>

      <div className="flex gap-2 justify-center">
        <Button onClick={() => setIsPaused(!isPaused)}>
          {isPaused ? '재개' : '일시정지'}
        </Button>
        <Button variant="destructive" onClick={onGameEnd}>
          종료
        </Button>
      </div>
    </div>
  );
}
```

#### 2. 사운드 서비스 (`lib/soundService.ts`)

```typescript
// Web Audio API를 사용한 비프음 생성
const audioContext = typeof window !== 'undefined' ? new AudioContext() : null;

export function playBeep(frequency = 800, duration = 200) {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';

  const volume = parseFloat(localStorage.getItem('dodgeball_volume') || '0.5');
  gainNode.gain.value = volume;

  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration / 1000);
}

export function playCountdownBeep() {
  playBeep(1000, 150);
}

export function playCustomSound(audioElement: HTMLAudioElement) {
  const volume = parseFloat(localStorage.getItem('dodgeball_volume') || '0.5');
  audioElement.volume = volume;
  audioElement.play();
}

export function setVolume(value: number) {
  localStorage.setItem('dodgeball_volume', value.toString());
}

export function getVolume(): number {
  return parseFloat(localStorage.getItem('dodgeball_volume') || '0.5');
}
```

#### 3. 사운드 설정 UI (`components/teacher/SoundSettings.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { setVolume, getVolume, playBeep } from '@/lib/soundService';

export function SoundSettings() {
  const [volume, setVolumeState] = useState(getVolume() * 100);
  const [customSound, setCustomSound] = useState<File | null>(null);

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolumeState(value[0]);
    setVolume(newVolume);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'audio/mp3' || file.type === 'audio/wav')) {
      setCustomSound(file);
      // 파일을 /public/sounds/에 저장하는 로직 (서버 필요)
    } else {
      alert('.mp3 또는 .wav 파일만 업로드 가능합니다!');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block font-bold mb-2">볼륨 조절</label>
        <div className="flex gap-4 items-center">
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="w-12 text-right">{Math.round(volume)}%</span>
        </div>
        <Button onClick={() => playBeep()} className="mt-2">
          테스트
        </Button>
      </div>

      <div>
        <label className="block font-bold mb-2">커스텀 사운드</label>
        <input
          type="file"
          accept=".mp3,.wav"
          onChange={handleFileUpload}
        />
        {customSound && (
          <div className="mt-2">
            <p className="text-sm text-gray-600">{customSound.name}</p>
            <Button variant="outline" onClick={() => setCustomSound(null)}>
              삭제
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 체크리스트
- [ ] 타이머 컴포넌트 완성 (text-6xl)
- [ ] Web Audio API 비프음 작동
- [ ] 공 추가 시 비프음 1회 재생
- [ ] 종료 10초 전 연속 비프음 (매 초)
- [ ] 볼륨 조절 슬라이더 작동
- [ ] 커스텀 사운드 업로드 UI
- [ ] 일시정지 시 타이머 정지
- [ ] 재개 시 정확히 이어짐

---

## Step 1-10: 피구 코트 UI - 가로 구조 (핵심!)

**예상 소요 시간**: 5시간

### 작업 내용

#### `components/teacher/DodgeballCourt.tsx` - 가로 레이아웃

```typescript
'use client';

import { GameTeam, TeamMember, Student } from '@/types';

interface DodgeballCourtProps {
  teams: GameTeam[];
  students: Student[];
  onStudentClick: (studentId: string) => void;
}

export function DodgeballCourt({ teams, students, onStudentClick }: DodgeballCourtProps) {
  const getStudentById = (id: string) => students.find(s => s.id === id);

  // 2개 팀 가정 (teamA, teamB)
  const teamA = teams[0];
  const teamB = teams[1];

  const renderPlayerCard = (member: TeamMember, team: GameTeam) => {
    const student = getStudentById(member.studentId);
    if (!student) return null;

    return (
      <div
        key={member.studentId}
        onClick={() => onStudentClick(member.studentId)}
        className="flex flex-col items-center gap-1 p-2 bg-white rounded cursor-pointer hover:shadow-lg transition-shadow border-2 border-gray-200"
      >
        <span className="text-xl">👤</span>
        <span className="text-xs font-medium">{student.name}</span>
        <span className="text-red-500 text-sm">
          {'❤️'.repeat(member.currentLives)}
        </span>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* 가로 레이아웃: 팀A 외야 | 팀A 내야 | 중앙선 | 팀B 내야 | 팀B 외야 */}
      <div className="grid grid-cols-[1fr_2fr_2px_2fr_1fr] gap-2 min-h-[400px]">

        {/* 팀A 외야 */}
        <div className={`p-4 rounded-l border-4 border-${teamA.color}-500 bg-${teamA.color}-50`}>
          <h3 className="text-sm font-bold mb-2 text-center">{teamA.name}<br/>외야</h3>
          <div className="flex flex-col gap-2">
            {teamA.members
              .filter(m => m.position === 'outer')
              .map(member => renderPlayerCard(member, teamA))}
          </div>
        </div>

        {/* 팀A 내야 */}
        <div className={`p-6 border-4 border-l-0 border-${teamA.color}-500 bg-${teamA.color}-100`}>
          <h3 className="text-sm font-bold mb-3 text-center">{teamA.name} 내야</h3>
          <div className="grid grid-cols-3 gap-3">
            {teamA.members
              .filter(m => m.position === 'inner')
              .map(member => renderPlayerCard(member, teamA))}
          </div>
        </div>

        {/* 중앙선 */}
        <div className="bg-gray-800"></div>

        {/* 팀B 내야 */}
        <div className={`p-6 border-4 border-r-0 border-${teamB.color}-500 bg-${teamB.color}-100`}>
          <h3 className="text-sm font-bold mb-3 text-center">{teamB.name} 내야</h3>
          <div className="grid grid-cols-3 gap-3">
            {teamB.members
              .filter(m => m.position === 'inner')
              .map(member => renderPlayerCard(member, teamB))}
          </div>
        </div>

        {/* 팀B 외야 */}
        <div className={`p-4 rounded-r border-4 border-${teamB.color}-500 bg-${teamB.color}-50`}>
          <h3 className="text-sm font-bold mb-2 text-center">{teamB.name}<br/>외야</h3>
          <div className="flex flex-col gap-2">
            {teamB.members
              .filter(m => m.position === 'outer')
              .map(member => renderPlayerCard(member, teamB))}
          </div>
        </div>

      </div>
    </div>
  );
}
```

#### 학생 클릭 시 하트 감소 & 외야 이동 로직

```typescript
const handleStudentClick = (studentId: string) => {
  setGameData(prev => {
    const newTeams = prev.teams.map(team => ({
      ...team,
      members: team.members.map(member => {
        if (member.studentId === studentId) {
          const newLives = member.currentLives - 1;

          return {
            ...member,
            currentLives: newLives,
            position: newLives === 0 ? 'outer' : member.position,
            isInOuterCourt: newLives === 0
          };
        }
        return member;
      })
    }));

    return { ...prev, teams: newTeams };
  });
};
```

### 체크리스트
- [ ] 피구 코트 4개 영역 레이아웃 (양쪽 내야/외야)
- [ ] 학생 아이콘 + 이름 + 하트 표시
- [ ] 학생 클릭 시 하트 -1
- [ ] 하트 0 시 자동 외야 이동 애니메이션
- [ ] 팀 색상 구분 명확
- [ ] 모바일 반응형 확인

---

## Step 1-11: 스코어보드 & 라인업 테이블 통합

**예상 소요 시간**: 4시간

### 작업 내용

#### `components/teacher/ScoreBoard.tsx`

```typescript
export function ScoreBoard({ game, teams }: { game: Game, teams: GameTeam[] }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <GameTimer {...timerProps} />
        <div className="text-lg">🏐 공: {game.currentBalls}개</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {teams.map(team => {
          const alivePlayers = team.members.filter(m => m.currentLives > 0).length;
          const totalLives = team.members.reduce((sum, m) => sum + m.currentLives, 0);

          return (
            <div key={team.teamId} className="text-center">
              <h3 className="font-bold text-xl">{team.name}</h3>
              <p className="text-2xl">{alivePlayers}명 남음</p>
              <p className="text-lg">❤️ {totalLives}개</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

#### `components/teacher/TeamLineupTable.tsx` - 스탯 입력 버튼 통합

```typescript
'use client';

import { GameTeam, Student, GameRecord } from '@/types';
import { Button } from '@/components/ui/button';

interface TeamLineupTableProps {
  team: GameTeam;
  students: Student[];
  gameRecords: GameRecord[];
  onStatUpdate: (studentId: string, stat: 'outs' | 'passes' | 'sacrifices' | 'cookies', delta: number) => void;
}

export function TeamLineupTable({ team, students, gameRecords, onStatUpdate }: TeamLineupTableProps) {
  const getStudentById = (id: string) => students.find(s => s.id === id);
  const getRecordByStudentId = (id: string) => gameRecords.find(r => r.studentId === id);

  const StatButton = ({
    studentId,
    stat,
    value,
    color
  }: {
    studentId: string;
    stat: 'outs' | 'passes' | 'sacrifices' | 'cookies';
    value: number;
    color: string;
  }) => (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="outline"
        className="w-8 h-8 p-0 text-red-500"
        onClick={() => onStatUpdate(studentId, stat, -1)}
        disabled={value === 0}
      >
        -
      </Button>
      <span className={`font-bold text-lg w-8 text-center text-${color}-600`}>
        {value}
      </span>
      <Button
        size="sm"
        className={`w-8 h-8 p-0 bg-${color}-500 hover:bg-${color}-600`}
        onClick={() => onStatUpdate(studentId, stat, 1)}
      >
        +
      </Button>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full">
        <thead className={`bg-${team.color}-500 text-white`}>
          <tr>
            <th className="p-2 text-left">번호</th>
            <th className="p-2 text-left">이름</th>
            <th className="p-2 text-center">배지</th>
            <th className="p-2 text-center">하트</th>
            <th className="p-2 text-center">아웃 🔥</th>
            <th className="p-2 text-center">패스 🤝</th>
            <th className="p-2 text-center">양보 💚</th>
            <th className="p-2 text-center">쿠키 🍪</th>
          </tr>
        </thead>
        <tbody>
          {team.members.map(member => {
            const student = getStudentById(member.studentId);
            const record = getRecordByStudentId(member.studentId);
            if (!student || !record) return null;

            return (
              <tr key={member.studentId} className="border-b hover:bg-gray-50">
                <td className="p-2">{student.number}</td>
                <td className="p-2 font-medium">{student.name}</td>
                <td className="p-2 text-center text-2xl">
                  {student.badges[0]?.emoji || '-'}
                </td>
                <td className="p-2 text-center">
                  {'❤️'.repeat(member.currentLives)}
                </td>
                <td className="p-2">
                  <StatButton
                    studentId={member.studentId}
                    stat="outs"
                    value={record.outs}
                    color="orange"
                  />
                </td>
                <td className="p-2">
                  <StatButton
                    studentId={member.studentId}
                    stat="passes"
                    value={record.passes}
                    color="blue"
                  />
                </td>
                <td className="p-2">
                  <StatButton
                    studentId={member.studentId}
                    stat="sacrifices"
                    value={record.sacrifices}
                    color="green"
                  />
                </td>
                <td className="p-2">
                  <StatButton
                    studentId={member.studentId}
                    stat="cookies"
                    value={record.cookies}
                    color="yellow"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

### 체크리스트
- [ ] 스코어보드 완성 (타이머, 팀 정보, 공 개수)
- [ ] 라인업 테이블에 스탯 입력 버튼 통합
- [ ] [-] [숫자] [+] 버튼 구조 구현
- [ ] 각 스탯별 색상 구분 (아웃: orange, 패스: blue, 양보: green, 쿠키: yellow)
- [ ] 음수 방지 로직 (0 이하로 내려가지 않음)
- [ ] 스탯 업데이트 즉시 반영
- [ ] 하트 표시 실시간 연동

---

## Step 1-12: 경기 진행 페이지 통합 & 실시간 하트 연동

**예상 소요 시간**: 3시간

### 작업 내용

#### `app/teacher/class/[classId]/game/play/page.tsx` - 경기 진행 메인 페이지

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Game, GameTeam, Student, GameRecord } from '@/types';
import { DodgeballCourt } from '@/components/teacher/DodgeballCourt';
import { ScoreBoard } from '@/components/teacher/ScoreBoard';
import { TeamLineupTable } from '@/components/teacher/TeamLineupTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function GamePlayPage() {
  const [gameData, setGameData] = useState<Game>(initialGameData);

  // 하트 감소 핸들러 (코트에서 클릭 시)
  const handleStudentClick = (studentId: string) => {
    setGameData(prev => {
      const newTeams = prev.teams.map(team => ({
        ...team,
        members: team.members.map(member => {
          if (member.studentId === studentId) {
            const newLives = Math.max(0, member.currentLives - 1);
            return {
              ...member,
              currentLives: newLives,
              position: newLives === 0 ? 'outer' : member.position,
              isInOuterCourt: newLives === 0
            };
          }
          return member;
        })
      }));
      return { ...prev, teams: newTeams };
    });
  };

  // 스탯 업데이트 핸들러 (라인업 테이블에서)
  const handleStatUpdate = (
    studentId: string,
    stat: 'outs' | 'passes' | 'sacrifices' | 'cookies',
    delta: number
  ) => {
    setGameData(prev => {
      const newRecords = prev.records.map(record => {
        if (record.studentId === studentId) {
          const oldValue = record[stat];
          const newValue = Math.max(0, oldValue + delta);
          return { ...record, [stat]: newValue };
        }
        return record;
      });
      return { ...prev, records: newRecords };
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* 상단 스코어보드 */}
      <ScoreBoard game={gameData} teams={gameData.teams} />

      {/* 탭: 피구 코트 vs 라인업 테이블 */}
      <Tabs defaultValue="court" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="court">피구 코트</TabsTrigger>
          <TabsTrigger value="lineup">라인업 테이블</TabsTrigger>
        </TabsList>

        <TabsContent value="court" className="mt-4">
          <DodgeballCourt
            teams={gameData.teams}
            students={students}
            onStudentClick={handleStudentClick}
          />
        </TabsContent>

        <TabsContent value="lineup" className="mt-4 space-y-4">
          {gameData.teams.map(team => (
            <TeamLineupTable
              key={team.teamId}
              team={team}
              students={students}
              gameRecords={gameData.records}
              onStatUpdate={handleStatUpdate}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

#### 실시간 하트 연동 (중요!)

```typescript
// 같은 상태를 공유하도록 설계
const [gameData, setGameData] = useState<Game>(initialGameData);

// 피구 코트에서 하트 변경 시
<DodgeballCourt
  teams={gameData.teams}
  onStudentClick={handleStudentClick}
/>

// 팀 라인업에서도 같은 gameData 사용
<TeamLineup
  teams={gameData.teams}
  records={gameData.records}
/>

// 하트 변경 시 gameData.teams가 업데이트되면
// 두 컴포넌트 모두 자동으로 리렌더링됨!
```

### 체크리스트
- [ ] 팀 라인업 페이지 완성
- [ ] 탭 전환 UI (스코어보드 ↔ 라인업)
- [ ] 각 학생 상세 스탯 표시
- [ ] **피구 코트 하트 ↔ 라인업 하트 실시간 연동** (필수!)
- [ ] 하트 변경 시 즉시 반영 확인

---

## Step 1-13: 경기 종료 & 학생 페이지

**예상 소요 시간**: 2시간

### 작업 내용

#### 1. 경기 종료 로직

```typescript
const handleGameEnd = async () => {
  // 1. 승리 팀 판정
  const winner = gameData.teams.reduce((prev, current) => {
    const prevAlive = prev.members.filter(m => m.currentLives > 0).length;
    const currentAlive = current.members.filter(m => m.currentLives > 0).length;
    return currentAlive > prevAlive ? current : prev;
  });

  // 2. 각 학생 누적 스탯 업데이트
  for (const record of gameData.records) {
    const student = await getStudentById(record.studentId);
    if (!student) continue;

    const newStats = {
      outs: student.stats.outs + record.outs,
      passes: student.stats.passes + record.passes,
      sacrifices: student.stats.sacrifices + record.sacrifices,
      cookies: student.stats.cookies + record.cookies,
      gamesPlayed: student.stats.gamesPlayed + 1,
      totalScore: 0 // 계산 필요
    };

    newStats.totalScore = calculateTotalScore(newStats);

    await updateStudent(student.id, { stats: newStats });
  }

  // 3. 경기 데이터 저장
  await updateGame(gameData.id, {
    winner: winner.teamId,
    isCompleted: true
  });

  alert(`${winner.name} 승리!`);
  router.push('/teacher/dashboard');
};
```

#### 2. 학생 페이지 완성 (`components/student/StudentDashboard.tsx`)

```typescript
export function StudentDashboard({ student }: { student: Student }) {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* 내 정보 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-2">내 정보</h2>
        <p>{student.classNumber}반 {student.number}번</p>
        <p className="text-2xl font-bold">{student.name}</p>
        <p className="text-lg">🍪 쿠키: {student.stats.cookies}개</p>
      </div>

      {/* 내 배지 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-3">내 배지</h2>
        <div className="grid grid-cols-3 gap-3">
          {student.badges.map(badge => (
            <div key={badge.id} className="text-center p-3 bg-gray-50 rounded">
              <div className="text-4xl">{badge.emoji}</div>
              <p className="text-sm font-medium mt-1">{badge.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 내 스탯 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-3">내 스탯</h2>
        <div className="space-y-2">
          <p>아웃: {student.stats.outs}회</p>
          <p>패스: {student.stats.passes}회</p>
          <p>양보: {student.stats.sacrifices}회</p>
          <p>참여 경기: {student.stats.gamesPlayed}경기</p>
          <p className="text-xl font-bold">종합 점수: {student.stats.totalScore}점</p>
        </div>
      </div>
    </div>
  );
}
```

### 체크리스트
- [ ] 경기 종료 로직 완성
- [ ] 승리 팀 자동 판정
- [ ] 누적 스탯 업데이트 작동
- [ ] 학생 페이지 UI 완성
- [ ] 접근 코드로 학생 정보 조회 가능

---

## ⚠️ Phase 1 핵심 주의사항

### 1. 데이터 구조 일치
```typescript
// Mock Data 구조 === Firestore 구조
// Phase 4에서 이것만 교체하면 끝!

// Before (Mock)
import { getStudents } from '@/lib/dataService';

// After (Firebase)
import { getStudents } from '@/lib/firebaseService';
```

### 2. 실시간 하트 연동
```typescript
// 하나의 상태를 공유해야 함!
const [gameData, setGameData] = useState<Game>();

// 피구 코트와 라인업 모두 gameData.teams 참조
<DodgeballCourt teams={gameData.teams} />
<TeamLineup teams={gameData.teams} />
```

### 3. 타이머 정확성
```typescript
// 일시정지 시 타이머와 경보음 모두 정지
// 재개 시 정확히 이어짐
```

### 4. 타입 안정성
```typescript
// strict mode에서 에러 없어야 함
// any 타입 절대 사용 금지
```

---

## ✅ Phase 1 최종 체크리스트

- [ ] Next.js 14 프로젝트 정상 실행
- [ ] TypeScript 타입 정의 완료 (Firestore와 일치)
- [ ] Mock Data 생성 (20명 이상 학생)
- [ ] LocalStorage 초기화 함수 작동
- [ ] 데이터 서비스 레이어 CRUD 함수 완성
- [ ] 교사 로그인 Mock 인증 작동
- [ ] 학생 접근 코드 입력 페이지 작동
- [ ] 학급 생성 및 학생 등록 기능
- [ ] 접근 코드 자동 생성 확인
- [ ] dnd-kit 드래그앤드롭 팀 편성
- [ ] 랜덤 팀 편성 기능
- [ ] 경기 설정 UI (시간, 하트, 외야 규칙, 공 추가)
- [ ] 타이머 컴포넌트 (text-6xl)
- [ ] Web Audio API 비프음 작동
- [ ] 공 추가 시 비프음, 종료 10초 전 연속 비프음
- [ ] 볼륨 조절 슬라이더
- [ ] 커스텀 사운드 업로드 UI
- [ ] 피구 코트 4개 영역 레이아웃
- [ ] 학생 클릭 시 하트 -1 및 외야 자동 이동
- [ ] **피구 코트 ↔ 라인업 실시간 하트 연동** (필수!)
- [ ] 스코어보드 (타이머, 팀 정보, 공 개수)
- [ ] 빠른 입력 버튼 (아웃/패스/양보/쿠키)
- [ ] 팀 라인업 페이지 (탭 전환)
- [ ] 경기 종료 및 스탯 집계
- [ ] 학생 페이지 (접근 코드 조회)
- [ ] 모바일 반응형 레이아웃
- [ ] 모든 기능 Mock Data로 정상 작동
- [ ] TypeScript 에러 없음 (strict mode)

---

**다음 단계**: Phase 1 완료 후 [PHASE2_DETAILED.md](./PHASE2_DETAILED.md)로 진행

---

**작성일**: 2025-10-21
**버전**: 1.0
