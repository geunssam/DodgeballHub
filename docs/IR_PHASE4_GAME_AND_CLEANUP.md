# IR_PHASE4: Game Setup Integration & Cleanup

**Phase**: 4-5/7 (통합)
**Status**: Ready for Implementation
**Priority**: Medium - 통합 및 정리
**Estimated Time**: 2-3 hours
**Dependencies**: Phase 1, 2, 3 완료 필수

## 목적 (Purpose)

1. 경기 설정 페이지를 teacherId 기반 팀 시스템과 통합
2. 기존 학급별 팀 페이지 제거 및 리디렉션 설정
3. 모든 참조를 새로운 독립 팀 관리 시스템으로 전환

## Part 1: 경기 설정 페이지 통합

### 1. 현재 문제점

```typescript
// 현재: app/teacher/game/new/page.tsx (일부만 존재)
// 또는: app/teacher/class/[classId]/game/setup/page.tsx
export default function GameSetupPage() {
  const params = useParams();
  const classId = params.classId as string;  // ❌ classId 기반

  // 해당 학급의 팀만 로드
  const teams = await getTeams(classId);  // ❌
}
```

**문제점**:
- 경기 설정이 특정 학급(`classId`)에 종속되어 있음
- 다른 학급의 팀을 선택할 수 없음
- 교사의 모든 팀 중에서 자유롭게 선택하지 못함

### 2. 제안하는 해결책

#### URL 구조 변경

```
현재: /teacher/class/{classId}/game/setup  (❌ 학급 종속)
제안: /teacher/game/new                     (✅ 교사 전체 팀)
```

#### 페이지 위치

- 기존 파일 유지: `/app/teacher/game/new/page.tsx`
- 또는 새로 생성 (기존 위치에 없으면)

### 3. 데이터 로딩 로직 수정

```typescript
// 수정 후: app/teacher/game/new/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClasses, getTeams, createGame } from '@/lib/dataService';
import { STORAGE_KEYS } from '@/lib/mockData';
import { Class, Team, GameSettings } from '@/types';

export default function GameSetupPage() {
  const router = useRouter();

  // State
  const [teacherId, setTeacherId] = useState<string>('');
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);  // ✅ 모든 팀
  const [loading, setLoading] = useState(true);

  // 경기 설정
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [duration, setDuration] = useState(10); // 분
  const [initialLives, setInitialLives] = useState(1);
  const [useOuterCourt, setUseOuterCourt] = useState(true);
  const [outerCourtRule, setOuterCourtRule] = useState<OuterCourtRule>('normal_catch_attack_right');
  const [ballAdditions, setBallAdditions] = useState<BallAddition[]>([{ minutesBefore: 3 }]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentTeacherId = localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER);
      if (!currentTeacherId) {
        router.push('/teacher/login');
        return;
      }
      setTeacherId(currentTeacherId);

      // 1. 교사의 모든 학급 로드 (경기 참여 학급 추적용)
      const classList = await getClasses(currentTeacherId);
      setAllClasses(classList);

      // 2. 교사의 모든 팀 로드 (✅ teacherId 기반)
      const teamList = await getTeams(currentTeacherId);
      setTeams(teamList);

      // 기본으로 처음 2개 팀 선택 (있으면)
      if (teamList.length >= 2) {
        setSelectedTeamIds([teamList[0].id, teamList[1].id]);
      }

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... 나머지 로직
}
```

### 4. 팀 선택 UI 수정

기존 학급 정보 없이 팀 정보만 표시:

```typescript
// 수정 후: app/teacher/game/new/page.tsx (렌더링 부분)
<Card className="p-6">
  <h2 className="text-xl font-bold mb-4">팀 선택 (2개)</h2>

  {teams.length < 2 ? (
    <div className="text-center py-8">
      <p className="text-gray-500 mb-4">최소 2개의 팀이 필요합니다.</p>
      <Link href="/teacher/teams">
        <Button>팀 만들러 가기</Button>
      </Link>
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {teams.map((team, index) => {
        const isSelected = selectedTeamIds.includes(team.id);

        // 팀원들이 속한 학급 정보
        const sourceClasses = team.sourceClassIds
          ?.map(classId => allClasses.find(c => c.id === classId))
          .filter(Boolean) || [];

        return (
          <div
            key={team.id}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              isSelected
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleTeamSelect(team.id, !isSelected)}
          >
            <div className="flex items-center gap-3 mb-2">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => handleTeamSelect(team.id, checked as boolean)}
              />
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getTeamColorHex(team.color) }}
              />
              <p className="font-bold">{team.name}</p>
            </div>

            <p className="text-sm text-gray-600 ml-7">
              {team.members?.length || 0}명
            </p>

            {/* 참여 학급 표시 */}
            {sourceClasses.length > 0 && (
              <div className="ml-7 mt-2 flex flex-wrap gap-1">
                {sourceClasses.map(classItem => (
                  <span
                    key={classItem!.id}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {classItem!.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  )}
</Card>
```

