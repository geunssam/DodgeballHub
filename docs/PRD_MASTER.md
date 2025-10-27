# 🏐 DodgeballHub - Product Requirements Document (Master)

## 📌 프로젝트 개요

**프로젝트명**: DodgeballHub
**목적**: 초등학교 체육 수업용 피구 경기 관리 및 게이미피케이션 웹 애플리케이션
**작성일**: 2025-10-21
**버전**: 1.0

---

## 🎯 프로젝트 핵심 가치

### 교육적 목표
1. **경쟁**: 니체적 자기극복의 아곤 (아웃 스탯)
2. **협력**: 공동체 내에서의 힘의 상승 (패스 스탯)
3. **배려**: 약자에 대한 귀족적 관대함 (양보 스탯)
4. **전인적 성장**: 다양한 가치를 측정하여 모든 학생에게 성취 기회 제공

### 사용자 가치
- **교사**: 실시간 경기 기록, 학생 성장 추적, 데이터 기반 피드백
- **학생**: 자신의 성장 시각화, 배지 획득을 통한 동기부여, 친구들과의 선의의 경쟁

---

## 🛠 기술 스택

### 프론트엔드
- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **UI 컴포넌트**: shadcn/ui (Radix UI 기반)
- **드래그앤드롭**: dnd-kit
- **상태관리**: React Context API (필요시 Zustand 추가)

### 백엔드 (Phase 4)
- **BaaS**: Firebase
  - Authentication (이메일/비밀번호)
  - Firestore Database
  - Storage (커스텀 사운드 파일)

### 배포
- **플랫폼**: Vercel
- **도메인**: TBD

### 개발 전략
- **Phase 1-3**: Mock Data로 프론트엔드 완성 (Firebase 구조 동일하게 설계)
- **Phase 4**: Mock Data → Firebase 마이그레이션 (import만 교체)

---

## 👥 사용자 역할

| 역할 | 접근 방식 | 권한 |
|------|-----------|------|
| **교사** | Firebase 로그인 (이메일/비밀번호) | 모든 기능 (생성/수정/삭제) |
| **학생** | 접근 코드 입력 | 본인 정보 열람 (읽기 전용) |

**학생 접근 코드 형식**: `{반번호}-{학생번호}-{이름}`
예: `3-5-김철수`, `3-12-이영희`

---

## 🎮 핵심 기능 요약

### 1. 학급 및 학생 관리
- 학급 생성 (학급명, 연도 자동 저장)
- 학생 등록 (반번호, 학생번호, 이름)
- 접근 코드 자동 생성
- 학생 목록 그리드 레이아웃

### 2. 팀 시스템
- 무제한 팀 생성 (팀명, 색상 선택)
- 드래그앤드롭 팀 편성
- 랜덤 N vs N 팀 편성

### 3. 경기 설정
- 경기 날짜/시간 선택
- 경기 시간 설정 (1~60분)
- 각 학생별 하트 개수 커스터마이징
- 외야 규칙 선택 (다중 선택 가능)
  - ✅ 일반 옵션 (던진 공 잡으면 공격권만 소유)
  - ✅ 공 잡으면 우리팀 한 명 부활
  - ✅ 공 잡으면 나한테 하트 +1
  - ✅ 외야에서 던져서 아웃시키면 하트 1개로 내야 부활
  - ✅ 외야에서 던져서 아웃시키면 우리팀 한 명 부활
- **공 추가 시스템**: N개의 공 추가 타이밍 설정 (예: 3분 전, 1분 전)

### 4. 타이머 & 사운드 시스템
- **큼지막한 타이머** (text-6xl, 60px)
- **2단계 경보음**
  - 공 추가 시: 짧은 비프음 1회
  - 종료 10초 전: 연속 비프음 (매 초마다)
- **기본 사운드**: Web Audio API 비프음
- **커스텀 사운드**: 파일 업로드 (.mp3, .wav) + 삭제 기능
- **볼륨 조절**: 슬라이더 (0~100%)

