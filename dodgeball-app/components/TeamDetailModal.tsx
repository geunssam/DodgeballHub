'use client';

import { Team, Class } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TeamDetailModalProps {
  team: Team | null;
  teamClass: Class | undefined;
  onClose: () => void;
}

export function TeamDetailModal({ team, teamClass, onClose }: TeamDetailModalProps) {
  if (!team) return null;

  // 팀 색상 매핑
  const getTeamColor = (color: string) => {
    const colorMap: Record<string, string> = {
      red: '#ef4444',
      blue: '#3b82f6',
      green: '#22c55e',
      yellow: '#eab308',
      purple: '#a855f7',
      orange: '#f97316',
    };
    return colorMap[color] || '#6b7280';
  };

  // 팀 통계 계산
  const totalScore = team.members?.reduce((sum, member) => sum + (member.stats?.totalScore || 0), 0) || 0;
  const avgScore = team.members?.length ? (totalScore / team.members.length).toFixed(1) : '0.0';
  const totalGames = team.members?.reduce((sum, member) => sum + (member.stats?.gamesPlayed || 0), 0) || 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card
        className="max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          {/* 헤더 */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: getTeamColor(team.color) }}
              />
              <div>
                <h2 className="text-xl font-bold">{team.name}</h2>
                {teamClass && (
                  <p className="text-sm text-gray-600">{teamClass.name}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              ✕
            </Button>
          </div>

          {/* 팀 통계 */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">팀 통계</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-600">팀원</p>
                <p className="text-lg font-bold text-blue-600">{team.members?.length || 0}명</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">총 점수</p>
                <p className="text-lg font-bold text-green-600">{totalScore}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">평균 점수</p>
                <p className="text-lg font-bold text-purple-600">{avgScore}</p>
              </div>
            </div>
          </div>

          {/* 팀원 목록 */}
          <div>
            <h3 className="font-semibold text-sm mb-2">팀원 목록</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {team.members && team.members.length > 0 ? (
                team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{member.name}</span>
                        <span className="text-xs text-gray-500">({member.number}번)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="text-right">
                        <span className="text-blue-600 font-semibold">
                          {member.stats?.totalScore || 0}점
                        </span>
                      </div>
                      <span className="text-gray-300">|</span>
                      <div className="text-right">
                        <span className="text-gray-500">
                          {member.stats?.gamesPlayed || 0}경기
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  팀원이 없습니다
                </p>
              )}
            </div>
          </div>

          {/* 닫기 버튼 */}
          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={onClose}
              className="w-full"
              variant="outline"
            >
              닫기
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
