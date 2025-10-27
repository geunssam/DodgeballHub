# IR_PHASE1: Data Structure Redesign

**Phase**: 1/7
**Status**: Ready for Implementation
**Priority**: Critical - Foundation for all subsequent phases
**Estimated Time**: 2-3 hours

## 목적 (Purpose)

팀 데이터 구조를 `classId` 기반에서 `teacherId` 기반으로 전환하여, 여러 학급의 학생들로 자유롭게 팀을 구성할 수 있도록 합니다.

## 현재 문제점 (Current Issues)

### 1. Team 모델의 구조적 한계
```typescript
// 현재: types/index.ts (line 47-54)
export interface Team {
  id: string;
  classId: string;  // ❌ 문제: 팀이 특정 학급에 종속됨
  teacherId: string;
  name: string;
  color: string;
  members?: TeamMember[];
  createdAt: string;
}
```

**문제점**:
- 팀이 특정 학급(`classId`)에 종속되어 있음
- 다른 학급의 학생을 팀에 추가하려면 학생의 `classId`를 변경해야 함
- 학생의 `classId` 변경 시 원래 학급 명단에서 사라짐
- 학급 간 경기, 통합 수업 등 유연한 시나리오 불가능

### 2. 데이터 저장 방식의 문제
```typescript
// 현재: lib/dataService.ts (line 175-184)
export const getTeams = async (classId: string): Promise<Team[]> => {
  const teamsJson = localStorage.getItem(STORAGE_KEYS.TEAMS);
  if (!teamsJson) return [];

  const allTeams: Team[] = JSON.parse(teamsJson);
  return allTeams.filter(team => team.classId === classId);
  // ❌ classId로 필터링하면 다중 학급 팀 구성 불가
};
```

### 3. 학생-팀 관계의 복잡성
현재는 `TeamMember`가 팀 내에 중첩되어 있어, 한 학생이 원래 학급 정보를 유지하면서 다른 학급 팀에 속하는 것이 불가능합니다.

## 제안하는 해결책 (Proposed Solution)

### 1. Team 인터페이스 변경

```typescript
// 수정 후: types/index.ts
export interface Team {
  id: string;
  teacherId: string;  // ✅ classId 삭제, teacherId만 유지
  name: string;
  color: string;
  members: TeamMember[];  // ✅ optional 제거, 항상 배열 유지
  createdAt: string;
  // 새로운 필드 추가
  sourceClassIds?: string[];  // 팀원들이 속한 학급 ID 목록 (선택사항, 통계용)
}
```

**주요 변경사항**:
1. `classId` 필드 **완전 삭제**
2. `teacherId`만 유지하여 교사별로 팀 관리
3. `members` 배열을 필수 필드로 변경 (빈 배열로 초기화)
4. `sourceClassIds` 추가: 팀원들의 원래 학급 정보 (통계/표시용)

### 2. Student 인터페이스는 유지

```typescript
// 변경 없음: types/index.ts
export interface Student {
  id: string;
  classId: string;  // ✅ 유지: 학생의 원래 학급은 변경되지 않음
  name: string;
  number: number;
  gender: 'male' | 'female';
  stats?: StudentStats;
}
```

**중요**: 학생의 `classId`는 **절대 변경하지 않습니다**. 학생은 항상 원래 학급에 속하며, 팀 배정은 별도로 관리됩니다.

### 3. TeamMember 인터페이스 개선

```typescript
// 수정 후: types/index.ts
export interface TeamMember {
  id: string;
  studentId: string;  // Student의 id 참조
  name: string;
  number: number;
  classId: string;  // ✅ 추가: 학생의 원래 학급 정보 (표시용)
  className?: string;  // ✅ 추가: 학급명 표시용 (예: "5학년 3반")
  // 경기 중 사용되는 필드들
  initialLives?: number;
  currentLives?: number;
  isInOuterCourt?: boolean;
  position?: 'infield' | 'outfield';
}
```

**변경 이유**:
- `classId`와 `className` 추가로 팀원이 어느 학급 출신인지 표시 가능
- UI에서 "홍길동 (5-3)" 같은 형태로 표시 가능
- 학생의 원본 데이터(`Student`)는 변경하지 않고 참조만 유지

## 데이터 서비스 함수 수정 (dataService.ts)

### 1. getTeams 함수 변경

