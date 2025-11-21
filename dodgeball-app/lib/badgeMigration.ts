/**
 * 배지 마이그레이션 유틸리티
 * 기존 게임 데이터를 분석하여 배지를 재계산하고 적용
 */

import { Student, StudentStats } from '@/types';
import { checkNewBadges, BADGES } from './badgeSystem';

export interface MigrationResult {
  studentsProcessed: number;
  badgesAwarded: number;
  errors: string[];
  details: {
    studentId: string;
    studentName: string;
    newBadges: string[];
  }[];
}

/**
 * 학생의 현재 스탯을 기반으로 모든 배지를 재계산
 * @param student - 학생 객체
 * @returns 수여해야 할 배지 ID 배열
 */
function recalculateBadgesForStudent(student: Student): string[] {
  const stats: StudentStats = student.stats;
  const awardedBadges: string[] = [];

  // 모든 배지를 순회하며 조건 체크
  Object.values(BADGES).forEach(badge => {
    if (badge.condition(stats)) {
      awardedBadges.push(badge.id);
    }
  });

  return awardedBadges;
}

/**
 * 학생 배열에 대해 배지 마이그레이션 실행
 * @param students - 마이그레이션할 학생 배열
 * @returns 마이그레이션 결과
 */
export function migrateBadges(students: Student[]): MigrationResult {
  const result: MigrationResult = {
    studentsProcessed: 0,
    badgesAwarded: 0,
    errors: [],
    details: []
  };

  students.forEach(student => {
    try {
      // 현재 보유한 자동 배지 ID 목록 (수동 배지는 제외)
      const currentAutoBadgeIds = student.badges
        .filter(b => b.isAuto)
        .map(b => b.id);

      // 스탯 기반으로 재계산
      const shouldHaveBadgeIds = recalculateBadgesForStudent(student);

      // 새로 추가해야 할 배지들 (현재 없지만 조건 만족)
      const newBadgeIds = shouldHaveBadgeIds.filter(
        id => !currentAutoBadgeIds.includes(id)
      );

      if (newBadgeIds.length > 0) {
        // 학생에게 새 배지 추가
        const now = new Date().toISOString();
        newBadgeIds.forEach(badgeId => {
          const badgeDef = BADGES[badgeId.toUpperCase()];
          if (badgeDef) {
            student.badges.push({
              id: badgeDef.id,
              name: badgeDef.name,
              emoji: badgeDef.icon,
              awardedAt: now,
              isAuto: true
            });
            result.badgesAwarded++;
          }
        });

        result.details.push({
          studentId: student.id,
          studentName: student.name,
          newBadges: newBadgeIds
        });
      }

      result.studentsProcessed++;
    } catch (error) {
      result.errors.push(
        `${student.name} (${student.id}): ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    }
  });

  return result;
}

/**
 * 마이그레이션 결과를 사람이 읽을 수 있는 문자열로 변환
 * @param result - 마이그레이션 결과
 * @returns 포맷된 결과 문자열
 */
export function formatMigrationResult(result: MigrationResult): string {
  const lines: string[] = [
    `✅ 처리된 학생: ${result.studentsProcessed}명`,
    `🏅 수여된 배지: ${result.badgesAwarded}개`,
    ''
  ];

  if (result.details.length > 0) {
    lines.push('📋 상세 내역:');
    result.details.forEach(detail => {
      lines.push(`  • ${detail.studentName}: ${detail.newBadges.length}개 배지`);
      detail.newBadges.forEach(badgeId => {
        const badge = BADGES[badgeId.toUpperCase()];
        if (badge) {
          lines.push(`    - ${badge.icon} ${badge.name}`);
        }
      });
    });
    lines.push('');
  }

  if (result.errors.length > 0) {
    lines.push('⚠️ 오류:');
    result.errors.forEach(error => {
      lines.push(`  • ${error}`);
    });
  }

  return lines.join('\n');
}
