'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getGameDefaults } from '@/lib/gameDefaults';

interface GameModeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuick: () => void;
}

export function GameModeSelectModal({
  isOpen,
  onClose,
  onSelectQuick,
}: GameModeSelectModalProps) {
  const router = useRouter();
  const [gameSettings, setGameSettings] = useState(() => getGameDefaults());

  useEffect(() => {
    if (isOpen) {
      setGameSettings(getGameDefaults());
    }
  }, [isOpen]);

  const handleQuickStart = () => {
    onSelectQuick();
  };

  const handleDetailedStart = () => {
    onClose();
    router.push('/teacher/game/new');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            🎯 경기 시작 방식 선택
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* 간단 설정 카드 */}
          <button
            onClick={handleQuickStart}
            className="group relative p-6 rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 transition-all duration-200 transform hover:scale-105 hover:shadow-lg text-left"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-500 rounded-full">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                간단 설정
              </h3>
            </div>

            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              팀만 선택하고 바로 시작하세요.
              모든 설정이 기본값으로 자동 적용됩니다.
            </p>

            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>경기 시간: {gameSettings.quickStart.duration}분</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>초기 하트: {gameSettings.quickStart.initialLives}개</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>
                  공 추가: {gameSettings.quickStart.ballAdditions.length > 0
                    ? `${gameSettings.quickStart.ballAdditions[0].minutesBefore}분마다`
                    : '없음'}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-green-200">
              <span className="text-green-600 font-semibold text-sm group-hover:underline">
                빠른 시작 →
              </span>
            </div>
          </button>

          {/* 상세 설정 카드 */}
          <button
            onClick={handleDetailedStart}
            className="group relative p-6 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200 transform hover:scale-105 hover:shadow-lg text-left"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-500 rounded-full">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                상세 설정
              </h3>
            </div>

            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              모든 옵션을 자유롭게 조정하세요.
              경기 시간, 하트, 외야 규칙 등을 설정할 수 있습니다.
            </p>

            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-blue-600">⚙️</span>
                <span>경기 시간 조정</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">⚙️</span>
                <span>초기 하트 설정</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">⚙️</span>
                <span>외야 규칙 선택</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-blue-200">
              <span className="text-blue-600 font-semibold text-sm group-hover:underline">
                상세 설정 →
              </span>
            </div>
          </button>
        </div>

        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            취소
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
