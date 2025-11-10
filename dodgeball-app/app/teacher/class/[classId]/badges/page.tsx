'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Award, RefreshCw } from 'lucide-react';
import BadgeCollection from '@/components/badge/BadgeCollection';
import { getClassById, getStudents } from '@/lib/dataService';
import { Class, Student } from '@/types';
import { migrateBadgesFromStats } from '@/lib/migration';

export default function BadgesPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    const loadClassData = async () => {
      try {
        const data = await getClassById(classId);
        const studentList = await getStudents(classId);
        setClassData(data);
        setStudents(studentList);
      } catch (error) {
        console.error('Failed to load class data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadClassData();
  }, [classId]);

  const handleMigrateBadges = async () => {
    if (!confirm('모든 학생의 stats를 기반으로 배지를 자동 부여하시겠습니까?\n\n이 작업은 학생들이 획득해야 할 배지를 자동으로 추가합니다.')) {
      return;
    }

    setIsMigrating(true);
    try {
      const result = await migrateBadgesFromStats();

      if (result.success) {
        alert(`✅ 배지 마이그레이션 완료!\n\n업데이트된 학생: ${result.updatedCount}명\n추가된 배지: ${result.totalBadgesAdded}개`);

        // 페이지 새로고침하여 변경사항 반영
        window.location.reload();
      } else {
        alert(`⚠️ 배지 마이그레이션 중 오류가 발생했습니다.\n\n${result.errors.join('\n')}`);
      }
    } catch (error) {
      console.error('Failed to migrate badges:', error);
      alert('❌ 배지 마이그레이션에 실패했습니다.');
    } finally {
      setIsMigrating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">배지 도감을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">학급 정보를 찾을 수 없습니다.</p>
          <Button onClick={() => router.push('/teacher')}>돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/teacher/dashboard')}
              className="hover:bg-white/50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-6 w-6 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-800">배지 도감</h1>
              </div>
              <p className="text-gray-600">{classData.name}</p>
            </div>
          </div>

          {/* 배지 마이그레이션 버튼 */}
          <Button
            onClick={handleMigrateBadges}
            disabled={isMigrating}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isMigrating ? 'animate-spin' : ''}`} />
            {isMigrating ? '마이그레이션 중...' : '배지 동기화'}
          </Button>
        </div>

        {/* 배지 컬렉션 */}
        <BadgeCollection classId={classId} students={students} />
      </div>
    </div>
  );
}