### 5. 피구 코트 시각화 (가로 구조)
- **가로 레이아웃**: 좌측 팀 A (외야-내야) | 중앙선 | 우측 팀 B (내야-외야)
```
┌────────┬────────┬──┬────────┬────────┐
│ 팀A외야 │ 팀A내야 │││ 팀B내야 │ 팀B외야 │
└────────┴────────┴──┴────────┴────────┘
```
- 학생 아이콘 + 이름 + 하트 표시
- 클릭 시 하트 -1
- **하트 0 시 자동 외야 이동** (핵심!)
- **실시간 연동**: 피구 코트 ↔ 팀 라인업

### 6. 스코어보드 & 경기 기록
- 상단 스코어보드 (타이머, 팀 정보, 현재 공 개수)
- 일시정지/재개/종료 버튼
- **팀 라인업 테이블** (각 학생별 스탯 + 입력 버튼 통합)

### 7. 스탯 시스템 & 라인업 테이블 통합

#### 라인업 테이블 구조
각 학생 행에 이름, 배지, 하트, 스탯 버튼이 모두 표시됩니다.

**테이블 열 구성**:
| 번호 | 이름 | 배지 | 하트 | 아웃 | 패스 | 양보 | 쿠키 |
|------|------|------|------|------|------|------|------|
| 5 | 김철수 | 🔥 | ❤️❤️ | [-] 3 [+] | [-] 2 [+] | [-] 1 [+] | [-] 5 [+] |

**버튼 구조**:
- `[-]` 버튼: 스탯 -1 (실수 수정용, 0 이하로 내려가지 않음)
- **숫자**: 현재 스탯 값 표시
- `[+]` 버튼: 스탯 +1 (주 입력 방법)

#### 스탯 종류

| 스탯 | 의미 | 기록 방법 | 가중치 |
|------|------|-----------|--------|
| **아웃** 🔥 | 상대를 아웃시킨 횟수 | [+] 버튼 | ×2 |
| **패스** 🤝 | 아군에게 패스 성공 횟수 | [+] 버튼 | ×1 |
| **양보** 💚 | 소외된 친구에게 양보 | [+] 버튼 | ×1.5 |
| **쿠키** 🍪 | 교사의 긍정 피드백 | [+] 버튼 | ×0.5 |
| **참여 경기 수** | 자동 집계 | - | - |

**종합 점수 계산식**:

```javascript
종합 점수 = (아웃 × 2) + (패스 × 1) + (양보 × 1.5) + (쿠키 × 0.5)
```

### 8. 배지 시스템
#### 자동 배지 (12개)
| 배지 이름 | 이모지 | 조건 |
|-----------|--------|------|
| 불꽃 슈터 | 🔥 | 누적 아웃 10개 |
| 화염 저격수 | 🎯 | 누적 아웃 30개 |
| 전설의 포수 | 👑 | 누적 아웃 50개 |
| 패스의 달인 | 🤝 | 누적 패스 20개 |
| 협동의 마스터 | 🏅 | 누적 패스 50개 |
| 배려왕 | 💚 | 누적 양보 10개 |
| 천사의 심장 | 😇 | 누적 양보 25개 |
| 쿠키 부자 | 🍪 | 누적 쿠키 30개 |
| 쿠키 재벌 | 💰 | 누적 쿠키 100개 |
| 완벽한 팀원 | ⭐ | 아웃 20 + 패스 20 + 양보 10 |
| 경기광 | 🏃 | 참여 20경기 |
| 체육 마니아 | 💪 | 참여 50경기 |

#### 교사 수동 배지
- 교사가 직접 생성 (이름, 이모지, 설명)
- 학생에게 수여 (사유 입력 가능)

### 9. 학생 페이지 (View-Only)
**URL**: `yourdomain.com/student?code={접근코드}`

**표시 정보**:
- 내 정보 (반, 번호, 이름, 쿠키 개수)
- 내 배지 컬렉션 (획득 배지 + 못 얻은 배지)
- 내 스탯 (아웃/패스/양보/경기수/종합점수)
- 학급 순위 (TOP 10)
- 최근 경기 기록

---

## 📊 데이터 구조 (Firestore 스키마)

### Collection: teachers
```typescript
{
  id: string,
  email: string,
  name: string,
  createdAt: Timestamp
}
```

### Collection: classes
```typescript
{
  id: string,
  teacherId: string,
  name: string,              // "5학년 3반"
  year: number,              // 2025
  isArchived: boolean,
  createdAt: Timestamp
}
```

