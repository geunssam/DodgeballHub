'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { createGame } from '@/lib/dataService';
import { Team, GameSettings } from '@/types';
import { Check } from 'lucide-react';
import { getGameDefaults } from '@/lib/gameDefaults';

interface QuickGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  teacherId: string;
}

export function QuickGameModal({
  isOpen,
  onClose,
  teams,
  teacherId,
}: QuickGameModalProps) {
  const router = useRouter();
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [gameSettings, setGameSettings] = useState(() => getGameDefaults());

  useEffect(() => {
    if (isOpen) {
      setGameSettings(getGameDefaults());
    }
  }, [isOpen]);

  const handleTeamSelect = (teamId: string, checked: boolean) => {
    if (checked) {
      if (selectedTeamIds.length < 2) {
        setSelectedTeamIds([...selectedTeamIds, teamId]);
      } else {
        alert('최대 2개 팀만 선택할 수 있습니다.');
      }
    } else {
      setSelectedTeamIds(selectedTeamIds.filter(id => id !== teamId));
    }
  };

  const handleQuickStart = async () => {
    // 유효성 검사
    if (selectedTeamIds.length !== 2) {
      alert('정확히 2개의 팀을 선택해주세요.');
      return;
    }

    setIsCreating(true);

    try {
      // 선택된 팀 가져오기
      const selectedTeams = teams.filter(t => selectedTeamIds.includes(t.id));

      // 참여 학급 ID 추출
      const participatingClassIds = [...new Set(selectedTeams.flatMap(t => t.sourceClassIds || []))];

      // 호스트 학급 (첫 번째 팀의 원천 학급)
      const hostClassId = selectedTeams[0].sourceClassIds?.[0] || participatingClassIds[0];

      // 빠른 시작 설정값 사용 (분 → 초 변환)
      const { quickStart } = gameSettings;
      const duration = quickStart.duration * 60; // 분을 초로 변환
      const initialLives = quickStart.initialLives;
      const settings: GameSettings = {
        useOuterCourt: true,
        outerCourtRules: ['normal_catch_attack_right'],
        ballAdditions: quickStart.ballAdditions,
      };

      const gameTeams = selectedTeams.map(team => ({
        teamId: team.id,
        name: team.name,
        color: team.color,
        members: (team.members || []).map(member => ({
          studentId: member.studentId,
          initialLives,
          currentLives: initialLives,
          isInOuterCourt: false,
          position: 'inner' as const
        }))
      }));

      const gameRecords = selectedTeams.flatMap(team =>
        (team.members || []).map(member => ({
          studentId: member.studentId,
          outs: 0,
          passes: 0,
          sacrifices: 0,
          cookies: 0
        }))
      );

      const newGame = await createGame({
        teacherId,
        classIds: participatingClassIds,
        hostClassId,
        date: new Date().toISOString(),
        duration,
        settings,
        teams: gameTeams,
        status: 'in_progress',
        records: gameRecords,
        currentTime: duration // duration이 이미 초 단위로 변환됨
      });

      alert('✅ 경기가 시작되었습니다!');
      onClose();
      router.push(`/teacher/class/${hostClassId}/game/play?gameId=${newGame.id}`);
    } catch (error) {
      console.error('Failed to create game:', error);
      alert('경기 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            🚀 빠른 시작 - 팀 선택
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            경기할 2개 팀을 선택하세요. 나머지 설정은 자동으로 적용됩니다.
          </p>
        </DialogHeader>

        {/* 기본 설정 안내 */}
        <Card className="p-4 bg-green-50 border-green-200">
          <h4 className="font-semibold text-sm mb-2 text-green-800">📋 기본 설정</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
            <div className="flex items-center gap-2">
              <Check className="w-3 h-3" />
              <span>경기 시간: {gameSettings.quickStart.duration}분</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3 h-3" />
              <span>초기 하트: {gameSettings.quickStart.initialLives}개</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3 h-3" />
              <span>
                공 추가: {gameSettings.quickStart.ballAdditions.length > 0
                  ? `${gameSettings.quickStart.ballAdditions[0].minutesBefore}분마다`
                  : '없음'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3 h-3" />
              <span>외야 규칙: 일반 캐치 공격권</span>
            </div>
          </div>
        </Card>

        {/* 팀 선택 */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">
            팀 선택 ({selectedTeamIds.length}/2)
          </h4>

          {teams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>생성된 팀이 없습니다.</p>
              <p className="text-sm">학급 관리에서 먼저 팀을 생성해주세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teams.map((team) => {
                const isSelected = selectedTeamIds.includes(team.id);
                return (
                  <label
                    key={team.id}
                    className={`
                      flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${isSelected
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleTeamSelect(team.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="font-semibold">{team.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        👥 {team.members?.length || 0}명
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isCreating}
          >
            취소
          </Button>
          <Button
            onClick={handleQuickStart}
            className="flex-1 bg-green-500 hover:bg-green-600"
            disabled={selectedTeamIds.length !== 2 || isCreating}
          >
            {isCreating ? '경기 생성 중...' : '🎯 바로 시작'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
