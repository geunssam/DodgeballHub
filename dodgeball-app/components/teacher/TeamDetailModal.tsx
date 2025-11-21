'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { X, Edit2, Check, User } from 'lucide-react';
import type { Team, Student } from '@/types';
import { calculateTeamStats, formatStatsWithIcons } from '@/lib/statsHelpers';
import { GenderIcon } from './GenderIcon';

interface TeamDetailModalProps {
  isOpen: boolean;
  team: Team | null;
  allStudents: Student[];
  onClose: () => void;
  onRename?: (newName: string) => void;
  onRemoveMember?: (studentId: string) => void;
}

export function TeamDetailModal({
  isOpen,
  team,
  allStudents,
  onClose,
  onRename,
  onRemoveMember,
}: TeamDetailModalProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(team?.name || '');

  if (!team) return null;

  // 팀 멤버 학생 정보 가져오기
  const teamMembers = team.members
    .map((member) => allStudents.find((s) => s.id === member.studentId))
    .filter((s): s is Student => s !== undefined);

  // 팀 통계 계산
  const teamStats = calculateTeamStats(team, allStudents);
  const statsWithIcons = formatStatsWithIcons(teamStats);

  // 팀 색상 배경 클래스
  const getTeamColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      red: 'bg-red-50 border-red-200',
      blue: 'bg-blue-50 border-blue-200',
      green: 'bg-green-50 border-green-200',
      yellow: 'bg-yellow-50 border-yellow-200',
      purple: 'bg-purple-50 border-purple-200',
      pink: 'bg-pink-50 border-pink-200',
      orange: 'bg-orange-50 border-orange-200',
      teal: 'bg-teal-50 border-teal-200',
      indigo: 'bg-indigo-50 border-indigo-200',
      cyan: 'bg-cyan-50 border-cyan-200',
    };
    return colorMap[color] || 'bg-gray-50 border-gray-200';
  };

  const handleSaveName = () => {
    if (editName.trim() && editName !== team.name && onRename) {
      onRename(editName.trim());
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditingName(false);
      setEditName(team.name);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[95vw] !max-h-[90vh] w-[95vw] overflow-y-auto">
        <DialogHeader className="flex-shrink-0 pr-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 flex-1">
              {/* 팀 이름 */}
              {isEditingName ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="text-2xl font-bold"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSaveName}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingName(false);
                      setEditName(team.name);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="text-2xl font-bold">{team.name}</span>
                  {onRename && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingName(true)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </>
              )}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* 팀 통계 요약 */}
        <Card className={`${getTeamColorClass(team.color)} border-2 p-4`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center">
              <User className="w-6 h-6 text-gray-600 mb-1" />
              <div className="text-sm text-gray-600">멤버 수</div>
              <div className="text-2xl font-bold">{teamStats.memberCount}</div>
            </div>
            {statsWithIcons.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
                <div className="text-2xl font-bold">{stat.value}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* 팀 멤버 목록 */}
        <div>
          <h3 className="text-lg font-bold mb-3">팀 멤버 ({teamMembers.length}명)</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {teamMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                팀원이 없습니다.
              </div>
            ) : (
              teamMembers.map((student) => (
                <Card
                  key={student.id}
                  className="p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    {/* 학생 정보 */}
                    <div className="flex items-center gap-4 flex-1">
                      {/* 번호 */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 font-bold text-gray-700">
                        {student.number}
                      </div>

                      {/* 이름 & 성별 */}
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{student.name}</span>
                        <GenderIcon gender={student.gender} />
                      </div>

                      {/* 학급 정보 */}
                      {student.className && (
                        <Badge variant="outline" className="text-xs">
                          {student.className}
                        </Badge>
                      )}
                    </div>

                    {/* 개인 통계 */}
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600">
                        🔥 {student.stats.outs} | 🤝 {student.stats.passes} | 👼{' '}
                        {student.stats.sacrifices} | 🍪 {student.stats.cookies}
                      </div>

                      {/* 제거 버튼 */}
                      {onRemoveMember && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRemoveMember(student.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          제거
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
