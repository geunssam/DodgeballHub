# 🏐 Phase 1-3 상세 구현 가이드

**작성일**: 2025-11-09
**대상 Phase**: 1 (배지 시스템), 2 (UI 컴포넌트), 3 (통계 시스템)

---

## 📋 Phase 1: 배지 시스템 완성 (3-5일)

### 🎯 목표
커스텀 배지 생성, 관리, 수동 부여, 학생 카드 배지 표시 기능 완성

### 📦 작업 목록

#### 1.1 커스텀 배지 생성 (`BadgeCreator.tsx`)

**위치**: `components/badge/BadgeCreator.tsx`

**기능**:
- 커스텀 배지 생성 UI
- 아이콘, 이름, 설명, 등급 설정
- 미리보기
- localStorage 저장

**Props 인터페이스**:
```typescript
interface BadgeCreatorProps {
  onClose: () => void;
  onSave: (badge: CustomBadge) => void;
}

interface CustomBadge {
  id: string;
  name: string;
  description: string;
  icon: string;  // 이모지
  tier: BadgeTier;
  category: BadgeCategory;
  isCustom: true;
  createdAt: string;
}
```

**UI 구성**:
```
┌─────────────────────────────────────┐
│  커스텀 배지 만들기          [X]    │
├─────────────────────────────────────┤
│  아이콘 선택                        │
│  [🏆] [⚡] [🌟] [💎] [🔥] ...     │
│                                     │
│  배지 이름                          │
│  [___________________________]      │
│                                     │
│  설명                               │
│  [___________________________]      │
│  [___________________________]      │
│                                     │
│  등급 선택                          │
│  ( ) 입문  (•) 숙련  ( ) 마스터    │
│                                     │
│  카테고리                           │
│  [특별 ▼]                          │
│                                     │
│  미리보기                           │
│  ┌───────────────────────┐         │
│  │ 🏆 슈퍼스타           │         │
│  │ 특별한 활약을 한 선수 │         │
│  │ ⭐ 특별                │         │
│  └───────────────────────┘         │
│                                     │
│     [취소]        [저장]            │
└─────────────────────────────────────┘
```

**주요 함수**:
```typescript
const handleSave = () => {
  const newBadge: CustomBadge = {
    id: generateUniqueId(),
    name,
    description,
    icon,
    tier,
    category: 'SPECIAL',
    isCustom: true,
    createdAt: new Date().toISOString()
  };

  // localStorage에 저장
  const customBadges = getCustomBadges();
  customBadges.push(newBadge);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_BADGES, JSON.stringify(customBadges));

  onSave(newBadge);
  onClose();
};
```

---

#### 1.2 배지 관리 모달 (`BadgeManagementModal.tsx`)

**위치**: `components/badge/BadgeManagementModal.tsx`

**기능**:
- 시스템 배지 + 커스텀 배지 목록
- 배지 숨기기/표시
- 배지 삭제 (커스텀만)
- 배지 재계산

**UI 구성**:
```
┌─────────────────────────────────────────────┐
│  배지 관리                          [X]     │
├─────────────────────────────────────────────┤
│  [시스템 배지] [커스텀 배지]               │
├─────────────────────────────────────────────┤
│  ┌───────────────────────────────────────┐  │
│  │ 🎽 첫 출전         [👁️ 표시] [🗑️]  │  │
│  │ 입문 배지                             │  │
│  │ 획득: 15명                            │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ 🎯 첫 아웃         [👁️ 표시] [🗑️]  │  │
│  │ 입문 배지                             │  │
│  │ 획득: 12명                            │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ...                                        │
│                                             │
│  [모든 배지 재계산]    [닫기]              │
└─────────────────────────────────────────────┘
```

**주요 함수**:
```typescript
const handleToggleVisibility = (badgeId: string) => {
  // 배지 숨기기/표시 토글
  const hiddenBadges = getHiddenBadges();
  if (hiddenBadges.includes(badgeId)) {
    // 표시
    const newHidden = hiddenBadges.filter(id => id !== badgeId);
    setHiddenBadges(newHidden);
  } else {
    // 숨기기
    setHiddenBadges([...hiddenBadges, badgeId]);
  }
};

const handleRecalculateAll = async () => {
  // 모든 학생의 배지 재계산
  const students = await getAllStudents();
  const games = await getGamesByTeacherId(teacherId);

  for (const student of students) {
    const badges = calculateBadges(student, games);
    await updateStudentBadges(student.id, badges);
  }

  toast.success('모든 배지가 재계산되었습니다');
};
```

