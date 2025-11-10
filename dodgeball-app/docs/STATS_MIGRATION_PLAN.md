# DodgeballHub 통계 시스템 구현 계획

> Baseball-Firebase 프로젝트의 통계 시스템을 DodgeballHub로 완전 이식
>
> 작성일: 2025-11-09
> 최종 수정: 2025-11-09 (검증 완료)

---

## 📊 전체 개요

Baseball-Firebase의 통계 시스템을 DodgeballHub로 완전 이식합니다. 피구 게임 특성에 맞게 조정하되, 핵심 데이터 구조와 로직은 동일하게 유지합니다.

**주요 결정 사항:**
- **범위**: Phase 1-4 전체 구현 (실시간 통계, 모든 UI 포함)
- **기존 데이터**: 마이그레이션 스크립트로 변환
- **MVP 계산**: 동일 가중치 (outs/passes/sacrifices/cookies 모두 1점)
- **추가 기능**: 학급 간 랭킹 보드

---

## 🎯 Phase 1: 데이터 구조 확장 (1-2일)

### 1.1 TypeScript 타입 정의 확장
**파일**: `types/index.ts`

추가할 인터페이스:
```typescript
// 경기 기록 관련
interface GameHistoryEntry {
  gameId: string;
  gameDate: string;
  teamId: string;
  teamName: string;
  isOriginalTeam: boolean;
  stats: StudentStats;
  newBadges: string[];
  result: 'win' | 'loss' | 'draw';
}

interface PlayerHistory {
  playerId: string;
  games: GameHistoryEntry[];
  updatedAt: Timestamp;
}

// 완료된 경기
interface FinishedGame extends Game {
  status: 'finished';
  finishedAt: string;
  finalScores: { [teamId: string]: number };
  winner?: string;
  mvps: string[];
}

// 통계 집계 (원 소속팀 기반)
interface AggregatedPlayerStats {
  playerId: string;
  playerName: string;
  originalTeamId: string;
  originalTeamName: string;
  className?: string;
  gamesPlayed: number;
  stats: StudentStats;
  gameDetails: GameHistoryEntry[];
  mvpScore: number;
}

// 통계 집계 (통합 분석용)
interface PlayerStatsMap {
  [playerId: string]: {
    id: string;
    name: string;
    className?: string;
    teamNames: string[];
    hits: number;
    runs: number;
    goodDefense: number;
    bonusCookie: number;
    gamesPlayed: number;
  };
}

interface ClassRankingData {
  className: string;
  totalPoints: number;
  avgPoints: number;
  studentCount: number;
  totalOuts: number;
  totalPasses: number;
  totalSacrifices: number;
  totalCookies: number;
}

interface TeamAggregatedStats {
  teamId: string;
  teamName: string;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  totalScore: number;
  totalScoreAllowed: number;
}
```

### 1.2 Firestore 서비스 함수 추가
**파일**: `lib/firebase/firestore.ts` 확장

새로 추가할 함수:
- `getPlayerHistory(teacherId, playerId)` → `PlayerHistory`
- `updatePlayerHistory(teacherId, playerId, gameEntry)` → `void`
- `getAllPlayerHistories(teacherId)` → `PlayerHistory[]`
- `getPlayerDetailedHistory(teacherId, playerId)` → `DetailedGame[]`
- `saveFinishedGame(teacherId, game)` → `void`
- `getFinishedGames(teacherId, limit?)` → `FinishedGame[]`
- `subscribeToFinishedGames(teacherId, callback)` → `Unsubscribe`

---

## 🧮 Phase 2: 통계 계산 로직 (2-3일)

### 2.1 statsAggregator.ts 생성
**파일**: `lib/statsAggregator.ts` (새 파일)

**⚠️ 중요**: 이 파일은 **원 소속팀 기반 통계 집계**용입니다 (임대 선수 필터링)

**구현 함수:**

