'use client';

import { Student } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StudentCodeCard } from './StudentCodeCard';

interface ClassStudentCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  className: string;
  students: Student[];
}

/**
 * 학급 상세 모달 (2차 모달)
 * 선택한 학급의 모든 학생 코드 표시
 * baseball-firebase의 ClassStudentCodesModal.jsx 이식
 */
export function ClassStudentCodesModal({
  isOpen,
  onClose,
  className,
  students,
}: ClassStudentCodesModalProps) {
  // 코드 없는 학생 수 계산
  const noCodeCount = students.filter(s => !s.studentCode).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            📚 {className} 학급 학생 코드 ({students.length}명)
            {noCodeCount > 0 && (
              <span className="ml-2 text-base font-normal text-yellow-600">
                ⚠️ 코드 없음: {noCodeCount}명
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* 학생 카드 그리드 */}
        <div className="max-h-[75vh] overflow-y-auto">
          {students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              학생이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {students.map((student) => (
                <StudentCodeCard key={student.id} student={student} />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