---

#### 1.3 수동 배지 부여 (`ManualBadgeModal.tsx`)

**위치**: `components/badge/ManualBadgeModal.tsx`

**기능**:
- 특정 학생에게 수동으로 배지 부여
- 배지 선택 (시스템 + 커스텀)
- 메모 입력
- 부여 날짜 설정

**UI 구성**:
```
┌─────────────────────────────────────┐
│  배지 수동 부여              [X]    │
├─────────────────────────────────────┤
│  학생: 김철수 (3-1)                 │
│                                     │
│  배지 선택                          │
│  [배지 선택하기 ▼]                 │
│                                     │
│  ┌───────────────────────┐         │
│  │ 🏆 슈퍼스타           │         │
│  │ 특별한 활약을 한 선수 │         │
│  │ ⭐ 특별                │         │
│  └───────────────────────┘         │
│                                     │
│  메모 (선택)                        │
│  [___________________________]      │
│  [___________________________]      │
│                                     │
│  부여 날짜                          │
│  [2025-11-09]                      │
│                                     │
│     [취소]        [부여]            │
└─────────────────────────────────────┘
```

**주요 함수**:
```typescript
const handleAwardBadge = async () => {
  const awardedBadge = {
    badgeId: selectedBadge.id,
    awardedAt: awardDate,
    awardType: 'manual' as const,
    note: memo
  };

  // 학생 배지 목록에 추가
  const student = await getStudentById(studentId);
  const updatedBadges = [...(student.badges || []), awardedBadge];

  await updateStudent(studentId, {
    ...student,
    badges: updatedBadges
  });

  toast.success(`${student.name}에게 배지를 부여했습니다`);
  onClose();
};
```

---

#### 1.4 학생 카드 배지 표시 (`PlayerBadgeDisplay.tsx`)

**위치**: `components/badge/PlayerBadgeDisplay.tsx`

**기능**:
- 학생 카드에 배지 최대 3개 표시
- 나머지는 +N 형태로 표시
- 클릭 시 전체 배지 목록 모달
- 모든 화면에서 재사용

**Props 인터페이스**:
```typescript
interface PlayerBadgeDisplayProps {
  studentId: string;
  badges: AwardedBadge[];
  maxDisplay?: number;  // 기본 3
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}
```

**UI 구성**:
```
컴팩트 모드 (size='sm'):
[🏆][⚡][🌟][+5]

일반 모드 (size='md'):
┌──┐┌──┐┌──┐┌────┐
│🏆││⚡││🌟││ +5 │
└──┘└──┘└──┘└────┘

큰 모드 (size='lg'):
┌────────┐┌────────┐┌────────┐┌────────┐
│   🏆   ││   ⚡   ││   🌟   ││   +5   │
│슈퍼스타││스피드왕││별의별  ││        │
└────────┘└────────┘└────────┘└────────┘
```

**주요 함수**:
```typescript
const PlayerBadgeDisplay: React.FC<PlayerBadgeDisplayProps> = ({
  studentId,
  badges,
  maxDisplay = 3,
  size = 'md',
  onClick
}) => {
  const displayBadges = badges.slice(0, maxDisplay);
  const remainingCount = Math.max(0, badges.length - maxDisplay);

  return (
    <div className="flex items-center gap-1">
      {displayBadges.map((badge, idx) => (
        <BadgeIcon key={idx} badge={badge} size={size} />
      ))}
      {remainingCount > 0 && (
        <div className="text-xs text-muted-foreground">
          +{remainingCount}
        </div>
      )}
    </div>
  );
};
```

---

#### 1.5 배지 순서 관리 (`PlayerBadgeOrderModal.tsx`)

**위치**: `components/badge/PlayerBadgeOrderModal.tsx`

**기능**:
- 학생이 대표 배지 3개 선택
- 드래그앤드롭으로 순서 조정
- localStorage에 저장

