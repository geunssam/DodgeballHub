'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/mockData';
import { GameSettingsModal } from '@/components/teacher/GameSettingsModal';

export function NavBar() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_TEACHER);
    router.push('/teacher/login');
  };

  return (
    <>
      <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* 좌측: 제목 */}
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏐</span>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                DodgeballHub
              </h1>
            </div>

            {/* 중앙: 날짜/시간 - baseball 스타일 */}
            <div className="flex flex-1 justify-center">
              <div className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-1.5 lg:py-2 bg-lime-50 text-gray-800 font-semibold rounded-full shadow-sm border border-lime-200">
                <div className="flex items-center gap-1">
                  <span className="text-base lg:text-lg">📆</span>
                  <span className="text-sm lg:text-base">
                    {currentDateTime.toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-base lg:text-lg">⏱️</span>
                  <span className="text-sm lg:text-base font-mono">
                    {currentDateTime.toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* 우측: 설정 및 로그아웃 */}
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold text-gray-900 hidden md:block">김교사 선생님</p>
              <Button
                onClick={() => setShowSettings(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">설정</span>
              </Button>
              <Button onClick={handleLogout} variant="destructive" size="sm">
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <GameSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
