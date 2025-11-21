/**
 * 통계 계산 헬퍼 함수
 * 학급, 학생, 팀의 통계를 계산합니다.
 */

import type { Student, StudentStats, Team, TeamMemberAssignment } from '@/types';

/**
 * 학급 전체 통계
 */
export interface ClassStats {
  totalHits: number;
  totalPasses: number;
  totalSacrifices: number;
  totalCookies: number;
  totalBadges: number;
  totalGamesPlayed: number;
  studentCount: number;
}

/**
 * 팀 전체 통계
 */
export interface TeamStats {
  totalHits: number;
  totalPasses: number;
  totalSacrifices: number;
  totalCookies: number;
  totalBadges: number;
  totalGamesPlayed: number;
  memberCount: number;
}

/**
 * 학생별 통계 (배지 수 포함)
 */
export interface EnrichedStudentStats extends StudentStats {
  badgeCount: number;
}

/**
 * 학급의 모든 학생 통계를 집계
 *
 * @param students - 학급에 속한 학생 목록
 * @returns 학급 전체 통계
 */
export function calculateClassStats(students: Student[]): ClassStats {
  if (!students || students.length === 0) {
    return {
      totalHits: 0,
      totalPasses: 0,
      totalSacrifices: 0,
      totalCookies: 0,
      totalBadges: 0,
      totalGamesPlayed: 0,
      studentCount: 0,
    };
  }

  const stats = students.reduce(
    (acc, student) => {
      const studentStats = student.stats || {
        hits: 0,
        passes: 0,
        sacrifices: 0,
        cookies: 0,
        gamesPlayed: 0,
        totalScore: 0,
      };

      return {
        totalHits: acc.totalHits + (studentStats.hits || 0),
        totalPasses: acc.totalPasses + (studentStats.passes || 0),
        totalSacrifices: acc.totalSacrifices + (studentStats.sacrifices || 0),
        totalCookies: acc.totalCookies + (studentStats.cookies || 0),
        totalBadges: acc.totalBadges + (student.badges?.length || 0),
        totalGamesPlayed: acc.totalGamesPlayed + (studentStats.gamesPlayed || 0),
        studentCount: acc.studentCount + 1,
      };
    },
    {
      totalHits: 0,
      totalPasses: 0,
      totalSacrifices: 0,
      totalCookies: 0,
      totalBadges: 0,
      totalGamesPlayed: 0,
      studentCount: 0,
    }
  );

  return stats;
}

/**
 * 학생 개인 통계 (배지 수 포함)
 *
 * @param student - 학생 데이터
 * @returns 배지 수가 포함된 학생 통계
 */
export function calculateStudentStats(student: Student): EnrichedStudentStats {
  const stats = student.stats || {
    hits: 0,
    passes: 0,
    sacrifices: 0,
    cookies: 0,
    gamesPlayed: 0,
    totalScore: 0,
  };

  return {
    ...stats,
    badgeCount: student.badges?.length || 0,
  };
}

/**
 * 팀의 모든 멤버 통계를 집계
 *
 * @param team - 팀 데이터
 * @param allStudents - 전체 학생 목록 (멤버 통계를 찾기 위해)
 * @returns 팀 전체 통계
 */
export function calculateTeamStats(
  team: Team,
  allStudents: Student[]
): TeamStats {
  if (!team || !team.members || team.members.length === 0) {
    return {
      totalHits: 0,
      totalPasses: 0,
      totalSacrifices: 0,
      totalCookies: 0,
      totalBadges: 0,
      totalGamesPlayed: 0,
      memberCount: 0,
    };
  }

  // 팀 멤버들의 학생 데이터를 찾아서 통계 집계
  const memberStats = team.members.reduce(
    (acc, member) => {
      const student = allStudents.find((s) => s.id === member.studentId);
      if (!student) return acc;

      const stats = student.stats || {
        hits: 0,
        passes: 0,
        sacrifices: 0,
        cookies: 0,
        gamesPlayed: 0,
        totalScore: 0,
      };

      return {
        totalHits: acc.totalHits + (stats.hits || 0),
        totalPasses: acc.totalPasses + (stats.passes || 0),
        totalSacrifices: acc.totalSacrifices + (stats.sacrifices || 0),
        totalCookies: acc.totalCookies + (stats.cookies || 0),
        totalBadges: acc.totalBadges + (student.badges?.length || 0),
        totalGamesPlayed: acc.totalGamesPlayed + (stats.gamesPlayed || 0),
        memberCount: acc.memberCount + 1,
      };
    },
    {
      totalHits: 0,
      totalPasses: 0,
      totalSacrifices: 0,
      totalCookies: 0,
      totalBadges: 0,
      totalGamesPlayed: 0,
      memberCount: 0,
    }
  );

  return memberStats;
}