```typescript
// 변경 전: lib/dataService.ts
export const getTeams = async (classId: string): Promise<Team[]> => {
  const teamsJson = localStorage.getItem(STORAGE_KEYS.TEAMS);
  if (!teamsJson) return [];

  const allTeams: Team[] = JSON.parse(teamsJson);
  return allTeams.filter(team => team.classId === classId);  // ❌
};

// 변경 후: lib/dataService.ts
export const getTeams = async (teacherId: string): Promise<Team[]> => {
  const teamsJson = localStorage.getItem(STORAGE_KEYS.TEAMS);
  if (!teamsJson) return [];

  const allTeams: Team[] = JSON.parse(teamsJson);
  return allTeams.filter(team => team.teacherId === teacherId);  // ✅
};
```

**함수명 변경 여부**:
- 기존 함수명 유지 가능 (`getTeams`)
- 하지만 파라미터가 `classId`에서 `teacherId`로 변경되므로 **호출하는 모든 코드 수정 필요**

### 2. createTeam 함수 변경

```typescript
// 변경 전
export const createTeam = async (team: Omit<Team, 'id' | 'createdAt'>): Promise<Team> => {
  const newTeam: Team = {
    ...team,
    id: Date.now().toString(),
    members: team.members || [],  // ❌ classId 포함되어 있음
    createdAt: new Date().toISOString(),
  };
  // ... 저장 로직
};

// 변경 후
export const createTeam = async (team: Omit<Team, 'id' | 'createdAt'>): Promise<Team> => {
  // team 객체에 classId가 없는지 검증
  if ('classId' in team) {
    throw new Error('Team should not have classId. Use teacherId instead.');
  }

  const newTeam: Team = {
    ...team,
    id: Date.now().toString(),
    members: team.members || [],  // ✅ teacherId만 포함
    sourceClassIds: calculateSourceClassIds(team.members || []),
    createdAt: new Date().toISOString(),
  };

  const teams = await getTeams(team.teacherId);
  const updatedTeams = [...teams, newTeam];
  localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(updatedTeams));

  return newTeam;
};

// 헬퍼 함수: 팀원들의 학급 ID 목록 추출
const calculateSourceClassIds = (members: TeamMember[]): string[] => {
  const classIds = new Set(members.map(m => m.classId).filter(Boolean));
  return Array.from(classIds);
};
```

### 3. 새로운 함수 추가: getTeamsByClassId

교사가 특정 학급에서 사용 가능한 팀을 보려는 경우를 위한 헬퍼 함수:

```typescript
// 새로 추가: lib/dataService.ts
/**
 * 특정 학급의 학생이 포함된 팀들을 가져옵니다.
 * @param classId - 학급 ID
 * @returns 해당 학급 학생이 1명이라도 포함된 팀 목록
 */
export const getTeamsByClassId = async (classId: string): Promise<Team[]> => {
  const teamsJson = localStorage.getItem(STORAGE_KEYS.TEAMS);
  if (!teamsJson) return [];

  const allTeams: Team[] = JSON.parse(teamsJson);
  return allTeams.filter(team =>
    team.members.some(member => member.classId === classId)
  );
};
```

## 마이그레이션 전략 (Migration Strategy)

### 1. 기존 데이터 변환

기존에 `classId`를 가진 팀 데이터를 `teacherId` 기반으로 변환:

```typescript
// lib/migration.ts (새 파일 생성)
export const migrateTeamsToTeacherBased = async (): Promise<void> => {
  const teamsJson = localStorage.getItem(STORAGE_KEYS.TEAMS);
  if (!teamsJson) return;

  const oldTeams: any[] = JSON.parse(teamsJson);
  const classesJson = localStorage.getItem(STORAGE_KEYS.CLASSES);
  if (!classesJson) {
    console.error('Cannot migrate teams: classes data not found');
    return;
  }

  const classes: Class[] = JSON.parse(classesJson);

  const migratedTeams: Team[] = oldTeams.map(oldTeam => {
    // classId로 해당 학급 찾기
    const teamClass = classes.find(c => c.id === oldTeam.classId);

    if (!teamClass) {
      console.warn(`Class not found for team ${oldTeam.id}, skipping`);
      return null;
    }

    // members에 classId 추가
    const updatedMembers = (oldTeam.members || []).map((member: any) => ({
      ...member,
      classId: oldTeam.classId,  // 기존 팀의 classId를 멤버에 추가
      className: teamClass.name
    }));

    // classId 제거하고 teacherId 사용
    const { classId, ...teamWithoutClassId } = oldTeam;

    return {
      ...teamWithoutClassId,
      teacherId: teamClass.teacherId,  // ✅ classId → teacherId
      members: updatedMembers,
      sourceClassIds: [oldTeam.classId]  // 원래 학급 정보 보존
    } as Team;
  }).filter(Boolean);  // null 제거

  localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(migratedTeams));
  console.log(`Migrated ${migratedTeams.length} teams from class-based to teacher-based`);
};
```

