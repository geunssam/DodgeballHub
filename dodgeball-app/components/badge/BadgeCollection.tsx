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
  [BADGE_TIERS.CUSTOM]: '커스텀',
};

// 등급별 색상
const TIER_COLORS: Record<number, string> = {
  [BADGE_TIERS.BEGINNER]: 'bg-gray-100 text-gray-700 border-gray-300',
  [BADGE_TIERS.SKILLED]: 'bg-blue-100 text-blue-700 border-blue-300',
  [BADGE_TIERS.MASTER]: 'bg-purple-100 text-purple-700 border-purple-300',
  [BADGE_TIERS.LEGEND]: 'bg-amber-100 text-amber-700 border-amber-300',
  [BADGE_TIERS.CUSTOM]: 'bg-pink-100 text-pink-700 border-pink-300',
};

// 배지 카드 컴포넌트 (컴팩트 버전)
const BadgeCard: React.FC<BadgeCardProps> = ({ badge, acquiredCount, totalStudents, onClick }) => {
  const completionRate = totalStudents > 0 ? (acquiredCount / totalStudents) * 100 : 0;

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
      onClick={onClick}
    >
      <CardHeader className="text-center pb-1.5 pt-3 px-2">
        <div className="text-4xl mb-1">{badge.icon}</div>
        <CardTitle className="text-sm leading-tight mb-1">{badge.name}</CardTitle>
        <Badge className={`${TIER_COLORS[badge.tier]} text-[10px] px-1.5 py-0.5`}>{TIER_NAMES[badge.tier]}</Badge>
      </CardHeader>
      <CardContent className="space-y-1.5 px-2 pb-3">
        <CardDescription className="text-[11px] text-center min-h-[28px] leading-tight line-clamp-2">
          {badge.description}
        </CardDescription>
        <div className="pt-1.5 border-t">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-gray-500">획득</span>
            <span className="text-xs font-semibold text-blue-600">
              {acquiredCount}/{totalStudents}
            </span>
          </div>
          <Progress value={completionRate} className="h-1.5" />
          <div className="text-[10px] text-gray-400 text-center mt-0.5">
            {completionRate.toFixed(0)}%
          </div>
        </div>
      </CardContent>
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
export default function BadgeCollection({ classId, students }: BadgeCollectionProps) {
  const [selectedTier, setSelectedTier] = useState<'all' | number>('all');
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

  // 등급별 필터링
  const filteredBadges = selectedTier === 'all'
    ? allBadges
    : allBadges.filter(badge => badge.tier === selectedTier);

  // 카테고리별 그룹화
  const groupedBadges = groupBadgesByCategory(filteredBadges);

  const handleBadgeClick = (badge: BadgeDefinition) => {
    setSelectedBadge(badge);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBadge(null);
  };

  return (
    <div className="space-y-4">
      {/* 통계 대시보드 (컴팩트) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardDescription className="text-xs">전체 배지</CardDescription>
            <CardTitle className="text-2xl">{totalBadges}개</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardDescription className="text-xs">획득된 배지</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{totalAcquiredBadges}개</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardDescription className="text-xs">학생 수</CardDescription>
            <CardTitle className="text-2xl text-green-600">{students.length}명</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardDescription className="text-xs">전체 달성률</CardDescription>
            <CardTitle className="text-2xl text-purple-600">
              {overallCompletionRate.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 등급별 탭 필터 */}
      <Tabs defaultValue="all" onValueChange={(value) => setSelectedTier(value === 'all' ? 'all' : Number(value))}>
        <TabsList className="grid w-full grid-cols-6 h-9">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value={String(BADGE_TIERS.BEGINNER)}>입문</TabsTrigger>
          <TabsTrigger value={String(BADGE_TIERS.SKILLED)}>숙련</TabsTrigger>
          <TabsTrigger value={String(BADGE_TIERS.MASTER)}>마스터</TabsTrigger>
          <TabsTrigger value={String(BADGE_TIERS.LEGEND)}>레전드</TabsTrigger>
          <TabsTrigger value={String(BADGE_TIERS.CUSTOM)}>커스텀</TabsTrigger>
        </TabsList>

        <TabsContent value={String(selectedTier)} className="space-y-6 mt-6">
          {Array.from(groupedBadges.entries()).map(([categoryId, categoryBadges]) => {
            if (categoryBadges.length === 0) return null;

            const category = Object.values(BADGE_CATEGORIES).find(cat => cat.id === categoryId);
            if (!category) return null;

            return (
              <div key={categoryId}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{category.icon}</span>
                  <h2 className="text-lg font-bold">{category.name}</h2>
                  <Badge variant="outline" className={`${getCategoryColorClass(categoryId, 'text')} text-xs`}>
                    {categoryBadges.length}개
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {categoryBadges.map(badge => (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      acquiredCount={badgeAcquisitionCounts[badge.id] || 0}
                      totalStudents={students.length}
                      onClick={() => handleBadgeClick(badge)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>
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
