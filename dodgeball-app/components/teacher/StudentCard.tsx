'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { GripVertical, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateStudentStats, STAT_ICONS } from '@/lib/statsHelpers';
import { GenderIcon } from '@/components/teacher/GenderIcon';
import { PlayerBadgeDisplay } from '@/components/badge/PlayerBadgeDisplay';
import type { Student, CustomBadge } from '@/types';

interface StudentCardProps {
  student: Student;
  customBadges?: CustomBadge[];
  isEditMode?: boolean;
  onClick?: () => void;
  onGenderToggle?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function StudentCard({
  student,
  customBadges = [],
  isEditMode = false,
  onClick,
  onGenderToggle,
  onDelete,
  className,
}: StudentCardProps) {
  const stats = calculateStudentStats(student);

  return (
    <Card
      className={cn(
        'relative py-2 px-3 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2',
        isEditMode ? 'ring-2 ring-blue-300' : 'hover:border-primary/50',
        className
      )}
      onClick={!isEditMode ? onClick : undefined}
    >
      {/* 번호 표시 (좌측 상단) */}
      {student.number && (
        <div className="absolute top-1.5 left-1.5 bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center z-10">
          {student.number}
        </div>
      )}

      {/* 편집 모드: 드래그 핸들 (우측 상단) */}
      {isEditMode && (
        <div className="absolute top-1.5 right-1.5 cursor-move text-muted-foreground hover:text-foreground p-1 bg-white/80 rounded z-10">
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      <CardContent className="p-0 flex flex-col gap-1.5 items-center justify-center">
        {/* 첫 번째 줄: 성별 아이콘 + 배지 */}
        <div className="flex items-center justify-center gap-3 w-full pt-3">
          {/* 성별 아이콘 */}
          <span className="text-4xl">
            {student.gender === 'male' ? '👨‍🎓' : student.gender === 'female' ? '👩‍🎓' : '👨‍🎓'}
          </span>

          {/* 배지 표시 */}
          <PlayerBadgeDisplay
            badges={student.badges}
            customBadges={customBadges}
            size="sm"
            maxDisplay={3}
            onClick={onClick}
          />
        </div>

        {/* 두 번째 줄: 이름 */}
        <div className="font-bold text-xl text-center w-full">
          {student.name}
        </div>

        {/* 세 번째 줄: 통계 정보 (편집 모드가 아닐 때만) */}
        {!isEditMode && (
          <div className="w-full pb-2">
            <div className="flex items-center justify-center gap-3 text-base">
              <span className="flex items-center gap-1" title="적중">
                <span className="text-lg">{STAT_ICONS.hits}</span>
                <span className="font-bold">{stats.hits}</span>
              </span>
              <span className="flex items-center gap-1" title="패스">
                <span className="text-lg">{STAT_ICONS.passes}</span>
                <span className="font-bold">{stats.passes}</span>
              </span>
              <span className="flex items-center gap-1" title="양보">
                <span className="text-lg">{STAT_ICONS.sacrifices}</span>
                <span className="font-bold">{stats.sacrifices}</span>
              </span>
              <span className="flex items-center gap-1" title="쿠키">
                <span className="text-lg">{STAT_ICONS.cookies}</span>
                <span className="font-bold">{stats.cookies}</span>
              </span>
            </div>
          </div>
        )}

        {/* 편집 모드: 성별 토글 버튼 */}
        {isEditMode && onGenderToggle && (
          <div className="flex justify-center pb-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGenderToggle();
              }}
              className="text-[10px] px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 rounded text-blue-700 transition-colors"
              title="성별 변경"
            >
              {student.gender === 'male' ? '👨→👩' : '👩→👨'}
            </button>
          </div>
        )}

      </CardContent>

      {/* 편집 모드: 삭제 버튼 (우측 상단) */}
      {isEditMode && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-1.5 -right-1.5 bg-rose-200 text-rose-700 rounded-full p-0.5 hover:bg-rose-300 transition-colors shadow-md z-20"
          title="삭제"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </Card>
  );
}
