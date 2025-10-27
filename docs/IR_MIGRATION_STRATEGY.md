# IR_MIGRATION: Data Migration Strategy

**Phase**: Supporting Document
**Status**: Reference Guide
**Priority**: Critical - 데이터 무결성 보장
**Estimated Time**: 1 hour (준비 및 검증)

## 목적 (Purpose)

팀 독립성 리팩토링 과정에서 기존 데이터를 안전하게 새로운 구조로 마이그레이션하고, 문제 발생 시 롤백할 수 있는 전략을 제공합니다.

## 마이그레이션 개요

### 변경 사항 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| Team.classId | 필수 필드 | 삭제됨 |
| Team.teacherId | 필수 필드 | 유지 |
| Team.members | optional | 필수 (빈 배열) |
| Team.sourceClassIds | 없음 | 추가 (선택) |
| TeamMember.classId | 없음 | 추가 |
| TeamMember.className | 없음 | 추가 |
| Game.teacherId | 없음 | 추가 (선택) |

### 영향 받는 데이터

1. **Teams** (localStorage: `DODGEBALL_TEAMS`)
   - 모든 팀 객체의 구조 변경
   - `classId` 제거, `sourceClassIds` 추가
   - `members` 배열에 학급 정보 추가

2. **Games** (localStorage: `DODGEBALL_GAMES`)
   - `teacherId` 필드 추가 (선택)
   - 기존 경기는 호환성 유지

3. **Students** (localStorage: `DODGEBALL_STUDENTS`)
   - 변경 없음 (안전)

4. **Classes** (localStorage: `DODGEBALL_CLASSES`)
   - 변경 없음 (안전)

## 마이그레이션 전략

### 1. 백업 생성

모든 마이그레이션 전에 자동으로 백업 생성:

```typescript
// lib/migration.ts
export const createBackup = (): void => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupKey = `BACKUP_${timestamp}`;

  const backupData = {
    teams: localStorage.getItem(STORAGE_KEYS.TEAMS),
    games: localStorage.getItem(STORAGE_KEYS.GAMES),
    students: localStorage.getItem(STORAGE_KEYS.STUDENTS),
    classes: localStorage.getItem(STORAGE_KEYS.CLASSES),
  };

  localStorage.setItem(backupKey, JSON.stringify(backupData));
  localStorage.setItem('LATEST_BACKUP_KEY', backupKey);

  console.log(`✅ Backup created: ${backupKey}`);
};
```

### 2. 팀 데이터 마이그레이션

```typescript
// lib/migration.ts
export const migrateTeamsToTeacherBased = async (): Promise<{
  success: boolean;
  migratedCount: number;
  errors: string[];
}> => {
  const errors: string[] = [];
  let migratedCount = 0;

  try {
    // 1. 백업 생성
    createBackup();

    // 2. 기존 팀 데이터 로드
    const teamsJson = localStorage.getItem(STORAGE_KEYS.TEAMS);
    if (!teamsJson) {
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
        // 이미 마이그레이션된 팀인지 확인
        if (!oldTeam.classId) {
          // 이미 새 구조
          migratedTeams.push(oldTeam);
          continue;
        }

        // classId로 학급 찾기
        const teamClass = classMap.get(oldTeam.classId);
        if (!teamClass) {
          errors.push(`Class not found for team ${oldTeam.id} (classId: ${oldTeam.classId})`);
          continue;
        }

        // 멤버 배열 업데이트
        const updatedMembers = (oldTeam.members || []).map((member: any) => ({
          ...member,
          classId: oldTeam.classId,  // 팀의 classId를 멤버에 추가
          className: teamClass.name
        }));

        // sourceClassIds 계산
        const sourceClassIds = [oldTeam.classId];

        // 새 팀 객체 생성
        const { classId, ...teamWithoutClassId } = oldTeam;

        const migratedTeam: Team = {
          ...teamWithoutClassId,
          teacherId: teamClass.teacherId,
          members: updatedMembers,
          sourceClassIds
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
};
```

### 3. 게임 데이터 마이그레이션 (선택)

