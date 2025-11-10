# 🎨 UI 컴포넌트 마이그레이션 가이드

**작성일**: 2025-11-09
**목적**: Baseball → Dodgeball 컴포넌트별 UI 마이그레이션 상세 가이드

---

## 📊 컴포넌트 매핑 테이블

### 배지 시스템 컴포넌트

| Baseball (JSX) | Dodgeball (TSX) | 상태 | 우선순위 |
|----------------|-----------------|------|----------|
| BadgeCollection.jsx | BadgeCollection.tsx | ✅ 존재 | - |
| BadgeProgressIndicator.jsx | BadgeProgressIndicator.tsx | ✅ 존재 | - |
| **BadgeCreator.jsx** | **BadgeCreator.tsx** | ❌ 없음 | 🔴 High |
| **BadgeManagementModal.jsx** | **BadgeManagementModal.tsx** | ❌ 없음 | 🔴 High |
| **ManualBadgeModal.jsx** | **ManualBadgeModal.tsx** | ❌ 없음 | 🔴 High |
| **PlayerBadgeDisplay.jsx** | **PlayerBadgeDisplay.tsx** | ❌ 없음 | 🔴 High |
| **PlayerBadgeOrderModal.jsx** | **PlayerBadgeOrderModal.tsx** | ❌ 없음 | 🟡 Medium |

### 통계 시스템 컴포넌트

| Baseball (JSX) | Dodgeball (TSX) | 상태 | 우선순위 |
|----------------|-----------------|------|----------|
| **StatsView.jsx** | **StatsView.tsx** | ❌ 없음 | 🔴 High |
| **ClassRankingWidget.jsx** | **ClassRankingWidget.tsx** | ❌ 없음 | 🔴 High |
| **ClassDetailRankingModal.jsx** | **ClassDetailRankingModal.tsx** | ❌ 없음 | 🟡 Medium |

### 학생 뷰 컴포넌트

| Baseball (JSX) | Dodgeball (TSX) | 상태 | 우선순위 |
|----------------|-----------------|------|----------|
| StudentView.jsx | app/student/page.tsx | ⚠️ 기본 | 🔴 High |
| **StudentGameHistory.jsx** | **StudentGameHistory.tsx** | ❌ 없음 | 🟡 Medium |
| **ClassStudentCodesModal.jsx** | **ClassStudentCodesModal.tsx** | ❌ 없음 | 🟡 Medium |

### 학급/팀 관리 컴포넌트

| Baseball (JSX) | Dodgeball (TSX) | 상태 | 우선순위 |
|----------------|-----------------|------|----------|
| **ClassTeamManagementView.jsx** | **ClassTeamManagementView.tsx** | ❌ 없음 | 🟢 Low |
| TeamSelectModal.jsx | TeamDetailModal.tsx | ⚠️ 유사 | 🟢 Low |

### 경기 화면 컴포넌트

| Baseball (JSX) | Dodgeball (TSX) | 상태 | 우선순위 |
|----------------|-----------------|------|----------|
| GameScreen.jsx | app/.../game/play/page.tsx | ✅ 존재 | - |
| CreateGameModal.jsx | - | ✅ 존재 | - |
| GameEndModal.jsx | - | ⚠️ 필요 | 🟡 Medium |

---

## 🎯 컴포넌트별 상세 가이드

### 1. BadgeCreator.tsx

**Baseball 원본**: `baseball-firebase/src/components/BadgeCreator.jsx` (12.7KB)

**Dodgeball 생성**: `dodgeball-app/components/badge/BadgeCreator.tsx`

#### Props 인터페이스
```typescript
interface BadgeCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (badge: CustomBadge) => void;
}

interface CustomBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'BEGINNER' | 'SKILLED' | 'MASTER' | 'LEGEND' | 'SPECIAL';
  category: BadgeCategory;
  isCustom: true;
  createdAt: string;
}
```