### Collection: students
```typescript
{
  id: string,
  classId: string,
  name: string,
  number: number,            // 학생 번호
  classNumber: number,       // 반 번호
  accessCode: string,        // "3-5-김철수"
  stats: {
    outs: number,
    passes: number,
    sacrifices: number,
    cookies: number,
    gamesPlayed: number,
    totalScore: number
  },
  badges: [
    {
      id: string,
      name: string,
      emoji: string,
      awardedAt: Timestamp,
      isAuto: boolean,
      reason?: string
    }
  ],
  createdAt: Timestamp
}
```

### Collection: teams
```typescript
{
  id: string,
  classId: string,
  name: string,              // "팀 A"
  color: string,             // "red", "blue", etc.
  createdAt: Timestamp
}
```

### Collection: games
```typescript
{
  id: string,
  classId: string,
  date: Timestamp,
  duration: number,          // 분
  settings: {
    useOuterCourt: boolean,
    outerCourtRules: [
      "normal_catch_attack_right",       // 일반 옵션
      "catch_revive_teammate",           // 공 잡으면 팀원 부활
      "catch_self_life",                 // 공 잡으면 본인 하트 +1
      "outer_hit_revive_self",           // 외야에서 아웃시키면 본인 부활
      "outer_hit_revive_teammate"        // 외야에서 아웃시키면 팀원 부활
    ],
    ballAdditions: [                     // 공 추가 타이밍
      { minutesBefore: 3 },
      { minutesBefore: 1 }
    ]
  },
  currentBalls: number,                  // 현재 공 개수
  teams: [
    {
      teamId: string,
      name: string,
      color: string,
      members: [
        {
          studentId: string,
          initialLives: number,          // 초기 하트
          currentLives: number,          // 현재 하트
          isInOuterCourt: boolean,
          position: "inner" | "outer"    // 내야/외야
        }
      ]
    }
  ],
  records: [
    {
      studentId: string,
      outs: number,
      passes: number,
      sacrifices: number,
      cookies: number
    }
  ],
  winner?: string,                       // teamId
  isCompleted: boolean,
  createdAt: Timestamp
}
```

### Collection: customBadges
```typescript
{
  id: string,
  teacherId: string,
  name: string,
  emoji: string,
  description: string,
  createdAt: Timestamp
}
```

---

## 🚀 Phase 개요

### Phase 1: MVP (프론트엔드 완성) - 12 Steps
**목표**: Firebase 없이 완전히 작동하는 프론트엔드
**기간**: 2-3주
**데이터**: Mock Data (Firestore 구조 동일)

**핵심 기능**:
- 교사/학생 Mock 인증
- 학급 및 학생 관리
- 드래그앤드롭 팀 편성
- 경기 설정 (타이머, 사운드, 공 추가)
- 피구 코트 UI (양쪽 내야/외야)
- 실시간 하트 연동
- 스탯 기록 및 경기 종료
- 학생 페이지

[상세 문서: PHASE1_DETAILED.md](./PHASE1_DETAILED.md)

---

### Phase 2: 게이미피케이션 - 4 Steps
**목표**: 배지 시스템 및 종합 점수
**기간**: 1주

**핵심 기능**:
- 자동 배지 시스템 (12개)
- 종합 점수 계산
- 학급 순위
- 교사 수동 배지

[상세 문서: PHASE2_DETAILED.md](./PHASE2_DETAILED.md)

---

### Phase 3: 고급 기능 - 4 Steps
**목표**: 사용자 편의성 증대
**기간**: 1주

**핵심 기능**:
- 경기 히스토리
- 외야 규칙 프리셋
- 일시정지 고도화
- 데이터 내보내기 (CSV/Excel)

[상세 문서: PHASE3_DETAILED.md](./PHASE3_DETAILED.md)

---

### Phase 4: Firebase 마이그레이션 - 6 Steps
**목표**: Mock Data → Firebase 완전 전환
**기간**: 1주

**핵심 작업**:
- Firebase 프로젝트 설정
- Firestore 스키마 구축
- Mock Data → Firebase SDK 교체
- Authentication 연동
- Vercel 배포
- 테스트 & 최적화

[상세 문서: PHASE4_DETAILED.md](./PHASE4_DETAILED.md)

---

## 🎨 UI/UX 요구사항

