# PRD Update Plan - 팀 독립성 리팩토링 반영

**문서 버전**: 2.0
**작성일**: 2025-01-22
**작성자**: Claude Code
**상태**: 계획 단계

## 목적 (Purpose)

기존 PRD_MASTER.md에 팀 독립성 리팩토링 내용을 반영하여, 변경된 아키텍처와 데이터 모델을 문서화합니다.

## 변경 개요

| 섹션 | 변경 유형 | 주요 내용 |
|------|----------|-----------|
| 1. 프로젝트 개요 | 수정 | 핵심 기능에 "다중 학급 팀 구성" 추가 |
| 2. 핵심 기능 | 추가 | "팀 독립 관리" 섹션 추가 |
| 3. 데이터 모델 | 수정 | Team, TeamMember, Game 인터페이스 변경 |
| 4. 페이지 구조 | 수정 | `/teacher/teams` 추가, 기존 페이지 deprecated |
| 5. UI/UX | 추가 | Dashboard 재설계, 학급/팀 분리 |
| 6. 기술 스택 | 유지 | 변경 없음 |

## 섹션별 수정 계획

### 1. 프로젝트 개요 (1. Project Overview)

#### 현재 (PRD_MASTER.md line 1-30)

```markdown
# DodgeballHub - Product Requirements Document (PRD)

## 1. 프로젝트 개요 (Project Overview)

### 1.1 프로젝트 목적
초등학교 피구 경기를 효율적으로 관리하고 기록할 수 있는 웹 애플리케이션 개발

### 1.2 핵심 기능
- 학급별 학생 명단 관리
- 학급별 팀 편성 및 관리
- 실시간 피구 경기 진행 및 점수 기록
- ...
```

#### 수정 후

```markdown
# DodgeballHub - Product Requirements Document (PRD)

**버전**: 2.0 (팀 독립성 리팩토링 반영)
**최종 수정일**: 2025-01-22

## 1. 프로젝트 개요 (Project Overview)

### 1.1 프로젝트 목적
초등학교 피구 경기를 효율적으로 관리하고 기록할 수 있는 웹 애플리케이션 개발

### 1.2 핵심 기능
- 학급별 학생 명단 관리
- **교사 단위 팀 편성 및 관리** (✨ 변경: 학급에 독립적)
- **다중 학급 팀 구성** (✨ 신규: 여러 학급의 학생으로 팀 구성)
- 실시간 피구 경기 진행 및 점수 기록
- **유연한 경기 설정** (✨ 변경: 모든 팀 중에서 선택)
- ...

### 1.3 주요 개념 구분

#### 학급 관리 (Class Management)
- 교사가 담당하는 고정된 학급 단위
- 학생들의 원래 소속 (변경되지 않음)
- 학급별 학생 명단 관리
- 예: 5학년 3반, 6학년 1반

#### 팀 관리 (Team Management)
- 경기를 위한 유동적인 팀 단위
- 여러 학급의 학생들로 구성 가능
- 교사 단위로 관리됨 (학급에 독립적)
- 예: 레드팀 (5-3 학생 3명 + 5-2 학생 2명)

이러한 구분을 통해:
- 학급 간 합동 경기 가능
- 학생의 원래 학급 정보 유지
- 팀 구성의 유연성 확보
```

### 2. 데이터 모델 (3. Data Models)

#### 현재 (PRD_MASTER.md line 235-270)

```typescript
export interface Team {
  id: string;
  classId: string;  // ❌ 삭제 예정
  teacherId: string;
  name: string;
  color: string;
  members?: TeamMember[];
  createdAt: string;
}

export interface TeamMember {
  id: string;
  studentId: string;
  name: string;
  number: number;
  // 경기 중 필드들...
}
```

#### 수정 후