### 5. 경기 생성 로직 수정

```typescript
// 수정 후: app/teacher/game/new/page.tsx
const handleStartGame = async () => {
  // 유효성 검사
  if (selectedTeamIds.length !== 2) {
    alert('정확히 2개의 팀을 선택해주세요.');
    return;
  }

  if (duration < 1 || duration > 60) {
    alert('경기 시간은 1~60분 사이로 설정해주세요.');
    return;
  }

  try {
    // 선택된 팀 가져오기
    const selectedTeams = teams.filter(t => selectedTeamIds.includes(t.id));

    // 참여 학급 ID 수집
    const classIdsSet = new Set<string>();
    selectedTeams.forEach(team => {
      team.sourceClassIds?.forEach(classId => classIdsSet.add(classId));
    });
    const participatingClassIds = Array.from(classIdsSet);

    // Game 객체 생성
    const settings: GameSettings = {
      useOuterCourt,
      outerCourtRules: [outerCourtRule],  // 단일 규칙
      ballAdditions
    };

    const gameTeams = selectedTeams.map(team => ({
      teamId: team.id,
      name: team.name,
      color: team.color,
      members: (team.members || []).map(member => ({
        studentId: member.studentId,
        initialLives,
        currentLives: initialLives,
        isInOuterCourt: false,
        position: 'infield' as const
      }))
    }));

    const gameRecords = selectedTeams.flatMap(team =>
      (team.members || []).map(member => ({
        studentId: member.studentId,
        outs: 0,
        passes: 0,
        sacrifices: 0,
        cookies: 0
      }))
    );

    const newGame = await createGame({
      classIds: participatingClassIds,  // ✅ 참여 학급들
      hostClassId: participatingClassIds[0] || '',  // 첫 번째 학급을 호스트로
      teacherId,  // ✅ 추가
      date: new Date().toISOString(),
      duration: duration * 60, // 초 단위로 변환
      settings,
      currentBalls: 1,
      teams: gameTeams,
      records: gameRecords,
      isCompleted: false
    });

    // 경기 진행 페이지로 이동
    router.push(`/teacher/game/play?gameId=${newGame.id}`);
  } catch (error) {
    console.error('Failed to create game:', error);
    alert('경기 생성에 실패했습니다.');
  }
};
```

### 6. Game 인터페이스 확인 및 수정

```typescript
// types/index.ts - Game 인터페이스 확인
export interface Game {
  id: string;
  classIds: string[];  // ✅ 참여 학급들 (복수)
  hostClassId: string;  // 경기 주최 학급
  teacherId?: string;  // ✅ 추가 (선택사항, 나중에 필수로 변경 가능)
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
```

만약 `teacherId` 필드가 없다면 추가:

```typescript
export interface Game {
  // ... 기존 필드
  teacherId: string;  // ✅ 추가
  // ... 나머지 필드
}
```

## Part 2: 기존 페이지 제거 및 리디렉션

### 1. 제거할 페이지

```
/app/teacher/class/[classId]/teams/page.tsx
```

이 페이지는 더 이상 필요하지 않음:
- 독립 팀 관리 페이지(`/teacher/teams`)로 대체됨
- 학급별 팀 관리는 deprecated됨

### 2. 리디렉션 페이지로 교체

완전히 삭제하는 대신, 리디렉션 페이지로 교체:

```typescript
// 수정 후: app/teacher/class/[classId]/teams/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeprecatedTeamManagementPage() {
  const router = useRouter();

  useEffect(() => {
    // 즉시 새 페이지로 리디렉션
    router.replace('/teacher/teams');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 mb-4">팀 관리 페이지로 이동 중...</p>
        <p className="text-sm text-gray-400">
          팀 관리가 독립 페이지로 이동했습니다.
        </p>
      </div>
    </div>
  );
}
```

**또는** 완전히 삭제하고 404 처리:

```bash
# 파일 삭제
rm app/teacher/class/[classId]/teams/page.tsx

# 관련 컴포넌트도 확인 후 삭제 (사용하지 않으면)
# - components/AddClassStudentsModal.tsx (독립 페이지에서 재사용 가능하면 유지)
```

### 3. 기존 학급별 경기 설정 페이지 처리

```
/app/teacher/class/[classId]/game/setup/page.tsx
```

이 페이지도 `/teacher/game/new`로 리디렉션:

