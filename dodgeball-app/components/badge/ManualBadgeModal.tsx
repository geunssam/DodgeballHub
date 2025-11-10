'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getAllBadges, BADGE_TIERS, type BadgeDefinition } from '@/lib/badgeSystem';
import type { CustomBadge, Student } from '@/types';
import { Award, User } from 'lucide-react';

interface ManualBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  customBadges: CustomBadge[];
  hiddenBadgeIds: string[];
  onAwardBadge: (studentId: string, badgeId: string, reason: string) => void;
}

export function ManualBadgeModal({
  isOpen,
  onClose,
  students,
  customBadges,
  hiddenBadgeIds,
  onAwardBadge,
}: ManualBadgeModalProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [step, setStep] = useState<'student' | 'badge' | 'reason'>('student');

  const systemBadges = getAllBadges();

  const handleReset = () => {
    setSelectedStudent(null);
    setSelectedBadgeId('');
    setReason('');
    setStep('student');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleAward = () => {
    if (!selectedStudent || !selectedBadgeId) {
      alert('학생과 배지를 선택해주세요.');
      return;
    }

    onAwardBadge(selectedStudent.id, selectedBadgeId, reason.trim() || '선생님이 직접 부여');
    handleReset();
    onClose();
  };

  // 학생이 아직 가지고 있지 않은 배지만 표시
  const getAvailableBadges = (): (BadgeDefinition | CustomBadge)[] => {
    if (!selectedStudent) return [];

    const studentBadgeIds = selectedStudent.badges?.map(b => b.id) || [];

    const availableSystemBadges = systemBadges.filter(
      badge => !studentBadgeIds.includes(badge.id) && !hiddenBadgeIds.includes(badge.id)
    );

    const availableCustomBadges = customBadges.filter(
      badge => !studentBadgeIds.includes(badge.id) && !hiddenBadgeIds.includes(badge.id)
    );

    return [...availableSystemBadges, ...availableCustomBadges];
  };

  const getTierColor = (tier?: number): string => {
    if (!tier) return 'bg-pink-100 text-pink-700 border-pink-300'; // 커스텀 배지

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

  const getTierLabel = (tier?: number): string => {
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

  const isSystemBadge = (badge: any): badge is BadgeDefinition => {
    return 'tier' in badge && typeof badge.tier === 'number';
  };

  const availableBadges = getAvailableBadges();
  const selectedBadge = availableBadges.find(b => b.id === selectedBadgeId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>배지 수동 부여</DialogTitle>
          <DialogDescription>
            특별한 성취나 노력을 보인 학생에게 배지를 직접 수여하세요
          </DialogDescription>
        </DialogHeader>

        {/* 진행 단계 표시 */}
        <div className="flex items-center gap-2 pb-4 border-b">
          <div className={cn(
            'flex items-center gap-2 px-3 py-1 rounded-full text-sm',
            step === 'student' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}>
            <User className="w-4 h-4" />
            1. 학생 선택
          </div>
          <div className="h-px flex-1 bg-border" />
          <div className={cn(
            'flex items-center gap-2 px-3 py-1 rounded-full text-sm',
            step === 'badge' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}>
            <Award className="w-4 h-4" />
            2. 배지 선택
          </div>
          <div className="h-px flex-1 bg-border" />
          <div className={cn(
            'flex items-center gap-2 px-3 py-1 rounded-full text-sm',
            step === 'reason' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}>
            ✍️ 3. 사유 입력
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Step 1: 학생 선택 */}
          {step === 'student' && (
            <div className="h-full flex flex-col">
              <Label className="mb-2">학생 선택</Label>
              <ScrollArea className="flex-1 pr-4">
                <div className="grid grid-cols-2 gap-2">
                  {students.map(student => (
                    <Card
                      key={student.id}
                      className={cn(
                        'cursor-pointer transition-all',
                        selectedStudent?.id === student.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      )}
                      onClick={() => setSelectedStudent(student)}
                    >
                      <CardContent className="p-3">
                        <div className="font-medium">{student.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          배지 {student.badges?.length || 0}개 보유
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Step 2: 배지 선택 */}
          {step === 'badge' && (
            <div className="h-full flex flex-col">
              <Label className="mb-2">
                {selectedStudent?.name}에게 수여할 배지
              </Label>
              {availableBadges.length > 0 ? (
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-2">
                    {availableBadges.map(badge => {
                      const isSys = isSystemBadge(badge);
                      const icon = isSys ? badge.icon : (badge as CustomBadge).emoji;
                      const tier = isSys ? badge.tier : undefined;

                      return (
                        <Card
                          key={badge.id}
                          className={cn(
                            'cursor-pointer transition-all',
                            selectedBadgeId === badge.id
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-primary/50'
                          )}
                          onClick={() => setSelectedBadgeId(badge.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{badge.name}</div>
                                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {badge.description}
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn('mt-2', getTierColor(tier))}
                                >
                                  {getTierLabel(tier)}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="text-4xl mb-3">🎉</div>
                  <div className="font-medium">
                    {selectedStudent?.name}은(는) 모든 배지를 보유하고 있습니다!
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    정말 대단한 학생이네요!
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: 사유 입력 */}
          {step === 'reason' && (
            <div className="h-full flex flex-col">
              <Label className="mb-2">배지 수여 사유 (선택)</Label>

              {/* 선택한 배지 미리보기 */}
              {selectedBadge && (
                <Card className="mb-4">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">
                        {isSystemBadge(selectedBadge)
                          ? selectedBadge.icon
                          : (selectedBadge as CustomBadge).emoji}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold">{selectedBadge.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {selectedBadge.description}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={getTierColor(
                            isSystemBadge(selectedBadge) ? selectedBadge.tier : undefined
                          )}>
                            {getTierLabel(
                              isSystemBadge(selectedBadge) ? selectedBadge.tier : undefined
                            )}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            → {selectedStudent?.name}에게 수여
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="예: 수업 시간에 친구를 도와준 모습이 인상적이었습니다"
                rows={4}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {reason.length}/200자 (선택사항)
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4 mt-4">
          {step === 'student' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button
                onClick={() => setStep('badge')}
                disabled={!selectedStudent}
              >
                다음
              </Button>
            </>
          )}

          {step === 'badge' && (
            <>
              <Button variant="outline" onClick={() => setStep('student')}>
                이전
              </Button>
              <Button
                onClick={() => setStep('reason')}
                disabled={!selectedBadgeId || availableBadges.length === 0}
              >
                다음
              </Button>
            </>
          )}

          {step === 'reason' && (
            <>
              <Button variant="outline" onClick={() => setStep('badge')}>
                이전
              </Button>
              <Button onClick={handleAward}>
                <Award className="w-4 h-4 mr-2" />
                배지 수여
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
