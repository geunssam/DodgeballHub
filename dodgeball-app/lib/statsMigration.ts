/**
 * Stats Migration Utility
 * outs → hits 프로퍼티 마이그레이션
 */

import { FinishedGame, Student } from '@/types';

export interface StatsMigrationResult {
  gamesUpdated: number;
  studentsUpdated: number;
  playerHistoriesUpdated: number;
  errors: string[];
}

/**
 * FinishedGame의 records에서 outs → hits 변환
 */
function migrateGameRecords(game: FinishedGame): FinishedGame {
  const updatedRecords = game.records.map(record => {
    // @ts-ignore - outs 프로퍼티가 있을 수 있음
    if (record.outs !== undefined && record.hits === undefined) {
      return {
        ...record,
        // @ts-ignore
        hits: record.outs,
        // @ts-ignore - outs 제거
        outs: undefined
      };
    }
    return record;
  });

  return {
    ...game,
    records: updatedRecords
  };
}

/**
 * Student의 stats에서 outs → hits 변환
 */
function migrateStudentStats(student: Student): Student {
  if (!student.stats) return student;

  // @ts-ignore - outs 프로퍼티가 있을 수 있음
  if (student.stats.outs !== undefined && student.stats.hits === undefined) {
    return {
      ...student,
      stats: {
        ...student.stats,
        // @ts-ignore
        hits: student.stats.outs,
        // @ts-ignore - outs 제거
        outs: undefined
      }
    };
  }

  return student;
}

/**
 * 전체 데이터 마이그레이션 수행
 */
export function migrateStatsData(
  games: FinishedGame[],
  students: Student[]
): {
  migratedGames: FinishedGame[];
  migratedStudents: Student[];
  result: StatsMigrationResult;
} {
  const result: StatsMigrationResult = {
    gamesUpdated: 0,
    studentsUpdated: 0,
    playerHistoriesUpdated: 0,
    errors: []
  };

  // 경기 데이터 마이그레이션
  const migratedGames = games.map(game => {
    const original = JSON.stringify(game);
    const migrated = migrateGameRecords(game);

    if (JSON.stringify(migrated) !== original) {
      result.gamesUpdated++;
    }

    return migrated;
  });

  // 학생 데이터 마이그레이션
  const migratedStudents = students.map(student => {
    const original = JSON.stringify(student);
    const migrated = migrateStudentStats(student);

    if (JSON.stringify(migrated) !== original) {
      result.studentsUpdated++;
    }

    return migrated;
  });

  return {
    migratedGames,
    migratedStudents,
    result
  };
}

/**
 * 마이그레이션 결과를 사용자 친화적 메시지로 포맷
 */
export function formatStatsMigrationResult(result: StatsMigrationResult): string {
  const messages: string[] = [];

  messages.push('📊 스탯 데이터 마이그레이션 완료!');
  messages.push('');
  messages.push(`✅ 경기 기록: ${result.gamesUpdated}개 업데이트`);
  messages.push(`✅ 학생 통계: ${result.studentsUpdated}명 업데이트`);

  if (result.playerHistoriesUpdated > 0) {
    messages.push(`✅ 경기 히스토리: ${result.playerHistoriesUpdated}개 업데이트`);
  }

  if (result.errors.length > 0) {
    messages.push('');
    messages.push('⚠️ 오류:');
    result.errors.forEach(error => messages.push(`  - ${error}`));
  }

  if (result.gamesUpdated === 0 && result.studentsUpdated === 0) {
    messages.push('');
    messages.push('ℹ️ 마이그레이션이 필요한 데이터가 없습니다.');
  }

  return messages.join('\n');
}
