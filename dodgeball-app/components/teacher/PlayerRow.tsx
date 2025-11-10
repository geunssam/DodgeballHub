'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge as BadgeUI } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GripVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateStudentStats, STAT_ICONS } from '@/lib/statsHelpers';
import { PlayerBadgeDisplay } from '@/components/badge/PlayerBadgeDisplay';
import type { Student, CustomBadge, TeamMemberAssignment } from '@/types';

interface PlayerRowProps {
  member: TeamMemberAssignment;
  student: Student | null;
  order: number;
  customBadges?: CustomBadge[];
  isDragging?: boolean;
  onPositionChange?: (position: 'infield' | 'outfield') => void;
  onDelete?: () => void;
  className?: string;
}

export function PlayerRow({
  member,
  student,
  order,
  customBadges = [],
  isDragging = false,
  onPositionChange,
  onDelete,
  className,
}: PlayerRowProps) {
  if (!student) {
    return null;
  }

  const stats = calculateStudentStats(student);

  return (
    <tr
      className={cn(
        'border-b hover:bg-muted/50 transition-colors',
        isDragging && 'opacity-50',
        className
      )}
    >
      {/* 드래그 핸들 */}
      <td className="p-3">
        <button
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-5 h-5" />
        </button>
      </td>

      {/* 순서 */}
      <td className="p-3 text-center">
        <BadgeUI
          variant="outline"
          className="text-sm font-bold px-2.5 py-0.5 bg-blue-100 text-blue-700 border-blue-300"
        >
          {order}
        </BadgeUI>
      </td>

      {/* 배지 (최대 3개) */}
      <td className="p-3">
        <PlayerBadgeDisplay
          badges={student.badges}
          customBadges={customBadges}
          size="sm"
          maxDisplay={3}
        />
      </td>

      {/* 이름 */}
      <td className="p-3 font-medium">
        {student.name}
      </td>

      {/* 학급 */}
      <td className="p-3 text-sm text-muted-foreground">
        {member.className || '-'}
      </td>

      {/* 번호 */}
      <td className="p-3 text-center text-sm">
        #{member.number}
      </td>

      {/* 통계 */}
      <td className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1" title="아웃">
            <span>{STAT_ICONS.outs}</span>
            <span className="text-sm font-medium">{stats.outs}</span>
          </div>
          <div className="flex items-center gap-1" title="통과">
            <span>{STAT_ICONS.passes}</span>
            <span className="text-sm font-medium">{stats.passes}</span>
          </div>
          <div className="flex items-center gap-1" title="희생">
            <span>{STAT_ICONS.sacrifices}</span>
            <span className="text-sm font-medium">{stats.sacrifices}</span>
          </div>
          <div className="flex items-center gap-1" title="쿠키">
            <span>{STAT_ICONS.cookies}</span>
            <span className="text-sm font-medium">{stats.cookies}</span>
          </div>
        </div>
      </td>

      {/* 포지션 */}
      <td className="p-3">
        {onPositionChange ? (
          <Select
            value={member.position}
            onValueChange={(value) => onPositionChange(value as 'infield' | 'outfield')}
          >
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="infield">내야</SelectItem>
              <SelectItem value="outfield">외야</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm">
            {member.position === 'infield' ? '내야' : '외야'}
          </span>
        )}
      </td>

      {/* 삭제 버튼 */}
      <td className="p-3 text-center">
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </td>
    </tr>
  );
}

// 테이블 헤더 컴포넌트
export function PlayerTableHeader() {
  return (
    <thead className="bg-muted/50">
      <tr>
        <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">
          {/* 드래그 */}
        </th>
        <th className="p-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-16">
          순서
        </th>
        <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
          배지
        </th>
        <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
          이름
        </th>
        <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
          학급
        </th>
        <th className="p-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-16">
          번호
        </th>
        <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
          통계
        </th>
        <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
          포지션
        </th>
        <th className="p-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-16">
          {/* 삭제 */}
        </th>
      </tr>
    </thead>
  );
}
