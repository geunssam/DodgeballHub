# IR_PHASE3: Independent Team Management Page

**Phase**: 3/7
**Status**: Ready for Implementation
**Priority**: Critical - 핵심 기능 구현
**Estimated Time**: 4-5 hours
**Dependencies**: Phase 1, Phase 2 완료 필수

## 목적 (Purpose)

학급에 종속되지 않는 독립적인 팀 관리 페이지(`/teacher/teams`)를 구현하여, 교사가 모든 학급의 학생들로 자유롭게 팀을 편성할 수 있도록 합니다.

## 현재 문제점 (Current Issues)

### 1. 학급별 팀 페이지의 한계

```typescript
// 현재: app/teacher/class/[classId]/teams/page.tsx
// URL: /teacher/class/{classId}/teams
export default function TeamManagementPage() {
  const params = useParams();
  const classId = params.classId as string;  // ❌ 특정 학급에 종속됨

  // 해당 학급의 학생만 로드
  const students = await getStudents(classId);  // ❌ 제한적

  // 해당 학급의 팀만 로드
  const teams = await getTeams(classId);  // ❌ classId 기반
}
```

**문제점**:
- 특정 학급(`classId`)에 종속된 URL 구조
- 다른 학급의 학생을 자연스럽게 포함할 수 없음
- "학급 추가" 기능이 임시방편적 해결책
- 학급 간 경기 시나리오를 지원하지 못함

### 2. 학생 로딩의 복잡성

현재는 "학급 추가" 모달로 다른 학급 학생을 가져오지만:
- 학생의 `classId`를 변경하여 현재 학급으로 이동시킴
- 원래 학급에서 학생이 사라짐
- 데이터 무결성 문제 발생

## 제안하는 해결책 (Proposed Solution)

### 1. 새로운 독립 페이지 구조

```
현재: /teacher/class/{classId}/teams  (❌ 학급 종속)
제안: /teacher/teams                  (✅ 교사 전체 팀 관리)
```

**URL 구조**:
```
/teacher/teams              # 전체 팀 목록 및 새 팀 생성
/teacher/teams?teamId={id}  # 특정 팀 편집 모드
```

### 2. 페이지 레이아웃 구조

```typescript
// 새 파일: app/teacher/teams/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DndContext, DragEndEvent } from '@dnd-kit/core';

export default function IndependentTeamManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamId = searchParams.get('teamId');  // 편집할 팀 ID (선택사항)

  // State
  const [teacherId, setTeacherId] = useState<string>('');
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);  // ✅ 모든 학급 학생
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  // UI State
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // ... 구현 로직
}
```

### 3. 레이아웃 구성

```
┌─────────────────────────────────────────────────────────────┐
│ 헤더: 팀 관리 (n팀) - [팀 랜덤 배정] [팀 초기화] [대시보드로] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │ 미배정 학생     │  │ 기존 팀 목록    │  │ + 새 팀     │  │
│  │ (학급별 그룹화) │  │ (카드 형태)     │  │             │  │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────┤  │
│  │ ▼ 5학년 3반     │  │ 🔴 레드팀       │  │ 팀 이름:    │  │
│  │   - 홍길동      │  │ (5명)           │  │ [입력]      │  │
│  │   - 김철수      │  │ 5-3, 5-2 학생   │  │             │  │
│  │                 │  │                 │  │ 팀 색상:    │  │
│  │ ▼ 5학년 2반     │  │ 🔵 블루팀       │  │ [선택]      │  │
│  │   - 이영희      │  │ (5명)           │  │             │  │
│  │   - 박민수      │  │ 5-3 학생        │  │ [생성]      │  │
│  │                 │  │                 │  │             │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 핵심 구현 사항

### 1. 데이터 로딩 로직

```typescript
// app/teacher/teams/page.tsx
const loadData = async () => {
  try {
    const currentTeacherId = localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER);
    if (!currentTeacherId) {
      router.push('/teacher/login');
      return;
    }
    setTeacherId(currentTeacherId);

    // 1. 교사의 모든 학급 로드
    const classList = await getClasses(currentTeacherId);
    setAllClasses(classList);

    // 2. 모든 학급의 학생 로드 (✅ Phase 1의 teacherId 기반)
    const studentPromises = classList.map(c => getStudents(c.id));
    const studentLists = await Promise.all(studentPromises);
    const students = studentLists.flat();
    setAllStudents(students);

    // 3. 교사의 모든 팀 로드 (✅ teacherId 기반)
    const teamList = await getTeams(currentTeacherId);
    setTeams(teamList);

    // 4. URL에서 teamId가 있으면 해당 팀 편집 모드
    if (teamId) {
      const team = teamList.find(t => t.id === teamId);
      setSelectedTeam(team || null);
    }

  } catch (error) {
    console.error('Failed to load data:', error);
  } finally {
    setLoading(false);
  }
};
```

### 2. 미배정 학생 계산

팀에 배정되지 않은 학생들:

```typescript
// app/teacher/teams/page.tsx
const getUnassignedStudents = (): Student[] => {
  // 모든 팀의 멤버 ID 수집
  const assignedStudentIds = new Set<string>();
  teams.forEach(team => {
    team.members.forEach(member => {
      assignedStudentIds.add(member.studentId);
    });
  });

  // 배정되지 않은 학생 필터링
  return allStudents.filter(student => !assignedStudentIds.has(student.id));
};