#### UI 레이아웃
```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>커스텀 배지 만들기</DialogTitle>
    </DialogHeader>

    {/* 아이콘 선택 */}
    <div className="space-y-2">
      <Label>아이콘 선택</Label>
      <div className="grid grid-cols-8 gap-2">
        {EMOJI_OPTIONS.map(emoji => (
          <button
            key={emoji}
            onClick={() => setIcon(emoji)}
            className={cn(
              "w-10 h-10 text-2xl rounded border",
              icon === emoji && "border-primary bg-primary/10"
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>

    {/* 이름 입력 */}
    <div className="space-y-2">
      <Label htmlFor="name">배지 이름</Label>
      <Input
        id="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="예: 슈퍼스타"
      />
    </div>

    {/* 설명 입력 */}
    <div className="space-y-2">
      <Label htmlFor="description">설명</Label>
      <Textarea
        id="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="배지 설명을 입력하세요"
      />
    </div>

    {/* 등급 선택 */}
    <div className="space-y-2">
      <Label>등급</Label>
      <div className="flex gap-2">
        {BADGE_TIERS.map(tier => (
          <button
            key={tier.value}
            onClick={() => setTier(tier.value)}
            className={cn(
              "flex-1 py-2 rounded border",
              selectedTier === tier.value && "border-primary bg-primary/10"
            )}
          >
            {tier.label}
          </button>
        ))}
      </div>
    </div>

    {/* 미리보기 */}
    <div className="space-y-2">
      <Label>미리보기</Label>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{icon}</span>
            <div>
              <div className="font-semibold">{name || '배지 이름'}</div>
              <div className="text-sm text-muted-foreground">
                {description || '설명'}
              </div>
              <Badge variant="outline">{getTierLabel(tier)}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={onClose}>
        취소
      </Button>
      <Button onClick={handleSave} disabled={!name || !description}>
        저장
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 스타일링 가이드
- **Tailwind 클래스**: `max-w-md`, `space-y-2`, `grid-cols-8`
- **shadcn/ui 컴포넌트**: Dialog, Input, Textarea, Badge, Card
- **색상**: `border-primary`, `bg-primary/10` (선택된 항목)
- **간격**: `gap-2`, `p-4`

---

### 2. PlayerBadgeDisplay.tsx

**Baseball 원본**: `baseball-firebase/src/components/PlayerBadgeDisplay.jsx` (7.0KB)

**Dodgeball 생성**: `dodgeball-app/components/badge/PlayerBadgeDisplay.tsx`

#### Props 인터페이스
```typescript
interface PlayerBadgeDisplayProps {
  badges: AwardedBadge[];
  maxDisplay?: number;  // 기본 3
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

interface AwardedBadge {
  badgeId: string;
  awardedAt: string;
  awardType: 'auto' | 'manual';
  note?: string;
}
```

#### 크기별 UI 변형
```tsx
// Small (sm) - 컴팩트
<div className="flex items-center gap-0.5">
  {displayBadges.map(badge => (
    <span key={badge.badgeId} className="text-base">
      {getBadgeIcon(badge.badgeId)}
    </span>
  ))}
  {remaining > 0 && (
    <span className="text-xs text-muted-foreground ml-0.5">
      +{remaining}
    </span>
  )}
</div>

// Medium (md) - 기본
<div className="flex items-center gap-1">
  {displayBadges.map(badge => (
    <div
      key={badge.badgeId}
      className="w-8 h-8 flex items-center justify-center text-xl border rounded"
    >
      {getBadgeIcon(badge.badgeId)}
    </div>
  ))}
  {remaining > 0 && (
    <div className="w-8 h-8 flex items-center justify-center text-xs border rounded bg-muted">
      +{remaining}
    </div>
  )}
</div>

// Large (lg) - 큼
<div className="flex items-center gap-2">
  {displayBadges.map(badge => (
    <Card key={badge.badgeId} className="w-20 h-20">
      <CardContent className="p-2 flex flex-col items-center justify-center">
        <span className="text-2xl">{getBadgeIcon(badge.badgeId)}</span>
        <span className="text-xs truncate w-full text-center">
          {getBadgeName(badge.badgeId)}
        </span>
      </CardContent>
    </Card>
  ))}
  {remaining > 0 && (
    <Card className="w-20 h-20">
      <CardContent className="p-2 flex items-center justify-center">
        <span className="text-lg font-semibold">+{remaining}</span>
      </CardContent>
    </Card>
  )}
</div>
```

#### 사용 예시
```tsx
// 학생 카드에서
<PlayerBadgeDisplay
  badges={student.badges}
  maxDisplay={3}
  size="md"
  onClick={() => openBadgeModal(student.id)}
/>

// 통계 테이블에서
<PlayerBadgeDisplay
  badges={student.badges}
  maxDisplay={3}
  size="sm"
/>

// 학생 대시보드에서
<PlayerBadgeDisplay
  badges={student.badges}
  maxDisplay={6}
  size="lg"
  onClick={() => openBadgeManagement()}
/>
```

---

### 3. StatsView.tsx

**Baseball 원본**: `baseball-firebase/src/components/StatsView.jsx` (~1000줄)

**Dodgeball 생성**: `dodgeball-app/components/stats/StatsView.tsx`

#### Props 인터페이스
```typescript
interface StatsViewProps {
  teacherId: string;
}
```

#### 탭 구조
```tsx
const StatsView: React.FC<StatsViewProps> = ({ teacherId }) => {
  const [activeTab, setActiveTab] = useState<'scoreboard' | 'games'>('scoreboard');

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="scoreboard">📊 스코어보드</TabsTrigger>
          <TabsTrigger value="games">🏐 경기 기록</TabsTrigger>
        </TabsList>

        <TabsContent value="scoreboard">
          <ScoreboardTab teacherId={teacherId} />
        </TabsContent>

        <TabsContent value="games">
          <GamesTab teacherId={teacherId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

#### 스코어보드 탭 (Table 사용)
```tsx
const ScoreboardTab = ({ teacherId }: { teacherId: string }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [sortBy, setSortBy] = useState<'totalScore' | 'outs' | 'passes'>('totalScore');

  return (
    <div className="space-y-4">
      {/* 필터 및 정렬 */}
      <div className="flex justify-between">
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="학급 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {classes.map(cls => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="totalScore">종합 점수</SelectItem>
            <SelectItem value="outs">아웃</SelectItem>
            <SelectItem value="passes">패스</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 테이블 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">순위</TableHead>
            <TableHead>이름</TableHead>
            <TableHead>학급</TableHead>
            <TableHead>배지</TableHead>
            <TableHead className="text-right">아웃</TableHead>
            <TableHead className="text-right">패스</TableHead>
            <TableHead className="text-right">양보</TableHead>
            <TableHead className="text-right">쿠키</TableHead>
            <TableHead className="text-right">종합</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStudents.map((student, idx) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">
                {idx + 1}
                {idx === 0 && ' 🥇'}
                {idx === 1 && ' 🥈'}
                {idx === 2 && ' 🥉'}
              </TableCell>
              <TableCell>{student.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {getClassName(student.classId)}
              </TableCell>
              <TableCell>
                <PlayerBadgeDisplay badges={student.badges} size="sm" />
              </TableCell>
              <TableCell className="text-right">{student.stats.outs}</TableCell>
              <TableCell className="text-right">{student.stats.passes}</TableCell>
              <TableCell className="text-right">{student.stats.sacrifices}</TableCell>
              <TableCell className="text-right">{student.stats.cookies}</TableCell>
              <TableCell className="text-right font-semibold">
                {calculatePlayerPoints(student)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
```

---

### 4. ClassRankingWidget.tsx

**Baseball 원본**: `baseball-firebase/src/components/ClassRankingWidget.jsx` (14.9KB)

**Dodgeball 생성**: `dodgeball-app/components/stats/ClassRankingWidget.tsx`

#### Props 인터페이스
```typescript
interface ClassRankingWidgetProps {
  teacherId: string;
  maxDisplay?: number;  // 기본 3
  onClassClick?: (classId: string) => void;
}

interface ClassStats {
  classId: string;
  className: string;
  studentCount: number;
  avgScore: number;
  topStudent: Student;
  totalGames: number;
}
```

#### UI 레이아웃
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      📊 학급 랭킹
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    {classStats.slice(0, maxDisplay).map((cls, idx) => (
      <div
        key={cls.classId}
        onClick={() => onClassClick?.(cls.classId)}
        className="p-3 border rounded hover:bg-accent cursor-pointer transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {idx === 0 && '🥇'}
              {idx === 1 && '🥈'}
              {idx === 2 && '🥉'}
              {idx > 2 && `${idx + 1}위`}
            </span>
            <div>
              <div className="font-semibold">{cls.className}</div>
              <div className="text-sm text-muted-foreground">
                평균 {cls.avgScore.toFixed(1)}점 | 학생 {cls.studentCount}명
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            더보기 →
          </Button>
        </div>
      </div>
    ))}
  </CardContent>
</Card>
```

---

## 🎨 공통 스타일 가이드

### 색상 시스템
```typescript
// Tailwind 색상 클래스
const colorClasses = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  accent: 'bg-accent text-accent-foreground',
  muted: 'bg-muted text-muted-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
};

// 배지 등급별 색상
const tierColors = {
  BEGINNER: 'bg-green-100 text-green-700 border-green-300',
  SKILLED: 'bg-blue-100 text-blue-700 border-blue-300',
  MASTER: 'bg-purple-100 text-purple-700 border-purple-300',
  LEGEND: 'bg-orange-100 text-orange-700 border-orange-300',
  SPECIAL: 'bg-yellow-100 text-yellow-700 border-yellow-300',
};

// 팀 색상
const teamColors = {
  red: 'bg-red-100 text-red-700 border-red-300',
  blue: 'bg-blue-100 text-blue-700 border-blue-300',
  green: 'bg-green-100 text-green-700 border-green-300',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  purple: 'bg-purple-100 text-purple-700 border-purple-300',
};
```

### 간격 시스템
```typescript
// 컴포넌트 간 간격
const spacing = {
  xs: 'gap-1',      // 4px
  sm: 'gap-2',      // 8px
  md: 'gap-4',      // 16px
  lg: 'gap-6',      // 24px
  xl: 'gap-8',      // 32px
};

// 섹션 간 간격
const sectionSpacing = 'space-y-4';  // 16px
const cardPadding = 'p-4';           // 16px
```

### 반응형 그리드
```typescript
// 카드 그리드
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* 카드들 */}
</div>

// 통계 카드
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
  {/* 통계 */}
</div>
```

### 버튼 스타일
```typescript
// 주요 액션
<Button>저장</Button>

// 보조 액션
<Button variant="outline">취소</Button>

// 위험 액션
<Button variant="destructive">삭제</Button>

// Ghost (투명)
<Button variant="ghost">더보기</Button>

// 크기
<Button size="sm">작게</Button>
<Button size="default">기본</Button>
<Button size="lg">크게</Button>
```

---

## 📐 레이아웃 패턴

### 모달 레이아웃
```tsx
<Dialog>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>제목</DialogTitle>
      <DialogDescription>설명 (선택)</DialogDescription>
    </DialogHeader>

