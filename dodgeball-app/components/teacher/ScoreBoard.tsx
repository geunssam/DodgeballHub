'use client';

import { Game } from '@/types';
import { GameTimer } from './GameTimer';

interface ScoreBoardProps {
  game: Game;
  onBallAddition: () => void;
  onGameEnd: () => void;
  onTimeUpdate?: (time: number, paused: boolean) => void;
}

export function ScoreBoard({ game, onBallAddition, onGameEnd, onTimeUpdate }: ScoreBoardProps) {
  // game.settings가 없을 때 기본값 제공
  const ballAdditions = game.settings?.ballAdditions || [];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg h-full flex flex-col justify-center items-center">
      <GameTimer
        gameId={game.id}
        duration={game.duration}
        initialTime={game.currentTime ?? game.duration}
        initialPaused={game.isPaused}
        isCompleted={game.isCompleted}
        ballAdditions={ballAdditions}
        currentBalls={game.currentBalls}
        onBallAddition={onBallAddition}
        onGameEnd={onGameEnd}
        onTimeUpdate={onTimeUpdate}
      />
    </div>
  );
}