### 디자인 철학
- **미니멀리즘**: 군더더기 없고 깔끔한 구조
- **세심한 텍스트 처리**: 한 단어나 표현에서 줄바꿈 방지
- **완벽한 정렬**: 표, 텍스트 정렬 깔끔하게
- **애플 스타일 디테일**: 자간, 폰트 크기, 줄간격 세밀한 조정

### 레이아웃
- **반응형**: 모바일(태블릿) 우선 설계
- **큰 터치 영역**: 최소 44×44px
- **간결한 네비게이션**: 2단계 이내

### 컬러 시스템 (Tailwind)
- **Primary**: blue-600
- **Secondary**: gray-500
- **Success**: green-500
- **Warning**: yellow-500
- **Danger**: red-500

### 타이포그래피
- **제목**: text-2xl font-bold
- **본문**: text-base
- **작은 텍스트**: text-sm text-gray-600
- **타이머**: text-6xl font-bold (60px)

### 인터랙션
- 버튼 클릭 시 즉각적인 시각 피드백 (scale, shadow)
- 로딩 상태 명확히 표시
- 에러 메시지는 toast로 표시
- 하트 감소 시 애니메이션
- 외야 이동 시 부드러운 전환

---

## ⚠️ 핵심 주의사항

### 1. 하트 데이터 동기화 (최우선!)
```
피구 코트의 하트 ↔️ 팀 라인업의 하트
→ 같은 데이터 소스 참조 필수!
→ 한 곳에서 변경 시 모든 화면 즉시 업데이트
```

### 2. 자동 외야 이동 로직
```typescript
if (student.currentLives === 0) {
  student.position = "outer";
  student.isInOuterCourt = true;
  // 애니메이션 실행
}
```

### 3. 피구 코트 가로 구조
```
┌────────┬────────┬──┬────────┬────────┐
│ 팀A외야 │ 팀A내야 │││ 팀B내야 │ 팀B외야 │
└────────┴────────┴──┴────────┴────────┘

반드시 가로 레이아웃으로 4개 영역 표시
좌측 팀 (외야-내야) | 중앙선 | 우측 팀 (내야-외야)
```

### 4. 배지 중복 방지
```typescript
if (student.badges.find(b => b.id === newBadge.id)) {
  return; // 중복 수여 방지
}
```

### 5. Firestore 구조 준수
- Mock Data와 Firebase 구조 완전히 동일
- 컬렉션명, 필드명 정확히 일치
- 타입 안정성 유지 (TypeScript strict mode)

### 6. 타이머 정확성
- 일시정지 시 경보음도 멈춤
- 재개 시 정확히 이어짐
- 공 추가 타이밍도 일시정지 영향 받음

---

## 📝 코딩 컨벤션

### 파일 및 폴더 네이밍
- **컴포넌트**: PascalCase (`StudentCard.tsx`)
- **유틸리티**: camelCase (`calculateScore.ts`)
- **상수**: UPPER_SNAKE_CASE (`MAX_LIVES`)
- **폴더**: kebab-case (`game-settings/`)

### TypeScript
- **strict mode** 활성화
- **any 타입 금지** (unknown 사용)
- **인터페이스** 활용 (type보다 interface 우선)

### 컴포넌트 구조
```typescript
// 1. Imports
import { useState } from 'react';
import { Student } from '@/types';

// 2. Types/Interfaces
interface StudentCardProps {
  student: Student;
  onClick: (id: string) => void;
}

// 3. Component
export function StudentCard({ student, onClick }: StudentCardProps) {
  // 4. Hooks
  const [isHovered, setIsHovered] = useState(false);

  // 5. Handlers
  const handleClick = () => {
    onClick(student.id);
  };

  // 6. Render
  return (
    <div onClick={handleClick}>
      {/* JSX */}
    </div>
  );
}
```

### Firestore 컬렉션 네이밍
- 소문자 복수형 (`students`, `games`, `teachers`)
- camelCase 필드명 (`accessCode`, `currentLives`)

---

## ✅ 전체 완료 체크리스트