    <div className="space-y-4">
      {/* 컨텐츠 */}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={onClose}>취소</Button>
      <Button onClick={onSave}>저장</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 카드 레이아웃
```tsx
<Card>
  <CardHeader>
    <CardTitle>제목</CardTitle>
    <CardDescription>설명 (선택)</CardDescription>
  </CardHeader>
  <CardContent>
    {/* 컨텐츠 */}
  </CardContent>
  <CardFooter>
    {/* 액션 버튼 */}
  </CardFooter>
</Card>
```

### 탭 레이아웃
```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">탭 1</TabsTrigger>
    <TabsTrigger value="tab2">탭 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    {/* 탭 1 컨텐츠 */}
  </TabsContent>
  <TabsContent value="tab2">
    {/* 탭 2 컨텐츠 */}
  </TabsContent>
</Tabs>
```

---

## ✅ 컴포넌트별 체크리스트

### Phase 1: 배지 시스템
- [ ] BadgeCreator.tsx - UI, Props, 로직
- [ ] BadgeManagementModal.tsx - UI, Props, 로직
- [ ] ManualBadgeModal.tsx - UI, Props, 로직
- [ ] PlayerBadgeDisplay.tsx - 3가지 크기 변형
- [ ] PlayerBadgeOrderModal.tsx - 드래그앤드롭

### Phase 3: 통계 시스템
- [ ] StatsView.tsx - 탭 구조
- [ ] ScoreboardTab.tsx - 테이블, 정렬
- [ ] GamesTab.tsx - 경기 기록 카드
- [ ] ClassRankingWidget.tsx - 위젯 UI
- [ ] ClassDetailRankingModal.tsx - 상세 모달

### Phase 5: 학생 뷰
- [ ] StudentView - 통계 카드
- [ ] StudentGameHistory.tsx - 타임라인
- [ ] ClassStudentCodesModal.tsx - 코드 목록

---

**마지막 업데이트**: 2025-11-09
