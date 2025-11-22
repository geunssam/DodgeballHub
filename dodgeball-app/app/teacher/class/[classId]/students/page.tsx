'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getClassById, getStudents, createStudent, deleteStudent, updateStudent } from '@/lib/dataService';
import { Class, Student } from '@/types';
import { StudentCard } from '@/components/teacher/StudentCard';
import { loadCustomBadges, recalculateAllStudentBadges } from '@/lib/badgeHelpers';
import { calculateClassStats, formatStatsWithIcons } from '@/lib/statsHelpers';

export default function StudentsPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;

  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [inputMethod, setInputMethod] = useState<'manual' | 'text' | 'csv' | null>(null);

  // 커스텀 배지
  const [customBadges, setCustomBadges] = useState(loadCustomBadges());

  // 개별 추가 폼 상태
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNumber, setNewStudentNumber] = useState(1);

  // 텍스트 일괄 입력 폼 상태
  const [bulkStudentText, setBulkStudentText] = useState('');

  // CSV 업로드 상태
  const [csvFile, setCsvFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    try {
      const [classInfo, studentList] = await Promise.all([
        getClassById(classId),
        getStudents(classId)
      ]);

      if (!classInfo) {
        alert('학급을 찾을 수 없습니다.');
        router.push('/teacher/dashboard');
        return;
      }

      setClassData(classInfo);
      setStudents(studentList.sort((a, b) => a.number - b.number));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newStudentName.trim()) {
      alert('학생 이름을 입력해주세요.');
      return;
    }

    if (!classData) return;

    try {
      // 접속코드 생성: "반번호-출석번호-이름"
      const accessCode = `${classData.name.split(' ')[1]?.replace('반', '')}-${newStudentNumber}-${newStudentName}`;

      await createStudent({
        classId,
        name: newStudentName,
        number: newStudentNumber,
        classNumber: parseInt(classData.name.split(' ')[1]?.replace('반', '') || '1'),
        accessCode,
        stats: {
          hits: 0,
          passes: 0,
          sacrifices: 0,
          cookies: 0,
          gamesPlayed: 0,
          totalScore: 0
        },
        badges: []
      });

      // 폼 초기화
      setNewStudentName('');
      setNewStudentNumber(students.length + 2);
      setInputMethod(null);
      setShowAddModal(false);

      // 목록 새로고침
      await loadData();
    } catch (error) {
      console.error('Failed to add student:', error);
      alert('학생 추가에 실패했습니다.');
    }
  };

  const handleBulkAddStudents = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bulkStudentText.trim()) {
      alert('학생 목록을 입력해주세요.');
      return;
    }

    if (!classData) return;

    try {
      // 줄바꿈으로 구분된 학생 이름 파싱
      const lines = bulkStudentText.trim().split('\n');
      const studentsToAdd = lines
        .map((line, index) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          // "번호 이름" 또는 "이름" 형식 지원
          const parts = trimmed.split(/\s+/);
          let number: number;
          let name: string;

          if (parts.length === 2 && !isNaN(parseInt(parts[0]))) {
            // "1 김철수" 형식
            number = parseInt(parts[0]);
            name = parts[1];
          } else {
            // "김철수" 형식 - 자동 번호 할당
            number = students.length + index + 1;
            name = trimmed;
          }

          return { number, name };
        })
        .filter(Boolean) as { number: number; name: string }[];

      if (studentsToAdd.length === 0) {
        alert('유효한 학생 정보가 없습니다.');
        return;
      }

      // 모든 학생 추가 (중복 ID 방지를 위해 각 생성 사이 지연)
      for (let i = 0; i < studentsToAdd.length; i++) {
        const student = studentsToAdd[i];
        const accessCode = `${classData.name.split(' ')[1]?.replace('반', '')}-${student.number}-${student.name}`;

        await createStudent({
          classId,
          name: student.name,
          number: student.number,
          classNumber: parseInt(classData.name.split(' ')[1]?.replace('반', '') || '1'),
          accessCode,
          stats: {
            hits: 0,
            passes: 0,
            sacrifices: 0,
            cookies: 0,
            gamesPlayed: 0,
            totalScore: 0
          },
          badges: []
        });

        // 마지막 학생 제외하고 1ms 대기 (ID 고유성 보장)
        if (i < studentsToAdd.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }

      // 폼 초기화
      setBulkStudentText('');
      setInputMethod(null);
      setShowAddModal(false);
      await loadData();

      alert(`${studentsToAdd.length}명의 학생이 추가되었습니다.`);
    } catch (error) {
      console.error('Failed to add students:', error);
      alert('학생 추가에 실패했습니다.');
    }
  };

  const downloadCsvTemplate = () => {
    // 현재 학급 정보 가져오기
    const currentYear = classData?.year || 2025;
    const className = classData?.name || '5학년 3반';
    const gradePart = className.split('학년')[0] || '5';
    const classPart = className.split(' ')[1]?.replace('반', '') || '3';

    // CSV 템플릿 생성
    const csvContent = `학년,반,번호,이름
${gradePart},${classPart},1,김철수
${gradePart},${classPart},2,이영희
${gradePart},${classPart},3,박민수
${gradePart},${classPart},4,최지훈
${gradePart},${classPart},5,정수진
${gradePart},${classPart},6,강민호
${gradePart},${classPart},7,윤서연
${gradePart},${classPart},8,임동현
${gradePart},${classPart},9,한예린
${gradePart},${classPart},10,오태양`;

    // BOM 추가 (한글 깨짐 방지)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentYear}학년도_${gradePart}학년_${classPart}반_학생명단_샘플.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!csvFile) {
      alert('CSV 파일을 선택해주세요.');
      return;
    }

    if (!classData) return;

    try {
      const text = await csvFile.text();
      const lines = text.trim().split('\n');

      // CSV 파싱: 첫 줄은 헤더로 건너뛰기 (선택사항)
      const hasHeader = lines[0].includes('학년') || lines[0].includes('반') || lines[0].includes('번호') || lines[0].includes('이름') ||
                        lines[0].includes('number') || lines[0].includes('name') || lines[0].includes('grade') || lines[0].includes('class');
      const dataLines = hasHeader ? lines.slice(1) : lines;

      const studentsToAdd = dataLines
        .map((line, index) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          // CSV는 쉼표로 구분
          const parts = trimmed.split(',').map(p => p.trim());
          let number: number;
          let name: string;

          // 형식 1: "학년,반,번호,이름" (4개 필드)
          if (parts.length === 4) {
            // parts[0] = 학년, parts[1] = 반, parts[2] = 번호, parts[3] = 이름
            number = parseInt(parts[2]);
            name = parts[3];
          }
          // 형식 2: "반,번호,이름" (3개 필드)
          else if (parts.length === 3 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
            // parts[0] = 반, parts[1] = 번호, parts[2] = 이름
            number = parseInt(parts[1]);
            name = parts[2];
          }
          // 형식 3: "번호,이름" (2개 필드)
          else if (parts.length === 2) {
            const firstPart = parts[0];
            if (!isNaN(parseInt(firstPart))) {
              number = parseInt(firstPart);
              name = parts[1];
            } else {
              // "이름,번호" 형식
              name = firstPart;
              number = !isNaN(parseInt(parts[1])) ? parseInt(parts[1]) : students.length + index + 1;
            }
          }
          // 형식 4: "이름" (1개 필드 - 자동 번호)
          else if (parts.length === 1) {
            name = parts[0];
            number = students.length + index + 1;
          } else {
            return null;
          }

          return { number, name };
        })
        .filter(Boolean) as { number: number; name: string }[];

      if (studentsToAdd.length === 0) {
        alert('CSV 파일에서 유효한 학생 정보를 찾을 수 없습니다.');
        return;
      }

      // 모든 학생 추가 (중복 ID 방지를 위해 각 생성 사이 지연)
      for (let i = 0; i < studentsToAdd.length; i++) {
        const student = studentsToAdd[i];
        const accessCode = `${classData.name.split(' ')[1]?.replace('반', '')}-${student.number}-${student.name}`;

        await createStudent({
          classId,
          name: student.name,
          number: student.number,
          classNumber: parseInt(classData.name.split(' ')[1]?.replace('반', '') || '1'),
          accessCode,
          stats: {
            hits: 0,
            passes: 0,
            sacrifices: 0,
            cookies: 0,
            gamesPlayed: 0,
            totalScore: 0
          },
          badges: []
        });

        // 마지막 학생 제외하고 1ms 대기 (ID 고유성 보장)
        if (i < studentsToAdd.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }

      // 폼 초기화
      setCsvFile(null);
      setInputMethod(null);
      setShowAddModal(false);
      await loadData();

      alert(`${studentsToAdd.length}명의 학생이 추가되었습니다.`);
    } catch (error) {
      console.error('Failed to upload CSV:', error);
      alert('CSV 파일 업로드에 실패했습니다.');
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`${studentName} 학생을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteStudent(studentId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete student:', error);
      alert('학생 삭제에 실패했습니다.');
    }
  };

  const handleToggleGender = async (student: Student) => {
    const currentGender = student.gender;
    const newGender: 'male' | 'female' | undefined =
      currentGender === 'male' ? 'female' :
      currentGender === 'female' ? undefined :
      'male';

    try {
      await updateStudent(student.id, { ...student, gender: newGender });
      await loadData();
    } catch (error) {
      console.error('Failed to toggle gender:', error);
      alert('성별 변경에 실패했습니다.');
    }
  };

  // 배지 재계산 핸들러
  const handleRecalculateBadges = async () => {
    if (!students || students.length === 0) {
      alert('재계산할 학생이 없습니다.');
      return;
    }

    const confirmed = confirm(
      `전체 ${students.length}명의 학생 배지를 재계산하시겠습니까?\n\n` +
      '현재 누적 스탯을 기반으로 받지 못한 배지를 자동 수여합니다.\n' +
      '이미 받은 배지는 그대로 유지됩니다.'
    );

    if (!confirmed) return;

    try {
      console.log('🚀 배지 재계산 시작...');
      const { totalBadgesAwarded, studentsUpdated } = await recalculateAllStudentBadges(students);

      alert(
        `배지 재계산이 완료되었습니다!\n\n` +
        `✅ 업데이트된 학생 수: ${studentsUpdated}명\n` +
        `🏆 총 수여된 배지: ${totalBadgesAwarded}개`
      );

      // 데이터 새로고침
      await loadData();
    } catch (error) {
      console.error('❌ 배지 재계산 실패:', error);
      alert('배지 재계산에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
      <main className="flex-grow p-6">
        <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {classData?.name} 학생 관리
            </h1>
            <p className="text-gray-600">총 {students.length}명</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRecalculateBadges}
              className="bg-amber-50 hover:bg-amber-100 border-amber-300"
            >
              🏆 배지 재계산
            </Button>
            <Link href="/teacher/dashboard">
              <Button variant="outline">대시보드로</Button>
            </Link>
          </div>
        </div>

        {/* 학생 추가 버튼 */}
        <div className="mb-6 space-y-4">
          {!showAddModal ? (
            <Button onClick={() => setShowAddModal(true)}>
              + 학생 추가
            </Button>
          ) : (
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">학생 추가 방법 선택</h3>

              {!inputMethod ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                    onClick={() => {
                      setInputMethod('manual');
                      setNewStudentNumber(students.length + 1);
                    }}
                  >
                    <span className="text-2xl">👤</span>
                    <span>개별 입력</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                    onClick={() => setInputMethod('text')}
                  >
                    <span className="text-2xl">📝</span>
                    <span>텍스트 일괄 입력</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                    onClick={() => setInputMethod('csv')}
                  >
                    <span className="text-2xl">📄</span>
                    <span>CSV 파일 업로드</span>
                  </Button>
                </div>
              ) : null}

              {inputMethod === 'manual' && (
                <form onSubmit={handleAddStudent} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="studentName">이름</Label>
                      <Input
                        id="studentName"
                        type="text"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        placeholder="학생 이름"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="studentNumber">출석번호</Label>
                      <Input
                        id="studentNumber"
                        type="number"
                        value={newStudentNumber}
                        onChange={(e) => setNewStudentNumber(parseInt(e.target.value))}
                        min={1}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setInputMethod(null);
                        setNewStudentName('');
                      }}
                      className="flex-1"
                    >
                      뒤로
                    </Button>
                    <Button type="submit" className="flex-1">
                      추가
                    </Button>
                  </div>
                </form>
              )}

              {inputMethod === 'text' && (
                <form onSubmit={handleBulkAddStudents} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="bulkStudentText">학생 목록</Label>
                    <textarea
                      id="bulkStudentText"
                      value={bulkStudentText}
                      onChange={(e) => setBulkStudentText(e.target.value)}
                      placeholder="한 줄에 한 명씩 입력하세요.&#10;&#10;예시 1 (이름만):&#10;김철수&#10;이영희&#10;박민수&#10;&#10;예시 2 (번호 + 이름):&#10;1 김철수&#10;2 이영희&#10;3 박민수"
                      className="w-full min-h-[200px] p-3 border rounded-md font-mono text-sm"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      💡 이름만 입력하면 자동으로 번호가 할당됩니다.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setInputMethod(null);
                        setBulkStudentText('');
                      }}
                      className="flex-1"
                    >
                      뒤로
                    </Button>
                    <Button type="submit" className="flex-1">
                      일괄 추가
                    </Button>
                  </div>
                </form>
              )}

              {inputMethod === 'csv' && (
                <form onSubmit={handleCsvUpload} className="space-y-4 mt-4">
                  {/* CSV 템플릿 다운로드 */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-bold text-green-900 mb-1">
                          📥 CSV 샘플 파일 다운로드
                        </p>
                        <p className="text-sm text-green-700">
                          어떻게 작성해야 할지 모르겠다면 샘플 파일을 다운로드하세요.
                          샘플 파일을 열어서 학생 정보를 수정한 후 업로드하면 됩니다.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={downloadCsvTemplate}
                        className="whitespace-nowrap bg-white hover:bg-green-50"
                      >
                        📄 샘플 다운로드
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="csvFile">CSV 파일 선택</Label>
                    <input
                      id="csvFile"
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="w-full p-3 border rounded-md"
                      required
                    />
                    {csvFile && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ 선택된 파일: {csvFile.name}
                      </p>
                    )}
                  </div>

                  <div className="p-4 bg-blue-50 rounded-md text-sm space-y-3">
                    <p className="font-bold text-blue-900">📌 CSV 파일 형식 안내</p>

                    <div className="space-y-2">
                      <p className="text-blue-700">
                        <strong>✅ 권장 형식:</strong> 학년,반,번호,이름<br />
                        <code className="bg-white px-2 py-1 rounded text-xs block mt-1">
                          학년,반,번호,이름<br />
                          5,3,1,김철수<br />
                          5,3,2,이영희
                        </code>
                      </p>

                      <p className="text-blue-700">
                        <strong>형식 2:</strong> 번호,이름<br />
                        <code className="bg-white px-2 py-1 rounded text-xs block mt-1">
                          1,김철수<br />
                          2,이영희
                        </code>
                      </p>

                      <p className="text-blue-700">
                        <strong>형식 3:</strong> 이름만 (자동 번호)<br />
                        <code className="bg-white px-2 py-1 rounded text-xs block mt-1">
                          김철수<br />
                          이영희
                        </code>
                      </p>
                    </div>

                    <p className="text-blue-700 text-xs mt-2 pt-2 border-t border-blue-200">
                      💡 <strong>사용 팁</strong><br />
                      • 첫 줄에 헤더(학년,반,번호,이름)가 있어도 자동 감지됩니다<br />
                      • 엑셀에서 작성 후 "CSV UTF-8"로 저장하세요<br />
                      • 학년/반 정보가 있으면 데이터 확인이 더 쉽습니다
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setInputMethod(null);
                        setCsvFile(null);
                      }}
                      className="flex-1"
                    >
                      뒤로
                    </Button>
                    <Button type="submit" className="flex-1" disabled={!csvFile}>
                      업로드
                    </Button>
                  </div>
                </form>
              )}

              {!inputMethod && (
                <div className="mt-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowAddModal(false);
                      setInputMethod(null);
                    }}
                    className="w-full"
                  >
                    취소
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* 학생 목록 */}
        {students.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500 mb-4">아직 등록된 학생이 없습니다.</p>
            <Button onClick={() => setShowAddModal(true)}>
              첫 학생 등록하기
            </Button>
          </Card>
        ) : (
          <>
            {/* 학생 카드 그리드 - 4열, 스크롤 */}
            <div className="max-h-[600px] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 tablet-lg:grid-cols-4 gap-3 tablet:gap-4 tablet-lg:gap-6">
                {students.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    customBadges={customBadges}
                    onClick={() => router.push(`/teacher/class/${classId}/students/${student.id}`)}
                    onGenderToggle={() => handleToggleGender(student)}
                    onDelete={() => handleDeleteStudent(student.id, student.name)}
                  />
                ))}
              </div>
            </div>

            {/* 학급 전체 통계 */}
            <Card className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4 text-center">학급 전체 통계</h3>
                <div className="flex items-center justify-around gap-4">
                  {formatStatsWithIcons(calculateClassStats(students)).map((stat) => (
                    <div key={stat.label} className="flex flex-col items-center gap-1">
                      <div className="text-3xl">{stat.icon}</div>
                      <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
        </div>
      </main>
    </div>
  );
}
