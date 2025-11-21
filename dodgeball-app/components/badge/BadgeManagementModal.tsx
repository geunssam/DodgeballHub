'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
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
import { BadgeCreator } from './BadgeCreator';

interface BadgeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  customBadges: CustomBadge[];
  hiddenBadgeIds: string[];
  onToggleBadgeVisibility: (badgeId: string) => void;
  onDeleteCustomBadge: (badgeId: string) => void;
  onRecalculateAll: () => void;
  onSaveCustomBadge?: (badge: CustomBadge) => void;
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
  onSaveCustomBadge,
}: BadgeManagementModalProps) {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [editMode, setEditMode] = useState<'system' | 'custom'>('custom');
  const [editingBadge, setEditingBadge] = useState<any | null>(null);

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

  const handleSaveBadge = (badge: any) => {
    if (onSaveCustomBadge) {
      onSaveCustomBadge(badge);
    }
    setEditingBadge(null);
    setActiveTab('edit');
  };

  const handleCancelEdit = () => {
    setEditingBadge(null);
  };

  // 시스템 배지 렌더링
  const renderSystemBadge = (badge: BadgeDefinition) => {
    const count = getBadgeCount(badge.id);
    const isHidden = hiddenBadgeIds.includes(badge.id);

    return (
      <Card
        key={badge.id}
        className={cn(
          'w-full p-3 bg-card transition-all hover:scale-105 relative',
          isHidden && 'opacity-50'
        )}
      >
        <CardContent className="p-0">
          <div className="flex flex-col items-center text-center gap-1.5">
            {/* 배지 아이콘 */}
            <div className="text-4xl">
              {badge.icon}
            </div>

            {/* 배지 이름 */}
            <h3 className="font-bold text-sm">
              {badge.name}
            </h3>

            {/* 등급 표시 */}
            <Badge variant="outline" className={getTierColor(badge.tier)}>
              {getTierLabel(badge.tier)}
            </Badge>

            {/* 설명 */}
            <p className="text-xs text-muted-foreground line-clamp-1">
              {badge.description}
            </p>

            {/* 획득 현황 */}
            <div className="mt-1 w-full">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">획득</span>
                <span className={count > 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                  {count}명
                </span>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-1 mt-2 w-full justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingBadge(badge)}
                title="수정"
                className="h-8 w-8"
              >
                <span className="text-base">✏️</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleBadgeVisibility(badge.id)}
                title={isHidden ? '표시하기' : '숨기기'}
                className="h-8 w-8"
              >
                {isHidden ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
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
      <Card
        key={badge.id}
        className={cn(
          'w-full p-3 bg-card transition-all hover:scale-105 relative',
          isHidden && 'opacity-50'
        )}
      >
        <CardContent className="p-0">
          <div className="flex flex-col items-center text-center gap-1.5">
            {/* 배지 아이콘 */}
            <div className="text-4xl">
              {badge.emoji}
            </div>

            {/* 배지 이름 */}
            <h3 className="font-bold text-sm">
              {badge.name}
            </h3>

            {/* 등급 표시 */}
            <Badge variant="outline" className="bg-pink-100 text-pink-700 border-pink-300">
              커스텀
            </Badge>

            {/* 설명 */}
            <p className="text-xs text-muted-foreground line-clamp-1">
              {badge.description}
            </p>

            {/* 획득 현황 */}
            <div className="mt-1 w-full">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">획득</span>
                <span className={count > 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                  {count}명
                </span>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-1 mt-2 w-full justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingBadge(badge)}
                title="수정"
                className="h-8 w-8"
              >
                <span className="text-base">✏️</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleBadgeVisibility(badge.id)}
                title={isHidden ? '표시하기' : '숨기기'}
                className="h-8 w-8"
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
                className="h-8 w-8"
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
      <DialogContent className="w-[95vw] max-w-[1600px] h-[85vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-8 pt-6">
          <DialogTitle>⚙️ 배지 편집</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden px-8">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="create">➕ 새로 만들기</TabsTrigger>
            <TabsTrigger value="edit">✏️ 수정하기</TabsTrigger>
            <TabsTrigger value="manage">🔧 관리</TabsTrigger>
          </TabsList>

          {/* 새로 만들기 탭 */}
          <TabsContent value="create" className="max-w-full flex-1 overflow-y-auto px-2 mt-4 pb-6">
            <BadgeCreator
              onSave={handleSaveBadge}
              standalone={false}
            />
          </TabsContent>

          {/* 수정하기 탭 */}
          <TabsContent value="edit" className="max-w-full flex-1 overflow-y-auto px-2 mt-4 pb-6">
            {editingBadge ? (
              <BadgeCreator
                initialBadge={editingBadge}
                onSave={handleSaveBadge}
                onCancel={handleCancelEdit}
                standalone={false}
              />
            ) : (
              <div className="space-y-4 h-full flex flex-col px-2">
                {/* 서브탭 */}
                <Tabs value={editMode} onValueChange={(v) => setEditMode(v as 'system' | 'custom')} className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="w-full flex-shrink-0">
                    <TabsTrigger value="system" className="flex-1">
                      🎯 기본 배지
                    </TabsTrigger>
                    <TabsTrigger value="custom" className="flex-1">
                      ✨ 커스텀 배지
                    </TabsTrigger>
                  </TabsList>

                  {/* 기본 배지 */}
                  <TabsContent value="system" className="max-w-full flex-1 overflow-y-auto px-2 mt-4">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        ⚠️ 기본 배지는 아이콘과 이름만 수정할 수 있습니다.
                      </p>
                      <div className="grid grid-cols-4 gap-4">
                        {systemBadges.map(renderSystemBadge)}
                      </div>
                    </div>
                  </TabsContent>

                  {/* 커스텀 배지 */}
                  <TabsContent value="custom" className="max-w-full flex-1 overflow-y-auto px-2 mt-4">
                    {customBadges.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <p className="text-5xl mb-4">📦</p>
                        <p className="text-lg font-semibold mb-2">아직 만든 배지가 없습니다</p>
                        <p className="text-sm">새로 만들기 탭에서 배지를 만들어보세요!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-4">
                        {customBadges.map(renderCustomBadge)}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </TabsContent>

          {/* 관리 탭 */}
          <TabsContent value="manage" className="max-w-full flex-1 overflow-y-auto px-2 mt-4 pb-6">
            <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="text-4xl">🔄</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      전체 배지 재계산
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      모든 학생의 배지를 경기 기록을 기반으로 다시 계산합니다.
                      배지 조건 변경, 데이터 오류 수정, 새 배지 추가 시 사용하세요.
                    </p>

                    <Button
                      onClick={handleRecalculate}
                      disabled={isRecalculating}
                      className="bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCcw className={cn('w-4 h-4 mr-2', isRecalculating && 'animate-spin')} />
                      {isRecalculating ? '재계산 중...' : '배지 재계산 시작'}
                    </Button>
                  </div>
                </div>

                {/* 주의사항 */}
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ 주의사항</p>
                  <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                    <li>학생 수가 많으면 시간이 걸릴 수 있습니다</li>
                    <li>재계산 중에는 다른 작업을 피해주세요</li>
                    <li>재계산 후 자동으로 저장됩니다</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
