# IR_PHASE2: Dashboard Redesign - 학급/팀 관리 분리

**Phase**: 2/7
**Status**: Ready for Implementation
**Priority**: High - UI 구조 변경의 기반
**Estimated Time**: 2-3 hours
**Dependencies**: Phase 1 완료 필수

## 목적 (Purpose)

대시보드를 재설계하여 "학급 관리"와 "팀 관리"를 명확히 분리하고, 사용자가 두 개념의 차이를 이해할 수 있도록 합니다.

## 현재 문제점 (Current Issues)

### 1. 학급과 팀이 혼재된 UI 구조

```typescript
// 현재: app/teacher/dashboard/page.tsx (line 174-198)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {classes.map((classItem) => (
    <Card key={classItem.id} className="p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-bold mb-2">{classItem.name}</h3>
      <p className="text-gray-600 mb-4">{classItem.year}학년도</p>
      <div className="space-y-3">
        <Link href={`/teacher/class/${classItem.id}/students`}>
          <Button variant="outline" className="w-full h-11">학생 관리</Button>
        </Link>
        <Link href={`/teacher/class/${classItem.id}/teams`}>
          <Button variant="outline" className="w-full h-11">팀 편성</Button>
        </Link>
        {/* ❌ 문제: 학급 카드 안에 팀 편성이 혼재됨 */}
      </div>
    </Card>
  ))}
</div>
```

**문제점**:
- 학급 카드에서 "팀 편성" 버튼이 학급에 종속된 것처럼 보임
- 실제로는 팀이 교사 전체 학급에 걸쳐 있을 수 있는데, 이를 표현하지 못함
- 사용자가 "학급별로 팀을 만들어야 한다"고 오해할 수 있음

### 2. 대시보드 뷰 구조의 모호함

```typescript
// 현재: app/teacher/dashboard/page.tsx (line 16)
const [dashboardView, setDashboardView] = useState<'dashboard' | 'classes' | 'games'>('dashboard');
```

**문제점**:
- 'classes' 뷰 안에 팀 관리가 포함되어 있음
- 팀 관리가 독립적인 뷰로 분리되어 있지 않음

## 제안하는 해결책 (Proposed Solution)

### 1. 대시보드 뷰 타입 확장

```typescript
// 수정 후: app/teacher/dashboard/page.tsx
type DashboardView = 'dashboard' | 'classes' | 'teams' | 'games';
const [dashboardView, setDashboardView] = useState<DashboardView>('dashboard');
```

### 2. 메인 대시보드 레이아웃 재구성

기존 4개 카드를 유지하되, 의미를 명확히 분리:

```typescript
// 수정 후: app/teacher/dashboard/page.tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* 1. 학급 관리 카드 */}
  <Card
    className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
    onClick={() => setDashboardView('classes')}
  >
    <CardHeader>
      <div className="text-5xl mb-2">🏫</div>
      <CardTitle className="text-xl">학급 관리</CardTitle>
      <CardDescription>학급 생성 및 학생 관리</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold text-blue-600">{classes.length}</p>
      <p className="text-sm text-muted-foreground">개 학급</p>
    </CardContent>
  </Card>

  {/* 2. 팀 관리 카드 (새로 추가) */}
  <Card
    className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
    onClick={() => setDashboardView('teams')}
  >
    <CardHeader>
      <div className="text-5xl mb-2">👥</div>
      <CardTitle className="text-xl">팀 관리</CardTitle>
      <CardDescription>팀 생성 및 팀원 편성</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold text-purple-600">{totalTeams}</p>
      <p className="text-sm text-muted-foreground">개 팀</p>
    </CardContent>
  </Card>

  {/* 3. 경기 관리 카드 */}
  <Card
    className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 bg-gradient-to-br from-green-50 to-green-100 border-green-200"
    onClick={() => setDashboardView('games')}
  >
    <CardHeader>
      <div className="text-5xl mb-2">🏐</div>
      <CardTitle className="text-xl">경기 관리</CardTitle>
      <CardDescription>진행 중 및 완료된 경기</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex gap-4">
        <div>
          <p className="text-2xl font-bold text-green-600">{ongoingGames}</p>
          <p className="text-xs text-muted-foreground">진행 중</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-600">{completedGames}</p>
          <p className="text-xs text-muted-foreground">완료</p>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* 4. 통계 카드 */}
  <Card className="cursor-not-allowed opacity-50 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
    <CardHeader>
      <div className="text-5xl mb-2">📊</div>
      <CardTitle className="text-xl">통계</CardTitle>
      <CardDescription>학생 및 팀 통계</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">준비 중...</p>
    </CardContent>
  </Card>
</div>
```