/**
 * 통계 아이콘과 값을 반환하는 헬퍼
 * 피구(Dodgeball) 용어 사용
 */
export const STAT_ICONS = {
  hits: '🔥',      // 히트 (상대를 맞춤)
  passes: '🤝',    // 패스 (공을 넘김)
  sacrifices: '👼', // 양보 (아웃된 동료 살리기)
  cookies: '🍪',   // 쿠키 (보너스)
  badges: '🏆',    // 배지
} as const;

/**
 * 통계를 아이콘과 함께 포맷
 *
 * @param stats - 통계 객체
 * @returns 아이콘과 값이 포함된 배열
 */
export function formatStatsWithIcons(
  stats: ClassStats | TeamStats | EnrichedStudentStats
): Array<{ icon: string; value: number; label: string }> {
  return [
    {
      icon: STAT_ICONS.hits,
      value: 'totalHits' in stats ? stats.totalHits : stats.hits,
      label: '히트',
    },
    {
      icon: STAT_ICONS.passes,
      value: 'totalPasses' in stats ? stats.totalPasses : stats.passes,
      label: '패스',
    },
    {
      icon: STAT_ICONS.sacrifices,
      value: 'totalSacrifices' in stats ? stats.totalSacrifices : stats.sacrifices,
      label: '양보',
    },
    {
      icon: STAT_ICONS.cookies,
      value: 'totalCookies' in stats ? stats.totalCookies : stats.cookies,
      label: '쿠키',
    },
    {
      icon: STAT_ICONS.badges,
      value: 'totalBadges' in stats ? stats.totalBadges : 'badgeCount' in stats ? stats.badgeCount : 0,
      label: '배지',
    },
  ];
}

// ===== 통합 분석 모달 전용 함수들 (간소화 버전) =====

/**
 * 선수 총점 계산 (1점 체계)
 * 통합 분석 모달에서 사용
 */
export function calculatePlayerPoints(stats: {
  hits?: number;
  passes?: number;
  sacrifices?: number;
  cookies?: number;
}): number {
  if (!stats) return 0;

  return (
    (stats.hits || 0) +
    (stats.passes || 0) +
    (stats.sacrifices || 0) +
    (stats.cookies || 0)
  );
}

/**
 * 반별 점수 집계 (선택된 경기들)
 * 통합 분석 모달에서 사용
 *
 * @param selectedGames - 선택된 완료 경기 목록
 * @param teams - 전체 팀 목록 (className 매핑용)
 * @returns { className: { totalScore, games[] } }
 */
export function aggregateClassScores(
  selectedGames: Array<any>,
  teams: Team[]
): {
  [className: string]: {
    totalScore: number;
    games: string[];
  };
} {
  const classScores: {
    [className: string]: {
      totalScore: number;
      games: string[];
    };
  } = {};

  selectedGames.forEach(game => {
    if (!game.finalScores || !game.teams) return;

    game.teams.forEach((gameTeam: any) => {
      // teams 배열에서 정확한 className 찾기
      const currentTeam = teams.find(t => t.id === gameTeam.teamId);

      // className 우선순위: currentTeam > gameTeam
      const className = currentTeam?.name || gameTeam.name || 'Unknown';

      // 초기화
      if (!classScores[className]) {
        classScores[className] = {
          totalScore: 0,
          games: []
        };
      }

      // 해당 팀의 점수 합산
      const teamScore = game.finalScores[gameTeam.teamId] || 0;
      classScores[className].totalScore += teamScore;

      if (!classScores[className].games.includes(game.id)) {
        classScores[className].games.push(game.id);
      }
    });
  });

  return classScores;
}

/**
 * 선수별 통계 집계 (간소화 버전 - 통합 분석 모달 전용)
 * statsAggregator.ts와 달리 원 소속팀 필터링 없이 모든 경기 포함
 *
 * @param selectedGames - 선택된 경기 목록
 * @param teams - 전체 팀 목록 (className 매핑용)
 * @param students - 전체 학생 목록 (정확한 className 조회용)
 * @returns { playerId: { id, name, className, teamNames, outs, passes, ..., gamesPlayed } }
 */
