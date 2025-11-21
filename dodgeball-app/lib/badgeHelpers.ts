/**
 * 배지 관련 LocalStorage 헬퍼 함수
 */

import { BADGES, BadgeDefinition } from './badgeSystem';
import { CustomBadge, Student, StudentStats, Badge } from '@/types';
import { getStudentById, updateStudent } from './dataService';

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

/**
 * 새 커스텀 배지 생성
 */
export function createCustomBadge(
  teacherId: string,
  name: string,
  emoji: string,
  description: string
): CustomBadge {
  const customBadges = loadCustomBadges();

  const newBadge: CustomBadge = {
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    teacherId,
    name,
    emoji,
    description,
    createdAt: new Date().toISOString(),
  };

  customBadges.push(newBadge);
  saveCustomBadges(customBadges);

  return newBadge;
}

/**
 * 커스텀 배지 삭제
 */
export function deleteCustomBadge(badgeId: string): boolean {
  const customBadges = loadCustomBadges();
  const filteredBadges = customBadges.filter(badge => badge.id !== badgeId);

  if (filteredBadges.length === customBadges.length) {
    return false; // 배지를 찾지 못함
  }

  saveCustomBadges(filteredBadges);
  return true;
}

/**
 * 배지 표시/숨김 토글
 */
export function toggleBadgeVisibility(badgeId: string): void {
  const hiddenBadges = loadHiddenBadges();

  const index = hiddenBadges.indexOf(badgeId);
  if (index > -1) {
    // 이미 숨김 목록에 있으면 제거 (표시)
    hiddenBadges.splice(index, 1);
  } else {
    // 숨김 목록에 없으면 추가 (숨김)
    hiddenBadges.push(badgeId);
  }

  saveHiddenBadges(hiddenBadges);
}

/**
 * 배지가 숨김 상태인지 확인
 */
export function isBadgeHidden(badgeId: string): boolean {
  const hiddenBadges = loadHiddenBadges();
  return hiddenBadges.includes(badgeId);
}

/**
 * 모든 숨김 배지 초기화
 */
export function clearHiddenBadges(): void {
  saveHiddenBadges([]);
}

/**
 * 모든 커스텀 배지 삭제
 */
export function clearCustomBadges(): void {
  saveCustomBadges([]);
}

/**
 * 학생의 통계를 기반으로 자동 배지를 체크하고 수여
 *
 * @param student - 학생 데이터
 * @param gameStats - 이번 경기에서 얻은 스탯 (경기 종료 시 누적 전 스탯)
 * @param gameId - 경기 ID
 * @returns 수여된 배지 배열과 업데이트된 학생 객체
 */
export async function checkAndAwardBadges(
  student: Student,
  gameStats: {
    hits: number;
    passes: number;
    sacrifices: number;
    cookies: number;
  },
  gameId: string
): Promise<{
  awardedBadges: Badge[];
  updatedStudent: Student;
}> {
  const awardedBadges: Badge[] = [];

  // 이번 경기 스탯을 더한 누적 통계 (업데이트 전)
  const newTotalStats: StudentStats = {
    hits: student.stats.hits + gameStats.hits,
    passes: student.stats.passes + gameStats.passes,
    sacrifices: student.stats.sacrifices + gameStats.sacrifices,
    cookies: student.stats.cookies + gameStats.cookies,
    gamesPlayed: student.stats.gamesPlayed + 1,
    totalScore: 0 // 아래에서 계산
  };

  newTotalStats.totalScore =
    newTotalStats.hits +
    newTotalStats.passes +
    newTotalStats.sacrifices +
    newTotalStats.cookies;

  // 현재 보유한 배지 ID 목록
  const ownedBadgeIds = student.badges.map((b) => b.id);

  // 모든 배지 체크
  for (const badge of Object.values(BADGES)) {
    // 이미 보유한 배지는 스킵
    if (ownedBadgeIds.includes(badge.id)) {
      continue;
    }

    // 조건 체크
    if (badge.condition(newTotalStats)) {
      const newBadge: Badge = {
        id: badge.id,
        name: badge.name,
        emoji: badge.icon,
        awardedAt: new Date().toISOString(),
        isAuto: true,
        reason: `${badge.description} (경기 ID: ${gameId})`
      };

      awardedBadges.push(newBadge);
      console.log(`🏆 [checkAndAwardBadges] ${student.name}에게 배지 수여: ${badge.name}`);
    }
  }

  // 학생 객체 업데이트 (배지 추가)
  const updatedStudent: Student = {
    ...student,
    badges: [...student.badges, ...awardedBadges]
  };

  // 데이터베이스에 저장 (배지만 업데이트 - 스탯은 별도로 업데이트됨)
  if (awardedBadges.length > 0) {
    await updateStudent(student.id, {
      badges: updatedStudent.badges
    });
  }

  return {
    awardedBadges,
    updatedStudent
  };
}