**주요 변경사항**:
- 첫 번째 카드: "학급/팀 관리" → "학급 관리"로 명확화
- 두 번째 카드: "경기 관리" → "팀 관리"로 변경
- 세 번째 카드: (새로) 경기 관리로 이동
- 네 번째 카드: 통계 유지

### 3. 학급 관리 뷰 수정

학급 카드에서 "팀 편성" 버튼 제거:

```typescript
// 수정 후: app/teacher/dashboard/page.tsx
{dashboardView === 'classes' && (
  <div>
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        <Button onClick={() => setDashboardView('dashboard')} variant="ghost">
          ← 대시보드
        </Button>
        <h2 className="text-2xl font-bold text-foreground">🏫 학급 관리</h2>
      </div>
      <Link href="/teacher/create-class">
        <Button>+ 학급 생성</Button>
      </Link>
    </div>

    {classes.length === 0 ? (
      <Card className="p-8 text-center">
        <p className="text-gray-500 mb-4">아직 생성된 학급이 없습니다.</p>
        <Link href="/teacher/create-class">
          <Button>첫 학급 만들기</Button>
        </Link>
      </Card>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((classItem) => (
          <Card key={classItem.id} className="p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold mb-2">{classItem.name}</h3>
            <p className="text-gray-600 mb-4">{classItem.year}학년도</p>

            {/* 학생 수 표시 */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">전체 학생</p>
              <p className="text-2xl font-bold text-blue-600">
                {classStudentCounts[classItem.id] || 0}명
              </p>
            </div>

            {/* 학급 관련 액션만 */}
            <div className="space-y-3">
              <Link href={`/teacher/class/${classItem.id}/students`}>
                <Button variant="outline" className="w-full h-11">
                  학생 관리
                </Button>
              </Link>
              {/* ✅ "팀 편성" 버튼 제거됨 */}
            </div>
          </Card>
        ))}
      </div>
    )}
  </div>
)}
```

### 4. 새로운 팀 관리 뷰 추가

독립적인 팀 관리 뷰:

```typescript
// 추가: app/teacher/dashboard/page.tsx
{dashboardView === 'teams' && (
  <div>
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        <Button onClick={() => setDashboardView('dashboard')} variant="ghost">
          ← 대시보드
        </Button>
        <h2 className="text-2xl font-bold text-foreground">👥 팀 관리</h2>
      </div>
      <Link href="/teacher/teams">
        <Button>팀 편성 페이지로 이동</Button>
      </Link>
    </div>

    {/* 팀 목록 그리드 */}
    {teams.length === 0 ? (
      <Card className="p-8 text-center">
        <p className="text-gray-500 mb-4">아직 생성된 팀이 없습니다.</p>
        <Link href="/teacher/teams">
          <Button>첫 팀 만들기</Button>
        </Link>
      </Card>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            classes={classes}
            onClick={() => setSelectedTeam(team)}
          />
        ))}
      </div>
    )}

    {/* 팀 상세 모달 */}
    {selectedTeam && (
      <TeamDetailModal
        team={selectedTeam}
        classes={classes}
        onClose={() => setSelectedTeam(null)}
      />
    )}
  </div>
)}
```

## 새로운 컴포넌트: TeamCard

팀을 표시하는 카드 컴포넌트 (기존 ClassTeamManagementView에서 영감):

```typescript
// 새 파일: components/TeamCard.tsx
'use client';

import { Team, Class } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TeamCardProps {
  team: Team;
  classes: Class[];
  onClick: () => void;
}

export function TeamCard({ team, classes, onClick }: TeamCardProps) {
  // 팀 색상 매핑
  const getTeamColor = (color: string) => {
    const colorMap: Record<string, string> = {
      red: '#ef4444',
      blue: '#3b82f6',
      green: '#22c55e',
      yellow: '#eab308',
      purple: '#a855f7',
      orange: '#f97316',
    };
    return colorMap[color] || '#6b7280';
  };

  // 팀원들의 학급 정보
  const sourceClasses = team.sourceClassIds
    ?.map(classId => classes.find(c => c.id === classId))
    .filter(Boolean) || [];

  return (
    <Card
      className="p-6 hover:shadow-lg transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* 팀 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-6 h-6 rounded-full flex-shrink-0"
          style={{ backgroundColor: getTeamColor(team.color) }}
        />
        <h3 className="text-xl font-bold">{team.name}</h3>
      </div>

      {/* 팀 통계 */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">팀원</span>
          <span className="font-semibold">{team.members.length}명</span>
        </div>

        {sourceClasses.length > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">참여 학급</span>
            <span className="font-semibold">{sourceClasses.length}개</span>
          </div>
        )}
      </div>

      {/* 학급 태그 */}
      {sourceClasses.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {sourceClasses.map((classItem) => (
            <span
              key={classItem!.id}
              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
            >
              {classItem!.name}
            </span>
          ))}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="mt-4 pt-4 border-t">
        <Button
          variant="outline"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `/teacher/teams?teamId=${team.id}`;
          }}
        >
          팀 편집
        </Button>
      </div>
    </Card>
  );
}
```

