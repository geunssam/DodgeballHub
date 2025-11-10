'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getBadgeById, BADGE_TIERS } from '@/lib/badgeSystem';
import type { Badge, CustomBadge } from '@/types';
import { GripVertical } from 'lucide-react';

interface PlayerBadgeOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  badges: Badge[];
  customBadges?: CustomBadge[];
  onSaveOrder: (orderedBadges: Badge[]) => void;
}

// Sortable 배지 아이템
interface SortableBadgeItemProps {
  badge: Badge;
  customBadges: CustomBadge[];
  index: number;
}

function SortableBadgeItem({ badge, customBadges, index }: SortableBadgeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: badge.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getBadgeInfo = () => {
    const systemBadge = getBadgeById(badge.id);
    if (systemBadge) {
      return {
        icon: systemBadge.icon,
        name: systemBadge.name,
        description: systemBadge.description,
        tier: systemBadge.tier,
      };
    }

    const customBadge = customBadges.find(cb => cb.id === badge.id);
    if (customBadge) {
      return {
        icon: customBadge.emoji,
        name: customBadge.name,
        description: customBadge.description,
        tier: null,
      };
    }

    return {
      icon: '🏆',
      name: badge.name || '알 수 없는 배지',
      description: '',
      tier: null,
    };
  };

  const getTierColor = (tier: number | null): string => {
    if (!tier) return 'bg-pink-100 text-pink-700 border-pink-300';

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

  const getTierLabel = (tier: number | null): string => {
    if (!tier) return '커스텀';

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

  const badgeInfo = getBadgeInfo();

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className={cn('mb-2', isDragging && 'opacity-50')}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* 순서 번호 */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
              {index + 1}
            </div>

            {/* 드래그 핸들 */}
            <button
              className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
              {...listeners}
            >
              <GripVertical className="w-5 h-5" />
            </button>

            {/* 배지 아이콘 */}
            <div className="text-2xl">{badgeInfo.icon}</div>

            {/* 배지 정보 */}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{badgeInfo.name}</div>
              {badgeInfo.description && (
                <div className="text-xs text-muted-foreground truncate">
                  {badgeInfo.description}
                </div>
              )}
            </div>

            {/* 배지 등급 */}
            <BadgeUI
              variant="outline"
              className={cn('text-xs', getTierColor(badgeInfo.tier))}
            >
              {getTierLabel(badgeInfo.tier)}
            </BadgeUI>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PlayerBadgeOrderModal({
  isOpen,
  onClose,
  studentName,
  badges,
  customBadges = [],
  onSaveOrder,
}: PlayerBadgeOrderModalProps) {
  const [orderedBadges, setOrderedBadges] = useState<Badge[]>(badges);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedBadges((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    onSaveOrder(orderedBadges);
    onClose();
  };

  const handleReset = () => {
    setOrderedBadges(badges);
  };

  const handleClose = () => {
    setOrderedBadges(badges);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>배지 순서 변경</DialogTitle>
          <DialogDescription>
            {studentName}의 배지 표시 순서를 변경합니다. 드래그하여 순서를 조정하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {orderedBadges.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedBadges.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                {orderedBadges.map((badge, index) => (
                  <SortableBadgeItem
                    key={badge.id}
                    badge={badge}
                    customBadges={customBadges}
                    index={index}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="text-4xl mb-2">🏆</div>
              <div className="text-muted-foreground">배지가 없습니다</div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4 mt-4">
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={handleReset}>
              초기화
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button onClick={handleSave} disabled={orderedBadges.length === 0}>
                저장
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
