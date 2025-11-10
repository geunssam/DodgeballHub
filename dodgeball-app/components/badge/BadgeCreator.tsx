'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BADGE_TIERS, type BadgeTier } from '@/lib/badgeSystem';
import type { CustomBadge } from '@/types';

// 이모지 옵션
const EMOJI_OPTIONS = [
  '🏆', '⚡', '🌟', '💎', '🔥', '🎯', '💪', '🤝',
  '💚', '🍪', '🎖️', '⭐', '👑', '🦾', '🏅', '😇',
  '💰', '🏃', '🎽', '🎨', '🎭', '🎪', '🎬', '🎤',
];

// 등급 레이블
const TIER_LABELS = [
  { value: BADGE_TIERS.BEGINNER, label: '입문' },
  { value: BADGE_TIERS.SKILLED, label: '숙련' },
  { value: BADGE_TIERS.MASTER, label: '마스터' },
  { value: BADGE_TIERS.LEGEND, label: '레전드' },
];

interface BadgeCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (badge: Omit<CustomBadge, 'id' | 'createdAt' | 'teacherId'>) => void;
}

export function BadgeCreator({ isOpen, onClose, onSave }: BadgeCreatorProps) {
  const [icon, setIcon] = useState<string>('🏆');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [tier, setTier] = useState<BadgeTier>(BADGE_TIERS.BEGINNER);

  const handleReset = () => {
    setIcon('🏆');
    setName('');
    setDescription('');
    setTier(BADGE_TIERS.BEGINNER);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSave = () => {
    if (!name.trim() || !description.trim()) {
      alert('배지 이름과 설명을 입력해주세요.');
      return;
    }

    onSave({
      name: name.trim(),
      emoji: icon,
      description: description.trim(),
    });

    handleReset();
    onClose();
  };

  const getTierLabel = (tierValue: BadgeTier): string => {
    return TIER_LABELS.find(t => t.value === tierValue)?.label || '입문';
  };

  const getTierColor = (tierValue: BadgeTier): string => {
    switch (tierValue) {
      case BADGE_TIERS.BEGINNER:
        return 'bg-green-100 text-green-700 border-green-300';
      case BADGE_TIERS.SKILLED:
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case BADGE_TIERS.MASTER:
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case BADGE_TIERS.LEGEND:
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>커스텀 배지 만들기</DialogTitle>
          <DialogDescription>
            특별한 성취를 위한 나만의 배지를 만들어보세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 아이콘 선택 */}
          <div className="space-y-2">
            <Label>아이콘 선택</Label>
            <div className="grid grid-cols-8 gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={cn(
                    'w-10 h-10 text-2xl rounded border transition-all',
                    icon === emoji
                      ? 'border-primary bg-primary/10 scale-110'
                      : 'border-muted hover:border-primary/50 hover:bg-accent'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 배지 이름 */}
          <div className="space-y-2">
            <Label htmlFor="name">배지 이름</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 슈퍼스타"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/20자
            </p>
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="배지 설명을 입력하세요"
              rows={3}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/100자
            </p>
          </div>

          {/* 등급 선택 */}
          <div className="space-y-2">
            <Label>등급 선택</Label>
            <div className="grid grid-cols-2 gap-2">
              {TIER_LABELS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTier(t.value)}
                  className={cn(
                    'py-2 px-4 rounded border font-medium transition-all',
                    tier === t.value
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-primary/50 hover:bg-accent'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 미리보기 */}
          <div className="space-y-2">
            <Label>미리보기</Label>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-4xl">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg truncate">
                      {name || '배지 이름'}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {description || '배지 설명이 여기 표시됩니다'}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('mt-2', getTierColor(tier))}
                    >
                      {getTierLabel(tier)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !description.trim()}
          >
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
