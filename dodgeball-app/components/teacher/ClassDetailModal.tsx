'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StudentCard } from '@/components/teacher/StudentCard';
import type { Class, Student } from '@/types';
import { X } from 'lucide-react';

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

  // 통계 계산
  const totalOuts = students.reduce((sum, s) => sum + (s.outs || 0), 0);
  const totalPasses = students.reduce((sum, s) => sum + (s.passes || 0), 0);
  const totalSacrifices = students.reduce((sum, s) => sum + (s.sacrifices || 0), 0);
  const totalCookies = students.reduce((sum, s) => sum + (s.cookies || 0), 0);
  const totalScore = totalOuts + totalPasses + totalSacrifices + totalCookies;
  const totalBadges = students.reduce((sum, s) => sum + (s.badges?.length || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[95vw] !max-h-[90vh] w-[95vw] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              {classData.name} 학생 목록
            </DialogTitle>
            <div className="flex items-center gap-2">
              {onRandomTeamGeneration && (
                <Button
                  onClick={onRandomTeamGeneration}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold"
                  size="sm"
                >
                  🎲 랜덤 팀 생성 (2팀)
                </Button>
              )}
              <button
                onClick={onClose}
                className="rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
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
              <span className="font-bold">{totalOuts}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">✋</span>
              <span className="font-bold">{totalPasses}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">❤️</span>
              <span className="font-bold">{totalSacrifices}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🍪</span>
              <span className="font-bold">{totalCookies}</span>
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
                배지: {totalBadges}개
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
