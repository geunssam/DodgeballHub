'use client';

import { useState, useMemo } from 'react';
import { Student } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClassStudentCodesModal } from './ClassStudentCodesModal';
import { generateStudentCode } from '@/lib/studentCodeGenerator';
import { generateStudentCodes } from '@/lib/dataService';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface StudentCodeListModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  teacherId: string;
  onRefresh?: () => void; // 코드 생성 후 데이터 새로고침
}

/**
 * 학급 목록 모달 (1차 모달)
 * 학급별 그룹화, 검색, 코드 일괄 생성 기능
 * baseball-firebase의 StudentCodeListModal.jsx 이식
 */
export function StudentCodeListModal({
  isOpen,
  onClose,
  students,
  teacherId,
  onRefresh,
}: StudentCodeListModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<{
    className: string;
    students: Student[];
  } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  // 학급별 그룹화
  const studentsByClass = useMemo(() => {
    const grouped: Record<string, Student[]> = {};

    students.forEach((student) => {
      // 학급명을 className에서 추출하거나, 없으면 "반번호"로 표시
      const className = getClassNameForStudent(student);

      if (!grouped[className]) {
        grouped[className] = [];
      }
      grouped[className].push(student);
    });

    return grouped;
  }, [students]);

  // 학생의 학급명 가져오기 (classNumber 기반)
  function getClassNameForStudent(student: Student): string {
    if (student.classNumber) {
      return `${student.classNumber}반`;
    }
    return '미분류';
  }

  // 검색 필터링
  const filteredStudentsByClass = useMemo(() => {
    if (!searchQuery.trim()) return studentsByClass;

    const filtered: Record<string, Student[]> = {};
    Object.entries(studentsByClass).forEach(([className, classStudents]) => {
      const matchedStudents = classStudents.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matchedStudents.length > 0) {
        filtered[className] = matchedStudents;
      }
    });
    return filtered;
  }, [studentsByClass, searchQuery]);

  // 코드 없는 학생 감지
  const studentsWithoutCode = useMemo(() => {
    return students.filter((s) => !s.studentCode);
  }, [students]);

  // 코드 일괄 생성
  const handleGenerateMissingCodes = async () => {
    if (studentsWithoutCode.length === 0) return;

    const confirmed = confirm(
      `${studentsWithoutCode.length}명의 학생에게 코드를 생성하시겠습니까?`
    );
    if (!confirmed) return;

    setGenerating(true);
    setProgress({ current: 0, total: studentsWithoutCode.length });

    try {
      // 코드 일괄 생성
      await generateStudentCodes(teacherId, studentsWithoutCode, generateStudentCode);

      // 진행률 표시 (시뮬레이션)
      for (let i = 0; i <= studentsWithoutCode.length; i++) {
        setProgress({ current: i, total: studentsWithoutCode.length });
        await new Promise((resolve) => setTimeout(resolve, 50)); // 50ms 딜레이
      }

      toast.success(`✅ 코드 생성 완료! ${studentsWithoutCode.length}명`);

      // 데이터 새로고침
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('코드 생성 실패:', error);
      toast.error('코드 생성에 실패했습니다');
    } finally {
      setGenerating(false);
      setProgress(null);
    }
  };

  // 학급 선택
  const openClassModal = (className: string) => {
    const classStudents = studentsByClass[className] || [];
    setSelectedClass({ className, students: classStudents });
  };

  return (
    <>
      {/* 1차 모달: 학급 목록 */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              🔑 학생 코드 관리 ({students.length}명)
            </DialogTitle>
          </DialogHeader>

          {/* 코드 없는 학생 경고 */}
          {studentsWithoutCode.length > 0 && (
            <Alert variant="warning" className="mb-4">
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    ⚠️ {studentsWithoutCode.length}명의 학생에게 코드가 없습니다
                  </span>
                  <Button
                    size="sm"
                    onClick={handleGenerateMissingCodes}
                    disabled={generating}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    {generating
                      ? `생성 중... (${progress?.current}/${progress?.total})`
                      : '🔄 코드 일괄 생성'}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 검색 */}
          <div className="mb-4">
            <div className="relative">
              <Input
                placeholder="학생 이름 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="검색어 지우기"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 학급 카드 그리드 */}
          <div className="max-h-[60vh] overflow-y-auto">
            {Object.keys(filteredStudentsByClass).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery
                  ? '검색 결과가 없습니다.'
                  : '학생이 없습니다.'}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Object.entries(filteredStudentsByClass).map(
                  ([className, classStudents]) => {
                    const hasWarning = classStudents.some((s) => !s.studentCode);

                    return (
                      <button
                        key={className}
                        onClick={() => openClassModal(className)}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all hover:shadow-md ${
                          hasWarning
                            ? 'bg-yellow-50 border-yellow-300 text-yellow-800'
                            : 'bg-blue-50 border-blue-300 text-blue-800'
                        }`}
                      >
                        {className} ({classStudents.length}명)
                        {hasWarning && ' ⚠️'}
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 2차 모달: 학급 상세 */}
      {selectedClass && (
        <ClassStudentCodesModal
          isOpen={!!selectedClass}
          onClose={() => setSelectedClass(null)}
          className={selectedClass.className}
          students={selectedClass.students}
        />
      )}
    </>
  );
}
