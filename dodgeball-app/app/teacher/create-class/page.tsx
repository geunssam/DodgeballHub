'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { createClass } from '@/lib/dataService';
import { STORAGE_KEYS } from '@/lib/mockData';

export default function CreateClassPage() {
  const router = useRouter();
  const [className, setClassName] = useState('');
  const [year, setYear] = useState(2025);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!className.trim()) {
      alert('학급명을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const teacherId = localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER);
      if (!teacherId) {
        router.push('/teacher/login');
        return;
      }

      await createClass({
        teacherId,
        name: className,
        year,
        isArchived: false
      });

      router.push('/teacher/dashboard');
    } catch (error) {
      console.error('Failed to create class:', error);
      alert('학급 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-grow p-6">
        <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">새 학급 만들기</h1>
          <p className="text-gray-600">학급 정보를 입력해주세요.</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="className">학급명</Label>
              <Input
                id="className"
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="예: 5학년 3반"
                required
              />
            </div>

            <div>
              <Label htmlFor="year">학년도</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                min={2020}
                max={2030}
                required
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/teacher/dashboard')}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? '생성 중...' : '학급 생성'}
              </Button>
            </div>
          </form>
        </Card>
        </div>
      </main>
    </div>
  );
}
