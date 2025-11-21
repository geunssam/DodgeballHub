'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { BADGES, BADGE_TIERS, BadgeDefinition } from '@/lib/badgeSystem';
import { BADGE_CATEGORIES, groupBadgesByCategory, getCategoryColorClass } from '@/lib/badgeCategories';
import { Student } from '@/types';

interface BadgeCollectionProps {
  classId: string;
  students: Student[];
  onBack?: () => void;
}

interface BadgeCardProps {
  badge: BadgeDefinition;
  acquiredCount: number;
  totalStudents: number;
  onClick: () => void;
}

interface StudentListModalProps {
  badge: BadgeDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  classId: string;
}

// 등급 이름 매핑
const TIER_NAMES: Record<number, string> = {
  [BADGE_TIERS.BEGINNER]: '입문',
  [BADGE_TIERS.SKILLED]: '숙련',
  [BADGE_TIERS.MASTER]: '마스터',
  [BADGE_TIERS.LEGEND]: '레전드',
  [BADGE_TIERS.SPECIAL]: '특별',
};

// 등급별 색상
const TIER_COLORS: Record<number, string> = {
  [BADGE_TIERS.BEGINNER]: 'bg-gray-100 text-gray-700 border-gray-300',
  [BADGE_TIERS.SKILLED]: 'bg-blue-100 text-blue-700 border-blue-300',
  [BADGE_TIERS.MASTER]: 'bg-purple-100 text-purple-700 border-purple-300',
  [BADGE_TIERS.LEGEND]: 'bg-amber-100 text-amber-700 border-amber-300',
  [BADGE_TIERS.SPECIAL]: 'bg-orange-100 text-orange-700 border-orange-300',
};

