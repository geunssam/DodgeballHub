import { FinishedGame, Team, StudentStats, AggregatedPlayerStats, TeamAggregatedStats } from '@/types';
import { calculateMVPScore } from './mvpCalculator';

/**
 * Stats Aggregator
 *
 * 여러 완료된 경기의 선수 스탯을 통합하는 유틸리티
 * - 원 소속팀 기록만 집계 (임대선수 필터링)
 * - 선수별 누적 통계 계산
 * - 경기별 상세 기록 유지
 */

/**
 * 선수의 원 소속팀 찾기
 */
function findOriginalTeam(playerId: string, teams: Team[]): Team | null {
  for (const team of teams) {
    if (team.members && team.members.some(m => m.studentId === playerId)) {
      return team;
    }
  }
  return null;
}

/**
 * 빈 스탯 객체 생성
 */
function createEmptyStats(): StudentStats {
  return {
    hits: 0,
    passes: 0,
    sacrifices: 0,
    cookies: 0,
    gamesPlayed: 0,
    totalScore: 0
  };
}

/**
 * 두 스탯 객체를 합침
 */
function mergeStats(stats1: StudentStats, stats2: StudentStats): StudentStats {
  return {
    hits: (stats1.hits || 0) + (stats2.hits || 0),
    passes: (stats1.passes || 0) + (stats2.passes || 0),
    sacrifices: (stats1.sacrifices || 0) + (stats2.sacrifices || 0),
    cookies: (stats1.cookies || 0) + (stats2.cookies || 0),
    gamesPlayed: (stats1.gamesPlayed || 0) + (stats2.gamesPlayed || 0),
    totalScore: (stats1.totalScore || 0) + (stats2.totalScore || 0)
  };
}

/**
 * 여러 완료된 경기의 선수 스탯을 통합
 *
 * @param finishedGames - 완료된 경기 목록
 * @param teams - 전체 팀 목록
 * @returns 선수별 통합 스탯 { playerId: AggregatedPlayerStats }
 */
export function aggregatePlayerStats(
  finishedGames: FinishedGame[],
  teams: Team[]
): { [playerId: string]: AggregatedPlayerStats } {
  const playerStatsMap: { [playerId: string]: AggregatedPlayerStats } = {};

  finishedGames.forEach(game => {
    // 모든 팀 순회
    game.teams.forEach(gameTeam => {
      if (!gameTeam || !gameTeam.members) return;

      gameTeam.members.forEach(member => {
        const playerId = member.studentId;
        if (!playerId) return;

        // records에서 해당 선수의 스탯 찾기
        const playerRecord = game.records.find(r => r.studentId === playerId);
        if (!playerRecord) return;

        // 원 소속팀 찾기
        const originalTeam = findOriginalTeam(playerId, teams);

        // 원 소속팀이 없으면 스킵 (삭제된 선수일 수 있음)
        if (!originalTeam) {
          console.warn(`⚠️ 선수 ID ${playerId}의 원 소속팀을 찾을 수 없습니다.`);
          return;
        }

        // 원 소속팀에서 뛴 경기인지 확인
        const isOriginalTeamGame = originalTeam.id === gameTeam.teamId;

        if (!playerStatsMap[playerId]) {
          // 선수 첫 등록
          playerStatsMap[playerId] = {
            playerId,
            playerName: '', // TODO: Student 데이터에서 가져와야 함
            originalTeamId: originalTeam.id,
            originalTeamName: originalTeam.name,
            gamesPlayed: 0,
            stats: createEmptyStats(),
            gameDetails: [],
            mvpScore: 0
          };
        }

        // 경기 상세 기록 추가 (원 소속팀 여부 표시)
        playerStatsMap[playerId].gameDetails.push({
          gameId: game.id,
          gameDate: game.finishedAt || game.createdAt,
          teamId: gameTeam.teamId,
          teamName: gameTeam.name,
          isOriginalTeam: isOriginalTeamGame,
          stats: {
            hits: playerRecord.hits || 0,
            passes: playerRecord.passes || 0,
            sacrifices: playerRecord.sacrifices || 0,
            cookies: playerRecord.cookies || 0,
            gamesPlayed: 1,
            totalScore: (playerRecord.hits || 0) + (playerRecord.passes || 0) +
                       (playerRecord.sacrifices || 0) + (playerRecord.cookies || 0)
          },
          newBadges: [], // 경기 종료 시 추가됨
          result: 'draw' // TODO: 승패 판정 로직 필요
        });

        // 원 소속팀 경기만 통계에 포함
        if (isOriginalTeamGame) {
          playerStatsMap[playerId].gamesPlayed += 1;
          playerStatsMap[playerId].stats = mergeStats(
            playerStatsMap[playerId].stats,
            {
              hits: playerRecord.hits || 0,
              passes: playerRecord.passes || 0,
              sacrifices: playerRecord.sacrifices || 0,
              cookies: playerRecord.cookies || 0,
              gamesPlayed: 1,
              totalScore: (playerRecord.hits || 0) + (playerRecord.passes || 0) +
                         (playerRecord.sacrifices || 0) + (playerRecord.cookies || 0)
            }
          );
        }
      });
    });
  });

  // MVP 점수 계산
  Object.values(playerStatsMap).forEach(player => {
    player.mvpScore = calculateMVPScore(player.stats);
  });

  return playerStatsMap;
}