### Phase 1 (MVP)
- [ ] 프로젝트 초기 설정 (Next.js, Tailwind, shadcn/ui)
- [ ] Mock Data 타입 정의 (TypeScript interfaces)
- [ ] 교사/학생 Mock 로그인 UI
- [ ] 학급 생성 및 학생 등록
- [ ] 접근 코드 자동 생성
- [ ] 드래그앤드롭 팀 편성 (dnd-kit)
- [ ] 랜덤 팀 편성
- [ ] 경기 설정 UI (시간, 하트, 외야 규칙, 공 추가)
- [ ] 타이머 컴포넌트 (text-6xl)
- [ ] 사운드 시스템 (비프음, 커스텀 업로드, 볼륨 조절)
- [ ] 피구 코트 UI (양쪽 내야/외야)
- [ ] 학생 클릭 시 하트 -1 및 외야 자동 이동
- [ ] 피구 코트 ↔ 라인업 실시간 하트 연동
- [ ] 스코어보드 (타이머, 팀 정보, 공 개수)
- [ ] 빠른 입력 버튼 (아웃/패스/양보/쿠키)
- [ ] 팀 라인업 페이지 (탭 전환)
- [ ] 경기 종료 및 스탯 집계
- [ ] 학생 페이지 (접근 코드 조회)
- [ ] 모바일 반응형 레이아웃

### Phase 2 (게이미피케이션)
- [ ] 자동 배지 조건 정의 (12개)
- [ ] 경기 종료 시 배지 자동 수여
- [ ] 배지 중복 방지 로직
- [ ] 종합 점수 계산식 구현
- [ ] 학급 순위 알고리즘
- [ ] 교사 수동 배지 생성 UI
- [ ] 배지 수여 폼
- [ ] 학생 페이지에 배지 표시

### Phase 3 (고급 기능)
- [ ] 경기 히스토리 목록
- [ ] 경기 상세 보기
- [ ] 외야 규칙 프리셋 (기본, 고급, 커스텀)
- [ ] 일시정지 중 스탯 수정
- [ ] CSV/Excel 내보내기
- [ ] 학급 통계 리포트

### Phase 4 (Firebase)
- [ ] Firebase 프로젝트 생성
- [ ] Authentication 설정
- [ ] Firestore 데이터베이스 생성
- [ ] Security Rules 설정
- [ ] Mock Data → Firebase SDK 교체
- [ ] 실시간 리스너 설정
- [ ] 교사 회원가입/로그인 연동
- [ ] Vercel 배포
- [ ] 환경 변수 설정
- [ ] E2E 테스트
- [ ] 성능 최적화

---

## 📚 관련 문서

- [Phase 1 상세 문서](./PHASE1_DETAILED.md)
- [Phase 2 상세 문서](./PHASE2_DETAILED.md)
- [Phase 3 상세 문서](./PHASE3_DETAILED.md)
- [Phase 4 상세 문서](./PHASE4_DETAILED.md)
- [Firebase 스키마 설계](./FIREBASE_SCHEMA.md)
- [마이그레이션 가이드](./MIGRATION_GUIDE.md)

---

## 📊 예상 개발 일정

| Phase | Step 수 | 예상 소요 시간 |
|-------|---------|----------------|
| Phase 1: MVP | 12 Steps | 2-3주 |
| Phase 2: 게이미피케이션 | 4 Steps | 1주 |
| Phase 3: 고급 기능 | 4 Steps | 1주 |
| Phase 4: Firebase | 6 Steps | 1주 |
| **총계** | **26 Steps** | **5-6주** |

---

## 🎓 교육적 의미

### 니체 철학과의 연결
이 프로젝트는 단순한 "피구 점수 기록 앱"이 아닙니다:

1. **경쟁(아웃)**: 니체적 자기극복의 아곤
2. **협력(패스)**: 공동체 내에서의 힘의 상승
3. **배려(양보)**: 약자에 대한 귀족적 관대함
4. **종합 점수**: 전인적 성장 측정

### 르상티망 극복
단순히 "이기는 것"만이 아닌, 다양한 가치를 측정하여 모든 학생에게 성취 기회를 제공합니다.

### 메타인지 촉발
학생 페이지에서 자신의 스탯을 보며 "나는 어떤 플레이어인가?" 성찰하고,
배지 시스템으로 "다음 목표는 무엇인가?" 동기 부여를 받습니다.

---

**작성자**: Claude Code & 이원근 선생님
**최종 수정일**: 2025-10-21
**버전**: 1.0