1. **내부 헬퍼 함수** (export 안됨)
   - `findOriginalTeam(playerId, teams)` → `Team | null`
   - `createEmptyStats()` → `StudentStats`
   - `mergeStats(stats1, stats2)` → `StudentStats`

2. **aggregatePlayerStats(finishedGames, teams)** → `{ [playerId]: AggregatedPlayerStats }`
   - **목적**: 완료된 경기들에서 선수별 누적 통계 계산
   - **로직**:
     * 원 소속팀 경기만 stats에 포함
     * 모든 경기는 gameDetails에 기록
     * MVP 점수 자동 계산
   - **특징**: 임대 선수 필터링 (isOriginalTeam 체크)

3. **aggregateTeamStats(finishedGames)** → `{ [teamName]: TeamAggregatedStats }`
   - **목적**: 팀별 승/패/무, 총 득점/실점 계산

4. **buildCombinedScoreboard(finishedGames)** → `Array`
   - **목적**: 통합 스코어보드 생성

5. **PlayerFilterOptions** (상수 객체)
   - ALL, HAS_GAMES, HAS_HITS, MVP_TOP_10

6. **filterPlayers(playerStatsMap, filterOption)** → `Array`
   - **목적**: 필터 옵션에 따라 선수 목록 필터링

### 2.2 statsHelpers.ts 생성
**파일**: `lib/statsHelpers.ts` (새 파일)

**⚠️ 중요**: 이 파일은 **통합 분석 모달 전용**입니다 (간소화 버전, 원 소속팀 필터링 없음)

**구현 함수:**

1. **calculatePlayerPoints(stats)** → `number`
   - **목적**: 선수 총점 계산 (1점 체계)
   - **계산식**: `hits + runs + goodDefense + bonusCookie`

2. **aggregateClassScores(selectedGames, teams)** → `Object`
   - **목적**: 반별 점수 집계 (이닝별 점수 포함)
   - **반환**: `{ className: { totalScore, inningScores[], games[] } }`
   - **특징**: scoreBoard 대문자 B 사용

3. **aggregatePlayerStats(selectedGames, teams, students)** → `PlayerStatsMap`
   - **목적**: 선수별 통계 집계 (통합 분석 모달용, 간소화 버전)
   - **반환**: `{ playerId: { name, className, teamNames, hits, runs, goodDefense, bonusCookie, gamesPlayed } }`
   - **특징**:
     * className 우선순위: `students배열 > player.className > teamClassName`
     * Set을 사용하여 팀명 중복 제거
     * **원 소속팀 필터링 없음** (statsAggregator와의 차이점)

4. **calculatePlayerRanking(playerStatsMap)** → `Array`
   - **목적**: 선수 랭킹 계산
   - **등수 계산**: 학교 성적표 방식 (연속 등수)
     * 예: 1등 2명 → 다음은 3등 (2등 건너뜀)

5. **getMVPs(ranking)** → `Array`
   - **목적**: MVP 선정 (공동 MVP 지원)
   - **로직**: 1위와 같은 점수를 가진 모든 선수 반환

### 🔍 두 aggregatePlayerStats 함수의 차이점

| 구분 | statsAggregator | statsHelpers |
|-----|----------------|--------------|
| **용도** | 원 소속팀 기반 집계 | 통합 분석 모달용 |
| **파라미터** | (finishedGames, teams) | (selectedGames, teams, students) |
| **필터링** | ✅ 원 소속팀만 | ❌ 모든 경기 포함 |
| **MVP 점수** | ✅ 포함 (mvpScore) | ❌ 없음 |
| **gameDetails** | ✅ 상세 기록 유지 | ❌ 없음 |
| **className** | team 기반 | students 배열 우선 |

### 2.3 mvpCalculator.ts 생성
**파일**: `lib/mvpCalculator.ts` (새 파일)

**MVP 가중치** (피구 맞춤):
```typescript
const MVP_WEIGHTS = {
  outs: 1,        // 아웃시킨 횟수
  passes: 1,      // 통과 성공
  sacrifices: 1,  // 희생 플레이
  cookies: 1      // 보너스 쿠키
};
```

