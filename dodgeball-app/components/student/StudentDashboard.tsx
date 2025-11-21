'use client';

import { useState } from 'react';
import { Student } from '@/types';
import { StudentGameHistory } from './StudentGameHistory';
import { StudentClassRanking } from './StudentClassRanking';
import { StudentBadgeProgressModal } from './StudentBadgeProgressModal';

interface StudentDashboardProps {
  student: Student;
  onLogout: () => void;
}

export function StudentDashboard({ student, onLogout }: StudentDashboardProps) {
  const [showBadgeProgress, setShowBadgeProgress] = useState(false);

  // 배지 티어별 색상
  const getTierColor = (tier: number) => {
    const colors: Record<number, string> = {
      1: 'from-gray-200 to-gray-300',
      2: 'from-green-200 to-green-300',
      3: 'from-blue-200 to-blue-300',
      4: 'from-yellow-200 to-amber-300',
      5: 'from-purple-200 to-purple-300'
    };
    return colors[tier] || colors[1];
  };

  // 배지 티어 라벨
  const getTierLabel = (tier: number) => {
    const labels: Record<number, string> = {
      1: '입문',
      2: '숙련',
      3: '마스터',
      4: '레전드',
      5: '특별'
    };
    return labels[tier] || '입문';
  };

  // 배지 획득일 포맷팅
  const formatBadgeDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            {/* 왼쪽: 로그아웃 버튼 */}
            <button
              onClick={onLogout}
              className="bg-sky-100 hover:bg-sky-200 text-gray-800 px-6 py-3 rounded-lg font-bold transition shadow-lg hover:shadow-xl text-lg flex-shrink-0"
            >
              ← 로그아웃
            </button>

            {/* 가운데: 이름 */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-6 py-3 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-black whitespace-nowrap">
                  🎓 {student.name} <span className="text-xl text-gray-700">({student.classNumber}반 {student.number}번)</span>
                </h1>
              </div>
            </div>

            {/* 우측: 빈 공간 (레이아웃 균형) */}
            <div className="w-[140px] flex-shrink-0"></div>
          </div>
        </div>
        {/* 배지 컬렉션 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-lg">
              <h2 className="text-3xl font-bold text-black flex items-center gap-2">
                🏅 나의 배지
              </h2>
            </div>
            <button
              onClick={() => setShowBadgeProgress(true)}
              className="bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 px-4 py-2 rounded-lg font-bold text-gray-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              📊 진행도 보기
            </button>
          </div>
          {student.badges.length === 0 ? (
            <div className="text-center py-12 text-black">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-lg font-bold">아직 획득한 배지가 없습니다.</p>
              <p className="text-sm mt-2 font-bold">열심히 활동해서 배지를 모아보세요!</p>
            </div>
          ) : (
            <div className={`grid ${
              student.badges.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' :
              student.badges.length === 2 ? 'grid-cols-2 max-w-2xl mx-auto' :
              student.badges.length === 3 ? 'grid-cols-3 max-w-4xl mx-auto' :
              student.badges.length === 4 ? 'grid-cols-4 max-w-5xl mx-auto' :
              'grid-cols-5'
            } gap-4`}>
              {student.badges.map((badge, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-br ${getTierColor(badge.tier || 1)} p-5 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer`}
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <span className="text-5xl">{badge.emoji || '🏅'}</span>
                      <div className="text-left">
                        <div className="text-black font-bold text-base">
                          {badge.name || '배지'} <span className="text-black font-bold text-sm">({getTierLabel(badge.tier || 1)})</span>
                        </div>
                        {badge.awardedAt && (
                          <div className="text-xs text-gray-700 mt-1">
                            📅 {formatBadgeDate(badge.awardedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 경기 기록 */}
        <StudentGameHistory games={[]} />

        {/* 반 랭킹 */}
        <StudentClassRanking currentStudentId={student.id} classStudents={[]} />

        {/* 배지 진행도 모달 */}
        <StudentBadgeProgressModal
          isOpen={showBadgeProgress}
          onClose={() => setShowBadgeProgress(false)}
          progressData={[]}
        />
      </div>
    </div>
  );
}