```typescript
// 수정 후: app/teacher/class/[classId]/game/setup/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeprecatedGameSetupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/teacher/game/new');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 mb-4">경기 설정 페이지로 이동 중...</p>
        <p className="text-sm text-gray-400">
          경기 설정이 독립 페이지로 이동했습니다.
        </p>
      </div>
    </div>
  );
}
```

### 4. Dashboard 링크 수정

학급 카드에서 경기 시작 버튼 제거:

```typescript
// 수정 후: app/teacher/dashboard/page.tsx (학급 관리 뷰)
{dashboardView === 'classes' && (
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
          {/* ✅ "팀 편성" 버튼 제거됨 (Phase 2에서 이미 제거) */}
          {/* ✅ "경기 시작" 버튼 제거됨 */}
        </div>
      </Card>
    ))}
  </div>
)}
```

경기 관리 뷰에서 "새 경기 시작" 링크 확인:

```typescript
// 확인: app/teacher/dashboard/page.tsx (경기 관리 뷰)
{dashboardView === 'games' && (
  <div>
    {/* ... */}
    <Link href="/teacher/game/new">  {/* ✅ 올바른 URL */}
      <Button size="lg">
        ⚾ 새 경기 시작
      </Button>
    </Link>
    {/* ... */}
  </div>
)}
```

## 영향받는 파일 목록 (Affected Files)

### 1. 수정할 파일

#### A. 경기 설정 통합
- ✅ `/app/teacher/game/new/page.tsx` - teacherId 기반 팀 로딩
- ✅ `/types/index.ts` - Game 인터페이스에 teacherId 추가 (필요시)

#### B. 리디렉션 처리
- ✅ `/app/teacher/class/[classId]/teams/page.tsx` - 리디렉션 페이지로 교체 또는 삭제
- ✅ `/app/teacher/class/[classId]/game/setup/page.tsx` - 리디렉션 페이지로 교체 또는 삭제

#### C. Dashboard 정리
- ✅ `/app/teacher/dashboard/page.tsx` - 경기 관리 뷰 링크 확인

### 2. 삭제 고려 파일
- `/components/AddClassStudentsModal.tsx` - 독립 페이지에서 재사용하지 않으면 삭제

### 3. 확인 필요 파일
- `/app/teacher/game/play/page.tsx` - 경기 진행 페이지 (teacherId 필드 사용 여부 확인)

## 구현 순서 (Implementation Steps)

### Step 1: Game 인터페이스 확인 (5분)
1. `/types/index.ts`에서 Game 인터페이스 확인
2. `teacherId` 필드 없으면 추가
3. TypeScript 컴파일 확인

### Step 2: 경기 설정 페이지 수정 (60분)
1. `/app/teacher/game/new/page.tsx` 열기 (없으면 생성)
2. classId 기반 로직 → teacherId 기반으로 변경
3. 팀 선택 UI에 학급 태그 추가
4. 경기 생성 로직에서 `classIds` 계산
5. `teacherId` 필드 추가
6. 테스트

### Step 3: 기존 페이지 리디렉션 (15분)
1. `/app/teacher/class/[classId]/teams/page.tsx` 리디렉션 코드로 교체
2. `/app/teacher/class/[classId]/game/setup/page.tsx` 리디렉션 코드로 교체
3. 리디렉션 테스트

### Step 4: Dashboard 링크 확인 (10분)
1. `/app/teacher/dashboard/page.tsx` 열기
2. 경기 관리 뷰에서 `/teacher/game/new` 링크 확인
3. 학급 카드에 "경기 시작" 버튼 없는지 확인

### Step 5: 사용하지 않는 컴포넌트 삭제 (10분)
1. `AddClassStudentsModal.tsx` 사용 여부 확인
2. 사용하지 않으면 삭제

### Step 6: 통합 테스트 (30분)
1. Dashboard → 경기 관리 → 새 경기 시작
2. 팀 선택에서 모든 팀 표시 확인
3. 다중 학급 팀 선택 가능 확인
4. 경기 생성 후 경기 진행 페이지 이동 확인
5. 기존 `/teacher/class/[classId]/teams` 접속 → 리디렉션 확인

### Step 7: 커밋 (5분)
```bash
git add .
git commit -m "feat: Phase4 - 경기 설정 통합 및 기존 페이지 정리

Part 1: 경기 설정 통합
- /teacher/game/new 페이지를 teacherId 기반으로 변경
- 교사의 모든 팀 중에서 경기 팀 선택 가능
- 팀 선택 UI에 참여 학급 태그 표시
- Game 인터페이스에 teacherId 추가
- 경기 생성 시 classIds 자동 계산 (참여 학급들)

Part 2: 기존 페이지 정리
- /teacher/class/[classId]/teams → /teacher/teams로 리디렉션
- /teacher/class/[classId]/game/setup → /teacher/game/new로 리디렉션
- Dashboard 학급 카드에서 '경기 시작' 버튼 제거
- 사용하지 않는 컴포넌트 삭제

Breaking Changes:
- 학급별 팀 관리 페이지는 deprecated됨
- 학급별 경기 설정 페이지는 deprecated됨
- 모든 팀/경기 관리는 교사 단위로 통합됨

Migration:
- 기존 URL 접속 시 자동으로 새 페이지로 리디렉션됨"
```

