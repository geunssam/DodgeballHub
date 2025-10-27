import { Team, Class } from '@/types';
import { STORAGE_KEYS } from './mockData';

/**
 * 팀 데이터를 학급 기반에서 교사 기반으로 마이그레이션
 */
export async function migrateTeamsToTeacherBased(): Promise<{
  success: boolean;
  migratedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let migratedCount = 0;

  try {
    // 1. 백업 생성
    createBackup();

    // 2. 기존 팀 데이터 로드
    const teamsJson = localStorage.getItem(STORAGE_KEYS.TEAMS);
    if (!teamsJson) {
      console.log('No teams to migrate');
      return { success: true, migratedCount: 0, errors: [] };
    }

    const oldTeams: any[] = JSON.parse(teamsJson);

    // 3. 학급 데이터 로드 (teacherId 매핑용)
    const classesJson = localStorage.getItem(STORAGE_KEYS.CLASSES);
    if (!classesJson) {
      errors.push('Classes data not found');
      return { success: false, migratedCount: 0, errors };
    }

    const classes: Class[] = JSON.parse(classesJson);
    const classMap = new Map(classes.map(c => [c.id, c]));

    // 4. 팀 마이그레이션
    const migratedTeams: Team[] = [];

    for (const oldTeam of oldTeams) {
      try {
        // 이미 teacherId가 있으면 스킵 (이미 마이그레이션됨)
        if (oldTeam.teacherId && !oldTeam.classId) {
          migratedTeams.push(oldTeam);
          continue;
        }

        // classId로 학급 찾기
        const classId = oldTeam.classId;
        if (!classId) {
          errors.push(`Team ${oldTeam.id} has no classId`);
          continue;
        }

        const teamClass = classMap.get(classId);
        if (!teamClass) {
          errors.push(`Class not found for team ${oldTeam.id}`);
          continue;
        }

        // 멤버 배열 업데이트 (classId, className 추가)
        const updatedMembers = (oldTeam.members || []).map((member: any) => ({
          ...member,
          classId: classId,
          className: teamClass.name
        }));

        // sourceClassIds 계산
        const sourceClassIds = [classId];

        // 새 팀 객체 생성
        const migratedTeam: Team = {
          id: oldTeam.id,
          teacherId: teamClass.teacherId,  // classId → teacherId
          name: oldTeam.name,
          color: oldTeam.color,
          members: updatedMembers,
          sourceClassIds,
          createdAt: oldTeam.createdAt
        };

        migratedTeams.push(migratedTeam);
        migratedCount++;

      } catch (error) {
        errors.push(`Failed to migrate team ${oldTeam.id}: ${error}`);
      }
    }

    // 5. 새 데이터 저장
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(migratedTeams));

    console.log(`✅ Migrated ${migratedCount} teams`);
    if (errors.length > 0) {
      console.warn('⚠️ Migration errors:', errors);
    }

    return {
      success: errors.length === 0,
      migratedCount,
      errors
    };

  } catch (error) {
    errors.push(`Critical migration error: ${error}`);
    return { success: false, migratedCount: 0, errors };
  }
}

/**
 * 백업 생성
 */
function createBackup(): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupKey = `BACKUP_${timestamp}`;

  const backupData = {
    teams: localStorage.getItem(STORAGE_KEYS.TEAMS),
    games: localStorage.getItem(STORAGE_KEYS.GAMES),
  };

  localStorage.setItem(backupKey, JSON.stringify(backupData));
  localStorage.setItem('LATEST_BACKUP_KEY', backupKey);

  console.log(`✅ Backup created: ${backupKey}`);
}

/**
 * 최신 백업으로 롤백
 */
export function rollbackToLatestBackup(): boolean {
  try {
    const latestBackupKey = localStorage.getItem('LATEST_BACKUP_KEY');
    if (!latestBackupKey) {
      console.error('❌ No backup found');
      return false;
    }

    const backupJson = localStorage.getItem(latestBackupKey);
    if (!backupJson) {
      console.error('❌ Backup data not found');
      return false;
    }

    const backup = JSON.parse(backupJson);

    // 복원
    if (backup.teams) localStorage.setItem(STORAGE_KEYS.TEAMS, backup.teams);
    if (backup.games) localStorage.setItem(STORAGE_KEYS.GAMES, backup.games);

    // 마이그레이션 플래그 제거
    localStorage.removeItem('TEAMS_MIGRATED_TO_TEACHER_BASED');

    console.log(`✅ Rolled back to ${latestBackupKey}`);
    return true;

  } catch (error) {
    console.error('❌ Rollback failed:', error);
    return false;
  }
}