/**
 * 팀별 통합 스탯 계산
 *
 * @param finishedGames - 완료된 경기 목록
 * @returns 팀별 통합 스탯 { teamName: TeamAggregatedStats }
 */
export function aggregateTeamStats(
  finishedGames: FinishedGame[]
): { [teamName: string]: TeamAggregatedStats } {
  const teamStatsMap: { [teamName: string]: TeamAggregatedStats } = {};

  finishedGames.forEach(game => {
    if (!game.finalScores || game.teams.length < 2) return;

    game.teams.forEach(team => {
      const teamName = team.name;
      const teamId = team.teamId;
      const teamScore = game.finalScores[teamId] || 0;

      // 상대 팀 점수 계산
      const opponentScore = Object.entries(game.finalScores)
        .filter(([id]) => id !== teamId)
        .reduce((sum, [_, score]) => sum + score, 0);

      if (!teamStatsMap[teamName]) {
        teamStatsMap[teamName] = {
          teamId,
          teamName,
          totalGames: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          totalScore: 0,
          totalScoreAllowed: 0
        };
      }

      teamStatsMap[teamName].totalGames += 1;
      teamStatsMap[teamName].totalScore += teamScore;
      teamStatsMap[teamName].totalScoreAllowed += opponentScore;

      if (teamScore > opponentScore) {
        teamStatsMap[teamName].wins += 1;
      } else if (teamScore < opponentScore) {
        teamStatsMap[teamName].losses += 1;
      } else {
        teamStatsMap[teamName].draws += 1;
      }
    });
  });

  return teamStatsMap;
}

/**
 * 통합 스코어보드 생성
 *
 * @param finishedGames - 완료된 경기 목록
 * @returns 경기별 스코어보드 정보
 */
export function buildCombinedScoreboard(finishedGames: FinishedGame[]) {
  return finishedGames.map(game => {
    const teamNames = game.teams.map(t => t.name);
    const scores = game.teams.map(t => game.finalScores[t.teamId] || 0);

    let winner = '무승부';
    if (scores.length === 2) {
      if (scores[0] > scores[1]) {
        winner = teamNames[0];
      } else if (scores[0] < scores[1]) {
        winner = teamNames[1];
      }
    }

    return {
      gameId: game.id,
      gameTitle: teamNames.join(' vs '),
      gameDate: game.finishedAt || game.createdAt,
      teams: teamNames,
      finalScores: game.finalScores,
      winner,
      mvps: game.mvps || []
    };
  });
}

/**
 * 선수 필터링 옵션
 */
export const PlayerFilterOptions = {
  ALL: 'all' as const,                    // 모든 선수
  HAS_GAMES: 'has_games' as const,       // 출전 경기가 있는 선수만
  HAS_OUTS: 'has_outs' as const,         // 아웃이 있는 선수만
  MVP_TOP_10: 'mvp_top_10' as const      // MVP 점수 상위 10명
};

export type PlayerFilterOption = typeof PlayerFilterOptions[keyof typeof PlayerFilterOptions];

/**
 * 필터 옵션에 따라 선수 목록 필터링
 *
 * @param playerStatsMap - 선수별 통합 스탯
 * @param filterOption - 필터 옵션
 * @returns 필터링된 선수 목록
 */
export function filterPlayers(
  playerStatsMap: { [playerId: string]: AggregatedPlayerStats },
  filterOption: PlayerFilterOption = PlayerFilterOptions.ALL
): AggregatedPlayerStats[] {
  let players = Object.values(playerStatsMap);

  switch (filterOption) {
    case PlayerFilterOptions.HAS_GAMES:
      players = players.filter(p => p.gamesPlayed > 0);
      break;

    case PlayerFilterOptions.HAS_OUTS:
      players = players.filter(p => p.stats.hits > 0);
      break;

    case PlayerFilterOptions.MVP_TOP_10:
      players = players
        .filter(p => p.gamesPlayed > 0)
        .sort((a, b) => b.mvpScore - a.mvpScore)
        .slice(0, 10);
      break;

    case PlayerFilterOptions.ALL:
    default:
      // 필터링 없음
      break;
  }

  return players;
}