export function aggregatePlayerStatsForIntegratedAnalysis(
  selectedGames: Array<any>,
  teams: Team[] = [],
  students: Student[] = []
): {
  [playerId: string]: {
    id: string;
    name: string;
    className?: string;
    teamNames: string[];
    hits: number;
    passes: number;
    sacrifices: number;
    cookies: number;
    gamesPlayed: number;
  };
} {
  const playerStatsMap: {
    [playerId: string]: {
      id: string;
      name: string;
      className?: string;
      teamNames: Set<string>;
      hits: number;
      passes: number;
      sacrifices: number;
      cookies: number;
      gamesPlayed: number;
    };
  } = {};

  selectedGames.forEach(game => {
    game.teams.forEach((gameTeam: any) => {
      // teams 배열에서 정확한 className 찾기
      const currentTeam = teams.find(t => t.id === gameTeam.teamId);
      const teamClassName = currentTeam?.name || gameTeam.name;

      // 각 팀원 처리
      gameTeam.members.forEach((member: any) => {
        const playerId = member.studentId;
        if (!playerId) return;

        // records에서 해당 선수의 스탯 찾기
        const playerRecord = game.records.find((r: any) => r.studentId === playerId);
        if (!playerRecord) return;

        // 우선순위: students 배열 > currentTeam.name
        const studentData = students.find(s => s.id === playerId);
        const finalClassName = studentData?.name || teamClassName;

        if (!playerStatsMap[playerId]) {
          playerStatsMap[playerId] = {
            id: playerId,
            name: studentData?.name || `선수${playerId.slice(-4)}`,
            className: finalClassName,
            teamNames: new Set(),
            hits: 0,
            passes: 0,
            sacrifices: 0,
            cookies: 0,
            gamesPlayed: 0
          };
        }

        const stats = playerStatsMap[playerId];

        // className이 비어있으면 업데이트
        if (!stats.className && finalClassName) {
          stats.className = finalClassName;
        }

        // 팀명 추가
        stats.teamNames.add(gameTeam.name);

        stats.hits += playerRecord.hits || 0;
        stats.passes += playerRecord.passes || 0;
        stats.sacrifices += playerRecord.sacrifices || 0;
        stats.cookies += playerRecord.cookies || 0;
        stats.gamesPlayed += 1;
      });
    });
  });

  // Set을 배열로 변환
  const result: {
    [playerId: string]: {
      id: string;
      name: string;
      className?: string;
      teamNames: string[];
      hits: number;
      passes: number;
      sacrifices: number;
      cookies: number;
      gamesPlayed: number;
    };
  } = {};

  Object.entries(playerStatsMap).forEach(([playerId, player]) => {
    result[playerId] = {
      ...player,
      teamNames: Array.from(player.teamNames)
    };
  });

  return result;
}

/**
 * 선수 랭킹 계산
 * 통합 분석 모달에서 사용
 *
 * @param playerStatsMap - aggregatePlayerStatsForIntegratedAnalysis 결과
 * @returns 랭킹 배열 (총점 내림차순)
 */
export function calculatePlayerRanking(playerStatsMap: {
  [playerId: string]: any;
}): Array<any> {
  const players = Object.values(playerStatsMap)
    .map(player => ({
      ...player,
      totalPoints: calculatePlayerPoints(player)
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  // 등수 계산 (학교 성적표 방식 - 연속 등수)
  // 예: 1등(2명) → 다음은 3등 (2등 건너뜀)
  let currentRank = 1;
  players.forEach((player, index) => {
    if (index > 0 && player.totalPoints < players[index - 1].totalPoints) {
      currentRank = index + 1; // 실제 순번 사용
    }
    player.rank = currentRank;
  });

  return players;
}

/**
 * MVP 선정 (공동 MVP 지원)
 * 통합 분석 모달에서 사용
 *
 * @param ranking - calculatePlayerRanking 결과
 * @returns MVP 선수 배열 (동점 시 여러 명)
 */
export function getMVPs(ranking: Array<any>): Array<any> {
  if (!ranking || ranking.length === 0) return [];

  const topScore = ranking[0].totalPoints;
  if (topScore === 0) return [];

  // 1위와 같은 점수를 가진 모든 선수 반환
  return ranking.filter(player => player.totalPoints === topScore);
}