```typescript
// lib/migration.ts
export const migrateGamesAddTeacherId = async (): Promise<{
  success: boolean;
  migratedCount: number;
  errors: string[];
}> => {
  const errors: string[] = [];
  let migratedCount = 0;

  try {
    const gamesJson = localStorage.getItem(STORAGE_KEYS.GAMES);
    if (!gamesJson) {
      return { success: true, migratedCount: 0, errors: [] };
    }

    const games: Game[] = JSON.parse(gamesJson);
    const classesJson = localStorage.getItem(STORAGE_KEYS.CLASSES);
    if (!classesJson) {
      errors.push('Classes data not found');
      return { success: false, migratedCount: 0, errors };
    }

    const classes: Class[] = JSON.parse(classesJson);

    const migratedGames = games.map(game => {
      // 이미 teacherId가 있으면 스킵
      if (game.teacherId) return game;

      // hostClassId로 teacherId 찾기
      const hostClass = classes.find(c => c.id === game.hostClassId);
      if (!hostClass) {
        errors.push(`Host class not found for game ${game.id}`);
        return game;
      }

      migratedCount++;
      return {
        ...game,
        teacherId: hostClass.teacherId
      };
    });

    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(migratedGames));

    console.log(`✅ Migrated ${migratedCount} games`);
    return { success: errors.length === 0, migratedCount, errors };

  } catch (error) {
    errors.push(`Critical migration error: ${error}`);
    return { success: false, migratedCount: 0, errors };
  }
};
```

### 4. 롤백 기능

```typescript
// lib/migration.ts
export const rollbackToLatestBackup = (): boolean => {
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
    if (backup.students) localStorage.setItem(STORAGE_KEYS.STUDENTS, backup.students);
    if (backup.classes) localStorage.setItem(STORAGE_KEYS.CLASSES, backup.classes);

    // 마이그레이션 플래그 제거
    localStorage.removeItem('TEAMS_MIGRATED_TO_TEACHER_BASED');
    localStorage.removeItem('GAMES_MIGRATED_ADD_TEACHER_ID');

    console.log(`✅ Rolled back to ${latestBackupKey}`);
    return true;

  } catch (error) {
    console.error('❌ Rollback failed:', error);
    return false;
  }
};

// 특정 백업으로 롤백
export const rollbackToSpecificBackup = (backupKey: string): boolean => {
  try {
    const backupJson = localStorage.getItem(backupKey);
    if (!backupJson) {
      console.error('❌ Backup not found:', backupKey);
      return false;
    }

    const backup = JSON.parse(backupJson);

    if (backup.teams) localStorage.setItem(STORAGE_KEYS.TEAMS, backup.teams);
    if (backup.games) localStorage.setItem(STORAGE_KEYS.GAMES, backup.games);
    if (backup.students) localStorage.setItem(STORAGE_KEYS.STUDENTS, backup.students);
    if (backup.classes) localStorage.setItem(STORAGE_KEYS.CLASSES, backup.classes);

    localStorage.removeItem('TEAMS_MIGRATED_TO_TEACHER_BASED');
    localStorage.removeItem('GAMES_MIGRATED_ADD_TEACHER_ID');

    console.log(`✅ Rolled back to ${backupKey}`);
    return true;

  } catch (error) {
    console.error('❌ Rollback failed:', error);
    return false;
  }
};

// 사용 가능한 백업 목록
export const listBackups = (): string[] => {
  const backups: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('BACKUP_')) {
      backups.push(key);
    }
  }

  return backups.sort().reverse();  // 최신순
};
```

## 마이그레이션 실행

### 1. 자동 실행 (권장)

앱 로딩 시 자동으로 마이그레이션 실행:

```typescript
// app/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  migrateTeamsToTeacherBased,
  migrateGamesAddTeacherId,
  listBackups
} from '@/lib/migration';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [migrationStatus, setMigrationStatus] = useState<'pending' | 'running' | 'done' | 'error'>('pending');
  const [migrationMessage, setMigrationMessage] = useState('');

  useEffect(() => {
    const runMigrations = async () => {
      // 이미 마이그레이션 완료됐는지 확인
      const teamsMigrated = localStorage.getItem('TEAMS_MIGRATED_TO_TEACHER_BASED');
      const gamesMigrated = localStorage.getItem('GAMES_MIGRATED_ADD_TEACHER_ID');

      if (teamsMigrated && gamesMigrated) {
        setMigrationStatus('done');
        return;
      }

      setMigrationStatus('running');
      setMigrationMessage('데이터를 업데이트하고 있습니다...');

      try {
        // 팀 마이그레이션
        if (!teamsMigrated) {
          const teamResult = await migrateTeamsToTeacherBased();
          if (!teamResult.success) {
            throw new Error(`Team migration failed: ${teamResult.errors.join(', ')}`);
          }
          localStorage.setItem('TEAMS_MIGRATED_TO_TEACHER_BASED', 'true');
        }

        // 게임 마이그레이션 (선택)
        if (!gamesMigrated) {
          const gameResult = await migrateGamesAddTeacherId();
          if (!gameResult.success) {
            console.warn('Game migration had errors:', gameResult.errors);
          }
          localStorage.setItem('GAMES_MIGRATED_ADD_TEACHER_ID', 'true');
        }

        setMigrationStatus('done');
        setMigrationMessage('');

      } catch (error) {
        console.error('Migration failed:', error);
        setMigrationStatus('error');
        setMigrationMessage('데이터 업데이트에 실패했습니다. 페이지를 새로고침해주세요.');
      }
    };

    runMigrations();
  }, []);

  // 마이그레이션 중 로딩 화면
  if (migrationStatus === 'running') {
    return (
      <html lang="ko">
        <body>
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-700">{migrationMessage}</p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  // 마이그레이션 실패 화면
  if (migrationStatus === 'error') {
    return (
      <html lang="ko">
        <body>
          <div className="min-h-screen flex items-center justify-center bg-red-50">
            <div className="text-center max-w-md p-6">
              <p className="text-red-700 mb-4">{migrationMessage}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                새로고침
              </button>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

### 2. 수동 실행 (개발자 도구)

브라우저 콘솔에서 수동으로 실행:

```javascript
// 마이그레이션 실행
import { migrateTeamsToTeacherBased } from './lib/migration';
await migrateTeamsToTeacherBased();

// 백업 목록 확인
import { listBackups } from './lib/migration';
console.log(listBackups());