## 필요한 State 추가

```typescript
// 수정 후: app/teacher/dashboard/page.tsx
export default function TeacherDashboardPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);  // ✅ 추가
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);  // ✅ 추가
  const [classStudentCounts, setClassStudentCounts] = useState<Record<string, number>>({});  // ✅ 추가
  const [loading, setLoading] = useState(true);
  const [dashboardView, setDashboardView] = useState<DashboardView>('dashboard');

  // ... 기존 코드
}
```

## 데이터 로딩 로직 수정

```typescript
// 수정 후: app/teacher/dashboard/page.tsx
const loadData = async (teacherId: string) => {
  try {
    // 학급 목록 로드
    const classList = await getClasses(teacherId);
    setClasses(classList);

    // 팀 목록 로드 (✅ teacherId 기반)
    const teamList = await getTeams(teacherId);
    setTeams(teamList);

    // 각 학급의 학생 수 계산
    const counts: Record<string, number> = {};
    for (const classItem of classList) {
      const students = await getStudents(classItem.id);
      counts[classItem.id] = students.length;
    }
    setClassStudentCounts(counts);

  } catch (error) {
    console.error('Failed to load data:', error);
  } finally {
    setLoading(false);
  }
};
```

## 영향받는 파일 목록 (Affected Files)

### 1. 수정할 파일
- ✅ `/app/teacher/dashboard/page.tsx` - 주요 변경 사항
  - DashboardView 타입 확장
  - 메인 카드 레이아웃 재구성
  - 학급 관리 뷰에서 "팀 편성" 제거
  - 새로운 팀 관리 뷰 추가
  - 데이터 로딩 로직 수정

### 2. 새로 생성할 파일
- ✅ `/components/TeamCard.tsx` - 팀 카드 컴포넌트
- ✅ (선택) `/components/TeamDetailModal.tsx` 업데이트 (이미 존재하면 재사용)

### 3. 참조 확인 필요
- `/app/teacher/class/[classId]/teams/page.tsx` - 이 페이지가 여전히 필요한지 검토

## 구현 순서 (Implementation Steps)

### Step 1: 타입 및 State 추가 (10분)
1. DashboardView 타입에 'teams' 추가
2. teams, selectedTeam, classStudentCounts state 추가
3. TypeScript 컴파일 확인

### Step 2: TeamCard 컴포넌트 생성 (30분)
1. `/components/TeamCard.tsx` 파일 생성
2. 팀 색상, 통계, 학급 태그 표시 로직 구현
3. 클릭 핸들러 및 액션 버튼 구현

### Step 3: 데이터 로딩 수정 (15분)
1. loadData 함수에 getTeams(teacherId) 추가
2. 학급별 학생 수 계산 로직 추가
3. 에러 핸들링 확인

### Step 4: 메인 대시보드 카드 재구성 (20분)
1. 4개 카드 레이아웃 수정
2. "학급 관리", "팀 관리" 카드 분리
3. 각 카드의 통계 데이터 연결

### Step 5: 학급 관리 뷰 수정 (15분)
1. "팀 편성" 버튼 제거
2. 학생 수 표시 추가
3. UI 정리

### Step 6: 팀 관리 뷰 추가 (30분)
1. 새로운 'teams' 뷰 케이스 추가
2. 팀 목록 그리드 렌더링
3. 팀 상세 모달 연결
4. 빈 상태 UI 구현

### Step 7: 스타일링 및 반응형 (20분)
1. 그리드 레이아웃 반응형 조정
2. 호버 효과 및 트랜지션
3. 색상 일관성 확인

### Step 8: 테스트 (20분)
1. 각 뷰 간 전환 테스트
2. 팀 카드 클릭 시 상세 모달 확인
3. 빈 상태 (학급 없음, 팀 없음) 테스트

### Step 9: 커밋 (5분)
```bash
git add .
git commit -m "feat: Phase2 - Dashboard를 학급/팀 관리로 분리

- DashboardView에 'teams' 뷰 추가
- 메인 카드를 학급 관리/팀 관리/경기 관리/통계로 재구성
- TeamCard 컴포넌트 생성 (팀 색상, 통계, 학급 태그 표시)
- 학급 관리 뷰에서 '팀 편성' 버튼 제거
- 새로운 팀 관리 뷰 추가 (teacherId 기반 팀 목록)
- 학급별 학생 수 통계 추가

UI Changes:
- 학급과 팀이 독립적인 관리 영역으로 분리됨
- 팀이 여러 학급의 학생을 포함할 수 있음을 UI로 표현"
```

