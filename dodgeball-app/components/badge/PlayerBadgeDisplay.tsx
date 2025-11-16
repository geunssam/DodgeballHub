'use client';

import { useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Badge as BadgeUI } from '@/components/ui/badge';
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
  showEmpty?: boolean;
  showOverflow?: boolean;
}

interface HoveredBadge {
  badgeId: string;
  type: 'badge' | 'overflow';
  rect: DOMRect;
}

export function PlayerBadgeDisplay({
  badges = [],  // 기본값 추가
  customBadges = [],
  size = 'md',
  maxDisplay = 3,
  onClick,
  className,
  direction = 'horizontal',
  showEmpty = true,
  showOverflow = true,
}: PlayerBadgeDisplayProps) {
  const [hoveredBadge, setHoveredBadge] = useState<HoveredBadge | null>(null);
  const badgeRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const displayBadges = useMemo(() => {
    return (badges || []).slice(0, maxDisplay);  // null/undefined 체크 추가
  }, [badges, maxDisplay]);

  const remainingCount = (badges?.length || 0) - maxDisplay;
  const overflowBadges = useMemo(() => {
    return badges.slice(maxDisplay);
  }, [badges, maxDisplay]);

  const getBadgeInfo = (badge: Badge) => {
    // 먼저 시스템 배지에서 찾기
    const systemBadge = getBadgeById(badge.id);
    if (systemBadge) {
      return {
        icon: systemBadge.icon,
        name: systemBadge.name,
        description: systemBadge.description,
        tier: systemBadge.tier,
      };
    }

    // 커스텀 배지에서 찾기
    const customBadge = customBadges.find(cb => cb.id === badge.id);
    if (customBadge) {
      return {
        icon: customBadge.emoji,
        name: customBadge.name,
        description: customBadge.description,
        tier: null,
      };
    }

    // 찾지 못한 경우 기본값
    return {
      icon: '🏆',
      name: badge.name || '알 수 없는 배지',
      description: '',
      tier: null,
    };
  };

  const handleMouseEnter = (badgeId: string, type: 'badge' | 'overflow', event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredBadge({ badgeId, type, rect });
  };

  const handleMouseLeave = () => {
    setHoveredBadge(null);
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
    return showEmpty ? (
      <span className="text-xs text-gray-400 italic">배지 없음</span>
    ) : null;
  }

  return (
    <>
      <div className={cn(
        'flex flex-wrap',
        direction === 'vertical' ? 'flex-col items-center' : 'items-center',
        sizeClasses.container,
        className
      )}>
        {displayBadges.map((badge, index) => {
          const badgeInfo = getBadgeInfo(badge);

          return (
            <span
              key={`${badge.id}-${index}`}
              ref={el => badgeRefs.current[badge.id] = el}
              className={cn(
                'rounded-full border flex items-center justify-center transition-all',
                'hover:scale-110 hover:shadow-sm cursor-pointer',
                sizeClasses.badge,
                getTierColor(badgeInfo.tier)
              )}
              role="img"
              aria-label={badgeInfo.name}
              onMouseEnter={(e) => handleMouseEnter(badge.id, 'badge', e)}
              onMouseLeave={handleMouseLeave}
              onClick={onClick}
            >
              {badgeInfo.icon}
            </span>
          );
        })}

        {showOverflow && remainingCount > 0 && (
          <span
            className={cn(
              'bg-muted/50 border border-muted-foreground/20 rounded-full flex items-center justify-center',
              sizeClasses.more,
              'cursor-pointer hover:bg-muted'
            )}
            onMouseEnter={(e) => handleMouseEnter('overflow', 'overflow', e)}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
          >
            +{remainingCount}
          </span>
        )}
      </div>

      {/* Portal로 툴팁 렌더링 */}
      {hoveredBadge && typeof window !== 'undefined' && createPortal(
        <BadgeTooltip
          hoveredBadge={hoveredBadge}
          badges={badges}
          customBadges={customBadges}
          overflowBadges={overflowBadges}
          maxDisplay={maxDisplay}
        />,
        document.body
      )}
    </>
  );
}

// 배지 툴팁 컴포넌트 (Portal로 렌더링)
interface BadgeTooltipProps {
  hoveredBadge: HoveredBadge;
  badges: Badge[];
  customBadges: CustomBadge[];
  overflowBadges: Badge[];
  maxDisplay: number;
}

const BadgeTooltip: React.FC<BadgeTooltipProps> = ({
  hoveredBadge,
  badges,
  customBadges,
  overflowBadges,
  maxDisplay
}) => {
  const { badgeId, type, rect } = hoveredBadge;

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

  const getTierName = (tier: number | null): string => {
    if (!tier) return '커스텀';
    const tierNames = {
      1: '🥉 입문',
      2: '🥈 숙련',
      3: '🥇 마스터',
      4: '👑 레전드',
      5: '⭐ 특별'
    };
    return tierNames[tier] || '배지';
  };

  // 개별 배지 툴팁
  if (type === 'badge') {
    const badge = badges.find(b => b.id === badgeId);
    if (!badge) return null;

    const badgeInfo = getBadgeInfo(badge);

    return (
      <div
        className="fixed px-3 py-2 bg-gray-900 text-white rounded-lg shadow-lg min-w-[200px] pointer-events-none z-[9999]"
        style={{
          left: `${rect.left + rect.width / 2}px`,
          top: `${rect.top - 10}px`,
          transform: 'translate(-50%, -100%)',
        }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{badgeInfo.icon}</span>
            <div className="flex-1">
              <p className="font-bold text-sm">{badgeInfo.name}</p>
              <p className="text-xs text-gray-300">{getTierName(badgeInfo.tier)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-300 mt-1">{badgeInfo.description}</p>
          {badge.reason && (
            <p className="text-xs text-gray-400 italic mt-1">"{badge.reason}"</p>
          )}
          {badge.awardedAt && (
            <p className="text-xs text-gray-400 mt-1">
              {new Date(badge.awardedAt).toLocaleDateString('ko-KR')}
            </p>
          )}
        </div>
        {/* 화살표 */}
        <div
          className="absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
          style={{
            left: '50%',
            bottom: '-4px',
            transform: 'translateX(-50%) rotate(180deg)',
          }}
        />
      </div>
    );
  }

  // 오버플로우 배지 툴팁
  if (type === 'overflow') {
    return (
      <div
        className="fixed px-3 py-2 bg-gray-900 text-white rounded-lg shadow-lg min-w-[240px] pointer-events-none z-[9999]"
        style={{
          left: `${rect.left + rect.width / 2}px`,
          top: `${rect.top - 10}px`,
          transform: 'translate(-50%, -100%)',
        }}
      >
        <p className="font-bold text-sm mb-2">추가 배지 ({badges.length - maxDisplay}개)</p>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {overflowBadges.map((badge, idx) => {
            const badgeInfo = getBadgeInfo(badge);
            return (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-lg">{badgeInfo.icon}</span>
                <div className="flex-1">
                  <p className="text-xs font-medium">{badgeInfo.name}</p>
                  <p className="text-[10px] text-gray-400">{getTierName(badgeInfo.tier)}</p>
                </div>
              </div>
            );
          })}
        </div>
        {/* 화살표 */}
        <div
          className="absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
          style={{
            left: '50%',
            bottom: '-4px',
            transform: 'translateX(-50%) rotate(180deg)',
          }}
        />
      </div>
    );
  }

  return null;
};

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