**구현 함수:**
- `calculateMVPScore(stats)` → `number`
- `findMVP(players)` → `Player | null` (단일 MVP)
- `sortPlayersByMVPScore(players, descending)` → `Array`
- `getMVPGrade(score)` → `'S'|'A'|'B'|'C'|'D'`
  * S: 50점 이상, A: 30-49, B: 15-29, C: 5-14, D: 5점 미만
- `getMVPScoreDescription(score, stats)` → `string`

### 2.4 classStatsCalculator.ts 생성
**파일**: `lib/classStatsCalculator.ts` (새 파일)

**구현 함수:**

1. **calculateAllClassStats(teacherId)** → `Promise<Object>`
   - **목적**: 모든 학급의 통계 계산
   - **데이터**: playerHistory + 진행 중 경기
   - **반환**: `{ [className]: { totalHits, totalRuns, totalDefense, totalCookie, studentCount } }`

2. **calculateClassStats(teacherId, className)** → `Promise<Object>`
   - **목적**: 특정 학급의 통계만 계산

3. **calculateStudentStats(teacherId, students)** → `Promise<Object>`
   - **목적**: 개별 학생들의 통계 계산
   - **반환**: `{ [studentId]: { hits, runs, defense, cookie } }`

### 2.5 teamStatsCalculator.ts 생성
**파일**: `lib/teamStatsCalculator.ts` (새 파일)

**⚠️ 중요**: classStatsCalculator의 팀 버전 (완료된 경기만 집계)

**구현 함수:**

1. **calculateTeamStats(teacherId, teamPlayers)** → `Promise<Object>`
   - **목적**: 단일 팀의 통계 계산
   - **데이터**: playerHistory만 (진행 중 경기 제외)
   - **반환**: `{ totalHits, totalRuns, totalDefense, totalCookie, totalBadges }`
   - **특징**: 배지 집계 시 중복 방지 (Set 사용)

2. **calculateAllTeamStats(teacherId, teams)** → `Promise<Object>`
   - **목적**: 모든 팀의 통계 계산
   - **반환**: `{ [teamId]: { totalHits, totalRuns, totalDefense, totalCookie, totalBadges } }`
   - **최적화**: 병렬 처리 (Promise.all)

---

## 🎨 Phase 3: UI 컴포넌트 구현 (3-4일)

### 3.1 통계 메인 페이지
**파일**: `app/teacher/stats/page.tsx` (새 파일)

**구조:**
```
StatsPage
├─ 탭 1: "경기 기록"
│  ├─ 완료된 경기 목록 (카드 형식)
│  │  ├─ 팀 정보, 최종 점수
│  │  ├─ MVP 정보 (공동 MVP 표시)
│  │  └─ 상세 정보 (details 아코디언)
│  │      ├─ 라운드별 스코어
│  │      ├─ 팀별 라인업
│  │      └─ 선수별 기록 테이블
│  └─ 필터 (날짜, 학급, 팀)
│
└─ 탭 2: "통합 스코어보드"
   ├─ 경기 선택 체크박스
   ├─ "통합 분석 보기" 버튼
   └─ SelectedGamesModal 열기
```

### 3.2 학급 랭킹 컴포넌트
**파일**: `components/teacher/ClassRankingWidget.tsx` (새 파일)

**기능:**
- 대시보드에 표시할 간단한 학급 랭킹
- 상위 3개 학급: 올림픽 포디움 스타일
- 나머지: 컴팩트한 1줄 리스트
- 클릭 시 `ClassDetailRankingModal` 표시

