/**
 * teamStatsCalculator.ts
 * 팀별 통계를 계산하는 유틸리티 함수
 * classStatsCalculator의 로직을 팀 단위로 재사용
 */

import { Team, TeamMemberAssignment } from '@/types';
import { getPlayerHistory } from './dataService';

/**
 * 팀 통계 인터페이스
 */
export interface TeamStats {
  totalOuts: number;
  totalPasses: number;
  totalSacrifices: number;
  totalCookies: number;
  totalBadges: number;
}

/**
 * 단일 팀의 통계를 계산
 * playerHistory에서만 가져옴 (진행 중인 경기 제외)
 *
 * @param teacherId - 선생님 ID
 * @param teamMembers - 팀 라인업 멤버 배열
 * @returns TeamStats
 */
export const calculateTeamStats = async (
  teacherId: string,
  teamMembers: TeamMemberAssignment[]
): Promise<TeamStats> => {
  try {
    if (!teamMembers || teamMembers.length === 0) {
      return {
        totalOuts: 0,
        totalPasses: 0,
        totalSacrifices: 0,
        totalCookies: 0,
        totalBadges: 0
      };
    }

    // 병렬 처리로 속도 개선
    const promises = teamMembers.map(async (member) => {
      const playerId = member.studentId;
      console.log('🔍 [teamStatsCalculator] 선수 처리:', { member, playerId });

      // playerHistory에서 스탯 가져오기 (진행 중인 경기 제외)
      const history = await getPlayerHistory(teacherId, playerId);

      let stats = {
        outs: 0,
        passes: 0,
        sacrifices: 0,
        cookies: 0,
        badges: 0
      };

      if (history && history.games) {
        // 완료된 경기만 집계 (진행 중인 경기는 제외)
        // Set을 사용하여 중복 배지 방지
        const uniqueBadges = new Set<string>();

        history.games.forEach(game => {
          if (game.stats) {
            stats.outs += game.stats.outs || 0;
            stats.passes += game.stats.passes || 0;
            stats.sacrifices += game.stats.sacrifices || 0;
            stats.cookies += game.stats.cookies || 0;
          }

          // 각 게임에서 획득한 배지 집계
          if (game.newBadges && Array.isArray(game.newBadges)) {
            game.newBadges.forEach(badgeId => {
              uniqueBadges.add(badgeId);
            });
          }
        });

        stats.badges = uniqueBadges.size;
        console.log('🏆 [teamStatsCalculator] 배지 집계 완료:', {
          playerId,
          badgeCount: stats.badges,
          uniqueBadges: Array.from(uniqueBadges)
        });
      }

      return stats;
    });

    const results = await Promise.all(promises);

    // 팀 전체 합계 계산
    const teamTotal = results.reduce(
      (acc, stats) => ({
        totalOuts: acc.totalOuts + stats.outs,
        totalPasses: acc.totalPasses + stats.passes,
        totalSacrifices: acc.totalSacrifices + stats.sacrifices,
        totalCookies: acc.totalCookies + stats.cookies,
        totalBadges: acc.totalBadges + stats.badges
      }),
      {
        totalOuts: 0,
        totalPasses: 0,
        totalSacrifices: 0,
        totalCookies: 0,
        totalBadges: 0
      }
    );

    console.log('📊 [teamStatsCalculator] 팀 통계 계산 완료:', teamTotal);

    return teamTotal;
  } catch (error) {
    console.error('❌ [teamStatsCalculator] 팀 통계 계산 실패:', error);
    return {
      totalOuts: 0,
      totalPasses: 0,
      totalSacrifices: 0,
      totalCookies: 0,
      totalBadges: 0
    };
  }
};

/**
 * 모든 팀의 통계를 계산
 *
 * @param teacherId - 선생님 ID
 * @param teams - 전체 팀 배열
 * @returns { [teamId]: TeamStats }
 */
export const calculateAllTeamStats = async (
  teacherId: string,
  teams: Team[]
): Promise<{ [teamId: string]: TeamStats }> => {
  try {
    if (!teams || teams.length === 0) {
      return {};
    }

    // 병렬 처리로 모든 팀의 스탯 계산
    const promises = teams.map(async (team) => {
      const teamMembers = team.members || [];
      const stats = await calculateTeamStats(teacherId, teamMembers);
      return { teamId: team.id, stats };
    });

    const results = await Promise.all(promises);

    // teamId를 키로 하는 객체로 변환
    const teamStatsObject: { [teamId: string]: TeamStats } = {};
    results.forEach(result => {
      if (result) {
        teamStatsObject[result.teamId] = result.stats;
      }
    });

    console.log('📊 [teamStatsCalculator] 모든 팀 통계 계산 완료:', teamStatsObject);

    return teamStatsObject;
  } catch (error) {
    console.error('❌ [teamStatsCalculator] 전체 팀 통계 계산 실패:', error);
    return {};
  }
};