// 배지 카드 컴포넌트 (baseball-firebase 스타일)
const BadgeCard: React.FC<BadgeCardProps> = ({ badge, acquiredCount, totalStudents, onClick }) => {
  const completionRate = totalStudents > 0 ? (acquiredCount / totalStudents) * 100 : 0;
  const isAcquired = acquiredCount > 0;

  return (
    <Card
      className={`w-full p-3 bg-card transition-all hover:scale-105 cursor-pointer ${isAcquired ? 'border-primary/50 hover:border-primary' : 'hover:border-muted-foreground/50'
        }`}
      onClick={onClick}
    >
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
        <Badge
          variant={isAcquired ? 'default' : 'outline'}
          className="text-xs"
        >
          {TIER_NAMES[badge.tier]}
        </Badge>

        {/* 설명 */}
        <p className="text-xs text-muted-foreground line-clamp-1">
          {badge.description}
        </p>

        {/* 획득 현황 (강조) */}
        <div className="mt-1 w-full">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">획득</span>
            <span className={isAcquired ? 'text-primary font-semibold' : 'text-muted-foreground'}>
              {acquiredCount} / {totalStudents}명
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full ${isAcquired ? 'bg-blue-400/30' : 'bg-muted-foreground/30'}`}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

// 학생 목록 모달 컴포넌트
const StudentListModal: React.FC<StudentListModalProps> = ({ badge, isOpen, onClose, students, classId }) => {
  if (!badge) return null;

  // 이 배지를 획득한 학생들 필터링
  const studentsWithBadge = students.filter(student => {
    return student.badges.some(b => b.id === badge.id);
  });

  // 반별로 그룹화 (classNumber 사용)
  const studentsByClass = studentsWithBadge.reduce((acc, student) => {
    const className = `${student.classNumber}반` || '미지정';
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(student);
    return acc;
  }, {} as Record<string, Student[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-5xl">{badge.icon}</span>
            <div>
              <DialogTitle className="text-xl">{badge.name}</DialogTitle>
              <Badge className={TIER_COLORS[badge.tier]}>{TIER_NAMES[badge.tier]}</Badge>
            </div>
          </div>
          <DialogDescription>{badge.description}</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium">총 획득 학생</span>
            <span className="text-lg font-bold text-blue-600">
              {studentsWithBadge.length}명
            </span>
          </div>

          {studentsWithBadge.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>아직 이 배지를 획득한 학생이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(studentsByClass).map(([className, classStudents]) => (
                <div key={className}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 px-2">
                    {className} ({classStudents.length}명)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {classStudents.map(student => (
                      <div
                        key={student.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                          {student.number}
                        </div>
                        <span className="text-sm font-medium">{student.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// 메인 배지 컬렉션 컴포넌트
export default function BadgeCollection({ classId, students, onBack }: BadgeCollectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 전체 배지 목록
  const allBadges = Object.values(BADGES);

  // 배지별 획득 학생 수 계산
  const badgeAcquisitionCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    allBadges.forEach(badge => {
      const count = students.filter(student => {
        return student.badges.some(b => b.id === badge.id);
      }).length;
      counts[badge.id] = count;
    });

    return counts;
  }, [allBadges, students, classId]);

  // 전체 통계
  const totalBadges = allBadges.length;
  const totalAcquiredBadges = Object.values(badgeAcquisitionCounts).reduce((sum, count) => sum + count, 0);
  const totalPossibleAcquisitions = totalBadges * students.length;
  const overallCompletionRate = totalPossibleAcquisitions > 0
    ? (totalAcquiredBadges / totalPossibleAcquisitions) * 100
    : 0;

  // 카테고리별 필터링
  const filteredBadges = useMemo(() => {
    if (selectedCategory === 'all') {
      return allBadges; // 전체 탭: 모든 시스템 배지
    }
    if (selectedCategory === 'custom') {
      // 커스텀 배지는 현재 구현되어 있지 않으므로 빈 배열 반환
      return [];
    }
    // 특정 카테고리 선택 시: 해당 카테고리의 배지만 필터링
    return allBadges.filter(badge => {
      const category = Object.values(BADGE_CATEGORIES).find(cat => cat.id === selectedCategory);
      return category?.badgeIds.includes(badge.id);
    });
  }, [selectedCategory, allBadges]);

  // 티어순으로 정렬
  const sortedBadges = useMemo(() => {
    return [...filteredBadges].sort((a, b) => a.tier - b.tier);
  }, [filteredBadges]);

  // 전체 탭 전용: 티어별 행, 카테고리별 열 데이터 구조
  const allTabData = useMemo(() => {
    if (selectedCategory !== 'all') return null;

    // 카테고리 순서 정의
    const categoryOrder = ['games', 'outs', 'passes', 'sacrifices', 'cookies', 'special'];

    // 티어별로 그룹화 (1-5: 입문, 숙련, 마스터, 레전드, 특별)
    const tierGroups = new Map<number, BadgeDefinition[]>();

    for (let tier = 1; tier <= 5; tier++) {
      const tierBadges: BadgeDefinition[] = [];

      // 카테고리 순서대로 해당 티어의 배지 추가
      categoryOrder.forEach(catId => {
        const category = Object.values(BADGE_CATEGORIES).find(c => c.id === catId);
        if (!category) return;

        category.badgeIds.forEach(badgeId => {
          const badge = allBadges.find(b => b.id === badgeId && b.tier === tier);
          if (badge) {
            tierBadges.push(badge);
          }
        });
      });

      if (tierBadges.length > 0) {
        tierGroups.set(tier, tierBadges);
      }
    }

    return tierGroups;
  }, [allBadges, selectedCategory]);

  const handleBadgeClick = (badge: BadgeDefinition) => {
    setSelectedBadge(badge);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBadge(null);
  };

  return (
    <div className="w-full max-w-full h-full flex flex-col bg-background min-h-0 pt-10">
      {/* 헤더 (baseball-firebase 스타일) */}
      <div className="border-b bg-card px-6 py-5 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* 좌측: 대시보드 버튼 */}
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-sky-100 hover:bg-sky-200 text-sky-700 font-medium rounded-full transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0"
            >
              <span>←</span>
              <span>대시보드</span>
            </button>
          )}

          {/* 중앙: 제목 */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <h1 className="text-2xl font-bold">🏆 배지 도감</h1>
          </div>

          {/* 우측: 통계 카드 3개 */}
          <div className="flex items-center gap-3">
            <div className="text-center bg-blue-50 rounded-lg px-4 py-2">
              <p className="text-sm font-bold text-black mb-1">전체 배지</p>
              <p className="text-2xl font-bold text-black">{totalBadges}</p>
            </div>
            <div className="text-center bg-green-50 rounded-lg px-4 py-2">
              <p className="text-sm font-bold text-black mb-1">획득한 배지</p>
              <p className="text-2xl font-bold text-black">{totalAcquiredBadges}</p>
            </div>
            <div className="text-center bg-purple-50 rounded-lg px-4 py-2">
              <p className="text-sm font-bold text-black mb-1">달성률</p>
              <p className="text-2xl font-bold text-black">
                {totalPossibleAcquisitions > 0 ? Math.round((totalAcquiredBadges / totalPossibleAcquisitions) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 카테고리별 탭 필터 */}
      <Tabs defaultValue="all" onValueChange={(value) => setSelectedCategory(value)} className="flex-1 w-full max-w-full flex flex-col min-h-0 overflow-hidden mt-2">
        <TabsList className="w-full grid grid-cols-8 rounded-none border-b flex-shrink-0">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="games">경기</TabsTrigger>
          <TabsTrigger value="hits">히트</TabsTrigger>
          <TabsTrigger value="passes">패스</TabsTrigger>
          <TabsTrigger value="sacrifices">양보</TabsTrigger>
          <TabsTrigger value="cookies">쿠키</TabsTrigger>
          <TabsTrigger value="special">특별</TabsTrigger>
          <TabsTrigger value="custom">커스텀</TabsTrigger>
        </TabsList>

        {/* 전체 탭 */}
        <TabsContent value="all" className="flex-1 w-full max-w-full overflow-y-auto px-4 pt-4 pb-12 mt-0 min-h-0">
          <div className="w-full max-w-full grid grid-cols-4 gap-x-4 gap-y-4">
            {allBadges.map(badge => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                acquiredCount={badgeAcquisitionCounts[badge.id] || 0}
                totalStudents={students.length}
                onClick={() => handleBadgeClick(badge)}
              />
            ))}
          </div>
        </TabsContent>

        {/* 카테고리별 탭 */}
        {selectedCategory !== 'all' && (
          <TabsContent value={selectedCategory} className="flex-1 w-full max-w-full overflow-y-auto px-4 pt-4 pb-12 mt-0 min-h-0">
            {sortedBadges.length > 0 ? (
              <div className="w-full max-w-full grid grid-cols-4 gap-x-4 gap-y-4">
                {sortedBadges.map(badge => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    acquiredCount={badgeAcquisitionCounts[badge.id] || 0}
                    totalStudents={students.length}
                    onClick={() => handleBadgeClick(badge)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">이 카테고리에는 배지가 없습니다.</p>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* 학생 목록 모달 */}
      <StudentListModal
        badge={selectedBadge}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        students={students}
        classId={classId}
      />
    </div>
  );
}
