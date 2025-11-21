'use client';

import { useState } from 'react';
import { GameHistoryEntry } from '@/types';

interface StudentGameHistoryProps {
  games: GameHistoryEntry[];
}

export function StudentGameHistory({ games }: StudentGameHistoryProps) {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // 정렬된 경기 목록
  const sortedGames = [...games].sort((a, b) => {
    const dateA = new Date(a.gameDate);
    const dateB = new Date(b.gameDate);
    return sortOrder === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
  });

  // 누적 통계 계산
  const totalStats = games.reduce((acc, game) => ({
    outs: acc.outs + (game.stats.hits || 0),
    passes: acc.passes + (game.stats.passes || 0),
    sacrifices: acc.sacrifices + (game.stats.sacrifices || 0),
    cookies: acc.cookies + (game.stats.cookies || 0),
    badges: acc.badges + (game.newBadges?.length || 0),
    wins: acc.wins + (game.result === 'win' ? 1 : 0)
  }), { outs: 0, passes: 0, sacrifices: 0, cookies: 0, badges: 0, wins: 0 });

  if (games.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-gradient-to-r from-blue-100 to-cyan-100 px-4 py-2 rounded-lg">
            <h2 className="text-3xl font-bold text-black">🏐 나의 경기 기록</h2>
          </div>
        </div>
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">⚾</div>
          <p className="text-lg">아직 출전한 경기가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <div className="bg-gradient-to-r from-blue-100 to-cyan-100 px-4 py-2 rounded-lg">
          <h2 className="text-3xl font-bold text-black">🏐 나의 경기 기록</h2>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
            className="px-3 py-2 border rounded-lg text-base"
          >
            <option value="desc">최신순</option>
            <option value="asc">오래된순</option>
          </select>
        </div>
      </div>

      {/* 누적 통계 요약 - 카드 스타일 */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl text-center">
          <div className="text-4xl font-bold text-blue-600">{games.length}</div>
          <div className="text-base text-gray-600 mt-1 font-bold">경기 수</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-xl text-center">
          <div className="text-4xl font-bold text-orange-600">{totalStats.outs}</div>
          <div className="text-base text-gray-600 mt-1 font-bold">아웃</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-xl text-center">
          <div className="text-4xl font-bold text-green-600">{totalStats.passes}</div>
          <div className="text-base text-gray-600 mt-1 font-bold">패스</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-xl text-center">
          <div className="text-4xl font-bold text-purple-600">{totalStats.sacrifices}</div>
          <div className="text-base text-gray-600 mt-1 font-bold">양보</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-xl text-center">
          <div className="text-4xl font-bold text-yellow-600">{totalStats.cookies}</div>
          <div className="text-base text-gray-600 mt-1 font-bold">쿠키</div>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-3 rounded-xl text-center">
          <div className="text-4xl font-bold text-teal-600">{totalStats.badges}</div>
          <div className="text-base text-gray-600 mt-1 font-bold">배지 수</div>
        </div>
      </div>

      {/* 경기 목록 - 테이블 형식 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="px-3 py-2 text-left text-base font-bold">날짜</th>
              <th className="px-3 py-2 text-left text-base font-bold">팀</th>
              <th className="px-3 py-2 text-center text-base font-bold">승패</th>
              <th className="px-3 py-2 text-center text-base font-bold">🎯 아웃</th>
              <th className="px-3 py-2 text-center text-base font-bold">🤝 패스</th>
              <th className="px-3 py-2 text-center text-base font-bold">💝 양보</th>
              <th className="px-3 py-2 text-center text-base font-bold">🍪 쿠키</th>
              <th className="px-3 py-2 text-left text-base font-bold">🏅 배지</th>
            </tr>
          </thead>
          <tbody>
            {sortedGames.map((game) => (
              <GameRow key={game.gameId} game={game} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * 개별 경기 행 컴포넌트
 */
function GameRow({ game }: { game: GameHistoryEntry }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const isWin = game.result === 'win';
  const isDraw = game.result === 'draw';
  const rowBgColor = isWin ? 'bg-blue-50' : isDraw ? 'bg-gray-50' : 'bg-red-50';
  const resultTextColor = isWin ? 'text-blue-600' : isDraw ? 'text-gray-600' : 'text-red-600';
  const resultText = isWin ? '승리' : isDraw ? '무승부' : '패배';
  const resultEmoji = isWin ? '🎉' : isDraw ? '🤝' : '😢';

  return (
    <tr className={`${rowBgColor} border-b border-gray-200 hover:shadow-md transition-shadow`}>
      {/* 날짜 */}
      <td className="px-3 py-3 text-base">
        {formatDate(game.gameDate)}
      </td>

      {/* 팀 */}
      <td className="px-3 py-3 text-base font-semibold">
        {game.teamName}
      </td>

      {/* 승패 */}
      <td className="px-3 py-3 text-center">
        <span className={`${resultTextColor} font-bold text-base`}>
          {resultEmoji} {resultText}
        </span>
      </td>

      {/* 아웃 */}
      <td className="px-3 py-3 text-center text-base font-semibold">
        {game.stats.hits}
      </td>

      {/* 패스 */}
      <td className="px-3 py-3 text-center text-base font-semibold">
        {game.stats.passes}
      </td>

      {/* 양보 */}
      <td className="px-3 py-3 text-center text-base font-semibold">
        {game.stats.sacrifices}
      </td>

      {/* 쿠키 */}
      <td className="px-3 py-3 text-center text-base font-semibold">
        {game.stats.cookies}
      </td>

      {/* 획득 배지 */}
      <td className="px-3 py-3 text-base">
        {game.newBadges && game.newBadges.length > 0 ? (
          <div className="flex gap-1 flex-wrap">
            {game.newBadges.map((badgeId, index) => (
              <span
                key={badgeId || `badge-${index}`}
                className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-semibold whitespace-nowrap"
              >
                🏅
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
    </tr>
  );
}