const unassignedStudents = getUnassignedStudents();
```

### 3. 학급별 그룹화 UI

```typescript
// app/teacher/teams/page.tsx
const groupStudentsByClass = (students: Student[]): Map<string, Student[]> => {
  const grouped = new Map<string, Student[]>();

  students.forEach(student => {
    if (!grouped.has(student.classId)) {
      grouped.set(student.classId, []);
    }
    grouped.get(student.classId)!.push(student);
  });

  return grouped;
};

const unassignedByClass = groupStudentsByClass(unassignedStudents);
```

### 4. 학급별 아코디언 UI

```typescript
// app/teacher/teams/page.tsx (렌더링 부분)
<div className="flex-1 border-2 border-gray-200 rounded-lg p-4 overflow-y-auto h-[600px]">
  <div className="flex justify-between items-center mb-3 pb-2 border-b">
    <h3 className="text-lg font-bold">
      미배정 학생 <span className="text-gray-600">({unassignedStudents.length}명)</span>
    </h3>
  </div>

  {/* 학급별 아코디언 */}
  <div className="space-y-2">
    {Array.from(unassignedByClass.entries()).map(([classId, students]) => {
      const classInfo = allClasses.find(c => c.id === classId);
      const isExpanded = expandedClasses.has(classId);

      return (
        <div key={classId} className="border rounded-lg">
          {/* 학급 헤더 (클릭으로 토글) */}
          <div
            className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-50"
            onClick={() => toggleClassExpansion(classId)}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
              <span className="font-semibold">{classInfo?.name || classId}</span>
              <span className="text-sm text-gray-600">({students.length}명)</span>
            </div>
          </div>

          {/* 학생 목록 (확장 시) */}
          {isExpanded && (
            <div className="p-2 space-y-2 bg-gray-50">
              {students.map(student => (
                <StudentCard key={student.id} student={student} />
              ))}
            </div>
          )}
        </div>
      );
    })}

    {unassignedStudents.length === 0 && (
      <p className="text-sm text-gray-400 text-center py-8">
        모든 학생이 팀에 배정되었습니다
      </p>
    )}
  </div>