// 롤백
import { rollbackToLatestBackup } from './lib/migration';
rollbackToLatestBackup();
```

## 마이그레이션 검증

### 1. 자동 검증 함수

```typescript
// lib/migration.ts
export const validateMigration = (): {
  valid: boolean;
  issues: string[];
} => {
  const issues: string[] = [];

  try {
    // 1. 팀 데이터 검증
    const teamsJson = localStorage.getItem(STORAGE_KEYS.TEAMS);
    if (teamsJson) {
      const teams: Team[] = JSON.parse(teamsJson);

      teams.forEach(team => {
        // classId가 없어야 함
        if ('classId' in team) {
          issues.push(`Team ${team.id} still has classId field`);
        }

        // teacherId는 있어야 함
        if (!team.teacherId) {
          issues.push(`Team ${team.id} missing teacherId`);
        }

        // members 배열 확인
        if (!Array.isArray(team.members)) {
          issues.push(`Team ${team.id} members is not an array`);
        } else {
          team.members.forEach(member => {
            // 각 멤버에 classId가 있어야 함
            if (!member.classId) {
              issues.push(`Team ${team.id}, member ${member.id} missing classId`);
            }
          });
        }
      });
    }

    // 2. 게임 데이터 검증 (선택)
    const gamesJson = localStorage.getItem(STORAGE_KEYS.GAMES);
    if (gamesJson) {
      const games: Game[] = JSON.parse(gamesJson);

      games.forEach(game => {
        // teacherId가 있는지 확인 (경고만)
        if (!game.teacherId) {
          console.warn(`Game ${game.id} missing teacherId`);
        }
      });
    }

  } catch (error) {
    issues.push(`Validation error: ${error}`);
  }

  return {
    valid: issues.length === 0,
    issues
  };
};
```

### 2. 마이그레이션 후 자동 검증

```typescript
// app/layout.tsx (마이그레이션 후)
const teamResult = await migrateTeamsToTeacherBased();
if (teamResult.success) {
  const validation = validateMigration();
  if (!validation.valid) {
    console.error('⚠️ Migration validation failed:', validation.issues);
    // 필요시 롤백
    // rollbackToLatestBackup();
  }
}
```

## 마이그레이션 시나리오별 대응

### 시나리오 1: 정상 마이그레이션

```
1. 앱 로딩
2. 백업 생성
3. 팀 마이그레이션 실행
4. 검증 통과
5. 플래그 설정
6. 정상 실행
```

### 시나리오 2: 마이그레이션 실패

```
1. 앱 로딩
2. 백업 생성
3. 팀 마이그레이션 실행
4. 오류 발생
5. 에러 메시지 표시
6. 사용자가 새로고침 → 재시도
```

### 시나리오 3: 데이터 손상

```
1. 검증 실패 감지
2. 자동 롤백 실행
3. 마이그레이션 플래그 제거
4. 오류 로그 출력
5. 개발자 확인 필요
```

### 시나리오 4: 부분 마이그레이션

```
1. 일부 팀만 마이그레이션됨
2. 마이그레이션 재실행 시 이미 완료된 팀은 스킵
3. 나머지 팀만 처리
4. 검증 후 완료
```

## 백업 관리

### 1. 백업 보관 정책

```typescript
// lib/migration.ts
export const cleanOldBackups = (keepCount: number = 5): void => {
  const backups = listBackups();

  // 최신 N개만 유지
  if (backups.length > keepCount) {
    const toDelete = backups.slice(keepCount);
    toDelete.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Deleted old backup: ${key}`);
    });
  }
};
```

### 2. 백업 크기 확인

```typescript
// lib/migration.ts
export const getBackupSize = (backupKey: string): number => {
  const backup = localStorage.getItem(backupKey);
  if (!backup) return 0;

  // 대략적인 크기 (바이트)
  return new Blob([backup]).size;
};

export const getTotalBackupSize = (): number => {
  const backups = listBackups();
  return backups.reduce((total, key) => total + getBackupSize(key), 0);
};
```

## 개발자 도구

마이그레이션 상태 확인 및 관리를 위한 개발자 페이지:

```typescript
// app/dev/migration/page.tsx (개발 환경 전용)
'use client';

import { useState, useEffect } from 'react';
import {
  listBackups,
  rollbackToLatestBackup,
  rollbackToSpecificBackup,
  validateMigration,
  cleanOldBackups,
  getTotalBackupSize
} from '@/lib/migration';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function MigrationDevPage() {
  const [backups, setBackups] = useState<string[]>([]);
  const [validation, setValidation] = useState<{ valid: boolean; issues: string[] } | null>(null);
  const [totalSize, setTotalSize] = useState(0);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = () => {
    setBackups(listBackups());
    setTotalSize(getTotalBackupSize());
  };

  const handleValidate = () => {
    const result = validateMigration();
    setValidation(result);
  };

  const handleRollback = (backupKey?: string) => {
    const success = backupKey
      ? rollbackToSpecificBackup(backupKey)
      : rollbackToLatestBackup();

    if (success) {
      alert('롤백 성공! 페이지를 새로고침하세요.');
      window.location.reload();
    } else {
      alert('롤백 실패');
    }
  };

  const handleCleanBackups = () => {
    cleanOldBackups(5);
    loadBackups();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">마이그레이션 관리</h1>

      {/* 검증 */}
      <Card className="p-4 mb-6">
        <h2 className="text-lg font-bold mb-2">데이터 검증</h2>
        <Button onClick={handleValidate}>검증 실행</Button>
        {validation && (
          <div className="mt-4">
            <p className={validation.valid ? 'text-green-600' : 'text-red-600'}>
              {validation.valid ? '✅ 검증 통과' : '❌ 검증 실패'}
            </p>
            {validation.issues.length > 0 && (
              <ul className="mt-2 text-sm text-red-600">
                {validation.issues.map((issue, i) => (
                  <li key={i}>- {issue}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      {/* 백업 목록 */}
      <Card className="p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">백업 목록</h2>
          <div className="text-sm text-gray-600">
            총 {backups.length}개 ({(totalSize / 1024).toFixed(2)} KB)
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {backups.map((key, index) => (
            <div key={key} className="flex justify-between items-center p-2 border rounded">
              <span className="text-sm">{key}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRollback(key)}
              >
                이 백업으로 복원
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button onClick={() => handleRollback()}>최신 백업으로 롤백</Button>
          <Button variant="outline" onClick={handleCleanBackups}>
            오래된 백업 정리
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

## 체크리스트

마이그레이션 전:
- [ ] 현재 데이터 백업 생성
- [ ] 마이그레이션 코드 테스트
- [ ] 롤백 절차 확인

마이그레이션 중:
- [ ] 백업 자동 생성 확인
- [ ] 진행 상황 모니터링
- [ ] 오류 발생 시 즉시 중단

마이그레이션 후:
- [ ] 검증 실행
- [ ] 주요 기능 테스트
- [ ] 백업 보관
- [ ] 플래그 설정 확인

## 긴급 복구 절차

문제 발생 시:

1. **즉시 롤백**
   ```javascript
   rollbackToLatestBackup();
   ```

2. **페이지 새로고침**
   ```javascript
   window.location.reload();
   ```

3. **백업 확인**
   ```javascript
   console.log(listBackups());
   ```

4. **특정 백업 복원**
   ```javascript
   rollbackToSpecificBackup('BACKUP_2025-01-22T...');
   ```

---

**작성일**: 2025-01-22
**작성자**: Claude Code
**검토 필요**: ✅ 프로덕션 적용 전 필수 검토
