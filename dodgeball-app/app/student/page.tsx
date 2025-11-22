'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { getStudentByAccessCode, getStudentByStudentCode } from '@/lib/firestoreService';
import { StudentDashboard } from '@/components/student/StudentDashboard';
import { Student } from '@/types';
import { isValidStudentCode } from '@/lib/studentCodeGenerator';

export default function StudentPage() {
  const [code, setCode] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);

  // URL 파라미터로 코드가 전달된 경우 자동 로그인 시도
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const codeFromUrl = params.get('code');
      if (codeFromUrl) {
        handleSubmitWithCode(codeFromUrl);
      }
    }
  }, []);

  // 코드로 학생 찾기 (studentCode 우선, 없으면 accessCode)
  const findStudentByCode = async (inputCode: string): Promise<Student | null> => {
    // 1. studentCode 형식(abc123-159001)인지 확인
    if (isValidStudentCode(inputCode)) {
      const foundStudent = await getStudentByStudentCode(inputCode);
      if (foundStudent) return foundStudent;
    }

    // 2. 기존 accessCode로 시도
    const foundStudent = await getStudentByAccessCode(inputCode);
    return foundStudent;
  };

  const handleSubmitWithCode = async (inputCode: string) => {
    if (!inputCode.trim()) {
      alert('접근 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const foundStudent = await findStudentByCode(inputCode);
      if (foundStudent) {
        setStudent(foundStudent);
        setCode(inputCode); // 입력 필드 업데이트
      } else {
        alert(
          '접근 코드를 찾을 수 없습니다!\n\n' +
          '💡 시크릿 모드를 사용중이라면 일반 브라우저 모드에서 접속해주세요.\n\n' +
          '지원 형식:\n' +
          '• 신규 코드: abc123-159001\n' +
          '• 기존 코드: 3-1-김철수'
        );
      }
    } catch (error) {
      console.error('Failed to find student:', error);
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmitWithCode(code);
  };

  const handleLogout = () => {
    setStudent(null);
    setCode('');
  };

  if (student) {
    return <StudentDashboard student={student} onLogout={handleLogout} />;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">🏐 학생 페이지</h1>
          <p className="text-gray-600">선생님께 받은 접근 코드를 입력하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="code">접근 코드</Label>
            <Input
              id="code"
              placeholder="예: 3-5-김철수"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '확인 중...' : '입장하기'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
          <p className="font-bold text-blue-900 mb-2">💡 접근 코드 형식</p>
          <div className="space-y-2">
            <div>
              <p className="text-blue-700 font-semibold">신규 코드 (추천)</p>
              <p className="text-xs text-blue-600">예: abc123-159001</p>
            </div>
            <div>
              <p className="text-blue-700 font-semibold">기존 코드</p>
              <p className="text-xs text-blue-600">예: 3반 5번 김철수 → 3-5-김철수</p>
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}
