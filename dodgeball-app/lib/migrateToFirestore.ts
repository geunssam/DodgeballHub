/**
 * localStorage에서 Firestore로 데이터 마이그레이션
 *
 * 이 스크립트는 기존 localStorage에 저장된 Mock 데이터를
 * Firestore로 이동시킵니다.
 */

import { db } from './firebase';
import { doc, setDoc, writeBatch, collection } from 'firebase/firestore';
import { STORAGE_KEYS } from './mockData';
import type { Class, Student, Team, Game, CustomBadge } from '@/types';

interface MigrationResult {
  success: boolean;
  message: string;
  details?: {
    classes: number;
    students: number;
    teams: number;
    games: number;
    customBadges: number;
  };
  error?: unknown;
}

/**
 * localStorage에서 Firestore로 모든 데이터 마이그레이션
 */
export async function migrateLocalStorageToFirestore(
  teacherId: string
): Promise<MigrationResult> {
  try {
    console.log('🚀 Starting migration to Firestore...');

    // localStorage에서 데이터 읽기
    const classesStr = localStorage.getItem(STORAGE_KEYS.CLASSES);
    const studentsStr = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    const teamsStr = localStorage.getItem(STORAGE_KEYS.TEAMS);
    const gamesStr = localStorage.getItem(STORAGE_KEYS.GAMES);
    const customBadgesStr = localStorage.getItem(STORAGE_KEYS.CUSTOM_BADGES);

    const classes: Class[] = classesStr ? JSON.parse(classesStr) : [];
    const students: Student[] = studentsStr ? JSON.parse(studentsStr) : [];
    const teams: Team[] = teamsStr ? JSON.parse(teamsStr) : [];
    const games: Game[] = gamesStr ? JSON.parse(gamesStr) : [];
    const customBadges: CustomBadge[] = customBadgesStr
      ? JSON.parse(customBadgesStr)
      : [];

    console.log('📊 Data counts:', {
      classes: classes.length,
      students: students.length,
      teams: teams.length,
      games: games.length,
      customBadges: customBadges.length,
    });

    // Firestore 배치 작업으로 업로드 (최대 500개씩)
    const batch = writeBatch(db);
    let batchCount = 0;

    // 1. 학급 데이터 마이그레이션
    console.log('📚 Migrating classes...');
    for (const cls of classes) {
      const classRef = doc(db, 'classes', cls.id);
      batch.set(classRef, {
        ...cls,
        teacherId, // teacherId를 현재 로그인한 사용자로 설정
      });
      batchCount++;

      if (batchCount >= 500) {
        await batch.commit();
        batchCount = 0;
      }
    }

    // 2. 학생 데이터 마이그레이션
    console.log('👨‍🎓 Migrating students...');
    for (const student of students) {
      const studentRef = doc(db, 'students', student.id);
      batch.set(studentRef, student);
      batchCount++;

      if (batchCount >= 500) {
        await batch.commit();
        batchCount = 0;
      }
    }

    // 3. 팀 데이터 마이그레이션
    console.log('🏆 Migrating teams...');
    for (const team of teams) {
      const teamRef = doc(db, 'teams', team.id);
      batch.set(teamRef, {
        ...team,
        teacherId, // teacherId를 현재 로그인한 사용자로 설정
      });
      batchCount++;

      if (batchCount >= 500) {
        await batch.commit();
        batchCount = 0;
      }
    }

    // 4. 경기 데이터 마이그레이션
    console.log('⚽ Migrating games...');
    for (const game of games) {
      const gameRef = doc(db, 'games', game.id);
      batch.set(gameRef, {
        ...game,
        teacherId, // teacherId를 현재 로그인한 사용자로 설정
      });
      batchCount++;

      if (batchCount >= 500) {
        await batch.commit();
        batchCount = 0;
      }
    }

    // 5. 커스텀 배지 데이터 마이그레이션
    console.log('🏅 Migrating custom badges...');
    for (const badge of customBadges) {
      const badgeRef = doc(db, 'customBadges', badge.id);
      batch.set(badgeRef, {
        ...badge,
        teacherId, // teacherId를 현재 로그인한 사용자로 설정
      });
      batchCount++;

      if (batchCount >= 500) {
        await batch.commit();
        batchCount = 0;
      }
    }

    // 마지막 배치 커밋
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log('✅ Migration completed successfully!');

    // localStorage 백업 (마이그레이션 성공 후)
    const backupKey = `dodgeball_backup_${Date.now()}`;
    localStorage.setItem(
      backupKey,
      JSON.stringify({
        classes,
        students,
        teams,
        games,
        customBadges,
        migratedAt: new Date().toISOString(),
      })
    );

    console.log(`💾 Backup saved to localStorage: ${backupKey}`);

    return {
      success: true,
      message: 'Migration completed successfully!',
      details: {
        classes: classes.length,
        students: students.length,
        teams: teams.length,
        games: games.length,
        customBadges: customBadges.length,
      },
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      message: 'Migration failed',
      error,
    };
  }
}

/**
 * 마이그레이션 상태 확인
 * localStorage에 데이터가 있는지 확인
 */
export function checkMigrationNeeded(): boolean {
  if (typeof window === 'undefined') return false;

  const classes = localStorage.getItem(STORAGE_KEYS.CLASSES);
  const students = localStorage.getItem(STORAGE_KEYS.STUDENTS);

  return !!(classes && students);
}

/**
 * localStorage 데이터 삭제 (마이그레이션 완료 후)
 * 주의: 백업이 있는지 확인 후 사용하세요!
 */
export function clearLocalStorageData(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEYS.CLASSES);
  localStorage.removeItem(STORAGE_KEYS.STUDENTS);
  localStorage.removeItem(STORAGE_KEYS.TEAMS);
  localStorage.removeItem(STORAGE_KEYS.GAMES);
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_BADGES);
  localStorage.removeItem(STORAGE_KEYS.FINISHED_GAMES);

  console.log('🗑️ localStorage data cleared');
}