**UI 구성**:
```
┌─────────────────────────────────────┐
│  배지 순서 관리              [X]    │
├─────────────────────────────────────┤
│  대표 배지 3개를 선택하세요         │
│  (드래그하여 순서 변경)              │
│                                     │
│  선택된 배지                        │
│  ┌───────────────────────┐         │
│  │ ⠿ 🏆 슈퍼스타         │  [x]   │
│  └───────────────────────┘         │
│  ┌───────────────────────┐         │
│  │ ⠿ ⚡ 스피드왕          │  [x]   │
│  └───────────────────────┘         │
│  ┌───────────────────────┐         │
│  │ ⠿ 🌟 별의별           │  [x]   │
│  └───────────────────────┘         │
│                                     │
│  내 모든 배지                       │
│  [🎯][💪][🤝][💚][🍪][🎖️]...     │
│                                     │
│         [취소]        [저장]        │
└─────────────────────────────────────┘
```

**주요 함수**:
```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  if (active.id !== over?.id) {
    setSelectedBadges((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over?.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }
};

const handleSave = async () => {
  const badgeOrder = selectedBadges.map(b => b.id);

  // localStorage에 저장
  await updateStudent(studentId, {
    badgeOrder
  });

  toast.success('배지 순서가 저장되었습니다');
  onClose();
};
```

---

### ✅ Phase 1 체크리스트

- [ ] `BadgeCreator.tsx` 작성 (커스텀 배지 생성)
- [ ] `BadgeManagementModal.tsx` 작성 (배지 관리)
- [ ] `ManualBadgeModal.tsx` 작성 (수동 부여)
- [ ] `PlayerBadgeDisplay.tsx` 작성 (카드 배지 표시)
- [ ] `PlayerBadgeOrderModal.tsx` 작성 (순서 관리)
- [ ] `lib/badgeHelpers.ts`에 커스텀 배지 함수 추가
- [ ] 학생 카드에 `PlayerBadgeDisplay` 통합
- [ ] 학생 뷰에 배지 순서 관리 추가
- [ ] localStorage 저장 로직 구현
- [ ] 테스트 및 버그 수정

---

## 📋 Phase 2: UI 컴포넌트 추가 (2-3일)

### 🎯 목표
shadcn/ui 컴포넌트 5개 추가 (Baseball에 있고 Dodgeball에 없는 것)

### 📦 작업 목록

#### 2.1 Avatar 컴포넌트

**위치**: `components/ui/avatar.tsx`

**용도**: 프로필 이미지, 학생 아바타

**설치 명령어**:
```bash
npx shadcn@latest add avatar
```

**사용 예시**:
```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

<Avatar>
  <AvatarImage src="/avatars/student.png" />
  <AvatarFallback>김철수</AvatarFallback>
</Avatar>
```

---

#### 2.2 Dropdown Menu 컴포넌트

**위치**: `components/ui/dropdown-menu.tsx`

**용도**: 액션 메뉴, 설정 메뉴

**설치 명령어**:
```bash
npx shadcn@latest add dropdown-menu
```

**사용 예시**:
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger>더보기</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>수정</DropdownMenuItem>
    <DropdownMenuItem>삭제</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

#### 2.3 Table 컴포넌트

**위치**: `components/ui/table.tsx`

**용도**: 통계 테이블, 스코어보드

**설치 명령어**:
```bash
npx shadcn@latest add table
```

**사용 예시**:
```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>이름</TableHead>
      <TableHead>아웃</TableHead>
      <TableHead>패스</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>김철수</TableCell>
      <TableCell>5</TableCell>
      <TableCell>3</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

#### 2.4 Textarea 컴포넌트

**위치**: `components/ui/textarea.tsx`

**용도**: 메모, 설명 입력

**설치 명령어**:
```bash
npx shadcn@latest add textarea
```

**사용 예시**:
```tsx
import { Textarea } from '@/components/ui/textarea';

<Textarea placeholder="메모를 입력하세요" />
```

---

#### 2.5 Tooltip 컴포넌트

**위치**: `components/ui/tooltip.tsx`

**용도**: 도움말, 힌트

**설치 명령어**:
```bash
npx shadcn@latest add tooltip
```

**사용 예시**:
```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>❓</TooltipTrigger>
    <TooltipContent>
      <p>도움말 내용</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

### ✅ Phase 2 체크리스트

- [ ] `npx shadcn@latest add avatar` 실행
- [ ] `npx shadcn@latest add dropdown-menu` 실행
- [ ] `npx shadcn@latest add table` 실행
- [ ] `npx shadcn@latest add textarea` 실행
- [ ] `npx shadcn@latest add tooltip` 실행
- [ ] 각 컴포넌트 테스트
- [ ] 스타일 확인 및 조정

---

## 📋 Phase 3: 통계 시스템 구현 (1주)

