'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getGameDefaults, saveGameDefaults, resetGameDefaults, DEFAULT_GAME_SETTINGS } from '@/lib/gameDefaults';
import { GameDefaults } from '@/types';

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GameSettingsModal({ isOpen, onClose }: GameSettingsModalProps) {
  const [settings, setSettings] = useState<GameDefaults>(DEFAULT_GAME_SETTINGS);

  useEffect(() => {
    if (isOpen) {
      setSettings(getGameDefaults());
    }
  }, [isOpen]);

  const handleSave = () => {
    saveGameDefaults(settings);
    alert('✅ 설정이 저장되었습니다!');
    onClose();
  };

  const handleReset = () => {
    if (confirm('정말 기본값으로 초기화하시겠습니까?')) {
      resetGameDefaults();
      setSettings(DEFAULT_GAME_SETTINGS);
      alert('✅ 기본값으로 초기화되었습니다!');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            ⚙️ 경기 기본 설정
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center mt-1">
            빠른 시작과 상세 시작의 기본값을 설정합니다.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-6">
          {/* 빠른 시작 설정 */}
          <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-sm">
            <h3 className="text-lg font-bold text-green-800 mb-4 text-center flex items-center justify-center gap-2">
              <span>⚡</span>
              <span>빠른 시작 기본값</span>
            </h3>

            <div className="space-y-4">
              {/* 경기 시간 */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  경기 시간 (분)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.quickStart.duration}
                  onChange={(e) => setSettings({
                    ...settings,
                    quickStart: {
                      ...settings.quickStart,
                      duration: parseInt(e.target.value) || 1,
                    }
                  })}
                  className="w-full px-3 py-2 text-sm font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>

              {/* 초기 하트 */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  초기 하트 (개)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.quickStart.initialLives}
                  onChange={(e) => setSettings({
                    ...settings,
                    quickStart: {
                      ...settings.quickStart,
                      initialLives: parseInt(e.target.value) || 1,
                    }
                  })}
                  className="w-full px-3 py-2 text-sm font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>

              {/* 공 추가 간격 */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  공 추가 간격 (분, 0은 추가 안함)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={settings.quickStart.ballAdditions.length > 0 ? settings.quickStart.ballAdditions[0].minutesBefore : 0}
                  onChange={(e) => {
                    const minutes = parseInt(e.target.value) || 0;
                    setSettings({
                      ...settings,
                      quickStart: {
                        ...settings.quickStart,
                        ballAdditions: minutes > 0 ? [{ minutesBefore: minutes }] : [],
                      }
                    });
                  }}
                  className="w-full px-3 py-2 text-sm font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
            </div>
          </Card>

          {/* 상세 시작 설정 */}
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-sm">
            <h3 className="text-lg font-bold text-blue-800 mb-4 text-center flex items-center justify-center gap-2">
              <span>⚙️</span>
              <span>상세 시작 기본값</span>
            </h3>

            <div className="space-y-4">
              {/* 경기 시간 */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  경기 시간 (분)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.detailedStart.duration}
                  onChange={(e) => setSettings({
                    ...settings,
                    detailedStart: {
                      ...settings.detailedStart,
                      duration: parseInt(e.target.value) || 1,
                    }
                  })}
                  className="w-full px-3 py-2 text-sm font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* 초기 하트 */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  초기 하트 (개)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.detailedStart.initialLives}
                  onChange={(e) => setSettings({
                    ...settings,
                    detailedStart: {
                      ...settings.detailedStart,
                      initialLives: parseInt(e.target.value) || 1,
                    }
                  })}
                  className="w-full px-3 py-2 text-sm font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* 공 추가 간격 */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  공 추가 간격 (분, 0은 추가 안함)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={settings.detailedStart.ballAdditions.length > 0 ? settings.detailedStart.ballAdditions[0].minutesBefore : 0}
                  onChange={(e) => {
                    const minutes = parseInt(e.target.value) || 0;
                    setSettings({
                      ...settings,
                      detailedStart: {
                        ...settings.detailedStart,
                        ballAdditions: minutes > 0 ? [{ minutesBefore: minutes }] : [],
                      }
                    });
                  }}
                  className="w-full px-3 py-2 text-sm font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-3 mt-8 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleReset}
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            🔄 초기화
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            onClick={onClose}
            className="min-w-[100px]"
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            className="min-w-[100px] bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            💾 저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
