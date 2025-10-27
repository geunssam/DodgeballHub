'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BADGE_TIERS, type BadgeDefinition } from '@/lib/badgeSystem';

interface BadgePopupProps {
  isOpen: boolean;
  onClose: () => void;
  badges: BadgeDefinition[];
}

/**
 * BadgePopup 컴포넌트
 * 학생이 새 배지를 획득했을 때 축하 메시지를 표시하는 팝업
 */
export function BadgePopup({ isOpen, onClose, badges = [] }: BadgePopupProps) {
  if (!badges || badges.length === 0) return null;

  // 배지 등급별 배경색 (파스텔톤)
  const getTierColor = (tier: number) => {
    switch (tier) {
      case BADGE_TIERS.BEGINNER:
        return 'bg-gray-100 border-gray-300';
      case BADGE_TIERS.SKILLED:
        return 'bg-green-100 border-green-300';
      case BADGE_TIERS.MASTER:
        return 'bg-blue-100 border-blue-300';
      case BADGE_TIERS.LEGEND:
        return 'bg-purple-100 border-purple-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  // 배지 등급명
  const getTierName = (tier: number) => {
    switch (tier) {
      case BADGE_TIERS.BEGINNER:
        return '입문';
      case BADGE_TIERS.SKILLED:
        return '숙련';
      case BADGE_TIERS.MASTER:
        return '마스터';
      case BADGE_TIERS.LEGEND:
        return '레전드';
      default:
        return '배지';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        {/* 헤더 */}
        <DialogHeader className="pb-3">
          <DialogTitle className="text-4xl font-bold text-center">
            🎉 배지 획득!
          </DialogTitle>
        </DialogHeader>

        {/* 배지 목록 */}
        <div className="space-y-4 py-4">
          {badges.map((badge, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border-2 shadow-lg ${getTierColor(badge.tier)}`}
            >
              {/* 배지 아이콘 및 이름 */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-5xl">{badge.icon}</span>
                <div className="flex-1">
                  <div className="text-2xl font-extrabold text-gray-800">
                    {badge.name}
                  </div>
                  <div className="text-sm font-semibold text-gray-600">
                    {getTierName(badge.tier)} 배지
                  </div>
                </div>
              </div>

              {/* 배지 설명 */}
              <div className="text-base text-gray-700 font-medium mt-2">
                {badge.description}
              </div>
            </div>
          ))}
        </div>

        {/* 푸터 */}
        <DialogFooter className="pt-3 flex justify-center">
          <Button
            onClick={onClose}
            className="text-xl font-bold px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