## UI/UX 개선 사항

### 1. 시각적 분리
- 학급 관리: 파란색 계열 (`from-blue-50 to-blue-100`)
- 팀 관리: 보라색 계열 (`from-purple-50 to-purple-100`)
- 경기 관리: 초록색 계열 (`from-green-50 to-green-100`)

### 2. 명확한 개념 구분
| 학급 관리 | 팀 관리 |
|----------|---------|
| 학급 생성/삭제 | 팀 생성/삭제 |
| 학생 명단 관리 | 팀원 편성 |
| 학급별 출석 | 팀별 경기 준비 |
| 고정된 구성원 | 유연한 구성원 |

### 3. 사용자 플로우
```
대시보드
  ├── 학급 관리 (🏫)
  │   ├── 학급 생성
  │   ├── 학생 추가/삭제
  │   └── 학생 정보 수정
  │
  ├── 팀 관리 (👥)
  │   ├── 팀 생성
  │   ├── 모든 학급의 학생으로 팀 편성
  │   └── 팀 통계 확인
  │
  ├── 경기 관리 (🏐)
  │   ├── 팀 선택하여 경기 시작
  │   └── 진행 중/완료 경기 확인
  │
  └── 통계 (📊)
      └── (준비 중)
```

## 테스트 시나리오 (Test Scenarios)

### 1. 대시보드 네비게이션
```
1. 대시보드 접속
2. "학급 관리" 카드 클릭 → 학급 목록 표시
3. "← 대시보드" 클릭 → 메인으로 복귀
4. "팀 관리" 카드 클릭 → 팀 목록 표시
5. "← 대시보드" 클릭 → 메인으로 복귀
```

### 2. 학급 관리 뷰
```
1. 학급이 없는 상태 → "첫 학급 만들기" 버튼 표시
2. 학급 생성 후 → 학급 카드 표시
3. 학급 카드에 학생 수 표시 확인
4. "학생 관리" 버튼 클릭 → 학생 관리 페이지 이동
5. "팀 편성" 버튼 없는 것 확인 ✅
```

### 3. 팀 관리 뷰
```
1. 팀이 없는 상태 → "첫 팀 만들기" 버튼 표시
2. 팀 생성 후 → TeamCard 표시
3. 팀 카드 클릭 → TeamDetailModal 표시
4. "팀 편집" 버튼 클릭 → /teacher/teams 페이지 이동
5. 여러 학급 학생으로 구성된 팀 → 학급 태그 여러 개 표시
```

### 4. 통계 정확성
```
1. 학급 관리 카드의 "n개 학급" 확인
2. 팀 관리 카드의 "n개 팀" 확인
3. 각 학급 카드의 학생 수 확인
4. 각 팀 카드의 팀원 수 확인
```

## 성공 기준 (Success Criteria)

1. ✅ 대시보드에 4개 카드 표시 (학급/팀/경기/통계)
2. ✅ 학급 관리 뷰에 "팀 편성" 버튼 없음
3. ✅ 팀 관리 뷰가 독립적으로 존재
4. ✅ TeamCard에 팀 색상, 통계, 학급 태그 표시
5. ✅ 팀 목록이 teacherId 기반으로 로드됨
6. ✅ 팀이 여러 학급의 학생을 포함할 수 있음을 UI로 표현
7. ✅ 모든 뷰 간 전환이 자연스러움
8. ✅ 반응형 레이아웃 (모바일/태블릿/데스크톱)

## 위험 요소 (Risks)

| 위험 | 영향도 | 완화 전략 |
|------|--------|-----------|
| 기존 사용자 혼란 | 중간 | 명확한 아이콘과 설명 추가 |
| 팀 목록 로딩 성능 | 낮음 | 필요시 페이지네이션 추가 |
| TeamCard 스타일 일관성 | 낮음 | 기존 Card 컴포넌트 재사용 |
| 빈 상태 UX | 낮음 | 명확한 CTA 버튼 제공 |

## 다음 단계 (Next Steps)

Phase 2 완료 후:
- **Phase 3**: 독립 팀 관리 페이지 구현 (`/teacher/teams`)
  - 모든 학급의 학생 표시
  - 학급별 그룹화 UI
  - 드래그앤드롭으로 팀원 편성

---

**작성일**: 2025-01-22
**작성자**: Claude Code
**의존성**: Phase 1 완료 필수
**검토 필요**: ✅ UI/UX 검토 권장
