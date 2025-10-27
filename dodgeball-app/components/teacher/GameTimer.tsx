'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BallAddition } from '@/types';
import { playBallAdditionBeep, playCountdownBeep } from '@/lib/soundService';

interface GameTimerProps {
  gameId: string;
  duration: number; // 초 단위
  initialTime?: number; // 저장된 시간
  initialPaused?: boolean; // 저장된 일시정지 상태
  isCompleted?: boolean; // 완료된 경기 여부
  ballAdditions: BallAddition[];
  currentBalls: number; // 현재 공 개수
  onBallAddition: () => void;
  onGameEnd: () => void;
  onTimeUpdate?: (time: number, paused: boolean) => void; // 실시간 저장 콜백
}

export function GameTimer({ gameId, duration, initialTime, initialPaused, isCompleted, ballAdditions, currentBalls, onBallAddition, onGameEnd, onTimeUpdate }: GameTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialTime ?? duration);
  const [isPaused, setIsPaused] = useState(initialPaused ?? false);
  const [triggeredAdditions, setTriggeredAdditions] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isCompleted || isPaused) return;

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 0) return 0;

        const newTime = prev - 1;

        // 공 추가 타이밍 체크
        ballAdditions.forEach((addition, index) => {
          const triggerTime = addition.minutesBefore * 60;
          if (newTime === triggerTime && !triggeredAdditions.has(index)) {
            playBallAdditionBeep();
            onBallAddition();
            setTriggeredAdditions(prev => new Set([...prev, index]));
          }
        });

        // 종료 10초 전 연속 비프음
        if (newTime <= 10 && newTime > 0) {
          playCountdownBeep();
        }

        // 경기 종료
        if (newTime === 0) {
          onGameEnd();
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted, isPaused, ballAdditions, onBallAddition, onGameEnd]);

  // 타이머 변경 시 저장 (별도 useEffect로 분리, 디바운싱 적용)
  useEffect(() => {
    if (!onTimeUpdate || isCompleted) return;

    const timeoutId = setTimeout(() => {
      onTimeUpdate(remainingSeconds, isPaused);
    }, 100); // 100ms 디바운싱

    return () => clearTimeout(timeoutId);
  }, [remainingSeconds, isPaused, isCompleted, onTimeUpdate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (remainingSeconds <= 10) return 'text-red-600';
    if (remainingSeconds <= 60) return 'text-orange-600';
    return 'text-gray-900';
  };

  return (
    <div className="text-center space-y-4">
      {/* 타이머 시계 */}
      <div className="flex items-center justify-center gap-4">
        <div className={`text-7xl font-bold ${getTimeColor()} flex items-center gap-3`}>
          <span className="text-8xl">⏱️</span>
          <span>{formatTime(remainingSeconds)}</span>
        </div>
        {/* 상태 카드 */}
        <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
          isPaused
            ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
            : 'bg-green-100 text-green-700 border-2 border-green-300'
        }`}>
          {isPaused ? '⏸️ 일시정지' : '▶️ 진행중'}
        </div>
      </div>

      {/* 버튼들 한 줄 배치 */}
      <div className="flex gap-2 justify-center items-center">
        <div className="text-lg font-bold">
          🏐 공: {currentBalls}개
        </div>
        <Button
          onClick={() => setIsPaused(!isPaused)}
          variant="outline"
          disabled={isCompleted}
          size="sm"
          className={`text-sm font-bold w-[110px] ${
            isPaused
              ? 'bg-green-100 hover:bg-green-200 border-green-300 text-green-700'
              : 'bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-700'
          }`}
        >
          {isPaused ? '▶️ 재개' : '⏸️ 일시정지'}
        </Button>
        <Button variant="outline" onClick={onGameEnd} disabled={isCompleted} size="sm" className="text-sm font-bold bg-red-100 hover:bg-red-200 border-red-300 text-red-700">
          🛑 경기 종료
        </Button>
      </div>
    </div>
  );
}