### 🎯 목표
통계 대시보드, 랭킹 위젯, 차트 통합

### 📦 작업 목록

#### 3.1 통계 계산 유틸 (`statsHelpers.ts`)

**위치**: `lib/statsHelpers.ts`

**함수 목록**:

```typescript
// 1. 선수 포인트 계산
export function calculatePlayerPoints(student: Student): number {
  const { outs, passes, sacrifices, cookies } = student.stats;
  return outs + passes + sacrifices + cookies;
}

// 2. MVP 점수 계산 (아웃 가중치 높음)
export function calculateMVPScore(record: GameRecord): number {
  return (record.outs * 2) + record.passes + (record.sacrifices * 0.5) + cookies;
}

// 3. 학급별 통계 계산
export async function calculateAllClassStats(teacherId: string) {
  const classes = await getClassesByTeacherId(teacherId);
  const students = await getAllStudents();

  return classes.map(cls => {
    const classStudents = students.filter(s => s.classId === cls.id);
    const totalGames = classStudents.reduce((sum, s) => sum + s.stats.gamesPlayed, 0);
    const avgPoints = classStudents.reduce((sum, s) => sum + calculatePlayerPoints(s), 0) / classStudents.length;

    return {
      classId: cls.id,
      className: cls.name,
      studentCount: classStudents.length,
      totalGames,
      avgPoints,
      topStudent: classStudents.sort((a, b) => calculatePlayerPoints(b) - calculatePlayerPoints(a))[0]
    };
  });
}

// 4. 팀별 통계 계산
export async function calculateAllTeamStats(teacherId: string) {
  const teams = await getTeamsByTeacherId(teacherId);
  const games = await getGamesByTeacherId(teacherId);

  return teams.map(team => {
    const teamGames = games.filter(g =>
      g.teams.some(t => t.teamId === team.id)
    );

    const wins = teamGames.filter(g => g.winner === team.id).length;
    const losses = teamGames.length - wins;

    return {
      teamId: team.id,
      teamName: team.name,
      gamesPlayed: teamGames.length,
      wins,
      losses,
      winRate: teamGames.length > 0 ? wins / teamGames.length : 0
    };
  });
}

// 5. 학생별 경기 히스토리
export async function getPlayerGameHistory(studentId: string) {
  const games = await getAllGames();

  return games
    .filter(game =>
      game.records.some(r => r.studentId === studentId)
    )
    .map(game => {
      const record = game.records.find(r => r.studentId === studentId)!;
      return {
        gameId: game.id,
        date: game.date,
        teams: game.teams.map(t => t.name).join(' vs '),
        record,
        mvpScore: calculateMVPScore(record),
        isWinner: game.winner === getTeamIdOfStudent(game, studentId)
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
```

---

#### 3.2 StatsView 컴포넌트

**위치**: `components/stats/StatsView.tsx`

**기능**:
- 스코어보드 탭
- 경기 기록 탭
- 정렬, 필터링

