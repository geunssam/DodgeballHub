/**
 * 배지 카테고리 시스템
 * 배지를 논리적 그룹으로 분류하여 관리
 */

import { BadgeDefinition } from './badgeSystem';

// ===== 배지 카테고리 정의 =====
export interface BadgeCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  badgeIds: string[];
  color: string; // Tailwind color class
}

export const BADGE_CATEGORIES: Record<string, BadgeCategory> = {
  GAMES: {
    id: 'games',
    name: '경기 참여',
    icon: '📊',
    description: '경기 출전 관련 배지',
    badgeIds: [
      'first_game',
      'steady_player',
      'iron_player',
      'legend_player'
    ],
    color: 'blue'
  },
  HITS: {
    id: 'hits',
    name: '히트',
    icon: '🎯',
    description: '상대 히트 관련 배지',
    badgeIds: [
      'first_hit',
      'fire_shooter',
      'fire_sniper',
      'legendary_catcher'
    ],
    color: 'red'
  },
  PASSES: {
    id: 'passes',
    name: '패스',
    icon: '🤝',
    description: '패스 성공 관련 배지',
    badgeIds: [
      'first_pass',
      'pass_master',
      'cooperation_master',
      'pass_legend'
    ],
    color: 'green'
  },
  SACRIFICES: {
    id: 'sacrifices',
    name: '양보',
    icon: '💚',
    description: '양보 관련 배지',
    badgeIds: [
      'first_sacrifice',
      'kind_heart',
      'angel_heart',
      'sacrifice_legend'
    ],
    color: 'purple'
  },
  COOKIES: {
    id: 'cookies',
    name: '쿠키',
    icon: '🍪',
    description: '보너스 쿠키 관련 배지',
    badgeIds: [
      'first_cookie',
      'cookie_collector',
      'cookie_rich',
      'cookie_tycoon'
    ],
    color: 'yellow'
  },
  SPECIAL: {
    id: 'special',
    name: '특별',
    icon: '⭐',
    description: '종합 성취 배지',
    badgeIds: [
      'first_point',
      'perfect_teamplayer'
    ],
    color: 'orange'
  }
};

// ===== 헬퍼 함수 =====

/**
 * 배지 ID로 카테고리 찾기
 * @param badgeId - 배지 ID
 * @returns 해당 배지가 속한 카테고리 또는 null
 */
export function getBadgeCategory(badgeId: string): BadgeCategory | null {
  for (const category of Object.values(BADGE_CATEGORIES)) {
    if (category.badgeIds.includes(badgeId)) {
      return category;
    }
  }
  return null;
}

/**
 * 카테고리별로 배지 그룹화
 * @param badges - 배지 배열
 * @returns 카테고리별 배지 맵
 */
export function groupBadgesByCategory(
  badges: BadgeDefinition[]
): Map<string, BadgeDefinition[]> {
  const grouped = new Map<string, BadgeDefinition[]>();

  // 모든 카테고리를 빈 배열로 초기화
  Object.values(BADGE_CATEGORIES).forEach(category => {
    grouped.set(category.id, []);
  });

  // 배지를 카테고리별로 분류
  badges.forEach(badge => {
    const category = getBadgeCategory(badge.id);
    if (category) {
      const categoryBadges = grouped.get(category.id) || [];
      categoryBadges.push(badge);
      grouped.set(category.id, categoryBadges);
    }
  });

  return grouped;
}

/**
 * 카테고리 내에서 다음 획득 가능한 배지 찾기
 * @param categoryId - 카테고리 ID
 * @param currentBadgeIds - 현재 보유한 배지 ID 배열
 * @param allBadges - 모든 배지 객체 맵
 * @returns 다음 배지 또는 null (모두 획득한 경우)
 */
export function getNextBadgeInCategory(
  categoryId: string,
  currentBadgeIds: string[],
  allBadges: Record<string, BadgeDefinition>
): BadgeDefinition | null {
  const category = BADGE_CATEGORIES[categoryId.toUpperCase()];
  if (!category) return null;

  // 카테고리 내 아직 획득하지 않은 배지 찾기
  for (const badgeId of category.badgeIds) {
    if (!currentBadgeIds.includes(badgeId)) {
      return allBadges[badgeId] || null;
    }
  }

  return null; // 모든 배지 획득 완료
}

/**
 * 카테고리별 획득률 계산
 * @param categoryId - 카테고리 ID
 * @param currentBadgeIds - 현재 보유한 배지 ID 배열
 * @returns 획득률 (0-100)
 */
export function getCategoryCompletionRate(
  categoryId: string,
  currentBadgeIds: string[]
): number {
  const category = BADGE_CATEGORIES[categoryId.toUpperCase()];
  if (!category || category.badgeIds.length === 0) return 0;

  const ownedCount = category.badgeIds.filter(badgeId =>
    currentBadgeIds.includes(badgeId)
  ).length;

  return Math.round((ownedCount / category.badgeIds.length) * 100);
}

/**
 * 모든 카테고리의 획득률 계산
 * @param currentBadgeIds - 현재 보유한 배지 ID 배열
 * @returns 카테고리별 획득률 맵
 */
export function getAllCategoryCompletionRates(
  currentBadgeIds: string[]
): Record<string, number> {
  const rates: Record<string, number> = {};

  Object.keys(BADGE_CATEGORIES).forEach(categoryKey => {
    rates[categoryKey.toLowerCase()] = getCategoryCompletionRate(
      categoryKey,
      currentBadgeIds
    );
  });

  return rates;
}

/**
 * 카테고리별 배지 개수
 * @returns 카테고리별 전체 배지 개수
 */
export function getCategoryBadgeCounts(): Record<string, number> {
  const counts: Record<string, number> = {};

  Object.entries(BADGE_CATEGORIES).forEach(([key, category]) => {
    counts[key.toLowerCase()] = category.badgeIds.length;
  });

  return counts;
}

/**
 * 카테고리 색상 클래스 가져오기
 * @param categoryId - 카테고리 ID
 * @param type - 색상 타입 ('bg' | 'text' | 'border' | 'ring')
 * @returns Tailwind 색상 클래스
 */
export function getCategoryColorClass(
  categoryId: string,
  type: 'bg' | 'text' | 'border' | 'ring' = 'bg'
): string {
  const category = BADGE_CATEGORIES[categoryId.toUpperCase()];
  if (!category) return `${type}-gray-500`;

  const colorMap: Record<string, Record<string, string>> = {
    blue: {
      bg: 'bg-blue-500',
      text: 'text-blue-600',
      border: 'border-blue-500',
      ring: 'ring-blue-500'
    },
    red: {
      bg: 'bg-red-500',
      text: 'text-red-600',
      border: 'border-red-500',
      ring: 'ring-red-500'
    },
    green: {
      bg: 'bg-green-500',
      text: 'text-green-600',
      border: 'border-green-500',
      ring: 'ring-green-500'
    },
    purple: {
      bg: 'bg-purple-500',
      text: 'text-purple-600',
      border: 'border-purple-500',
      ring: 'ring-purple-500'
    },
    yellow: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-600',
      border: 'border-yellow-500',
      ring: 'ring-yellow-500'
    },
    orange: {
      bg: 'bg-orange-500',
      text: 'text-orange-600',
      border: 'border-orange-500',
      ring: 'ring-orange-500'
    }
  };

  return colorMap[category.color]?.[type] || `${type}-gray-500`;
}