```typescript
// ============================================
// Team 인터페이스 (v2.0 - 팀 독립성)
// ============================================

export interface Team {
  id: string;
  teacherId: string;  // ✅ 교사 ID (학급에 독립적)
  name: string;
  color: 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';
  members: TeamMember[];  // ✅ 필수 필드 (빈 배열 허용)
  createdAt: string;
  sourceClassIds?: string[];  // ✅ 팀원들이 속한 학급 ID 목록 (통계용)
}

/**
 * 주요 변경사항:
 * - classId 필드 삭제: 팀이 특정 학급에 종속되지 않음
 * - members를 필수 필드로 변경: 항상 배열 유지
 * - sourceClassIds 추가: 팀원들의 원래 학급 정보 (선택, 통계용)
 */

// ============================================
// TeamMember 인터페이스 (v2.0 - 학급 정보 추가)
// ============================================

export interface TeamMember {
  id: string;
  studentId: string;  // Student의 id 참조
  name: string;
  number: number;
  classId: string;  // ✅ 팀원의 원래 학급 ID (표시용)
  className?: string;  // ✅ 학급명 (예: "5학년 3반")

  // 경기 중 사용되는 필드들
  initialLives?: number;
  currentLives?: number;
  isInOuterCourt?: boolean;
  position?: 'infield' | 'outfield';
}

/**
 * 주요 변경사항:
 * - classId 추가: 팀원이 어느 학급 출신인지 표시
 * - className 추가: UI에서 "홍길동 (5-3)" 같은 형태로 표시
 * - 학생의 원본 데이터(Student)는 변경하지 않고 참조만 유지
 */

// ============================================
// Student 인터페이스 (변경 없음)
// ============================================

export interface Student {
  id: string;
  classId: string;  // ✅ 유지: 학생의 원래 학급은 절대 변경되지 않음
  name: string;
  number: number;
  gender: 'male' | 'female';
  stats?: StudentStats;
}

/**
 * 중요: 학생의 classId는 절대 변경되지 않습니다.
 * 팀 배정은 별도의 TeamMember 객체로 관리됩니다.
 */

// ============================================
// Game 인터페이스 (v2.0 - teacherId 추가)
// ============================================

export interface Game {
  id: string;
  classIds: string[];  // ✅ 참여 학급들 (복수, 자동 계산됨)
  hostClassId: string;  // 경기 주최 학급 (첫 번째 참여 학급)
  teacherId: string;  // ✅ 추가: 경기를 생성한 교사
  date: string;
  duration: number;  // 초 단위
  settings: GameSettings;
  currentBalls: number;
  teams: GameTeam[];
  records: GameRecord[];
  isCompleted: boolean;
  winnerId?: string;
  completedAt?: string;
}

/**
 * 주요 변경사항:
 * - teacherId 추가: 경기를 생성한 교사 정보
 * - classIds는 선택된 팀의 sourceClassIds를 합친 것
 */
```

### 3. 페이지 구조 (4. Page Structure)

#### 추가할 섹션

```markdown
## 4.5 독립 팀 관리 페이지 (/teacher/teams) ✨ 신규

### 목적
교사의 모든 학급 학생들로 자유롭게 팀을 편성하고 관리합니다.

### URL
- 메인: `/teacher/teams`
- 편집 모드: `/teacher/teams?teamId={id}`

### 주요 기능
1. **미배정 학생 표시**
   - 교사의 모든 학급 학생 표시
   - 학급별 아코디언 그룹화
   - 드래그 가능한 학생 카드

2. **팀 목록 및 관리**
   - 기존 팀 카드 표시
   - 팀원 목록 (학급명 포함)
   - 팀원 추가/제거 (드래그앤드롭)

3. **새 팀 생성**
   - 팀 이름, 색상 입력
   - 빈 팀 생성
   - 드래그로 팀원 추가

4. **추가 기능**
   - 팀 랜덤 배정
   - 팀 초기화 (전체 삭제)
   - 팀 삭제

### 레이아웃
```
┌─────────────────────────────────────────────────────────────┐
│ 헤더: 팀 관리 (n팀) - [팀 랜덤 배정] [팀 초기화] [대시보드] │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │ 미배정 학생     │  │ 기존 팀 목록    │  │ + 새 팀     │  │
│  │ (학급별 그룹)   │  │ (카드 형태)     │  │             │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 데이터 플로우
1. 교사의 모든 학급 로드
2. 모든 학급의 학생 로드
3. 교사의 모든 팀 로드 (teacherId 기반)
4. 미배정 학생 계산 (팀에 없는 학생들)
5. 학급별 그룹화

