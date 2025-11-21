'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StudentCard } from '@/components/teacher/StudentCard';
import { calculateClassStats } from '@/lib/statsHelpers';
import type { Class, Student } from '@/types';

interface ClassDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: Class | null;
  students: Student[];
  onRandomTeamGeneration?: () => void;
}

/**
 * 학급 상세 정보를 모달로 표시하는 컴포넌트
 * - 학생 목록 (4열 그리드)
 * - 통계 정보 (총점, 배지)
 */
export function ClassDetailModal({
  isOpen,
  onClose,
  classData,
  students,
  onRandomTeamGeneration
}: ClassDetailModalProps) {
  if (!classData) return null;

  // 통계 계산 - statsHelpers 사용
  const classStats = calculateClassStats(students);
  const totalScore = classStats.totalHits + classStats.totalPasses + classStats.totalSacrifices + classStats.totalCookies;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[95vw] !max-h-[90vh] w-[95vw] flex flex-col">
        <DialogHeader className="flex-shrink-0 pr-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              {classData.name} 학생 목록
            </DialogTitle>
            {onRandomTeamGeneration && (
              <Button
                onClick={onRandomTeamGeneration}
                className="bg-green-500 hover:bg-green-600 text-white font-bold"
                size="sm"
              >
                🎲 랜덤 팀 생성 (2팀)
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* 학생 목록 (스크롤 영역) */}
        <div className="flex-1 overflow-y-auto pr-2 min-h-0">
          <div className="grid grid-cols-4 gap-3 pb-2">
            {students.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
              />
            ))}
          </div>
        </div>

        {/* 통계 정보 (하단 고정) */}
        <div className="flex-shrink-0 mt-4 pt-4 border-t-2 border-primary/20">
          <div className="flex items-center justify-center gap-6 py-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <span className="font-bold">{classStats.totalHits}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">✋</span>
              <span className="font-bold">{classStats.totalPasses}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">❤️</span>
              <span className="font-bold">{classStats.totalSacrifices}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🍪</span>
              <span className="font-bold">{classStats.totalCookies}</span>
            </div>
            <div className="flex items-center gap-2 ml-4 pl-4 border-l-2 border-blue-300">
              <span className="text-lg">📊</span>
              <span className="font-bold text-blue-600">
                총점: {totalScore}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <span className="font-bold text-yellow-600">
                배지: {classStats.totalBadges}개
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
