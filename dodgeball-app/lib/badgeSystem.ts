/**
 * 배지 시스템 - 학생들의 성취를 추적하고 보상
 * DodgeballHub용으로 최적화
 */

import { StudentStats } from '@/types';

// ===== 배지 등급 =====
export const BADGE_TIERS = {
  BEGINNER: 1,    // 입문
  SKILLED: 2,     // 숙련
  MASTER: 3,      // 마스터
  LEGEND: 4,      // 레전드
} as const;

export type BadgeTier = typeof BADGE_TIERS[keyof typeof BADGE_TIERS];

// ===== 배지 인터페이스 =====
export interface BadgeDefinition {
  id: string;
  name: string;
  icon: string;
  tier: BadgeTier;
  description: string;
  condition: (stats: StudentStats) => boolean;
  progress?: (stats: StudentStats) => number;
}

// ===== 배지 정의 =====
export const BADGES: Record<string, BadgeDefinition> = {
  // ===== 입문 배지 (6개) =====
  FIRST_GAME: {
    id: 'first_game',
    name: '첫 출전',
    icon: '🎽',
    tier: BADGE_TIERS.BEGINNER,
    description: '첫 경기 참여를 축하합니다!',
    condition: (stats) => stats.gamesPlayed >= 1
  },
  FIRST_OUT: {
    id: 'first_out',
    name: '첫 아웃',
    icon: '🎯',
    tier: BADGE_TIERS.BEGINNER,
    description: '첫 아웃을 기록했습니다!',
    condition: (stats) => stats.outs >= 1
  },
  FIRST_PASS: {
    id: 'first_pass',
    name: '첫 패스',
    icon: '🤝',
    tier: BADGE_TIERS.BEGINNER,
    description: '첫 패스를 성공했습니다!',
    condition: (stats) => stats.passes >= 1
  },
  FIRST_SACRIFICE: {
    id: 'first_sacrifice',
    name: '첫 양보',
    icon: '💚',
    tier: BADGE_TIERS.BEGINNER,
    description: '첫 양보를 했습니다!',
    condition: (stats) => stats.sacrifices >= 1
  },
  FIRST_COOKIE: {
    id: 'first_cookie',
    name: '첫 쿠키',
    icon: '🍪',
    tier: BADGE_TIERS.BEGINNER,
    description: '첫 보너스 쿠키를 받았습니다!',
    condition: (stats) => stats.cookies >= 1
  },
  FIRST_POINT: {
    id: 'first_point',
    name: '첫 득점',
    icon: '⭐',
    tier: BADGE_TIERS.BEGINNER,
    description: '첫 종합 점수를 획득했습니다!',
    condition: (stats) => stats.totalScore >= 1
  },

  // ===== 숙련 배지 (5개) =====
  STEADY_PLAYER: {
    id: 'steady_player',
    name: '꾸준함',
    icon: '💪',
    tier: BADGE_TIERS.SKILLED,
    description: '5경기 출전!',
    condition: (stats) => stats.gamesPlayed >= 5,
    progress: (stats) => Math.min(100, (stats.gamesPlayed / 5) * 100)
  },
  FIRE_SHOOTER: {
    id: 'fire_shooter',
    name: '불꽃 슈터',
    icon: '🔥',
    tier: BADGE_TIERS.SKILLED,
    description: '아웃 10개 달성!',
    condition: (stats) => stats.outs >= 10,
    progress: (stats) => Math.min(100, (stats.outs / 10) * 100)
  },
  PASS_MASTER: {
    id: 'pass_master',
    name: '패스의 달인',
    icon: '🤝',
    tier: BADGE_TIERS.SKILLED,
    description: '패스 20개 달성!',
    condition: (stats) => stats.passes >= 20,
    progress: (stats) => Math.min(100, (stats.passes / 20) * 100)
  },
  KIND_HEART: {
    id: 'kind_heart',
    name: '배려왕',
    icon: '💚',
    tier: BADGE_TIERS.SKILLED,
    description: '양보 10개 달성!',
    condition: (stats) => stats.sacrifices >= 10,
    progress: (stats) => Math.min(100, (stats.sacrifices / 10) * 100)
  },
  COOKIE_COLLECTOR: {
    id: 'cookie_collector',
    name: '쿠키 수집가',
    icon: '🍪💰',
    tier: BADGE_TIERS.SKILLED,
    description: '쿠키 30개 수집!',
    condition: (stats) => stats.cookies >= 30,
    progress: (stats) => Math.min(100, (stats.cookies / 30) * 100)
  },

  // ===== 마스터 배지 (5개) =====
  IRON_PLAYER: {
    id: 'iron_player',
    name: '철인',
    icon: '🦾',
    tier: BADGE_TIERS.MASTER,
    description: '10경기 출전!',
    condition: (stats) => stats.gamesPlayed >= 10,
    progress: (stats) => Math.min(100, (stats.gamesPlayed / 10) * 100)
  },
  FIRE_SNIPER: {
    id: 'fire_sniper',
    name: '화염 저격수',
    icon: '🎯🔥',
    tier: BADGE_TIERS.MASTER,
    description: '아웃 30개 달성!',
    condition: (stats) => stats.outs >= 30,
    progress: (stats) => Math.min(100, (stats.outs / 30) * 100)
  },
  COOPERATION_MASTER: {
    id: 'cooperation_master',
    name: '협동의 마스터',
    icon: '🏅',
    tier: BADGE_TIERS.MASTER,
    description: '패스 50개 달성!',
    condition: (stats) => stats.passes >= 50,
    progress: (stats) => Math.min(100, (stats.passes / 50) * 100)
  },
  ANGEL_HEART: {
    id: 'angel_heart',
    name: '천사의 심장',
    icon: '😇',
    tier: BADGE_TIERS.MASTER,
    description: '양보 25개 달성!',
    condition: (stats) => stats.sacrifices >= 25,
    progress: (stats) => Math.min(100, (stats.sacrifices / 25) * 100)
  },
  COOKIE_RICH: {
    id: 'cookie_rich',
    name: '쿠키 부자',
    icon: '💰🍪',
    tier: BADGE_TIERS.MASTER,
    description: '쿠키 100개 수집!',
    condition: (stats) => stats.cookies >= 100,
    progress: (stats) => Math.min(100, (stats.cookies / 100) * 100)
  },

  // ===== 레전드 배지 (2개) =====
  LEGEND_PLAYER: {
    id: 'legend_player',
    name: '불멸의 선수',
    icon: '💎',
    tier: BADGE_TIERS.LEGEND,
    description: '20경기 출전!',
    condition: (stats) => stats.gamesPlayed >= 20,
    progress: (stats) => Math.min(100, (stats.gamesPlayed / 20) * 100)
  },
  LEGENDARY_CATCHER: {
    id: 'legendary_catcher',
    name: '전설의 포수',
    icon: '👑🔥',
    tier: BADGE_TIERS.LEGEND,
    description: '아웃 50개 달성!',
    condition: (stats) => stats.outs >= 50,
    progress: (stats) => Math.min(100, (stats.outs / 50) * 100)
  },

  // ===== 특별 배지 (3개) =====
  PERFECT_TEAMPLAYER: {
    id: 'perfect_teamplayer',
    name: '완벽한 팀원',
    icon: '⭐',
    tier: BADGE_TIERS.MASTER,
    description: '아웃 20 + 패스 20 + 양보 10 달성!',
    condition: (stats) =>
      stats.outs >= 20 &&
      stats.passes >= 20 &&
      stats.sacrifices >= 10
  },
  GAME_ENTHUSIAST: {
    id: 'game_enthusiast',
    name: '경기광',
    icon: '🏃',
    tier: BADGE_TIERS.LEGEND,
    description: '참여 50경기!',
    condition: (stats) => stats.gamesPlayed >= 50,
    progress: (stats) => Math.min(100, (stats.gamesPlayed / 50) * 100)
  },
  COOKIE_TYCOON: {
    id: 'cookie_tycoon',
    name: '쿠키 재벌',
    icon: '💰',
    tier: BADGE_TIERS.LEGEND,
    description: '쿠키 200개 수집!',
    condition: (stats) => stats.cookies >= 200,
    progress: (stats) => Math.min(100, (stats.cookies / 200) * 100)
  }
};