**데이터 로딩 로직:**
```typescript
useEffect(() => {
  async function loadRankings() {
    // 1. 모든 학생 조회
    const students = await getStudents(teacherId);

    // 2. 진행 중 경기 1회 조회 (성능 최적화)
    const activeGames = await getActiveGames(teacherId);

    // 3. 각 학생별 병렬 처리
    const statsPromises = students.map(async (student) => {
      // playerHistory에서 완료 경기 스탯
      const history = await getPlayerHistory(teacherId, student.id);
      const historyStats = sumStats(history.games);

      // 진행 중 경기에서 현재 스탯
      const activeStats = extractActiveStats(activeGames, student.id);

      // 합산
      return {
        className: student.className,
        stats: combineStats(historyStats, activeStats)
      };
    });

    const allStats = await Promise.all(statsPromises);

    // 4. 학급별 집계
    const classRankings = aggregateByClass(allStats);
    setRankings(classRankings);
  }

  loadRankings();
}, [teacherId]);
```

### 3.3 학급 상세 랭킹 모달
**파일**: `components/teacher/ClassDetailRankingModal.tsx` (새 파일)

**표시 내용:**
- 학급명, 총점, 평균 점수, 학생 수
- 학생별 랭킹 테이블
  * 순위, 이름, 포인트, 상세 스탯
  * 상위 3명 배경색 강조

### 3.4 학생 경기 기록 컴포넌트
**파일**: `components/teacher/StudentHistoryModal.tsx` (새 파일)

**표시 내용:**
- 최근 N경기 기록 (기본 3개)
- 누적 통계 요약 카드
- 각 경기별:
  * 날짜, 팀명, 승/패
  * 스탯 (아웃/통과/희생/쿠키)
  * 새로 획득한 배지
- "전체 기록 보기" 버튼 → StudentView로 이동

**데이터 로딩:**
```typescript
async function loadGames() {
  // 1. playerHistory에서 기본 게임 데이터
  const history = await getPlayerHistory(teacherId, playerId);

  // 2. 각 게임의 상세 정보 조회
  const detailedGames = await Promise.all(
    history.games.map(async (game) => {
      const gameDoc = await getFinishedGame(teacherId, game.gameId);

      if (!gameDoc) {
        return { ...game, isDeleted: true };
      }

      // 승패 판정
      const result = calculateGameResult(gameDoc, game.teamId);

      return {
        ...game,
        result,
        isDeleted: false
      };
    })
  );

  // 3. 날짜순 정렬 및 최근 N개만
  const recent = detailedGames
    .sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate))
    .slice(0, maxGames);

  setGames(recent);
}
```

### 3.5 학생 전체 기록 페이지
**파일**: `components/teacher/StudentGameHistory.tsx` (새 파일)

**표시 내용:**
- 전체 경기 목록 (정렬 가능)
- 누적 통계 요약
- 차트 (recharts 사용)
  * LineChart: 경기별 득점 추이
  * BarChart: 스탯 타입별 비교

### 3.6 통합 분석 모달
**파일**: `components/teacher/SelectedGamesModal.tsx` (새 파일)

**표시 내용:**
- Section 1: 반별 통합 스코어보드
  * 각 학급의 라운드별 점수, 총점
  * 점수 순 정렬

- Section 2: 통합 MVP 카드
  * 공동 MVP 모두 표시
  * 이름, 학급, 출전 팀, 총점, 상세 스탯

- Section 3: 전체 선수 랭킹
  * 순위, 이름, 학급, 팀, 출전 횟수, 스탯, 총점
  * 상위 3명 메달 표시

**계산 로직:**
```typescript
// useMemo로 최적화 (statsHelpers 사용)
const selectedGames = useMemo(
  () => finishedGames.filter(g => selectedGameIds.includes(g.id)),
  [finishedGames, selectedGameIds]
);

const classScores = useMemo(
  () => aggregateClassScores(selectedGames, teams),
  [selectedGames, teams]
);

const playerStatsMap = useMemo(
  () => aggregatePlayerStats(selectedGames, teams, students),
  [selectedGames, teams, students]
);

const playerRanking = useMemo(
  () => calculatePlayerRanking(playerStatsMap),
  [playerStatsMap]
);

const mvps = useMemo(
  () => getMVPs(playerRanking),
  [playerRanking]
);
```

---

