'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Award } from 'lucide-react';
import BadgeCollection from '@/components/badge/BadgeCollection';
import { getClassById, getStudents } from '@/lib/dataService';
import { Class, Student } from '@/types';

export default function BadgesPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        <div className="flex items-center gap-4 mb-8">
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

        {/* 배지 컬렉션 */}
        <BadgeCollection classId={classId} students={students} />
      </div>
    </div>
  );
}