### 주요 State
```typescript
const [allClasses, setAllClasses] = useState<Class[]>([]);
const [allStudents, setAllStudents] = useState<Student[]>([]);
const [teams, setTeams] = useState<Team[]>([]);
const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
```

### 드래그앤드롭
- 학생 → 팀: 팀에 학생 추가
- 팀 → 팀: 팀 간 학생 이동
- 팀 → 미배정: 팀에서 학생 제거

---

## 4.6 경기 설정 페이지 (/teacher/game/new) 🔄 수정

### 변경 사항
**이전**: 특정 학급(`classId`)의 팀만 선택 가능
**변경 후**: 교사의 모든 팀 중에서 선택 가능

### 주요 수정
1. **팀 로딩**
   ```typescript
   // 이전
   const teams = await getTeams(classId);

   // 변경 후
   const teams = await getTeams(teacherId);
   ```

2. **팀 선택 UI**
   - 팀 카드에 참여 학급 태그 표시
   - 예: "레드팀 (5명) [5-3] [5-2]"

3. **경기 생성**
   - `classIds` 자동 계산 (선택된 팀의 sourceClassIds 합치기)
   - `teacherId` 필드 추가

---

## 4.X Deprecated 페이지들

### 4.X.1 학급별 팀 관리 (/teacher/class/[classId]/teams) ❌ Deprecated

**상태**: v2.0부터 사용 중단
**리디렉션**: `/teacher/teams`로 자동 이동

**사유**:
- 팀이 학급에 독립적으로 변경됨
- 독립 팀 관리 페이지로 대체됨

### 4.X.2 학급별 경기 설정 (/teacher/class/[classId]/game/setup) ❌ Deprecated

**상태**: v2.0부터 사용 중단
**리디렉션**: `/teacher/game/new`로 자동 이동

**사유**:
- 경기 설정이 학급에 독립적으로 변경됨
- 통합 경기 설정 페이지로 대체됨
```

### 4. Dashboard 재설계 (새 섹션 추가)

```markdown
## 4.2 대시보드 페이지 (/teacher/dashboard) 🔄 수정

### v2.0 변경사항

#### 메인 카드 재구성
**이전**: 학급/팀 관리, 경기 관리, 통계, 설정
**변경 후**: 학급 관리, 팀 관리, 경기 관리, 통계

```
┌──────────────────────────────────────────────────────────┐
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 🏫 학급 관리  │  │ 👥 팀 관리   │  │ 🏐 경기 관리 │  │
│  │ n개 학급     │  │ n개 팀       │  │ 진행 중: n   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐                                       │
│  │ 📊 통계      │                                       │
│  │ (준비 중)    │                                       │
│  └──────────────┘                                       │
└──────────────────────────────────────────────────────────┘
```

#### 학급 관리 뷰 변경
**제거된 버튼**:
- ❌ "팀 편성" 버튼 (독립 팀 관리 페이지로 이동)
- ❌ "경기 시작" 버튼 (경기 관리 뷰에서 통합)

**유지되는 기능**:
- ✅ "학생 관리" 버튼
- ✅ 학급별 학생 수 표시

#### 팀 관리 뷰 (신규)
- 교사의 모든 팀 목록 표시
- TeamCard 컴포넌트 사용
- 팀 클릭 → 상세 모달
- "팀 편성 페이지로 이동" 버튼 → `/teacher/teams`

