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
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg h-full flex flex-col justify-center items-center">
      <GameTimer
        gameId={game.id}
        duration={game.duration}
        initialTime={game.currentTime ?? game.duration}
        initialPaused={game.isPaused}
        isCompleted={game.isCompleted}
        ballAdditions={game.settings.ballAdditions}
        currentBalls={game.currentBalls}
        onBallAddition={onBallAddition}
        onGameEnd={onGameEnd}
        onTimeUpdate={onTimeUpdate}
      />
    </div>
  );
}
