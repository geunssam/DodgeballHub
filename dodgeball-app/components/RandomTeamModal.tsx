'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { calculateTeamSizes, generateTeamName, TEAM_COLOR_NAMES, TeamNamingStyle } from '@/lib/teamUtils';

export type TeamAssignmentMode = 'single-class' | 'multi-class-mixed';

interface RandomTeamModalProps {
  totalStudents: number;
  mode?: TeamAssignmentMode;
  onConfirm: (teamCount: number, namingStyle: TeamNamingStyle) => void;
  onCancel: () => void;
}

export function RandomTeamModal({ totalStudents, mode = 'single-class', onConfirm, onCancel }: RandomTeamModalProps) {
  const [selectedTeamCount, setSelectedTeamCount] = useState(2);
  const [namingStyle, setNamingStyle] = useState<TeamNamingStyle>('numbered');

  const teamSizes = calculateTeamSizes(totalStudents, selectedTeamCount);

  const handleConfirm = () => {
    onConfirm(selectedTeamCount, namingStyle);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="p-8 max-w-lg w-full mx-4">
        <h2 className="text-2xl font-bold mb-6">랜덤 팀 편성 🎲</h2>

        {/* 총 학생 수 */}
        <div className="mb-6">
          <p className="text-gray-600 mb-2">총 학생 수</p>
          <p className="text-3xl font-bold text-blue-600">{totalStudents}명</p>
        </div>

        {/* 팀 개수 선택 */}
        <div className="mb-6">
          <p className="text-gray-600 mb-3">팀 개수 선택</p>
          <div className="grid grid-cols-5 gap-2">
            {[2, 3, 4, 5, 6].map(count => (
              <Button
                key={count}
                variant={selectedTeamCount === count ? 'default' : 'outline'}
                onClick={() => setSelectedTeamCount(count)}
                className="h-12"
              >
                {count}팀
              </Button>
            ))}
          </div>
        </div>

        {/* 팀 이름 스타일 선택 */}
        <div className="mb-6">
          <p className="text-gray-600 mb-3">팀 이름 스타일</p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={namingStyle === 'numbered' ? 'default' : 'outline'}
              onClick={() => setNamingStyle('numbered')}
              className="h-12"
            >
              숫자 (팀1, 팀2...)
            </Button>
            <Button
              variant={namingStyle === 'colored' ? 'default' : 'outline'}
              onClick={() => setNamingStyle('colored')}
              className="h-12"
            >
              색상 (레드팀, 블루팀...)
            </Button>
          </div>
        </div>

        {/* 팀별 예상 인원 */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">예상 팀 구성</p>
          <div className="space-y-1">
            {teamSizes.map((size, index) => (
              <p key={index} className="text-sm">
                <span className="font-bold">{generateTeamName(index, namingStyle)}</span>: {size}명
              </p>
            ))}
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-gray-700">
            ⚠️ <strong>주의:</strong> 랜덤 뽑기를 실행하면 기존 팀이 모두 삭제되고 새로 생성됩니다.
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-12"
          >
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            🎲 랜덤 뽑기 실행
          </Button>
        </div>
      </Card>
    </div>
  );
}