// ===== 핵심 함수 =====

/**
 * 새로 획득한 배지 체크
 * @param playerStats - 선수의 누적 통계
 * @param currentBadgeIds - 현재 보유한 배지 ID 배열
 * @returns 새로 획득한 배지 배열
 */
export function checkNewBadges(
  playerStats: StudentStats,
  currentBadgeIds: string[] = []
): BadgeDefinition[] {
  const newBadges: BadgeDefinition[] = [];

  Object.values(BADGES).forEach(badge => {
    // 이미 가지고 있지 않고, 조건을 만족하는 배지
    if (!currentBadgeIds.includes(badge.id) && badge.condition(playerStats)) {
      newBadges.push(badge);
    }
  });

  return newBadges;
}

/**
 * 배지 진행도 계산
 * @param playerStats - 선수의 누적 통계
 * @param badgeId - 배지 ID
 * @returns 진행도 (0-100) 또는 null (진행도 함수가 없는 경우)
 */
export function getBadgeProgress(
  playerStats: StudentStats,
  badgeId: string
): number | null {
  const badge = Object.values(BADGES).find(b => b.id === badgeId);
  if (!badge || !badge.progress) return null;

  return badge.progress(playerStats);
}

/**
 * 획득 가능한 다음 배지 추천 (진행도 높은 순)
 * @param playerStats - 선수의 누적 통계
 * @param currentBadgeIds - 현재 보유한 배지 ID 배열
 * @returns 추천 배지 배열 (최대 3개)
 */
