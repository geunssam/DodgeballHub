'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/mockData';
import { GameSettingsModal } from '@/components/teacher/GameSettingsModal';
import { StudentCodeListModal } from '@/components/teacher/StudentCodeListModal';
import { getCurrentTeacherId, getClasses, getStudents } from '@/lib/dataService';
import { Student } from '@/types';

export function NavBar() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showStudentCodeModal, setShowStudentCodeModal] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [teacherId, setTeacherId] = useState<string>('');

  useEffect(() => {
    setIsMounted(true);
    setCurrentDateTime(new Date());

    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 모든 학급의 학생 데이터 로드
  useEffect(() => {
    const loadAllStudents = async () => {
      const currentTeacherId = getCurrentTeacherId();
      if (!currentTeacherId) return;

      setTeacherId(currentTeacherId);

      const classes = await getClasses(currentTeacherId);
      const students: Student[] = [];

      for (const cls of classes) {
        const classStudents = await getStudents(cls.id);
        students.push(...classStudents);
      }

      setAllStudents(students);
    };

    if (isMounted) {
      loadAllStudents();
    }
  }, [isMounted]);

  // 학생 데이터 새로고침
  const handleRefreshStudents = async () => {
    const classes = await getClasses(teacherId);
    const students: Student[] = [];

    for (const cls of classes) {
      const classStudents = await getStudents(cls.id);
      students.push(...classStudents);
    }

    setAllStudents(students);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_TEACHER);
    router.push('/teacher/login');
  };

  return (
    <>
      <nav className="bg-white shadow-lg border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-full mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* 좌측: 제목 */}
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏐</span>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                DodgeballHub
              </h1>
            </div>

            {/* 중앙: 날짜/시간 - baseball 스타일 */}
            <div className="flex flex-1 justify-center">
              <div className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-1.5 lg:py-2 bg-lime-50 text-gray-800 font-semibold rounded-full shadow-sm border border-lime-200">
                {isMounted && currentDateTime ? (
                  <>
                    <div className="flex items-center gap-1">
                      <span className="text-base lg:text-lg">📆</span>
                      <span className="text-sm lg:text-base">
                        {currentDateTime.toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-base lg:text-lg">⏱️</span>
                      <span className="text-sm lg:text-base font-mono">
                        {currentDateTime.toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm lg:text-base text-gray-400">로딩 중...</span>
                  </div>
                )}
              </div>
            </div>

            {/* 우측: 학생 코드 + 학급 랭킹 + 설정 및 로그아웃 */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowStudentCodeModal(true)}
                size="sm"
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200 text-sm lg:text-base"
              >
                📋 학생코드
              </Button>
              <Button
                onClick={() => router.push('/teacher/dashboard?view=rankings')}
                size="sm"
                className="bg-rose-100 hover:bg-rose-200 text-rose-700 border-rose-200 text-sm lg:text-base"
              >
                🏅 학급 랭킹
              </Button>
              <p className="text-sm font-semibold text-gray-900 hidden md:block">김교사 선생님</p>
              <Button
                onClick={() => setShowSettings(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">설정</span>
              </Button>
              <Button onClick={handleLogout} variant="destructive" size="sm">
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <GameSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <StudentCodeListModal
        isOpen={showStudentCodeModal}
        onClose={() => setShowStudentCodeModal(false)}
        students={allStudents}
        teacherId={teacherId}
        onRefresh={handleRefreshStudents}
      />
    </>
  );
}
