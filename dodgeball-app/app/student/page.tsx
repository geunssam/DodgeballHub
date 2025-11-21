'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { getStudentByAccessCode } from '@/lib/dataService';
import { StudentDashboard } from '@/components/student/StudentDashboard';
import { Student } from '@/types';

export default function StudentPage() {
  const [code, setCode] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      alert('접근 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const foundStudent = await getStudentByAccessCode(code);
      if (foundStudent) {
        setStudent(foundStudent);
      } else {
        alert('접근 코드를 찾을 수 없습니다!\n\n💡 시크릿 모드를 사용중이라면 일반 브라우저 모드에서 접속해주세요.\n테스트용 접근 코드: 3-1-김철수');
      }
    } catch (error) {
      console.error('Failed to find student:', error);
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
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
          <p className="font-bold text-blue-900 mb-1">💡 접근 코드 형식</p>
          <p className="text-blue-700">반번호-출석번호-이름</p>
          <p className="text-xs text-blue-600 mt-2">예: 3반 5번 김철수 → 3-5-김철수</p>
        </div>
      </Card>
    </main>
  );
}
