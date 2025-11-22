'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClass, createStudent } from '@/lib/dataService';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  classId?: string; // 기존 학급에 학생 추가 시 사용
  onClassCreated?: (classId: string) => void;
}

export default function CreateClassModal({
  isOpen,
  onClose,
  teacherId,
  classId,
  onClassCreated,
}: CreateClassModalProps) {
  const isEditMode = !!classId;

  // 학급 정보
  const [year, setYear] = useState(2025);
  const [grade, setGrade] = useState(5);
  const [classNumber, setClassNumber] = useState(1);

  // 학생 추가 옵션
  const [inputMethod, setInputMethod] = useState<'text' | 'csv'>('text');
  const [bulkStudentText, setBulkStudentText] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // 상태
  const [isCreating, setIsCreating] = useState(false);

  const handleClose = () => {
    // 초기화
    setYear(2025);
    setGrade(5);
    setClassNumber(1);
    setBulkStudentText('');
    setCsvFile(null);
    onClose();
  };

  const handleBulkAddStudents = async (targetClassId: string) => {
    const lines = bulkStudentText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) return;

    // 각 줄을 학생으로 생성
    for (let i = 0; i < lines.length; i++) {
      const name = lines[i];
      await createStudent(targetClassId, {
        name,
        number: i + 1, // 1부터 시작
        gender: 'male', // 기본값
        badges: [],
        earnedBadges: []
      });
    }
  };

  const handleCsvUpload = async (targetClassId: string) => {
    if (!csvFile) return;

    const text = await csvFile.text();
    const lines = text.split('\n').filter(line => line.trim());

    // 첫 줄은 헤더로 건너뛰기
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(col => col.trim());

      if (cols.length < 2) continue; // 최소 번호, 이름 필요

      const number = parseInt(cols[0]) || i;
      const name = cols[1];
      const gender = (cols[2]?.toLowerCase() === 'female' || cols[2] === '여') ? 'female' : 'male';

      await createStudent(targetClassId, {
        name,
        number,
        gender,
        badges: [],
        earnedBadges: []
      });
    }
  };

  const downloadCsvTemplate = () => {
    const csvContent = '번호,이름,성별\n1,김철수,남\n2,이영희,여\n3,박민수,남';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '학생_목록_템플릿.csv';
    link.click();
  };

  const handleCreate = async () => {
    // 학생 추가 옵션 검증 (텍스트나 CSV 중 하나라도 있어야 함)
    const hasStudentData = bulkStudentText.trim() || csvFile;

    if (!hasStudentData) {
      alert('학생 정보를 입력해주세요.');
      return;
    }

    if (inputMethod === 'text' && !bulkStudentText.trim()) {
      alert('학생 이름을 입력해주세요.');
      return;
    }
    if (inputMethod === 'csv' && !csvFile) {
      alert('CSV 파일을 선택해주세요.');
      return;
    }

    setIsCreating(true);

    try {
      let targetClassId = classId;

      // 1. 학급 생성 (편집 모드가 아닐 때만)
      if (!isEditMode) {
        const className = `${year}학년도 ${grade}학년 ${classNumber}반`;
        targetClassId = await createClass(teacherId, {
          name: className,
          year,
          isArchived: false
        });
      }

      // 2. 학생 추가
      if (targetClassId) {
        if (inputMethod === 'text') {
          await handleBulkAddStudents(targetClassId);
        } else if (inputMethod === 'csv') {
          await handleCsvUpload(targetClassId);
        }
      }

      // 3. 성공 콜백
      onClassCreated?.(targetClassId!);
      handleClose();
    } catch (error) {
      console.error('Failed to create class:', error);
      alert(isEditMode ? '학생 추가에 실패했습니다.' : '학급 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isEditMode ? '학생 추가' : '새 학급 만들기'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 학급 기본 정보 (편집 모드가 아닐 때만 표시) */}
          {!isEditMode && (
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-lg font-semibold">학급 기본 정보</h3>
              </div>

              {/* 학년도, 학년, 반 - 가로 레이아웃 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">학년도</span>
                <span className="text-gray-400">|</span>
                <Input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  min={2020}
                  max={2030}
                  className="w-24"
                  required
                />
                <span className="text-gray-400">|</span>
                <Input
                  id="grade"
                  type="number"
                  value={grade}
                  onChange={(e) => setGrade(parseInt(e.target.value))}
                  min={1}
                  max={6}
                  className="w-16"
                  required
                />
                <span className="text-sm font-medium">학년</span>
                <span className="text-gray-400">|</span>
                <Input
                  id="classNumber"
                  type="number"
                  value={classNumber}
                  onChange={(e) => setClassNumber(parseInt(e.target.value))}
                  min={1}
                  max={20}
                  className="w-16"
                  required
                />
                <span className="text-sm font-medium">반</span>
              </div>
            </div>
          )}

          {/* 학생 추가 섹션 */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-lg font-semibold">학생 추가</h3>
            </div>

            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                {/* 입력 방식 선택 */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={inputMethod === 'text' ? 'default' : 'outline'}
                    onClick={() => setInputMethod('text')}
                    className="flex-1"
                  >
                    📝 텍스트 일괄
                  </Button>
                  <Button
                    type="button"
                    variant={inputMethod === 'csv' ? 'default' : 'outline'}
                    onClick={() => setInputMethod('csv')}
                    className="flex-1"
                  >
                    📄 CSV 업로드
                  </Button>
                </div>

                {/* 텍스트 일괄 입력 */}
                {inputMethod === 'text' && (
                  <div>
                    <Label htmlFor="bulkText" className="mb-2 block">
                      학생 이름 입력 (한 줄에 한 명씩)
                    </Label>
                    <Textarea
                      id="bulkText"
                      value={bulkStudentText}
                      onChange={(e) => setBulkStudentText(e.target.value)}
                      placeholder={'김철수\n이영희\n박민수'}
                      rows={8}
                      className="font-mono mt-2"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      * 줄바꿈으로 학생을 구분합니다.
                    </p>
                  </div>
                )}

                {/* CSV 업로드 */}
                {inputMethod === 'csv' && (
                  <div className="space-y-3">
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={downloadCsvTemplate}
                        className="w-full"
                      >
                        📥 샘플 파일 다운로드
                      </Button>
                    </div>

                    <div>
                      <Label htmlFor="csvFile">CSV 파일 선택</Label>
                      <Input
                        id="csvFile"
                        type="file"
                        accept=".csv"
                        onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      />
                    </div>

                    <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                      <p className="font-semibold mb-1">파일 형식 안내:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>첫 줄은 헤더 (번호,이름,성별)</li>
                        <li>성별: 남/여 또는 male/female</li>
                        <li>예: 1,김철수,남</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isCreating}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              className="flex-1"
              disabled={isCreating}
            >
              {isCreating
                ? '처리 중...'
                : isEditMode
                ? '학생 추가'
                : '학급 생성'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