#### 경기 관리 뷰
- "새 경기 시작" 버튼 → `/teacher/game/new`
- 진행 중인 경기 목록
- 완료된 경기 목록
```

### 5. 마이그레이션 가이드 (새 섹션 추가)

```markdown
## 8. 마이그레이션 가이드 (Migration Guide) ✨ 신규

### 8.1 개요
v1.0 (학급 기반 팀)에서 v2.0 (교사 기반 팀)으로 업그레이드 시 자동 마이그레이션이 실행됩니다.

### 8.2 자동 마이그레이션
앱 로딩 시 다음이 자동으로 실행됩니다:

1. **백업 생성**
   - 현재 데이터를 localStorage에 백업
   - 백업 키: `BACKUP_{timestamp}`

2. **팀 데이터 변환**
   - `Team.classId` → 삭제
   - `Team.teacherId` 유지
   - `TeamMember.classId`, `className` 추가
   - `Team.sourceClassIds` 계산

3. **게임 데이터 업데이트**
   - `Game.teacherId` 추가 (기존 경기는 호환성 유지)

4. **검증**
   - 변환된 데이터 검증
   - 오류 발생 시 자동 롤백

### 8.3 수동 롤백
문제 발생 시 브라우저 콘솔에서:

```javascript
// 최신 백업으로 롤백
import { rollbackToLatestBackup } from '@/lib/migration';
rollbackToLatestBackup();

// 페이지 새로고침
window.location.reload();
```

### 8.4 마이그레이션 플래그
마이그레이션 완료 여부는 localStorage에 저장:
- `TEAMS_MIGRATED_TO_TEACHER_BASED`: 팀 마이그레이션 완료
- `GAMES_MIGRATED_ADD_TEACHER_ID`: 게임 마이그레이션 완료

### 8.5 개발자 도구
마이그레이션 상태 확인: `/dev/migration` (개발 환경 전용)
```

## 수정할 기존 섹션들

### 수정 1: 사용자 플로우 (User Flow)

```markdown
## 5. 사용자 플로우 (User Flow) 🔄 수정

### 5.1 교사 - 팀 편성 플로우 (변경됨)

```
로그인
  ↓
대시보드
  ↓
팀 관리 카드 클릭  (변경: 학급 관리와 분리됨)
  ↓
독립 팀 관리 페이지 (/teacher/teams)
  ├─ 학급별 미배정 학생 확인
  ├─ 새 팀 생성
  ├─ 드래그앤드롭으로 팀원 배정
  │  (여러 학급의 학생 자유롭게 조합 가능)
  └─ 팀 랜덤 배정 / 팀 초기화
```

### 5.2 교사 - 경기 시작 플로우 (변경됨)

```
대시보드
  ↓
경기 관리 카드 클릭
  ↓
새 경기 시작 버튼
  ↓
경기 설정 페이지 (/teacher/game/new)
  ├─ 모든 팀 중에서 2개 선택  (변경: 학급 제한 없음)
  │  예: 5-3 팀 vs 5-2+6-1 통합팀
  ├─ 경기 설정 입력
  └─ 경기 시작
       ↓
    경기 진행 화면
```
```

## 변경 이력 (Changelog)

```markdown
## 부록 A. 변경 이력 (Changelog)

### v2.0 (2025-01-22) - 팀 독립성 리팩토링

**주요 변경사항**:
1. **데이터 모델**
   - Team 인터페이스에서 `classId` 삭제
   - TeamMember에 `classId`, `className` 추가
   - Game에 `teacherId` 추가

2. **페이지 구조**
   - `/teacher/teams` 독립 팀 관리 페이지 추가
   - `/teacher/class/[classId]/teams` deprecated
   - `/teacher/class/[classId]/game/setup` deprecated

