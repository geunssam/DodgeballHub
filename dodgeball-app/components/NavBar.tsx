'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { GameSettingsModal } from '@/components/teacher/GameSettingsModal';
import { StudentCodeListModal } from '@/components/teacher/StudentCodeListModal';
import { BadgeManagementModal } from '@/components/badge/BadgeManagementModal';
import { getClasses, getStudents } from '@/lib/dataService';
import {
  loadCustomBadges,
  loadHiddenBadges,
  saveCustomBadges,
  saveHiddenBadges,
  toggleBadgeVisibility,
  deleteCustomBadge,
  recalculateAllStudentBadges
} from '@/lib/badgeHelpers';
import { Student, CustomBadge } from '@/types';
import { toast } from 'sonner';

export function NavBar() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showSettings, setShowSettings] = useState(false);
  const [showStudentCodeModal, setShowStudentCodeModal] = useState(false);
  const [showBadgeManagement, setShowBadgeManagement] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [customBadges, setCustomBadges] = useState<CustomBadge[]>([]);
  const [hiddenBadgeIds, setHiddenBadgeIds] = useState<string[]>([]);

  useEffect(() => {
    setIsMounted(true);
    setCurrentDateTime(new Date());

    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 모든 학급의 학생 데이터 및 배지 데이터 로드
  useEffect(() => {
    const loadAllData = async () => {
      if (!session?.user?.id) return;

      const classes = await getClasses(session.user.id);
      const students: Student[] = [];

      for (const cls of classes) {
        const classStudents = await getStudents(cls.id);
        students.push(...classStudents);
      }

      setAllStudents(students);

      // 배지 데이터 로드
      setCustomBadges(loadCustomBadges());
      setHiddenBadgeIds(loadHiddenBadges());
    };

    if (isMounted && session?.user?.id) {
      loadAllData();
    }
  }, [isMounted, session?.user?.id]);

  // 학생 데이터 새로고침
  const handleRefreshStudents = async () => {
    if (!session?.user?.id) return;

    const classes = await getClasses(session.user.id);
    const students: Student[] = [];

    for (const cls of classes) {
      const classStudents = await getStudents(cls.id);
      students.push(...classStudents);
    }

    setAllStudents(students);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/teacher/login' });
  };

  // 배지 관리 핸들러들
  const handleToggleBadgeVisibility = (badgeId: string) => {
    toggleBadgeVisibility(badgeId);
    setHiddenBadgeIds(loadHiddenBadges());
    toast.success('배지 표시 설정이 변경되었습니다');
  };

  const handleDeleteCustomBadge = (badgeId: string) => {
    deleteCustomBadge(badgeId);
    setCustomBadges(loadCustomBadges());
    toast.success('커스텀 배지가 삭제되었습니다');
  };

  const handleSaveCustomBadge = (badge: CustomBadge) => {
    const existingBadges = loadCustomBadges();
    const existingIndex = existingBadges.findIndex(b => b.id === badge.id);

    if (existingIndex >= 0) {
      // 기존 배지 수정
      existingBadges[existingIndex] = badge;
      toast.success('배지가 수정되었습니다');
    } else {
      // 새 배지 추가
      existingBadges.push(badge);
      toast.success('배지가 생성되었습니다');
    }

    saveCustomBadges(existingBadges);
    setCustomBadges(loadCustomBadges());
  };

  const handleRecalculateAll = async () => {
    try {
      const result = await recalculateAllStudentBadges(allStudents);
      toast.success(`${result.studentsUpdated}명의 학생에게 ${result.totalBadgesAwarded}개의 배지를 수여했습니다!`);

      // 학생 데이터 다시 로드
      await handleRefreshStudents();
    } catch (error) {
      console.error('배지 재계산 실패:', error);
      toast.error('배지 재계산에 실패했습니다');
    }
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

            {/* 우측: 학생 코드 + 학급 랭킹 + 배지 관리 + 설정 및 로그아웃 */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowStudentCodeModal(true)}
                size="sm"
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200 text-sm"
              >
                📋 학생코드
              </Button>
              <Button
                onClick={() => router.push('/teacher/dashboard?view=rankings')}
                size="sm"
                className="bg-rose-100 hover:bg-rose-200 text-rose-700 border-rose-200 text-sm"
              >
                🏅 학급 랭킹
              </Button>
              <Button
                onClick={() => setShowBadgeManagement(true)}
                size="sm"
                className="bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-200 text-sm"
              >
                🏆 배지관리
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
        teacherId={session?.user?.id || ''}
        onRefresh={handleRefreshStudents}
      />

      <BadgeManagementModal
        isOpen={showBadgeManagement}
        onClose={() => setShowBadgeManagement(false)}
        students={allStudents}
        customBadges={customBadges}
        hiddenBadgeIds={hiddenBadgeIds}
        onToggleBadgeVisibility={handleToggleBadgeVisibility}
        onDeleteCustomBadge={handleDeleteCustomBadge}
        onRecalculateAll={handleRecalculateAll}
        onSaveCustomBadge={handleSaveCustomBadge}
      />
    </>
  );
}
