'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { getAllBadges, BADGE_TIERS, type BadgeDefinition } from '@/lib/badgeSystem';
import type { CustomBadge, Student } from '@/types';
import { Eye, EyeOff, Trash2, RefreshCcw, Users } from 'lucide-react';

interface BadgeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  customBadges: CustomBadge[];
  hiddenBadgeIds: string[];
  onToggleBadgeVisibility: (badgeId: string) => void;
  onDeleteCustomBadge: (badgeId: string) => void;
  onRecalculateAll: () => void;
}

export function BadgeManagementModal({
  isOpen,
  onClose,
  students,
  customBadges,
  hiddenBadgeIds,
  onToggleBadgeVisibility,
  onDeleteCustomBadge,
  onRecalculateAll,
}: BadgeManagementModalProps) {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const systemBadges = getAllBadges();

  // 배지별 보유 학생 수 계산
  const getBadgeCount = (badgeId: string): number => {
    return students.filter(student =>
      student.badges?.some(b => b.id === badgeId)
    ).length;
  };

  // 등급별 색상
  const getTierColor = (tier: number): string => {
    switch (tier) {
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

  const getTierLabel = (tier: number): string => {
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
        return '';
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    await onRecalculateAll();
    setIsRecalculating(false);
  };

  const handleDeleteCustomBadge = (badgeId: string) => {
    if (confirm('정말 이 배지를 삭제하시겠습니까?\n이미 부여된 배지는 유지되지만, 더 이상 사용할 수 없습니다.')) {
      onDeleteCustomBadge(badgeId);
    }
  };

  // 시스템 배지 렌더링
  const renderSystemBadge = (badge: BadgeDefinition) => {
    const count = getBadgeCount(badge.id);
    const isHidden = hiddenBadgeIds.includes(badge.id);

    return (
      <Card key={badge.id} className={cn('relative', isHidden && 'opacity-50')}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{badge.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{badge.name}</div>
              <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {badge.description}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={getTierColor(badge.tier)}>
                  {getTierLabel(badge.tier)}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  {count}명
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleBadgeVisibility(badge.id)}
              title={isHidden ? '표시하기' : '숨기기'}
            >
              {isHidden ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // 커스텀 배지 렌더링
  const renderCustomBadge = (badge: CustomBadge) => {
    const count = getBadgeCount(badge.id);
    const isHidden = hiddenBadgeIds.includes(badge.id);

    return (
      <Card key={badge.id} className={cn('relative', isHidden && 'opacity-50')}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{badge.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{badge.name}</div>
              <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {badge.description}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="bg-pink-100 text-pink-700 border-pink-300">
                  커스텀
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  {count}명
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleBadgeVisibility(badge.id)}
                title={isHidden ? '표시하기' : '숨기기'}
              >
                {isHidden ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteCustomBadge(badge.id)}
                title="삭제"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>배지 관리</DialogTitle>
          <DialogDescription>
            시스템 배지 및 커스텀 배지를 관리하고, 학생들의 배지를 다시 계산할 수 있습니다
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="system" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="system">
                시스템 배지 ({systemBadges.length})
              </TabsTrigger>
              <TabsTrigger value="custom">
                커스텀 배지 ({customBadges.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="system" className="flex-1 overflow-y-auto mt-4">
              <div className="space-y-3 pb-4">
                {systemBadges.map(renderSystemBadge)}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="flex-1 overflow-y-auto mt-4">
              {customBadges.length > 0 ? (
                <div className="space-y-3 pb-4">
                  {customBadges.map(renderCustomBadge)}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="text-5xl mb-4">🏆</div>
                  <div className="text-lg font-medium mb-2">
                    아직 커스텀 배지가 없습니다
                  </div>
                  <div className="text-sm text-muted-foreground">
                    특별한 성취를 위한 나만의 배지를 만들어보세요
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              💡 팁: 배지를 숨기면 학생들에게 표시되지 않습니다
            </div>
            <Button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              variant="outline"
            >
              <RefreshCcw className={cn('w-4 h-4 mr-2', isRecalculating && 'animate-spin')} />
              {isRecalculating ? '재계산 중...' : '전체 재계산'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
