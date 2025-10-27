'use client';

import { useEffect, useState } from 'react';
import { Class, Student } from '@/types';
import { getStudents } from '@/lib/dataService';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';

interface AddClassStudentsModalProps {
  currentClassId: string;
  teacherClasses: Class[];
  onConfirm: (studentIds: string[], sourceClassId: string) => void;
  onCancel: () => void;
}

export function AddClassStudentsModal({
  currentClassId,
  teacherClasses,
  onConfirm,
  onCancel
}: AddClassStudentsModalProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // 학급 선택 시 해당 학급의 학생 목록 로드
  useEffect(() => {
    if (selectedClassId) {
      loadClassStudents(selectedClassId);
    }
  }, [selectedClassId]);

  const loadClassStudents = async (classId: string) => {
    setLoading(true);
    try {
      const students = await getStudents(classId);
      setClassStudents(students);
      setSelectedStudentIds(new Set()); // 학급 변경 시 선택 초기화
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setSelectedStudentIds(newSet);
  };

  const toggleAll = () => {
    if (selectedStudentIds.size === classStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(classStudents.map(s => s.id)));
    }
  };

  const handleConfirm = () => {
    if (selectedStudentIds.size === 0) {
      alert('학생을 선택해주세요.');
      return;
    }
    if (!selectedClassId) {
      alert('학급을 선택해주세요.');
      return;
    }
    onConfirm(Array.from(selectedStudentIds), selectedClassId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">다른 학급 학생 추가</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 학급 선택 */}
          <div>
            <h3 className="font-bold mb-3 text-gray-700">학급 선택</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
              {teacherClasses.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  다른 학급이 없습니다.
                </p>
              ) : (
                teacherClasses.map((cls) => (
                  <label
                    key={cls.id}
                    className={`flex items-center gap-3 p-3 rounded cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedClassId === cls.id ? 'bg-blue-50 border border-blue-300' : 'border border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="class"
                      value={cls.id}
                      checked={selectedClassId === cls.id}
                      onChange={() => setSelectedClassId(cls.id)}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">{cls.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* 학생 목록 */}
          {selectedClassId && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-700">
                  {teacherClasses.find(c => c.id === selectedClassId)?.name} 학생 목록
                </h3>
                {classStudents.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAll}
                    className="text-xs"
                  >
                    {selectedStudentIds.size === classStudents.length ? '전체 해제' : '전체 선택'}
                  </Button>
                )}
              </div>

              {loading ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  학생 목록을 불러오는 중...
                </p>
              ) : classStudents.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  학생이 없습니다.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                  {classStudents.map((student) => (
                    <label
                      key={student.id}
                      className="flex items-center gap-3 p-3 rounded cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200"
                    >
                      <Checkbox
                        checked={selectedStudentIds.has(student.id)}
                        onCheckedChange={() => toggleStudent(student.id)}
                      />
                      <span className="font-medium">{student.name}</span>
                      <span className="text-sm text-gray-500">({student.number}번)</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 선택 요약 */}
          {selectedStudentIds.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800">
                선택됨: <span className="font-bold">{selectedStudentIds.size}명</span>
              </p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedStudentIds.size === 0}
          >
            추가
          </Button>
        </div>
      </div>
    </div>
  );
}
