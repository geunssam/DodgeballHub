'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/types';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getBadgeById } from '@/lib/badgeSystem';

interface BadgeCelebrationModalProps {
  badges: Badge[];
  playerName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BadgeCelebrationModal({
  badges,
  playerName,
  isOpen,
  onClose
}: BadgeCelebrationModalProps) {
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentBadgeIndex(0);
    }
  }, [isOpen]);

  if (badges.length === 0) return null;

  const currentBadge = badges[currentBadgeIndex];
  const badgeInfo = getBadgeById(currentBadge.id);

  const handleNext = () => {
    if (currentBadgeIndex < badges.length - 1) {
      setCurrentBadgeIndex(currentBadgeIndex + 1);
    } else {
      onClose();
    }
  };

  const getTierName = (tier: number | null): string => {
    const tierNames: Record<number, string> = {
      1: '🥉 입문',
      2: '🥈 숙련',
      3: '🥇 마스터',
      4: '👑 레전드',
      5: '⭐ 특별'
    };
    return tierNames[tier || 1] || '배지';
  };

  const getTierColor = (tier: number | null): string => {
    const colors: Record<number, string> = {
      1: 'from-green-400 to-green-600',
      2: 'from-blue-400 to-blue-600',
      3: 'from-purple-400 to-purple-600',
      4: 'from-yellow-400 to-orange-500',
      5: 'from-pink-400 to-red-500'
    };
    return colors[tier || 1] || 'from-gray-400 to-gray-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-4 border-yellow-400">
        {/* 배경 애니메이션 */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 animate-pulse" />

        {/* 반짝이는 효과 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: '2s'
              }}
            >
              ✨
            </div>
          ))}
        </div>

        {/* 내용 */}
        <div className="relative z-10 p-8 text-center">
          {/* 축하 메시지 */}
          <div className="mb-6">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 mb-2 animate-bounce">
              🎉 축하합니다! 🎉
            </h2>
            <p className="text-xl font-bold text-gray-800">
              {playerName}님이 새로운 배지를 획득했습니다!
            </p>
          </div>

          {/* 배지 표시 */}
          <div className="mb-6">
            <div className={`inline-block p-8 rounded-3xl bg-gradient-to-br ${getTierColor(badgeInfo?.tier || null)} shadow-2xl transform hover:scale-105 transition-transform`}>
              <div className="text-8xl mb-4 animate-bounce">
                {currentBadge.emoji || badgeInfo?.icon || '🏆'}
              </div>
            </div>
          </div>

          {/* 배지 정보 */}
          <div className="mb-6 space-y-2">
            <h3 className="text-2xl font-bold text-gray-900">
              {currentBadge.name || badgeInfo?.name || '새 배지'}
            </h3>
            <p className="text-lg font-semibold text-gray-600">
              {getTierName(badgeInfo?.tier || null)}
            </p>
            {badgeInfo?.description && (
              <p className="text-sm text-gray-600 mt-2">
                {badgeInfo.description}
              </p>
            )}
          </div>

          {/* 진행 상황 */}
          {badges.length > 1 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {currentBadgeIndex + 1} / {badges.length} 배지
              </p>
              <div className="flex gap-1 justify-center mt-2">
                {badges.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 w-8 rounded-full ${
                      idx === currentBadgeIndex
                        ? 'bg-yellow-500'
                        : idx < currentBadgeIndex
                        ? 'bg-yellow-300'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 버튼 */}
          <button
            onClick={handleNext}
            className="w-full py-3 px-6 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all"
          >
            {currentBadgeIndex < badges.length - 1 ? '다음 배지 보기' : '확인'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