## ⚡ Phase 4: 경기 종료 프로세스 통합 (1-2일)

### 4.1 finishGame 함수 수정
**파일**: `app/teacher/class/[classId]/game/play/page.tsx`

**현재 경기 종료 버튼에 추가할 로직:**

```typescript
async function handleFinishGame() {
  // 1. 확인 모달 표시
  setShowGameEndModal(true);
}

async function confirmFinishGame() {
  try {
    // 2. 배지 계산 준비
    const allPlayers = [...game.teamA.lineup, ...game.teamB.lineup];

    for (const player of allPlayers) {
      // a. 과거 경기 기록 조회
      const history = await getPlayerHistory(teacherId, player.id);
      const pastGames = history?.games || [];

      // b. 과거 누적 스탯 계산
      const pastStats = pastGames.reduce((acc, game) => ({
        outs: acc.outs + (game.stats.outs || 0),
        passes: acc.passes + (game.stats.passes || 0),
        sacrifices: acc.sacrifices + (game.stats.sacrifices || 0),
        cookies: acc.cookies + (game.stats.cookies || 0),
      }), { outs: 0, passes: 0, sacrifices: 0, cookies: 0 });

      // c. 현재 경기 포함 최종 누적 스탯
      const totalStats = {
        outs: pastStats.outs + (player.stats.outs || 0),
        passes: pastStats.passes + (player.stats.passes || 0),
        sacrifices: pastStats.sacrifices + (player.stats.sacrifices || 0),
        cookies: pastStats.cookies + (player.stats.cookies || 0),
      };

      // d. 배지 조건 체크
      const currentBadges = await getPlayerBadges(teacherId, player.id);
      const eligibleBadges = checkBadgeConditions(totalStats, currentBadges);
      const newBadges = eligibleBadges.filter(
        id => !currentBadges.some(b => b.badgeId === id)
      );

      // e. player 객체에 배지 정보 추가
      player.badges = currentBadges.map(b => b.badgeId);
      player.newBadges = newBadges;
    }

    // 3. Firestore Batch 작업
    const batch = writeBatch(db);

    // a. games 컬렉션에서 삭제
    const gameRef = doc(db, `users/${teacherId}/games/${game.id}`);
    batch.delete(gameRef);

    // b. finishedGames에 저장
    const finishedRef = doc(db, `users/${teacherId}/finishedGames/${game.id}`);
    batch.set(finishedRef, {
      ...game,
      status: 'finished',
      finishedAt: serverTimestamp()
    });

    // c. 각 선수의 playerHistory 업데이트
    for (const player of allPlayers) {
      const historyRef = doc(db, `users/${teacherId}/playerHistory/${player.id}`);
      const gameEntry = {
        gameId: game.id,
        gameDate: new Date().toISOString(),
        teamId: player.teamId,
        teamName: player.teamName,
        isOriginalTeam: true,  // TODO: 임대 선수 체크 로직
        stats: player.stats,
        newBadges: player.newBadges,
        result: 'draw'  // TODO: 승패 판정
      };

      batch.update(historyRef, {
        games: arrayUnion(gameEntry),
        updatedAt: serverTimestamp()
      });
    }

    // d. 새 배지 수여
    for (const player of allPlayers) {
      if (player.newBadges.length > 0) {
        const badgesRef = doc(db, `users/${teacherId}/playerBadges/${player.id}`);
        const badgeDetails = player.newBadges.map(badgeId => ({
          badgeId,
          awardedAt: serverTimestamp(),
          awardType: 'auto',
          gameId: game.id
        }));

        batch.update(badgesRef, {
          badgeDetails: arrayUnion(...badgeDetails),
          updatedAt: serverTimestamp()
        });
      }
    }

    // 4. Commit
    await batch.commit();

    // 5. 배지 획득 모달 표시 (새 배지가 있는 경우)
    const playersWithNewBadges = allPlayers.filter(p => p.newBadges.length > 0);
    if (playersWithNewBadges.length > 0) {
      setNewlyAwardedBadges(playersWithNewBadges);
      setShowBadgeAwardModal(true);
    }

    // 6. 대시보드로 리다이렉트
    router.push('/teacher/dashboard');

  } catch (error) {
    console.error('경기 종료 실패:', error);
    alert('경기 종료 중 오류가 발생했습니다.');
  }
}
```

