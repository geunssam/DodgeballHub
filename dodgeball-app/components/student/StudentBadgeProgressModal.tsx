'use client';

import { Badge } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BadgeProgress {
  badge: Badge;
  progress: number;
  current: number;
  target: number;
  category: string;
}

interface StudentBadgeProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  progressData: BadgeProgress[];
}

export function StudentBadgeProgressModal({
  isOpen,
  onClose,
  progressData
}: StudentBadgeProgressModalProps) {
  // 진행도가 없을 때
  if (!progressData || progressData.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              다음 배지 진행도
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-lg text-gray-600">진행 중인 배지가 없습니다.</p>
            <p className="text-sm text-gray-500 mt-2">열심히 활동해서 배지를 모아보세요!</p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 transition-colors"
          >
            닫기
          </button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            다음 배지 진행도
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {progressData.map((progress, idx) => (
            <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">{progress.badge.emoji || '🏅'}</span>
                <div className="flex-1">
                  <div className="font-bold text-base text-gray-900">
                    {progress.badge.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {progress.badge.description}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    티어: {getTierLabel(progress.badge.tier || 1)}
                  </div>
                </div>
              </div>

              {/* 진행도 바 */}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 h-full transition-all duration-500 flex items-center justify-center"
                    style={{ width: `${progress.progress}%` }}
                  >
                    {progress.progress > 30 && (
                      <span className="text-white text-xs font-bold">
                        {Math.round(progress.progress)}%
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-700 font-bold whitespace-nowrap min-w-[60px] text-right">
                  {progress.current}/{progress.target}
                </span>
              </div>

              {/* 남은 횟수 표시 */}
              {progress.target - progress.current > 0 && (
                <div className="mt-2 text-xs text-gray-500 text-right">
                  {progress.target - progress.current}번 더 필요해요!
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg font-bold text-white transition-all shadow-lg hover:shadow-xl"
        >
          닫기
        </button>
      </DialogContent>
    </Dialog>
  );
}

// 배지 티어 라벨
function getTierLabel(tier: number): string {
  const labels: Record<number, string> = {
    1: '🥉 입문',
    2: '🥈 숙련',
    3: '🥇 마스터',
    4: '👑 레전드',
    5: '⭐ 특별'
  };
  return labels[tier] || '입문';
}