## 테스트 시나리오 (Test Scenarios)

### 1. 경기 설정 페이지
```
1. Dashboard → 경기 관리 → 새 경기 시작
2. /teacher/game/new 접속 확인
3. 교사의 모든 팀 목록 표시 확인
4. 팀 선택 시 학급 태그 표시 확인
5. 2개 팀 선택
6. 경기 설정 입력
7. 경기 시작 → /teacher/game/play?gameId={id} 이동 확인
```

### 2. 다중 학급 경기
```
1. 5-3 학급 팀 선택
2. 5-2 학급 팀 선택
3. 경기 생성
4. 생성된 Game 객체의 classIds = ['class-5-3', 'class-5-2'] 확인
```

### 3. 리디렉션
```
1. /teacher/class/{classId}/teams 접속
2. /teacher/teams로 리디렉션 확인
3. /teacher/class/{classId}/game/setup 접속
4. /teacher/game/new로 리디렉션 확인
```

### 4. Dashboard 링크
```
1. Dashboard → 학급 관리
2. 학급 카드에 "학생 관리"만 있고 "팀 편성", "경기 시작" 없는지 확인
3. Dashboard → 경기 관리
4. "새 경기 시작" 버튼 클릭 → /teacher/game/new 이동 확인
```

## 성공 기준 (Success Criteria)

1. ✅ `/teacher/game/new` 페이지가 teacherId 기반으로 작동
2. ✅ 교사의 모든 팀이 경기 설정에 표시됨
3. ✅ 팀 선택 UI에 참여 학급 태그 표시
4. ✅ 경기 생성 시 `classIds` 자동 계산됨
5. ✅ Game 객체에 `teacherId` 포함
6. ✅ 기존 학급별 URL 접속 시 새 페이지로 리디렉션됨
7. ✅ Dashboard에서 학급별 "경기 시작" 버튼 제거됨
8. ✅ 사용하지 않는 컴포넌트 삭제됨
9. ✅ TypeScript 컴파일 오류 없음

## 위험 요소 (Risks)

| 위험 | 영향도 | 완화 전략 |
|------|--------|-----------|
| 기존 경기 데이터 호환성 | 높음 | Game 인터페이스에 teacherId를 선택 필드로 추가 |
| 사용자 혼란 (URL 변경) | 중간 | 리디렉션으로 자동 이동, 안내 메시지 표시 |
| 경기 진행 페이지 영향 | 낮음 | teacherId 필드는 선택사항으로 시작 |
| 링크 누락 | 낮음 | 전체 검색으로 확인 |

## 추가 고려사항

### 1. 경기 목록 표시

Dashboard의 "진행 중인 경기" 섹션에서 경기 목록 표시 시:

```typescript
// app/teacher/dashboard/page.tsx
const [ongoingGames, setOngoingGames] = useState<Game[]>([]);

useEffect(() => {
  const loadGames = async () => {
    const games = await getGames();  // 모든 경기
    const myGames = games.filter(g =>
      g.teacherId === teacherId ||  // teacherId가 일치하거나
      g.classIds.some(classId =>  // 내 학급이 참여하거나
        classes.some(c => c.id === classId)
      )
    );
    setOngoingGames(myGames.filter(g => !g.isCompleted));
  };

  loadGames();
}, [teacherId, classes]);
```

### 2. 경기 진행 페이지 호환성

```typescript
// app/teacher/game/play/page.tsx
// teacherId 필드가 없는 기존 경기도 지원
const game = await getGameById(gameId);

if (!game.teacherId) {
  // 마이그레이션: classIds로부터 teacherId 유추
  const firstClass = await getClassById(game.classIds[0]);
  if (firstClass) {
    await updateGame(gameId, { teacherId: firstClass.teacherId });
  }
}
```

## 다음 단계 (Next Steps)

Phase 4 완료 후:
- **Phase 6**: 전체 테스트 및 버그 수정
  - 모든 페이지 플로우 테스트
  - 데이터 무결성 검증
  - UI/UX 최종 점검

---

**작성일**: 2025-01-22
**작성자**: Claude Code
**의존성**: Phase 1, 2, 3 완료 필수
**검토 필요**: ✅ 리디렉션 전략 검토