### 4.2 GameEndModal 컴포넌트
**파일**: `components/teacher/GameEndModal.tsx` (새 파일)

**표시 내용:**
- 최종 점수 확인
- "정말 종료하시겠습니까?" 확인 메시지
- 확인/취소 버튼

### 4.3 BadgeAwardModal 컴포넌트
**파일**: `components/badge/BadgeAwardModal.tsx` (기존 활용)

**표시 내용:**
- 새로 배지를 획득한 선수 목록
- 각 배지 아이콘, 이름, 설명
- 축하 애니메이션

---

## 🔄 Phase 5: 실시간 통계 통합 (1일)

### 5.1 실시간 리스너 설정
**파일**: `contexts/GameContext.tsx` (또는 새 StatsContext)

```typescript
useEffect(() => {
  if (!teacherId) return;

  // finishedGames 실시간 구독
  const unsubFinished = subscribeToFinishedGames(
    teacherId,
    (games) => setFinishedGames(games)
  );

  return () => {
    unsubFinished();
  };
}, [teacherId]);
```

### 5.2 통계 조회 최적화
- Context에서 finishedGames 캐싱
- 필요할 때만 playerHistory 조회
- Promise.all로 병렬 처리

---

## 📦 Phase 6: 추가 기능 및 마무리 (1-2일)

### 6.1 필요한 패키지 설치
```bash
npm install recharts  # 차트 라이브러리
```

### 6.2 UI/UX 개선
- [ ] 스켈레톤 UI (로딩 중)
- [ ] 빈 상태 메시지 (경기 없음, 학생 없음)
- [ ] 에러 바운더리
- [ ] 반응형 디자인 (모바일 대응)

### 6.3 성능 최적화
- [ ] React.memo() 적용
- [ ] useMemo(), useCallback() 활용
- [ ] 페이지네이션 (경기 많을 때)

---

## ✅ 전체 구현 체크리스트

### 데이터 구조
- [ ] types/index.ts에 새 인터페이스 추가
- [ ] Firestore 서비스 함수 구현
- [ ] playerHistory 컬렉션 준비
- [ ] finishedGames 컬렉션 준비

### 통계 계산 로직
- [ ] lib/statsAggregator.ts 생성 (원 소속팀 기반)
- [ ] lib/statsHelpers.ts 생성 (통합 분석 모달용)
- [ ] lib/mvpCalculator.ts 생성
- [ ] lib/classStatsCalculator.ts 생성
- [ ] lib/teamStatsCalculator.ts 생성

### UI 컴포넌트 - 메인 페이지
- [ ] app/teacher/stats/page.tsx 생성
- [ ] components/teacher/GameCard.tsx
- [ ] components/teacher/GameDetailAccordion.tsx

### UI 컴포넌트 - 학급 랭킹
- [ ] components/teacher/ClassRankingWidget.tsx
- [ ] components/teacher/ClassDetailRankingModal.tsx
- [ ] components/teacher/ClassPodiumCard.tsx

### UI 컴포넌트 - 학생 기록
- [ ] components/teacher/StudentHistoryModal.tsx
- [ ] components/teacher/StudentGameHistory.tsx
- [ ] components/teacher/StatsCard.tsx
- [ ] components/teacher/StatsChart.tsx

### UI 컴포넌트 - 통합 분석
- [ ] components/teacher/SelectedGamesModal.tsx
- [ ] components/teacher/ClassScoreboardTable.tsx
- [ ] components/teacher/MVPCard.tsx
- [ ] components/teacher/PlayerRankingTable.tsx