### 2. 마이그레이션 실행 시점

마이그레이션은 앱 로딩 시 자동으로 실행:

```typescript
// app/layout.tsx 또는 적절한 진입점
'use client';

import { useEffect } from 'react';
import { migrateTeamsToTeacherBased } from '@/lib/migration';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 한 번만 실행되도록 플래그 체크
    const migrated = localStorage.getItem('TEAMS_MIGRATED_TO_TEACHER_BASED');
    if (!migrated) {
      migrateTeamsToTeacherBased().then(() => {
        localStorage.setItem('TEAMS_MIGRATED_TO_TEACHER_BASED', 'true');
      });
    }
  }, []);

  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

### 3. 롤백 계획

문제 발생 시 이전 데이터로 복원:

```typescript
// lib/migration.ts
export const rollbackTeamMigration = (): void => {
  const backupKey = 'TEAMS_BACKUP_BEFORE_MIGRATION';
  const backup = localStorage.getItem(backupKey);

  if (!backup) {
    console.error('No backup found, cannot rollback');
    return;
  }

  localStorage.setItem(STORAGE_KEYS.TEAMS, backup);
  localStorage.removeItem('TEAMS_MIGRATED_TO_TEACHER_BASED');
  console.log('Rolled back to class-based teams');
};

// 마이그레이션 전 백업 생성
export const migrateTeamsToTeacherBased = async (): Promise<void> => {
  const teamsJson = localStorage.getItem(STORAGE_KEYS.TEAMS);
  if (!teamsJson) return;

  // 백업 생성
  localStorage.setItem('TEAMS_BACKUP_BEFORE_MIGRATION', teamsJson);

  // ... 마이그레이션 로직
};
```

## 영향받는 파일 목록 (Affected Files)

### 1. 타입 정의
- ✅ `/types/index.ts` - Team, TeamMember 인터페이스 수정

### 2. 데이터 서비스
- ✅ `/lib/dataService.ts` - getTeams, createTeam 함수 수정
- ✅ `/lib/migration.ts` (새 파일) - 마이그레이션 로직

### 3. 컴포넌트 (Phase 3-4에서 수정 예정)
- `/app/teacher/class/[classId]/teams/page.tsx` - getTeams 호출 수정
- `/app/teacher/game/new/page.tsx` - 팀 로딩 로직 수정
- `/components/AddClassStudentsModal.tsx` - 학생 추가 시 classId 변경 제거

## 구현 순서 (Implementation Steps)

### Step 1: 백업 및 준비 (5분)
1. 현재 localStorage 데이터 백업
2. Git에서 새 브랜치 생성: `git checkout -b phase1/data-structure`

### Step 2: 타입 수정 (10분)
1. `/types/index.ts`에서 Team 인터페이스 수정
2. TeamMember에 classId, className 추가
3. TypeScript 컴파일 오류 확인

### Step 3: 마이그레이션 코드 작성 (30분)
1. `/lib/migration.ts` 파일 생성
2. `migrateTeamsToTeacherBased` 함수 작성
3. 백업 및 롤백 함수 작성
4. 테스트 데이터로 마이그레이션 검증

### Step 4: dataService 수정 (30분)
1. `getTeams` 함수 파라미터 변경 (classId → teacherId)
2. `createTeam` 함수에서 classId 제거 검증 추가
3. `getTeamsByClassId` 헬퍼 함수 추가
4. 기타 팀 관련 함수들 검토 및 수정

### Step 5: 마이그레이션 실행 설정 (15분)
1. 앱 진입점에 마이그레이션 자동 실행 코드 추가
2. 플래그 체크로 중복 실행 방지

### Step 6: 테스트 (30분)
1. 기존 데이터로 마이그레이션 테스트
2. 새 팀 생성 테스트
3. teacherId로 팀 조회 테스트
4. 롤백 테스트

### Step 7: 커밋 및 문서화 (10분)
```bash
git add .
git commit -m "feat: Phase1 - Team 데이터 구조를 teacherId 기반으로 변경