3. **UI/UX**
   - Dashboard에 "팀 관리" 카드 분리
   - 학급 관리 뷰에서 "팀 편성" 제거
   - 경기 설정에서 모든 팀 선택 가능

4. **마이그레이션**
   - 자동 데이터 변환
   - 백업 및 롤백 시스템

**Breaking Changes**:
- getTeams(classId) → getTeams(teacherId)
- 학급별 팀 페이지 URL 변경

**Migration Required**: Yes (자동 실행)

---

### v1.0 (2025-01-XX) - 초기 버전

- 학급 기반 팀 관리
- 경기 진행 및 기록
- 학생 관리
```

## 문서 업데이트 작업 순서

### Phase 1: 백업 및 준비 (5분)
```bash
cd docs/
cp PRD_MASTER.md PRD_MASTER_v1.0_backup.md
```

### Phase 2: 헤더 및 개요 수정 (10분)
1. 문서 버전 추가
2. 프로젝트 개요 수정
3. 핵심 기능 업데이트
4. 개념 구분 섹션 추가

### Phase 3: 데이터 모델 수정 (20분)
1. Team 인터페이스 수정
2. TeamMember 인터페이스 수정
3. Game 인터페이스 수정
4. 변경 사항 주석 추가

### Phase 4: 페이지 구조 수정 (30분)
1. 독립 팀 관리 페이지 섹션 추가
2. 경기 설정 페이지 수정 사항 반영
3. Deprecated 페이지 섹션 추가
4. Dashboard 재설계 반영

### Phase 5: 사용자 플로우 수정 (15분)
1. 팀 편성 플로우 업데이트
2. 경기 시작 플로우 업데이트

### Phase 6: 마이그레이션 가이드 추가 (20분)
1. 마이그레이션 개요 작성
2. 자동 마이그레이션 설명
3. 수동 롤백 가이드
4. 개발자 도구 안내

### Phase 7: 변경 이력 추가 (10분)
1. Changelog 섹션 작성
2. v2.0 변경사항 정리
3. Breaking Changes 명시

### Phase 8: 검토 및 정리 (10분)
1. 전체 문서 일관성 확인
2. 링크 및 참조 업데이트
3. 오타 및 서식 확인

## 커밋 메시지

```bash
git add docs/PRD_MASTER.md docs/PRD_MASTER_v1.0_backup.md
git commit -m "docs: PRD v2.0 - 팀 독립성 리팩토링 반영

- 프로젝트 개요에 다중 학급 팀 구성 개념 추가
- 학급 관리 vs 팀 관리 개념 구분 명시
- Team, TeamMember, Game 인터페이스 변경 사항 반영
- /teacher/teams 독립 팀 관리 페이지 문서화
- /teacher/game/new 경기 설정 변경 사항 반영
- Deprecated 페이지 목록 추가
- Dashboard 재설계 반영
- 마이그레이션 가이드 추가
- Changelog v2.0 작성

Breaking Changes:
- 팀 데이터 모델 변경 (classId → teacherId)
- 페이지 URL 구조 변경
- 자동 마이그레이션 필요

Backup:
- PRD_MASTER_v1.0_backup.md 생성"
```

## 체크리스트

문서 업데이트 전:
- [ ] PRD_MASTER.md 백업 생성
- [ ] IR 문서들 모두 완성되었는지 확인

문서 업데이트 중:
- [ ] 모든 데이터 모델 변경사항 반영
- [ ] 모든 페이지 구조 변경사항 반영
- [ ] 사용자 플로우 업데이트
- [ ] 마이그레이션 가이드 추가

문서 업데이트 후:
- [ ] 전체 문서 읽어보며 일관성 확인
- [ ] 코드 예시 TypeScript 문법 확인
- [ ] 링크 및 참조 확인
- [ ] Git 커밋

---

**작성일**: 2025-01-22
**작성자**: Claude Code
**상태**: 계획 완료, 실행 대기