**UI 구성**:
```
┌─────────────────────────────────────────────────────┐
│  통계                                                │
├─────────────────────────────────────────────────────┤
│  [스코어보드] [경기 기록]                            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  스코어보드 탭:                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ 학급 [전체 ▼]  정렬 [종합점수 ▼]              │ │
│  ├────┬──────┬────┬────┬────┬────┬────┬────────┤ │
│  │순위│ 이름 │학급│아웃│패스│양보│쿠키│종합점수│ │
│  ├────┼──────┼────┼────┼────┼────┼────┼────────┤ │
│  │ 1  │김철수│3-1 │ 25 │ 15 │ 10 │ 30 │  80 🥇│ │
│  │ 2  │이영희│3-2 │ 20 │ 18 │ 12 │ 25 │  75 🥈│ │
│  │ 3  │박민수│3-1 │ 18 │ 20 │ 8  │ 28 │  74 🥉│ │
│  │ ...│      │    │    │    │    │    │        │ │
│  └────┴──────┴────┴────┴────┴────┴────┴────────┘ │
│                                                      │
│  경기 기록 탭:                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │ 2025-11-08  빨강팀 vs 파랑팀                   │ │
│  │ 승자: 빨강팀                                   │ │
│  │ MVP: 김철수 (아웃 5, 패스 3)                   │ │
│  │ [상세보기]                                     │ │
│  ├────────────────────────────────────────────────┤ │
│  │ 2025-11-07  노랑팀 vs 초록팀                   │ │
│  │ 승자: 초록팀                                   │ │
│  │ MVP: 이영희, 박민수 (공동)                     │ │
│  │ [상세보기]                                     │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**주요 함수**:
```typescript
const StatsView = () => {
  const [tab, setTab] = useState<'scoreboard' | 'games'>('scoreboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [sortBy, setSortBy] = useState<'totalScore' | 'outs' | 'passes'>('totalScore');

  useEffect(() => {
    loadStudents();
  }, []);

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      if (sortBy === 'totalScore') {
        return calculatePlayerPoints(b) - calculatePlayerPoints(a);
      }
      return b.stats[sortBy] - a.stats[sortBy];
    });
  }, [students, sortBy]);

  return (
    <div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="scoreboard">스코어보드</TabsTrigger>
          <TabsTrigger value="games">경기 기록</TabsTrigger>
        </TabsList>

        <TabsContent value="scoreboard">
          <ScoreboardTab students={sortedStudents} sortBy={sortBy} setSortBy={setSortBy} />
        </TabsContent>

        <TabsContent value="games">
          <GamesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

---

#### 3.3 차트 라이브러리 통합

**라이브러리**: `recharts`

**설치**:
```bash
npm install recharts
```

**사용 예시** (학급별 통계 차트):
```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const ClassStatsChart = ({ data }: { data: ClassStats[] }) => {
  return (
    <BarChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="className" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="avgPoints" fill="#8884d8" name="평균 점수" />
      <Bar dataKey="studentCount" fill="#82ca9d" name="학생 수" />
    </BarChart>
  );
};
```

---

#### 3.4 학급 랭킹 위젯 (`ClassRankingWidget.tsx`)

**위치**: `components/stats/ClassRankingWidget.tsx`

**기능**:
- 학급별 순위 표시
- 평균 기록, 최고 기록
- 클릭 시 상세 모달

**UI 구성**:
```
┌─────────────────────────────┐
│  📊 학급 랭킹               │
├─────────────────────────────┤
│  1위 🥇 3학년 1반           │
│  평균 75.2점 | 학생 28명   │
│  [더보기 →]                 │
├─────────────────────────────┤
│  2위 🥈 3학년 2반           │
│  평균 72.8점 | 학생 27명   │
│  [더보기 →]                 │
├─────────────────────────────┤
│  3위 🥉 3학년 3반           │
│  평균 70.5점 | 학생 26명   │
│  [더보기 →]                 │
└─────────────────────────────┘
```

---

#### 3.5 상세 랭킹 모달 (`ClassDetailRankingModal.tsx`)

**위치**: `components/stats/ClassDetailRankingModal.tsx`

**기능**:
- 학급 내 학생 순위
- 개인별 상세 스탯
- 배지 컬렉션

**UI 구성**:
```
┌─────────────────────────────────────────┐
│  3학년 1반 상세 랭킹            [X]     │
├─────────────────────────────────────────┤
│  총 학생: 28명                          │
│  평균 점수: 75.2점                      │
│  참여 경기: 45경기                      │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ 1위 김철수  [🏆][⚡][🌟]      │   │
│  │ 아웃 25 패스 15 양보 10 🍪30  │   │
│  │ 종합 80점                       │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 2위 이영희  [🎯][💪][🤝]      │   │
│  │ 아웃 20 패스 18 양보 12 🍪25  │   │
│  │ 종합 75점                       │   │
│  └─────────────────────────────────┘   │
│  ...                                    │
│                                         │
│              [닫기]                     │
└─────────────────────────────────────────┘
```

---

### ✅ Phase 3 체크리스트

- [ ] `lib/statsHelpers.ts` 작성 (통계 계산 함수)
- [ ] `components/stats/StatsView.tsx` 작성
- [ ] `components/stats/ScoreboardTab.tsx` 작성
- [ ] `components/stats/GamesTab.tsx` 작성
- [ ] `npm install recharts` 실행
- [ ] 차트 컴포넌트 작성
- [ ] `components/stats/ClassRankingWidget.tsx` 작성
- [ ] `components/stats/ClassDetailRankingModal.tsx` 작성
- [ ] 대시보드에 랭킹 위젯 추가
- [ ] 테스트 및 버그 수정

---

## 📝 다음 단계

Phase 1-3 완료 후 `PHASE_4-6_DETAILED.md`를 참고하여 계속 진행

**마지막 업데이트**: 2025-11-09
