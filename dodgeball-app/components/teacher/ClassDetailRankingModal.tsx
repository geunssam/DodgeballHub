'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClassRankingData, Student } from '@/types';
import { getClasses, getStudents, getCurrentTeacherId } from '@/lib/dataService';

interface ClassDetailRankingModalProps {
  classData: ClassRankingData;
  isOpen: boolean;
  onClose: () => void;
}

interface StudentRankingData {
  studentId: string;
  name: string;
  number: number;
  hits: number;
  passes: number;
  sacrifices: number;
  cookies: number;
  totalPoints: number;
  badgeCount: number;
}

/**
 * 학급 상세 랭킹 모달
 * - 선택한 학급의 학생별 개별 랭킹 표시
 * - 상위 3명은 노란색 배경으로 하이라이트
 */
export function ClassDetailRankingModal({
  classData,
  isOpen,
  onClose,
}: ClassDetailRankingModalProps) {
  const [students, setStudents] = useState<StudentRankingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && classData) {
      loadStudentRankings();
    }
  }, [isOpen, classData]);

  const loadStudentRankings = async () => {
    try {
      setLoading(true);

      const teacherId = getCurrentTeacherId();
      if (!teacherId) {
        console.warn('⚠️ 로그인 정보 없음');
        return;
      }

      // 해당 학급의 모든 학생 가져오기
      const classes = await getClasses(teacherId);
      const targetClass = classes.find(c => c.name === classData.className);

      if (!targetClass) {
        console.warn('⚠️ 학급을 찾을 수 없음:', classData.className);
        setStudents([]);
        return;
      }

      const classStudents = await getStudents(targetClass.id);

      if (classStudents.length === 0) {
        setStudents([]);
        return;
      }

      // StudentRankingData 형식으로 변환 (student.stats 직접 사용)
      const studentRankings: StudentRankingData[] = classStudents.map((student) => {
        const stats = student.stats || {
          hits: 0,
          passes: 0,
          sacrifices: 0,
          cookies: 0,
        };

        return {
          studentId: student.id,
          name: student.name,
          number: student.number,
          hits: stats.hits || 0,
          passes: stats.passes || 0,
          sacrifices: stats.sacrifices || 0,
          cookies: stats.cookies || 0,
          totalPoints:
            (stats.hits || 0) +
            (stats.passes || 0) +
            (stats.sacrifices || 0) +
            (stats.cookies || 0),
          badgeCount: student.badges?.length || 0,
        };
      });

      // 총점 기준 내림차순 정렬
      studentRankings.sort((a, b) => b.totalPoints - a.totalPoints);

      console.log('📊 [ClassDetailRankingModal] 학생별 랭킹:', studentRankings);

      setStudents(studentRankings);
    } catch (error) {
      console.error('❌ 학생 랭킹 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <span>🏅</span>
            <span>{classData.className} 학생별 랭킹</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-lg">로딩 중...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-lg">학생 데이터가 없습니다.</p>
          </div>
        ) : (
          <div className="mt-4">
            {/* 학급 통계 요약 */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-5 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600 mb-1">학생 수</div>
                  <div className="text-2xl font-bold text-blue-600">{classData.studentCount}명</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">총 아웃</div>
                  <div className="text-2xl font-bold text-red-600">{classData.totalOuts}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">총 패스</div>
                  <div className="text-2xl font-bold text-blue-600">{classData.totalPasses}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">총 희생</div>
                  <div className="text-2xl font-bold text-purple-600">{classData.totalSacrifices}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">총 쿠키</div>
                  <div className="text-2xl font-bold text-orange-600">{classData.totalCookies}</div>
                </div>
              </div>
            </div>

            {/* 학생별 랭킹 테이블 */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left text-base font-bold">순위</th>
                    <th className="p-3 text-left text-base font-bold">번호</th>
                    <th className="p-3 text-left text-base font-bold">이름</th>
                    <th className="p-3 text-center text-base font-bold">총점</th>
                    <th className="p-3 text-center text-base font-bold">⚾ 아웃</th>
                    <th className="p-3 text-center text-base font-bold">🏃 패스</th>
                    <th className="p-3 text-center text-base font-bold">🛡️ 희생</th>
                    <th className="p-3 text-center text-base font-bold">🍪 쿠키</th>
                    <th className="p-3 text-center text-base font-bold">🏆 배지</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => {
                    const isTopThree = index < 3;
                    return (
                      <tr
                        key={student.studentId}
                        className={`border-t ${
                          isTopThree
                            ? 'bg-yellow-50 font-semibold'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="p-3 text-base">
                          {index === 0 && <span className="text-2xl">🥇</span>}
                          {index === 1 && <span className="text-2xl">🥈</span>}
                          {index === 2 && <span className="text-2xl">🥉</span>}
                          {index > 2 && <span className="text-gray-600">{index + 1}위</span>}
                        </td>
                        <td className="p-3 text-base">{student.number}</td>
                        <td className="p-3 text-base">{student.name}</td>
                        <td className="p-3 text-center text-lg font-bold text-blue-600">
                          {student.totalPoints}
                        </td>
                        <td className="p-3 text-center text-base">{student.hits}</td>
                        <td className="p-3 text-center text-base">{student.passes}</td>
                        <td className="p-3 text-center text-base">{student.sacrifices}</td>
                        <td className="p-3 text-center text-base">{student.cookies}</td>
                        <td className="p-3 text-center text-base">{student.badgeCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