</div>
```

**토글 함수**:
```typescript
const toggleClassExpansion = (classId: string) => {
  setExpandedClasses(prev => {
    const newSet = new Set(prev);
    if (newSet.has(classId)) {
      newSet.delete(classId);
    } else {
      newSet.add(classId);
    }
    return newSet;
  });
};
```

### 5. 기존 팀 목록 표시

```typescript
// app/teacher/teams/page.tsx
<div className="flex-1 border-2 border-gray-200 rounded-lg p-4 overflow-y-auto h-[600px]">
  <div className="flex justify-between items-center mb-3 pb-2 border-b">
    <h3 className="text-lg font-bold">
      기존 팀 <span className="text-gray-600">({teams.length}팀)</span>
    </h3>
  </div>

  <div className="space-y-4">
    {teams.map(team => (
      <div
        key={team.id}
        className="border-2 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all"
        style={{ borderColor: getTeamColorHex(team.color) }}
      >
        {/* 팀 헤더 */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: getTeamColorHex(team.color) }}
            />
            <h4 className="font-bold">{team.name}</h4>
            <span className="text-sm text-gray-600">({team.members.length}명)</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteTeam(team.id)}
          >
            삭제
          </Button>
        </div>

        {/* 팀원 목록 */}
        <div className="space-y-1">
          {team.members.map(member => (
            <div
              key={member.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
            >
              <span>
                {member.name} ({member.number}번)
                {member.className && (
                  <span className="ml-2 text-xs text-gray-500">
                    [{member.className}]
                  </span>
                )}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveMemberFromTeam(team.id, member.studentId)}
                className="h-6 px-2"
              >
                ✕
              </Button>
            </div>
          ))}
        </div>

        {/* 드롭존 */}
        <TeamDropZone
          id={team.id}
          color={team.color}
          students={team.members.map(m => {
            const student = allStudents.find(s => s.id === m.studentId);
            return student || { id: m.studentId, name: m.name, number: m.number, classId: m.classId, gender: 'male' } as Student;
          })}
        />
      </div>
    ))}

    {teams.length === 0 && (
      <p className="text-sm text-gray-400 text-center py-8">
        아직 생성된 팀이 없습니다
      </p>
    )}
  </div>
</div>
```

### 6. 새 팀 생성 폼

```typescript
// app/teacher/teams/page.tsx
<div className="w-80 border-2 border-dashed border-gray-300 rounded-lg p-4">
  <h3 className="text-lg font-bold mb-4 text-center">+ 새 팀 만들기</h3>

  {showNewTeamForm ? (
    <div className="space-y-4">
      <div>
        <Label htmlFor="teamName">팀 이름</Label>
        <Input
          id="teamName"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          placeholder="예: 레드팀"
        />
      </div>

      <div>
        <Label htmlFor="teamColor">팀 색상</Label>
        <select
          id="teamColor"
          value={newTeamColor}
          onChange={(e) => setNewTeamColor(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="red">빨강</option>
          <option value="blue">파랑</option>
          <option value="green">초록</option>
          <option value="yellow">노랑</option>
          <option value="purple">보라</option>
          <option value="orange">주황</option>
        </select>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleCreateTeam} className="flex-1">
          생성
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowNewTeamForm(false)}
          className="flex-1"
        >
          취소
        </Button>
      </div>
    </div>
  ) : (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => setShowNewTeamForm(true)}
    >
      + 팀 추가
    </Button>
  )}
</div>
```

### 7. 드래그앤드롭 핸들러

```typescript
// app/teacher/teams/page.tsx
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;

  if (!over) return;

  const studentId = active.id as string;
  const targetTeamId = over.id as string;

  try {
    // 학생 정보 찾기
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return;

    // 대상 팀 찾기
    const targetTeam = teams.find(t => t.id === targetTeamId);
    if (!targetTeam) return;

    // 이미 다른 팀에 속해있는지 확인
    const currentTeam = teams.find(t =>
      t.members.some(m => m.studentId === studentId)
    );

    if (currentTeam) {
      // 기존 팀에서 제거
      const updatedMembers = currentTeam.members.filter(m => m.studentId !== studentId);
      await updateTeam(currentTeam.id, { members: updatedMembers });
    }

    // 새 팀에 추가
    const classInfo = allClasses.find(c => c.id === student.classId);
    const newMember: TeamMember = {
      id: Date.now().toString(),
      studentId: student.id,
      name: student.name,
      number: student.number,
      classId: student.classId,
      className: classInfo?.name
    };

    const updatedTargetMembers = [...targetTeam.members, newMember];
    await updateTeam(targetTeamId, {
      members: updatedTargetMembers,
      sourceClassIds: calculateSourceClassIds(updatedTargetMembers)
    });

    // 데이터 새로고침
    await loadData();

  } catch (error) {
    console.error('Failed to update team:', error);
    alert('팀원 배정에 실패했습니다.');
  }
};

