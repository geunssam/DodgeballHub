'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { STORAGE_KEYS, initializeMockData } from '@/lib/mockData';

export default function TeacherLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('teacher@school.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  const handleLogin = () => {
    // Mock Data 초기화
    initializeMockData();

    // Mock 로그인 (Phase 4에서 Firebase Auth로 교체)
    if (email === 'teacher@school.com' && password === 'password') {
      localStorage.setItem(STORAGE_KEYS.CURRENT_TEACHER, 'teacher1');
      router.push('/teacher/dashboard');
    } else {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg shadow">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">🏐 DodgeballHub</h1>
          <h2 className="text-xl font-semibold text-gray-700">교사 로그인</h2>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@school.com"
            />
          </div>

          <div>
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
            />
          </div>

          <Button onClick={handleLogin} className="w-full">
            로그인
          </Button>
        </div>

        <div className="text-sm text-gray-500 text-center space-y-1">
          <p>Mock 계정으로 로그인하세요:</p>
          <p className="font-mono bg-gray-100 p-2 rounded">
            teacher@school.com / password
          </p>
        </div>
      </div>
    </main>
  );
}
