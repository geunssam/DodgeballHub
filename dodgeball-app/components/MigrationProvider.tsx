'use client';

import { useEffect, useState } from 'react';
import { migrateTeamsToTeacherBased } from '@/lib/migration';
import { initializeMockData } from '@/lib/mockData';

export function MigrationProvider({ children }: { children: React.ReactNode }) {
  const [migrationStatus, setMigrationStatus] = useState<'pending' | 'running' | 'done' | 'error'>('pending');

  useEffect(() => {
    const runMigrations = async () => {
      // 1. 먼저 Mock 데이터 초기화 (없으면)
      initializeMockData();

      // 2. 이미 마이그레이션 완료됐는지 확인
      const teamsMigrated = localStorage.getItem('TEAMS_MIGRATED_TO_TEACHER_BASED');

      if (teamsMigrated) {
        setMigrationStatus('done');
        return;
      }

      setMigrationStatus('running');

      try {
        const result = await migrateTeamsToTeacherBased();

        if (result.success) {
          localStorage.setItem('TEAMS_MIGRATED_TO_TEACHER_BASED', 'true');
          setMigrationStatus('done');
          console.log('✅ Migration completed successfully');
        } else {
          console.error('Migration had errors:', result.errors);
          setMigrationStatus('done'); // 계속 진행 (데이터 없을 수도 있음)
        }
      } catch (error) {
        console.error('Migration failed:', error);
        setMigrationStatus('error');
      }
    };

    runMigrations();
  }, []);

  // 마이그레이션 중 로딩 화면
  if (migrationStatus === 'running') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700">데이터 업데이트 중...</p>
        </div>
      </div>
    );
  }

  // 마이그레이션 실패 화면
  if (migrationStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center max-w-md p-6">
          <p className="text-red-700 mb-4">데이터 업데이트에 실패했습니다.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