/**
 * 학생의 현재 누적 통계를 기반으로 배지를 재계산하고 수여 (소급 적용)
 * 기존 학생들의 배지를 일괄 업데이트할 때 사용
 *
 * @param student - 학생 데이터
 * @returns 수여된 배지 배열과 업데이트된 학생 객체
 */
export async function recalculateAndAwardBadges(
  student: Student
): Promise<{
  awardedBadges: Badge[];
  updatedStudent: Student;
}> {
  const awardedBadges: Badge[] = [];

  // 현재 누적 통계 사용
  const currentStats: StudentStats = student.stats;

  // 현재 보유한 배지 ID 목록
  const ownedBadgeIds = student.badges.map((b) => b.id);

  console.log(`🔍 [recalculateAndAwardBadges] ${student.name} 배지 재계산 시작`);
  console.log(`   현재 스탯:`, currentStats);
  console.log(`   보유 배지 (${ownedBadgeIds.length}개):`, ownedBadgeIds);

  // 모든 배지 체크
  for (const badge of Object.values(BADGES)) {
    // 이미 보유한 배지는 스킵
    if (ownedBadgeIds.includes(badge.id)) {
      continue;
    }

    // 조건 체크
    if (badge.condition(currentStats)) {
      const newBadge: Badge = {
        id: badge.id,
        name: badge.name,
        emoji: badge.icon,
        tier: badge.tier,
        awardedAt: new Date().toISOString(),
        isAuto: true,
        reason: `${badge.description} (소급 적용)`
      };

      awardedBadges.push(newBadge);
      console.log(`   ✅ 새 배지 발견: ${badge.name}`);
    }
  }

  console.log(`   총 ${awardedBadges.length}개 배지 수여`);

  // 학생 객체 업데이트 (배지 추가)
  const updatedStudent: Student = {
    ...student,
    badges: [...student.badges, ...awardedBadges]
  };

  // 데이터베이스에 저장
  if (awardedBadges.length > 0) {
    await updateStudent(student.id, {
      badges: updatedStudent.badges
    });
    console.log(`   💾 ${student.name} 배지 저장 완료`);
  }

  return {
    awardedBadges,
    updatedStudent
  };
}

/**
 * 모든 학생의 배지를 재계산하고 수여 (일괄 소급 적용)
 *
 * @param students - 학생 배열
 * @returns 총 수여된 배지 개수와 업데이트된 학생 수
 */
export async function recalculateAllStudentBadges(
  students: Student[]
): Promise<{
  totalBadgesAwarded: number;
  studentsUpdated: number;
}> {
  let totalBadgesAwarded = 0;
  let studentsUpdated = 0;

  console.log(`🚀 [recalculateAllStudentBadges] ${students.length}명 학생 배지 재계산 시작`);

  for (const student of students) {
    const { awardedBadges } = await recalculateAndAwardBadges(student);

    if (awardedBadges.length > 0) {
      totalBadgesAwarded += awardedBadges.length;
      studentsUpdated++;
    }
  }

  console.log(`✅ [recalculateAllStudentBadges] 완료!`);
  console.log(`   총 ${studentsUpdated}명 학생에게 ${totalBadgesAwarded}개 배지 수여`);

  return {
    totalBadgesAwarded,
    studentsUpdated
  };
}
