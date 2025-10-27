/**
 * 배지 관련 LocalStorage 헬퍼 함수
 */

import { BADGES, BadgeDefinition } from './badgeSystem';
import { CustomBadge } from '@/types';

const STORAGE_KEYS = {
  CUSTOM_BADGES: 'dodgeball_custom_badges',
  HIDDEN_BADGES: 'dodgeball_hidden_badges'
} as const;

/**
 * localStorage에서 커스텀 배지 불러오기
 */
export function loadCustomBadges(): CustomBadge[] {
  if (typeof window === 'undefined') return [];

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_BADGES);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load custom badges:', error);
    return [];
  }
}

/**
 * localStorage에서 숨긴 배지 ID 목록 불러오기
 */
export function loadHiddenBadges(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HIDDEN_BADGES);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load hidden badges:', error);
    return [];
  }
}

/**
 * 커스텀 배지를 localStorage에 저장
 */
export function saveCustomBadges(badges: CustomBadge[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_BADGES, JSON.stringify(badges));
  } catch (error) {
    console.error('Failed to save custom badges:', error);
  }
}

/**
 * 숨긴 배지를 localStorage에 저장
 */
export function saveHiddenBadges(badgeIds: string[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.HIDDEN_BADGES, JSON.stringify(badgeIds));
  } catch (error) {
    console.error('Failed to save hidden badges:', error);
  }
}

/**
 * 모든 배지 가져오기 (기본 + 커스텀 - 숨김)
 *
 * @param customBadges - 커스텀 배지 배열 (옵션)
 * @param hiddenBadgeIds - 숨긴 배지 ID 배열 (옵션)
 * @returns 배지 객체 { badgeId: badge, ... }
 */
export function getAllBadges(
  customBadges?: CustomBadge[],
  hiddenBadgeIds?: string[]
): Record<string, BadgeDefinition | CustomBadge> {
  const custom = customBadges || loadCustomBadges();
  const hidden = hiddenBadgeIds || loadHiddenBadges();

  const allBadges: Record<string, BadgeDefinition | CustomBadge> = {};

  // 기본 배지 중 숨기지 않은 것만 추가
  Object.entries(BADGES).forEach(([key, badge]) => {
    if (!hidden.includes(key) && !hidden.includes(badge.id)) {
      allBadges[badge.id] = badge;
    }
  });

  // 커스텀 배지 추가 (CustomBadge를 BadgeDefinition 형식으로 변환)
  custom.forEach(badge => {
    allBadges[badge.id] = {
      id: badge.id,
      name: badge.name,
      icon: badge.emoji,
      tier: 5, // 커스텀 배지는 특별 등급
      description: badge.description,
      condition: () => false // 커스텀 배지는 수동 수여만 가능
    };
  });

  return allBadges;
}

/**
 * localStorage에서 모든 배지 데이터 로드
 *
 * @returns 커스텀 배지, 숨김 배지, 전체 배지
 */
export function loadAllBadgeData() {
  const customBadges = loadCustomBadges();
  const hiddenBadges = loadHiddenBadges();
  const allBadges = getAllBadges(customBadges, hiddenBadges);

  return {
    customBadges,
    hiddenBadges,
    allBadges
  };
}
