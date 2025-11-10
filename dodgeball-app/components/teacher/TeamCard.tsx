'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Check, X, Edit2, Lock, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateTeamStats, formatStatsWithIcons } from '@/lib/statsHelpers';
import type { Team, Student } from '@/types';

interface TeamCardProps {
  team: Team;
  allStudents: Student[];
  onClick?: () => void;
  onRename?: (newName: string) => void;
  isShared?: boolean;
  className?: string;
}

export function TeamCard({
  team,
  allStudents,
  onClick,
  onRename,
  isShared = false,
  className,
}: TeamCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(team.name);

  // 팀 전체 통계 계산
  const teamStats = calculateTeamStats(team, allStudents);
  const statsWithIcons = formatStatsWithIcons(teamStats);

  const handleEditStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(team.name);
  };

  const handleEditCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditName(team.name);
  };

  const handleEditSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editName.trim() && editName !== team.name && onRename) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editName.trim() && editName !== team.name && onRename) {
        onRename(editName.trim());
      }
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
      setEditName(team.name);
    }
  };

  // 팀 색상 배경
  const getColorClasses = (color: string): string => {
    const colorMap: Record<string, string> = {
      red: 'from-red-50 to-red-100 border-red-200',
      blue: 'from-blue-50 to-blue-100 border-blue-200',
      green: 'from-green-50 to-green-100 border-green-200',
      yellow: 'from-yellow-50 to-yellow-100 border-yellow-200',
      purple: 'from-purple-50 to-purple-100 border-purple-200',
      pink: 'from-pink-50 to-pink-100 border-pink-200',
      orange: 'from-orange-50 to-orange-100 border-orange-200',
      teal: 'from-teal-50 to-teal-100 border-teal-200',
    };
    return colorMap[color] || 'from-gray-50 to-gray-100 border-gray-200';
  };

  return (
    <Card
      className={cn(
        'h-[280px] cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]',
        'bg-gradient-to-br',
        getColorClasses(team.color),
        className
      )}
      onClick={!isEditing ? onClick : undefined}
    >
      <CardContent className="p-6 tablet:p-8 tablet-lg:p-10 h-full flex flex-col justify-center gap-4">
        {/* Row 1: 이름 | 멤버 수 | 권한 배지 */}
        <div className="flex items-center justify-between gap-4">
          {/* 팀 이름 */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-xl tablet:text-2xl tablet-lg:text-3xl font-bold h-auto py-2"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleEditSave}
                  className="shrink-0"
                >
                  <Check className="w-4 h-4 text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleEditCancel}
                  className="shrink-0"
                >
                  <X className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <>
                <h3 className="text-xl tablet:text-2xl tablet-lg:text-3xl font-bold truncate">
                  {team.name}
                </h3>
                {onRename && !isShared && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEditStart}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
          </div>

          {/* 권한 배지 & 멤버 수 */}
          <div className="shrink-0 flex items-center gap-2">
            {/* 권한 배지 */}
            <BadgeUI
              variant="outline"
              className={cn(
                'text-xs px-2 py-1',
                isShared
                  ? 'bg-gray-100 text-gray-700 border-gray-300'
                  : 'bg-green-100 text-green-700 border-green-300'
              )}
            >
              {isShared ? (
                <>
                  <Lock className="w-3 h-3 mr-1 inline" />
                  읽기
                </>
              ) : (
                <>
                  <Edit className="w-3 h-3 mr-1 inline" />
                  편집
                </>
              )}
            </BadgeUI>

            {/* 멤버 수 */}
            <div className="flex flex-col items-center px-4 py-2 bg-white/80 rounded-lg">
              <div className="text-sm font-medium text-gray-700">
                멤버
              </div>
              <div className="text-2xl tablet:text-3xl font-bold text-gray-900">
                {teamStats.memberCount}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: 통계 아이콘 */}
        <div className="flex items-center justify-around gap-2 pt-4 border-t border-white/50">
          {statsWithIcons.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <div className="text-2xl tablet:text-3xl tablet-lg:text-4xl">
                {stat.icon}
              </div>
              <div className="text-lg tablet:text-xl tablet-lg:text-2xl font-bold text-foreground">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
