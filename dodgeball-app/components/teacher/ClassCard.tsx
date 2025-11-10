'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateClassStats, formatStatsWithIcons } from '@/lib/statsHelpers';
import type { Class, Student } from '@/types';

interface ClassCardProps {
  classData: Class;
  students: Student[];
  onClick?: () => void;
  onRename?: (newName: string) => void;
  className?: string;
}

export function ClassCard({
  classData,
  students,
  onClick,
  onRename,
  className,
}: ClassCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(classData.name);

  // 학급 전체 통계 계산
  const classStats = calculateClassStats(students);
  const statsWithIcons = formatStatsWithIcons(classStats);

  const handleEditStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(classData.name);
  };

  const handleEditCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditName(classData.name);
  };

  const handleEditSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editName.trim() && editName !== classData.name && onRename) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editName.trim() && editName !== classData.name && onRename) {
        onRename(editName.trim());
      }
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
      setEditName(classData.name);
    }
  };

  return (
    <Card
      className={cn(
        'h-[280px] cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]',
        className
      )}
      onClick={!isEditing ? onClick : undefined}
    >
      <CardContent className="p-6 tablet:p-8 tablet-lg:p-10 h-full flex flex-col justify-center gap-4">
        {/* Row 1: 이름 | 학생 수 | 전체 통계 */}
        <div className="flex items-center justify-between gap-4">
          {/* 학급 이름 */}
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
                  {classData.name}
                </h3>
                {onRename && (
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

          {/* 학생 수 */}
          <div className="shrink-0 flex flex-col items-center px-4 py-2 bg-blue-100/80 rounded-lg">
            <div className="text-sm tablet:text-base font-medium text-blue-700">
              학생 수
            </div>
            <div className="text-2xl tablet:text-3xl tablet-lg:text-4xl font-bold text-blue-900">
              {classStats.studentCount}
            </div>
          </div>
        </div>

        {/* Row 2: 통계 아이콘 */}
        <div className="flex items-center justify-around gap-2 pt-4 border-t">
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