const calculateSourceClassIds = (members: TeamMember[]): string[] => {
  const classIds = new Set(members.map(m => m.classId).filter(Boolean));
  return Array.from(classIds);
};
```

### 8. 팀원 제거 핸들러

```typescript
// app/teacher/teams/page.tsx
const handleRemoveMemberFromTeam = async (teamId: string, studentId: string) => {
  try {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    const updatedMembers = team.members.filter(m => m.studentId !== studentId);

    await updateTeam(teamId, {
      members: updatedMembers,
      sourceClassIds: calculateSourceClassIds(updatedMembers)
    });

    await loadData();
  } catch (error) {
    console.error('Failed to remove member:', error);
    alert('팀원 제거에 실패했습니다.');
  }
};
```

### 9. 팀 생성 핸들러

```typescript
// app/teacher/teams/page.tsx
const handleCreateTeam = async () => {
  if (!newTeamName.trim()) {
    alert('팀 이름을 입력해주세요.');
    return;
  }

  try {
    await createTeam({
      teacherId,
      name: newTeamName,
      color: newTeamColor,
      members: [],
      sourceClassIds: []
    });

    // 폼 초기화
    setNewTeamName('');
    setNewTeamColor('red');
    setShowNewTeamForm(false);

    // 데이터 새로고침
    await loadData();

    alert('팀이 생성되었습니다!');
  } catch (error) {
    console.error('Failed to create team:', error);
    alert('팀 생성에 실패했습니다.');
  }
};
```

### 10. 팀 랜덤 배정 핸들러

```typescript
// app/teacher/teams/page.tsx
const handleRandomAssignment = async () => {
  if (teams.length === 0) {
    alert('팀이 없습니다. 먼저 팀을 생성해주세요.');
    return;
  }

  if (unassignedStudents.length === 0) {
    alert('미배정 학생이 없습니다.');
    return;
  }

  if (!confirm(`${unassignedStudents.length}명의 학생을 ${teams.length}개 팀에 랜덤으로 배정하시겠습니까?`)) {
    return;
  }

  try {
    // 학생 셔플
    const shuffled = [...unassignedStudents].sort(() => Math.random() - 0.5);

    // 팀별로 배정
    const updatedTeams = teams.map(team => ({ ...team }));
    shuffled.forEach((student, index) => {
      const teamIndex = index % teams.length;
      const classInfo = allClasses.find(c => c.id === student.classId);

      const newMember: TeamMember = {
        id: Date.now().toString() + index,
        studentId: student.id,
        name: student.name,
        number: student.number,
        classId: student.classId,
        className: classInfo?.name
      };

      updatedTeams[teamIndex].members.push(newMember);
    });

    // 각 팀 업데이트
    for (const team of updatedTeams) {
      await updateTeam(team.id, {
        members: team.members,
        sourceClassIds: calculateSourceClassIds(team.members)
      });
    }

    await loadData();
    alert('랜덤 배정이 완료되었습니다!');

  } catch (error) {
    console.error('Failed to random assign:', error);
    alert('랜덤 배정에 실패했습니다.');
  }
};
```

## 영향받는 파일 목록 (Affected Files)

### 1. 새로 생성할 파일
- ✅ `/app/teacher/teams/page.tsx` - 독립 팀 관리 페이지 (메인)
- ✅ (선택) `/components/ClassStudentGroup.tsx` - 학급별 그룹 컴포넌트

### 2. 재사용 가능한 기존 컴포넌트
- ✅ `/components/StudentCard.tsx` - 드래그 가능한 학생 카드
- ✅ `/components/TeamDropZone.tsx` - 팀 드롭존 (수정 필요)
- ✅ `/components/ui/*` - shadcn/ui 컴포넌트

### 3. 수정이 필요한 파일
- ✅ `/lib/dataService.ts` - getTeams, updateTeam 함수 (Phase 1에서 수정됨)
- ✅ `/app/teacher/dashboard/page.tsx` - 팀 관리 뷰에서 이 페이지로 링크

### 4. 참조할 기존 파일
- `/app/teacher/class/[classId]/teams/page.tsx` - 로직 참고용 (나중에 제거 가능)

## 구현 순서 (Implementation Steps)

### Step 1: 페이지 파일 생성 (15분)
1. `/app/teacher/teams/page.tsx` 생성
2. 기본 구조 및 State 설정
3. 헤더 구현

### Step 2: 데이터 로딩 (30분)
1. `loadData` 함수 구현
2. 모든 학급, 학생, 팀 로드
3. URL 파라미터 처리 (`teamId`)

### Step 3: 미배정 학생 섹션 (45분)
1. `getUnassignedStudents` 함수
2. `groupStudentsByClass` 함수
3. 학급별 아코디언 UI
4. 토글 기능 구현

### Step 4: 기존 팀 목록 섹션 (30분)
1. 팀 카드 렌더링
2. 팀원 목록 표시 (학급명 포함)
3. 팀원 제거 버튼

### Step 5: 새 팀 생성 섹션 (30분)
1. 팀 생성 폼 UI
2. `handleCreateTeam` 함수
3. 폼 초기화 로직

### Step 6: 드래그앤드롭 통합 (45분)
1. DndContext 설정
2. `handleDragEnd` 함수 구현
3. 학생 → 팀 드래그 테스트
4. 팀 → 팀 드래그 테스트

### Step 7: 추가 기능 (30분)
1. 팀 랜덤 배정 버튼 및 함수
2. 팀 초기화 버튼 및 함수
3. 팀 삭제 핸들러

### Step 8: 스타일링 (30분)
1. 3-column 레이아웃 조정
2. 아코디언 애니메이션
3. 색상 일관성 확인

### Step 9: 테스트 (45분)
1. 학생 드래그 테스트
2. 팀 생성 테스트
3. 랜덤 배정 테스트
4. 다중 학급 시나리오 테스트

### Step 10: Dashboard 연결 (15분)
1. Dashboard의 팀 관리 뷰에서 링크 연결
2. "팀 편성 페이지로 이동" 버튼

### Step 11: 커밋 (10분)
```bash
git add .
git commit -m "feat: Phase3 - 독립 팀 관리 페이지 구현

- /teacher/teams 독립 페이지 생성
- 모든 학급의 학생을 한 곳에서 관리
- 학급별 아코디언 그룹화 UI
- 드래그앤드롭으로 팀원 배정
- 학생의 원래 classId 유지 (변경하지 않음)
- 팀원에 학급명 표시 기능
- 팀 랜덤 배정 및 초기화 기능

Breaking Changes:
- 기존 /teacher/class/[classId]/teams 페이지는 deprecated됨
- Dashboard에서 팀 관리는 /teacher/teams로 이동

Features:
- 여러 학급의 학생으로 팀 편성 가능
- 팀별 sourceClassIds 자동 계산"
```

## UI/UX 개선 사항

### 1. 학급별 색상 구분 (선택사항)

학급마다 다른 배경색 적용:

```typescript
const classColors = ['bg-blue-50', 'bg-green-50', 'bg-yellow-50', 'bg-purple-50'];

const getClassColor = (index: number) => {
  return classColors[index % classColors.length];
};
```

### 2. 드래그 피드백

드래그 중인 학생 카드에 시각적 피드백:

```typescript
<div className={`transition-all ${isDragging ? 'opacity-50 scale-95' : ''}`}>
  <StudentCard student={student} />
</div>
```

### 3. 팀원 수 균형 표시

팀별로 인원 수 차이가 크면 경고:

```typescript
const getTeamBalanceWarning = (): string | null => {
  if (teams.length === 0) return null;

  const memberCounts = teams.map(t => t.members.length);
  const max = Math.max(...memberCounts);
  const min = Math.min(...memberCounts);

  if (max - min > 2) {
    return `⚠️ 팀 인원이 불균형합니다 (최대: ${max}명, 최소: ${min}명)`;
  }

  return null;
};
```

### 4. 학급별 학생 수 표시

```typescript
<div className="text-xs text-gray-500 mt-1">
  5-3: 3명 | 5-2: 2명 | 5-1: 1명
</div>
```

## 테스트 시나리오 (Test Scenarios)

### 1. 페이지 로딩
```
1. /teacher/teams 접속
2. 모든 학급의 학생 로드 확인
3. 기존 팀 목록 표시 확인
4. 미배정 학생이 학급별로 그룹화되어 표시되는지 확인
```

### 2. 팀 생성
```
1. "+ 팀 추가" 클릭
2. 팀 이름, 색상 입력
3. "생성" 클릭
4. 빈 팀이 "기존 팀" 섹션에 추가되는지 확인
```

### 3. 드래그앤드롭 배정
```
1. 학급 아코디언 펼치기
2. 학생 카드를 팀 드롭존으로 드래그
3. 팀에 학생 추가 확인
4. 학생 카드 옆에 학급명 표시 확인 (예: [5-3])
5. 미배정 학생 섹션에서 해당 학생 제거 확인
```

### 4. 팀 간 이동
```
1. 팀 A의 학생을 팀 B로 드래그
2. 팀 A에서 제거, 팀 B에 추가 확인
3. 양쪽 팀의 sourceClassIds 업데이트 확인
```

### 5. 다중 학급 팀 구성
```
1. 5-3 학급 학생 2명 → 레드팀
2. 5-2 학급 학생 2명 → 레드팀
3. 레드팀의 팀원 목록에서 학급명 구분 표시 확인
4. 레드팀의 sourceClassIds = ['class-5-3', 'class-5-2'] 확인
```

### 6. 팀원 제거
```
1. 팀 카드에서 "✕" 버튼 클릭
2. 해당 학생이 미배정 학생 섹션으로 이동 확인
3. 팀의 sourceClassIds 업데이트 확인 (해당 학급 학생이 없으면 제거)
```

### 7. 랜덤 배정
```
1. 미배정 학생 10명, 팀 2개 상태
2. "팀 랜덤 배정" 클릭
3. 10명이 2개 팀에 균등하게 분배되는지 확인 (5명씩)
4. 각 팀의 sourceClassIds 확인
```

### 8. 팀 초기화
```
1. "팀 초기화" 클릭
2. 모든 팀 삭제 확인
3. 모든 팀원이 미배정 학생으로 이동 확인
```

## 성공 기준 (Success Criteria)

1. ✅ `/teacher/teams` URL로 접속 가능
2. ✅ 교사의 모든 학급 학생이 한 곳에 표시됨
3. ✅ 학급별 아코디언 그룹화 UI
4. ✅ 드래그앤드롭으로 팀원 배정 가능
5. ✅ 학생의 원래 `classId`는 변경되지 않음
6. ✅ 팀원 카드에 학급명 표시 (`className`)
7. ✅ 여러 학급의 학생으로 팀 구성 가능
8. ✅ 팀의 `sourceClassIds` 자동 계산됨
9. ✅ 팀 생성, 삭제, 초기화 기능 동작
10. ✅ 랜덤 배정 기능 동작
11. ✅ 반응형 레이아웃 (3-column)

## 위험 요소 (Risks)

| 위험 | 영향도 | 완화 전략 |
|------|--------|-----------|
| 대량 학생 로딩 성능 | 중간 | 필요시 가상 스크롤 추가 |
| 드래그앤드롭 충돌 | 낮음 | dnd-kit 최신 버전 사용 |
| 학급 아코디언 UX 복잡도 | 낮음 | 기본적으로 모두 펼침 |
| TeamDropZone 재사용성 | 낮음 | 기존 컴포넌트 그대로 사용 |

## 다음 단계 (Next Steps)

Phase 3 완료 후:
- **Phase 4**: 경기 설정 페이지 통합
  - `/teacher/game/new` 페이지 수정
  - teacherId 기반 팀 로딩
  - 기존 학급별 경기 설정 리디렉션

---

**작성일**: 2025-01-22
**작성자**: Claude Code
**의존성**: Phase 1, Phase 2 완료 필수
**검토 필요**: ✅ UX 플로우 검토 권장
