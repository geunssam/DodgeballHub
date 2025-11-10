'use client';

import { useMemo } from 'react';
import { Badge as BadgeUI } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getBadgeById, BADGE_TIERS } from '@/lib/badgeSystem';
import type { Badge, CustomBadge } from '@/types';

type DisplaySize = 'sm' | 'md' | 'lg';
type DisplayDirection = 'horizontal' | 'vertical';

interface PlayerBadgeDisplayProps {
  badges: Badge[];
  customBadges?: CustomBadge[];
  size?: DisplaySize;
  maxDisplay?: number;
  onClick?: () => void;
  className?: string;
  direction?: DisplayDirection;
}

export function PlayerBadgeDisplay({
  badges,
  customBadges = [],
  size = 'md',
  maxDisplay = 3,
  onClick,
  className,
  direction = 'horizontal',
}: PlayerBadgeDisplayProps) {
  const displayBadges = useMemo(() => {
    return badges.slice(0, maxDisplay);
  }, [badges, maxDisplay]);

  const remainingCount = badges.length - maxDisplay;

  const getBadgeInfo = (badge: Badge) => {
    // 먼저 시스템 배지에서 찾기
    const systemBadge = getBadgeById(badge.id);
    if (systemBadge) {
      return {
        icon: systemBadge.icon,
        name: systemBadge.name,
        tier: systemBadge.tier,
      };
    }

    // 커스텀 배지에서 찾기
    const customBadge = customBadges.find(cb => cb.id === badge.id);
    if (customBadge) {
      return {
        icon: customBadge.emoji,
        name: customBadge.name,
        tier: null,
      };
    }

    // 찾지 못한 경우 기본값
    return {
      icon: '🏆',
      name: badge.name || '알 수 없는 배지',
      tier: null,
    };
  };

  const getTierColor = (tier: number | null): string => {
    if (!tier) return 'bg-pink-100/50 border-pink-300/30'; // 커스텀 배지

    switch (tier) {
      case BADGE_TIERS.BEGINNER:
        return 'bg-green-100/50 border-green-300/30';
      case BADGE_TIERS.SKILLED:
        return 'bg-blue-100/50 border-blue-300/30';
      case BADGE_TIERS.MASTER:
        return 'bg-purple-100/50 border-purple-300/30';
      case BADGE_TIERS.LEGEND:
        return 'bg-orange-100/50 border-orange-300/30';
      default:
        return 'bg-gray-100/50 border-gray-300/30';
    }
  };

  const getSizeClasses = (size: DisplaySize) => {
    switch (size) {
      case 'sm':
        return {
          container: 'gap-1',
          badge: 'w-6 h-6 text-sm',
          more: 'text-xs px-1.5 py-0.5',
        };
      case 'md':
        return {
          container: 'gap-1.5',
          badge: 'w-8 h-8 text-base',
          more: 'text-xs px-2 py-1',
        };
      case 'lg':
        return {
          container: 'gap-2',
          badge: 'w-10 h-10 text-lg',
          more: 'text-sm px-2.5 py-1',
        };
    }
  };

  const sizeClasses = getSizeClasses(size);

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      'flex flex-wrap',
      direction === 'vertical' ? 'flex-col items-center' : 'items-center',
      sizeClasses.container,
      className
    )}>
      <TooltipProvider>
        {displayBadges.map((badge, index) => {
          const badgeInfo = getBadgeInfo(badge);

          return (
            <Tooltip key={`${badge.id}-${index}`}>
              <TooltipTrigger asChild>
                <button
                  onClick={onClick}
                  className={cn(
                    'rounded-full border flex items-center justify-center transition-all',
                    'hover:scale-110 hover:shadow-sm',
                    sizeClasses.badge,
                    getTierColor(badgeInfo.tier),
                    onClick && 'cursor-pointer'
                  )}
                  type="button"
                >
                  {badgeInfo.icon}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <div className="font-medium">{badgeInfo.name}</div>
                  {badge.reason && (
                    <div className="text-xs text-muted-foreground mt-1 max-w-xs">
                      {badge.reason}
                    </div>
                  )}
                  {badge.awardedAt && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(badge.awardedAt).toLocaleDateString('ko-KR')}
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>

      {remainingCount > 0 && (
        <BadgeUI
          variant="outline"
          className={cn(
            'bg-muted/50 border-muted-foreground/20',
            sizeClasses.more,
            onClick && 'cursor-pointer hover:bg-muted'
          )}
          onClick={onClick}
        >
          +{remainingCount}
        </BadgeUI>
      )}
    </div>
  );
}

// 배지 컬렉션 전체를 표시하는 확장 버전
interface PlayerBadgeCollectionProps {
  badges: Badge[];
  customBadges?: CustomBadge[];
  className?: string;
}

export function PlayerBadgeCollection({
  badges,
  customBadges = [],
  className,
}: PlayerBadgeCollectionProps) {
  const getBadgeInfo = (badge: Badge) => {
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

  if (badges.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="text-4xl mb-2">🏆</div>
        <div className="text-muted-foreground">아직 획득한 배지가 없습니다</div>
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3', className)}>
      {badges.map((badge, index) => {
        const badgeInfo = getBadgeInfo(badge);

        return (
          <div
            key={`${badge.id}-${index}`}
            className="p-3 rounded-lg border bg-card hover:shadow-md transition-all"
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className="text-3xl">{badgeInfo.icon}</div>
              <div className="font-medium text-sm">{badgeInfo.name}</div>
              {badgeInfo.description && (
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {badgeInfo.description}
                </div>
              )}
              <BadgeUI
                variant="outline"
                className={cn('text-xs', getTierColor(badgeInfo.tier))}
              >
                {getTierLabel(badgeInfo.tier)}
              </BadgeUI>
              {badge.reason && (
                <div className="text-xs text-muted-foreground italic mt-1 line-clamp-2">
                  &quot;{badge.reason}&quot;
                </div>
              )}
              {badge.awardedAt && (
                <div className="text-xs text-muted-foreground">
                  {new Date(badge.awardedAt).toLocaleDateString('ko-KR')}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