export function getRecommendedBadges(
  playerStats: StudentStats,
  currentBadgeIds: string[] = []
): (BadgeDefinition & { progressPercent: number })[] {
  const notOwnedBadges = Object.values(BADGES).filter(
    badge => !currentBadgeIds.includes(badge.id) && badge.progress
  );

  return notOwnedBadges
    .map(badge => ({
      ...badge,
      progressPercent: badge.progress!(playerStats)
    }))
    .sort((a, b) => b.progressPercent - a.progressPercent)
    .slice(0, 3);
}

/**
 * 등급별 배지 개수 카운트
 * @param badgeIds - 보유한 배지 ID 배열
 * @returns 등급별 배지 개수
 */
export function countBadgesByTier(badgeIds: string[] = []): Record<string, number> {
  const counts = {
    beginner: 0,
    skilled: 0,
    master: 0,
    legend: 0
  };

  badgeIds.forEach(badgeId => {
    const badge = Object.values(BADGES).find(b => b.id === badgeId);
    if (!badge) return;

    switch(badge.tier) {
      case BADGE_TIERS.BEGINNER:
        counts.beginner++;
        break;
      case BADGE_TIERS.SKILLED:
        counts.skilled++;
        break;
      case BADGE_TIERS.MASTER:
        counts.master++;
        break;
      case BADGE_TIERS.LEGEND:
        counts.legend++;
        break;
    }
  });

  return counts;
}

/**
 * 배지 ID로 배지 객체 가져오기
 * @param badgeId - 배지 ID
 * @returns 배지 객체 또는 null
 */
export function getBadgeById(badgeId: string): BadgeDefinition | null {
  return Object.values(BADGES).find(b => b.id === badgeId) || null;
}

/**
 * 모든 배지 목록 가져오기
 * @returns 모든 배지 배열
 */
export function getAllBadges(): BadgeDefinition[] {
  return Object.values(BADGES);
}
