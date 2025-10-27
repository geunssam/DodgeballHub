'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddTeamModalProps {
  onConfirm: (teamName: string) => void;
  onCancel: () => void;
}

export function AddTeamModal({ onConfirm, onCancel }: AddTeamModalProps) {
  const [teamName, setTeamName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      onConfirm(teamName.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-6">새 팀 만들기</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 팀 이름 입력 */}
          <div>
            <Label htmlFor="teamName" className="text-base mb-2 block">
              팀 이름
            </Label>
            <Input
              id="teamName"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="예: 레드팀, 블루팀..."
              className="h-12 text-base"
              autoFocus
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              팀 색상은 자동으로 지정됩니다
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 h-12"
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12"
              disabled={!teamName.trim()}
            >
              생성
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