- Team 인터페이스에서 classId 제거, teacherId 유지
- TeamMember에 classId, className 추가 (표시용)
- getTeams 함수 파라미터를 teacherId로 변경
- 마이그레이션 로직 추가 (classId → teacherId)
- 백업 및 롤백 기능 구현

Breaking Changes:
- getTeams(classId) → getTeams(teacherId)로 시그니처 변경
- Team.classId 필드 삭제됨

Migration:
- 기존 데이터는 자동으로 teacherId 기반으로 변환됨
- 원래 학급 정보는 sourceClassIds에 보존됨"
```

## 테스트 시나리오 (Test Scenarios)

### 1. 마이그레이션 테스트
```typescript
// 테스트 데이터 준비
const oldTeamData = {
  id: '1',
  classId: 'class-123',
  teacherId: 'teacher-456',
  name: '레드팀',
  color: 'red',
  members: [
    { id: 'm1', studentId: 's1', name: '홍길동', number: 1 }
  ]
};

// 마이그레이션 실행
await migrateTeamsToTeacherBased();

// 검증
const teams = await getTeams('teacher-456');
expect(teams[0]).not.toHaveProperty('classId');
expect(teams[0].teacherId).toBe('teacher-456');
expect(teams[0].members[0].classId).toBe('class-123');
```

### 2. 새 팀 생성 테스트
```typescript
const newTeam = await createTeam({
  teacherId: 'teacher-456',
  name: '블루팀',
  color: 'blue',
  members: [
    {
      id: 'm1',
      studentId: 's1',
      name: '김철수',
      number: 5,
      classId: 'class-123',
      className: '5학년 3반'
    }
  ]
});

expect(newTeam).not.toHaveProperty('classId');
expect(newTeam.sourceClassIds).toContain('class-123');
```

### 3. 다중 학급 팀 생성 테스트
```typescript
const multiClassTeam = await createTeam({
  teacherId: 'teacher-456',
  name: '통합팀',
  color: 'green',
  members: [
    { id: 'm1', studentId: 's1', name: '홍길동', number: 1, classId: 'class-123', className: '5-3' },
    { id: 'm2', studentId: 's2', name: '김철수', number: 5, classId: 'class-456', className: '5-2' }
  ]
});

expect(multiClassTeam.sourceClassIds).toEqual(['class-123', 'class-456']);
```

## 성공 기준 (Success Criteria)

1. ✅ Team 인터페이스에 classId 필드가 없음
2. ✅ 모든 기존 팀 데이터가 teacherId 기반으로 변환됨
3. ✅ TeamMember에 원래 학급 정보(classId, className)가 포함됨
4. ✅ getTeams(teacherId)로 교사의 모든 팀 조회 가능
5. ✅ 여러 학급의 학생으로 팀 생성 가능
6. ✅ 학생의 원래 classId는 변경되지 않음
7. ✅ 마이그레이션 롤백 기능 동작
8. ✅ TypeScript 컴파일 오류 없음

## 위험 요소 (Risks)

| 위험 | 영향도 | 완화 전략 |
|------|--------|-----------|
| 마이그레이션 실패로 데이터 손실 | 높음 | 자동 백업 생성, 롤백 기능 |
| 기존 컴포넌트 호환성 깨짐 | 중간 | Phase 3-4에서 순차적 수정 |
| localStorage 용량 부족 | 낮음 | 백업은 세션 단위로만 유지 |
| getTeams 함수 호출부 누락 | 중간 | TypeScript 컴파일 오류로 발견 |

## 다음 단계 (Next Steps)

Phase 1 완료 후:
- **Phase 2**: Dashboard 페이지 재설계 (학급 관리 / 팀 관리 분리)
- **Phase 3**: 독립 팀 관리 페이지 구현 (`/teacher/teams`)
- **Phase 4**: 경기 설정 페이지 통합

---

**작성일**: 2025-01-22
**작성자**: Claude Code
**검토 필요**: ✅ 구현 전 검토 필수
