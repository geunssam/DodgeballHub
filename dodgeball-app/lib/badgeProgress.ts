/**
 * 배지 진행도 계산 유틸리티
 */

import { StudentStats } from '@/types';
import { BADGES, BadgeDefinition } from './badgeSystem';

export interface BadgeProgressData {
  badge: BadgeDefinition;
  progress: number;      // 진행도 (0-100)
  current: number;       // 현재 값
  target: number;        // 목표 값
  category: string;      // 카테고리 ID
}

/**
 * 배지의 카테고리 추정
 */
function getBadgeCategory(badgeId: string): string {
  if (badgeId.includes('game') || badgeId.includes('steady') || badgeId.includes('iron') || badgeId.includes('legend_player') || badgeId.includes('enthusiast')) {
    return 'games';
  }
  if (badgeId.includes('out') || badgeId.includes('fire') || badgeId.includes('sniper') || badgeId.includes('catcher')) {
    return 'outs';
  }
  if (badgeId.includes('pass') || badgeId.includes('cooperation')) {
    return 'passes';
  }
  if (badgeId.includes('sacrifice') || badgeId.includes('kind') || badgeId.includes('angel')) {
    return 'sacrifices';
  }
  if (badgeId.includes('cookie') || badgeId.includes('tycoon')) {
    return 'cookies';
  }
  return 'special';
}

/**
 * 배지의 목표치 계산
 */
function calculateTarget(badge: BadgeDefinition, _stats: StudentStats): number {
  // 입문 배지 (first_로 시작)
  if (badge.id.startsWith('first_')) return 1;

  // 경기 수
  if (badge.id === 'steady_player') return 5;
  if (badge.id === 'iron_player') return 10;
  if (badge.id === 'legend_player') return 20;
  if (badge.id === 'game_enthusiast') return 50;

  // 아웃
  if (badge.id === 'fire_shooter') return 10;
  if (badge.id === 'fire_sniper') return 30;
  if (badge.id === 'legendary_catcher') return 50;

  // 패스
  if (badge.id === 'pass_master') return 20;
  if (badge.id === 'cooperation_master') return 50;

  // 양보
  if (badge.id === 'kind_heart') return 10;
  if (badge.id === 'angel_heart') return 25;

  // 쿠키
  if (badge.id === 'cookie_collector') return 30;
  if (badge.id === 'cookie_rich') return 100;
  if (badge.id === 'cookie_tycoon') return 200;

  // 특별 배지
  if (badge.id === 'perfect_teamplayer') return 20; // 대표값 (아웃 기준)

  return 10; // 기본값
}

/**
 * 배지의 현재 진행 상황 계산
 */
function calculateCurrent(badge: BadgeDefinition, stats: StudentStats): number {
  const category = getBadgeCategory(badge.id);

  switch (category) {
    case 'games':
      return stats.gamesPlayed;
    case 'outs':
      return stats.hits;
    case 'passes':
      return stats.passes;
    case 'sacrifices':
      return stats.sacrifices;
    case 'cookies':
      return stats.cookies;
    case 'special':
      // 특별 배지는 조건에 따라 다름
      if (badge.id === 'perfect_teamplayer') {
        // 최소값 반환 (가장 부족한 스탯)
        return Math.min(
          stats.hits,
          stats.passes,
          Math.floor(stats.sacrifices * 2) // 양보는 목표가 10이므로 2배
        );
      }
      return stats.totalScore;
    default:
      return 0;
  }
}

/**
 * 선수의 다음 획득 가능한 배지들의 진행도를 계산
 *
 * @param stats - 선수의 누적 통계
 * @param currentBadgeIds - 현재 보유한 배지 ID 배열
 * @param onlyNextInCategory - true면 각 카테고리별로 바로 다음 배지만 표시
 * @returns 진행 중인 배지 목록
 */
export function getNextBadgesProgress(
  stats: StudentStats,
  currentBadgeIds: string[] = [],
  onlyNextInCategory: boolean = false
): BadgeProgressData[] {
  const progressList: BadgeProgressData[] = [];

  Object.values(BADGES).forEach(badge => {
    // 이미 획득한 배지는 제외
    if (currentBadgeIds.includes(badge.id)) {
      return;
    }

    // 이미 조건을 만족하면 제외 (곧 획득될 배지)
    if (badge.condition(stats)) {
      return;
    }

    const category = getBadgeCategory(badge.id);
    const target = calculateTarget(badge, stats);
    const current = calculateCurrent(badge, stats);

    // progress 함수가 있는 배지
    if (typeof badge.progress === 'function') {
      const progressPercent = badge.progress(stats);

      // 진행도가 0보다 크면 목록에 추가
      if (progressPercent > 0) {
        progressList.push({
          badge,
          progress: progressPercent,
          current,
          target,
          category
        });
      }
    } else {
      // progress 함수가 없는 입문 배지 - 진행도 0%로 표시
      if (current > 0) {
        progressList.push({
          badge,
          progress: 0,
          current,
          target,
          category
        });
      }
    }
  });

  // onlyNextInCategory가 true면 각 카테고리별로 가장 진행도가 높은 배지만 남김
  if (onlyNextInCategory) {
    const categoryMap = new Map<string, BadgeProgressData>();

    progressList.forEach(item => {
      const existing = categoryMap.get(item.category);
      if (!existing || item.progress > existing.progress) {
        categoryMap.set(item.category, item);
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.progress - a.progress);
  }

  // 진행도 높은 순으로 정렬
  return progressList.sort((a, b) => b.progress - a.progress);
}

/**
 * 특정 배지의 진행도만 계산
 *
 * @param badge - 배지 객체
 * @param stats - 선수의 누적 통계
 * @returns 진행도 데이터 또는 null
 */
export function getSingleBadgeProgress(
  badge: BadgeDefinition,
  stats: StudentStats
): BadgeProgressData | null {
  if (typeof badge.progress !== 'function') {
    return null;
  }

  const progressPercent = badge.progress(stats);
  const current = calculateCurrent(badge, stats);
  const target = calculateTarget(badge, stats);
  const category = getBadgeCategory(badge.id);

  return {
    badge,
    progress: progressPercent,
    current,
    target,
    category
  };
}