### 경기 종료 통합
- [ ] finishGame 함수 수정
- [ ] 배지 자동 계산 로직
- [ ] playerHistory 업데이트
- [ ] components/teacher/GameEndModal.tsx

### 실시간 통계
- [ ] finishedGames 실시간 리스너
- [ ] Context에서 캐싱 구현
- [ ] 성능 최적화

### 추가 기능
- [ ] recharts 설치
- [ ] 스켈레톤 UI
- [ ] 에러 처리
- [ ] 반응형 디자인

---

## 📋 구현 우선순위

### 🔴 최우선 (1주차)
1. 데이터 구조 확장 (types, Firestore 서비스)
2. 경기 종료 프로세스 (finishGame 함수)
3. playerHistory 업데이트 로직
4. 배지 자동 계산

### 🟡 중요 (2주차)
5. 통계 계산 로직 (aggregator, helpers, calculator)
6. 학급 랭킹 위젯 (대시보드용)
7. 학생 경기 기록 모달
8. 통계 메인 페이지 (경기 기록 탭)

### 🟢 부가 기능 (3주차)
9. 통합 분석 모달
10. 차트 및 시각화
11. 성능 최적화
12. UI/UX 개선

---

## 🎓 Baseball → DodgeballHub 용어 매핑

| Baseball | DodgeballHub | 설명 |
|----------|--------------|------|
| hits (안타) | outs (아웃) | 상대 아웃시킨 횟수 |
| runs (득점) | passes (통과) | 공 피해서 통과 성공 |
| goodDefense (수비) | sacrifices (희생) | 희생 플레이 |
| bonusCookie (쿠키) | cookies (쿠키) | 보너스 쿠키 (동일) |
| single/double/triple/homerun | - | 피구는 세분화 없음 |
| scoreBoard.teamA[] | rounds.teamA[] | 이닝 → 라운드 |

---

## 📝 주요 참고 파일 (Baseball-Firebase)

### 컴포넌트
- `src/components/StatsView.jsx` → UI 구조 참고
- `src/components/ClassRankingWidget.jsx` → 랭킹 위젯
- `src/components/StudentHistoryModal.jsx` → 학생 기록
- `src/components/SelectedGamesModal.jsx` → 통합 분석

### 로직
- `src/services/firestoreService.js` → finishGame 함수, playerHistory 업데이트
- `src/utils/statsAggregator.js` → 원 소속팀 기반 통계 집계
- `src/utils/statsHelpers.js` → 통합 분석 모달 헬퍼
- `src/utils/mvpCalculator.js` → MVP 계산
- `src/utils/classStatsCalculator.js` → 학급 통계
- `src/utils/teamStatsCalculator.js` → 팀 통계

### 데이터
- Firestore 구조: playerHistory, finishedGames, playerBadges

---

## 💡 구현 시 주의사항

1. **원 소속팀 필터링**: 임대 선수는 원 소속팀 경기만 통계에 포함 (statsAggregator)
2. **공동 MVP 처리**: 같은 점수의 선수 모두 MVP로 표시
3. **실시간 + 완료 통합**: 진행 중 경기와 완료 경기를 함께 고려
4. **배지 중복 방지**: 이미 보유한 배지는 재수여 안 됨
5. **성능 최적화**: Promise.all, useMemo 적극 활용
6. **에러 처리**: 경기 삭제 시 isDeleted 플래그 처리
7. **두 aggregatePlayerStats 구분**: statsAggregator(원 소속팀) vs statsHelpers(통합 분석)

---

## 📅 예상 일정

- **Phase 1-2**: 4일 (데이터 구조 + 계산 로직)
- **Phase 3**: 3일 (UI 컴포넌트)
- **Phase 4**: 2일 (실시간 통합)
- **Phase 5**: 1일 (마이그레이션)
- **Phase 6**: 2일 (마무리)
- **총 12일** (여유 포함 시 2-3주)

---

이 계획대로 진행하면 Baseball-Firebase와 동일한 수준의 통계 시스템을 DodgeballHub에 완전히 구현할 수 있습니다!
