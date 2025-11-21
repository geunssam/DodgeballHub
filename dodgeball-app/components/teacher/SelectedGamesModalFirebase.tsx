'use client';

import { useMemo } from 'react';
import {
  aggregateClassScores,
  aggregatePlayerStatsForIntegratedAnalysis,
  calculatePlayerRanking,
  getMVPs,
  calculatePlayerPoints
} from '@/lib/statsHelpers';
import { FinishedGame, Team, Student } from '@/types';
import { PlayerBadgeDisplay } from '@/components/badge/PlayerBadgeDisplay';

interface SelectedGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGames: FinishedGame[];
  teams: Team[];
  students: Student[];
}

/**
 * SelectedGamesModal - Firebase 스타일 버전
 *
 * 선택된 경기들의 통합 분석 모달
 * 탭 없이 한 화면에 모든 정보 표시
 */
export function SelectedGamesModalFirebase({
  isOpen,
  onClose,
  selectedGames,
  teams,
  students
}: SelectedGamesModalProps) {
  // ============================================
  // 데이터 계산 (useMemo로 최적화)
  // ============================================

  const classScores = useMemo(
    () => aggregateClassScores(selectedGames, teams),
    [selectedGames, teams]
  );

  const playerStatsMap = useMemo(
    () => aggregatePlayerStatsForIntegratedAnalysis(selectedGames, teams, students),
    [selectedGames, teams, students]
  );

  const playerRanking = useMemo(
    () => calculatePlayerRanking(playerStatsMap),
    [playerStatsMap]
  );

  const mvps = useMemo(() => getMVPs(playerRanking), [playerRanking]);

  // 경기별 학급 점수 계산
  const classGameScores = useMemo(() => {
    const result: {
      [className: string]: {
        gameScores: { [gameId: string]: number };
        totalScore: number;
      };
    } = {};

    selectedGames.forEach((game) => {
      if (!game.finalScores || !game.teams) return;

      game.teams.forEach((gameTeam) => {
        const currentTeam = teams.find((t) => t.id === gameTeam.teamId);
        const className = currentTeam?.name || gameTeam.name || 'Unknown';

        if (!result[className]) {
          result[className] = {
            gameScores: {},
            totalScore: 0
          };
        }

        const teamScore = game.finalScores[gameTeam.teamId] || 0;
        result[className].gameScores[game.id] = teamScore;
        result[className].totalScore += teamScore;
      });
    });

    return result;
  }, [selectedGames, teams]);

  if (!isOpen) return null;

  // ============================================
  // 렌더링 - Firebase 스타일
  // ============================================

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* 모달 헤더 (sticky) - Firebase 스타일 */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-t-2xl z-10 shadow-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-bold">📊 통합 분석</h2>
              <span className="text-blue-100 text-2xl">선택된 경기: {selectedGames.length}개</span>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg px-4 py-2 font-bold transition text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 모달 내용 - 한 화면에 모든 섹션 표시 */}
        <div className="p-6 space-y-8">

          {/* Section 1: 학급별 통합 스코어보드 */}
          <section className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 shadow-xl">
            <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <span className="text-4xl">🏆</span>
              <span>학급별 통합 스코어보드</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-3xl">
                <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <tr className="font-bold">
                    <th className="border-2 border-gray-300 py-4 px-6 rounded-tl-lg">학급</th>
                    {selectedGames.map((game, idx) => (
                      <th key={game.id || idx} className="border-2 border-gray-300 py-4 px-6">
                        경기 {idx + 1}
                      </th>
                    ))}
                    <th className="border-2 border-gray-300 py-4 px-6 bg-yellow-500 rounded-tr-lg">
                      총점
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {Object.entries(classGameScores)
                    .sort(([, a], [, b]) => b.totalScore - a.totalScore)
                    .map(([className, data], idx) => (
                      <tr
                        key={className}
                        className={idx === 0 ? 'bg-yellow-50 font-bold' : 'hover:bg-gray-50'}
                      >
                        <td className="border-2 border-gray-300 py-4 px-6 font-bold">
                          {idx === 0 && <span className="mr-3 text-5xl">🥇</span>}
                          {idx === 1 && <span className="mr-3 text-5xl">🥈</span>}
                          {idx === 2 && <span className="mr-3 text-5xl">🥉</span>}
                          {className}
                        </td>
                        {selectedGames.map((game) => (
                          <td
                            key={game.id}
                            className="border-2 border-gray-300 py-4 px-6 font-semibold"
                          >
                            {data.gameScores[game.id] || 0}
                          </td>
                        ))}
                        <td className="border-2 border-gray-300 py-4 px-6 font-black text-5xl bg-yellow-100">
                          {data.totalScore}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 2: 통합 MVP 카드 */}
          {mvps.length > 0 && (
            <section className="bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 rounded-xl p-10 shadow-2xl border-4 border-yellow-400">
              <div className={`space-y-10 ${mvps.length > 1 ? 'divide-y-4 divide-orange-300' : ''}`}>
                {mvps.map((mvp, idx) => (
                  <div key={mvp.id} className={idx > 0 ? 'pt-10' : ''}>
                    {/* 첫 줄: 왕관 | 통합 MVP | 폭죽 */}
                    <div className="flex items-center justify-center gap-8 mb-8">
                      <span className="text-7xl animate-bounce">👑</span>
                      <h3 className="text-6xl font-black text-yellow-900">
                        {mvps.length === 1 ? '통합 MVP' : `공동 MVP`}
                      </h3>
                      <span className="text-7xl animate-pulse">🎉</span>
                    </div>

                    {/* 둘째 줄: 이름, 학급 | 소속팀 */}
                    <div className="text-center mb-8">
                      <div className="text-6xl font-black text-orange-600 mb-4">{mvp.name}</div>
                      <div className="text-4xl text-gray-800 font-bold">
                        {mvp.className || '-'} | 소속 팀: {mvp.teamNames?.join(', ') || '-'}
                      </div>
                    </div>

                    {/* 셋째 줄: 경기 스탯 카드 */}
                    <div className="grid grid-cols-5 gap-6">
                      {/* 아웃 카드 */}
                      <div className="bg-red-100 rounded-xl p-6 shadow-xl flex flex-col items-center gap-3">
                        <div className="text-5xl">🎯</div>
                        <div className="text-2xl text-red-800 font-bold">아웃</div>
                        <div className="text-5xl font-black text-red-900">{mvp.outs}</div>
                      </div>
                      {/* 패스 카드 */}
                      <div className="bg-blue-100 rounded-xl p-6 shadow-xl flex flex-col items-center gap-3">
                        <div className="text-5xl">🤝</div>
                        <div className="text-2xl text-blue-800 font-bold">패스</div>
                        <div className="text-5xl font-black text-blue-900">{mvp.passes}</div>
                      </div>
                      {/* 양보 카드 */}
                      <div className="bg-purple-100 rounded-xl p-6 shadow-xl flex flex-col items-center gap-3">
                        <div className="text-5xl">👼</div>
                        <div className="text-2xl text-purple-800 font-bold">양보</div>
                        <div className="text-5xl font-black text-purple-900">{mvp.sacrifices}</div>
                      </div>
                      {/* 쿠키 카드 */}
                      <div className="bg-orange-100 rounded-xl p-6 shadow-xl flex flex-col items-center gap-3">
                        <div className="text-5xl">🍪</div>
                        <div className="text-2xl text-orange-800 font-bold">쿠키</div>
                        <div className="text-5xl font-black text-orange-900">{mvp.cookies}</div>
                      </div>
                      {/* 총점 카드 */}
                      <div className="bg-gradient-to-r from-yellow-200 to-orange-200 rounded-xl p-6 shadow-2xl flex flex-col items-center gap-3">
                        <div className="text-5xl">⭐</div>
                        <div className="text-2xl text-orange-900 font-black">총점</div>
                        <div className="text-5xl font-black text-orange-900">{mvp.totalPoints}</div>
                      </div>
                    </div>

                    {/* 출전 경기 수 */}
                    <div className="mt-6 text-center text-3xl text-gray-700 font-semibold">
                      출전 경기: {mvp.gamesPlayed}개
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 3: 전체 선수 랭킹 */}
          <section className="bg-white rounded-xl p-8 shadow-xl border-4 border-gray-300">
            <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <span className="text-4xl">🎖️</span>
              <span>전체 선수 랭킹</span>
              <span className="text-2xl text-gray-500 font-normal">
                ({playerRanking.length}명)
              </span>
            </h3>

            {/* 랭킹 테이블 (스크롤 가능) */}
            <div className="overflow-x-auto">
              <div className="max-h-[600px] overflow-y-auto border-4 border-gray-300 rounded-lg">
                <table className="w-full text-center border-collapse">
                  <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white sticky top-0 z-10">
                    <tr className="text-2xl font-bold">
                      <th className="border-2 border-gray-300 p-5 w-20">순위</th>
                      <th className="border-2 border-gray-300 p-5">이름</th>
                      <th className="border-2 border-gray-300 p-5">학급</th>
                      <th className="border-2 border-gray-300 p-5">팀</th>
                      <th className="border-2 border-gray-300 p-5">출전</th>
                      <th className="border-2 border-gray-300 p-5">🔥 히트</th>
                      <th className="border-2 border-gray-300 p-5">🤝 패스</th>
                      <th className="border-2 border-gray-300 p-5">👼 양보</th>
                      <th className="border-2 border-gray-300 p-5">🍪 쿠키</th>
                      <th className="border-2 border-gray-300 p-5 bg-yellow-500">총점</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {playerRanking.map((player) => {
                      const isMVP = player.rank === 1;
                      const isSecond = player.rank === 2;
                      const isThird = player.rank === 3;

                      return (
                        <tr
                          key={player.id}
                          className={`
                            ${isMVP ? 'bg-yellow-50 font-bold' : ''}
                            ${isSecond ? 'bg-gray-50 font-semibold' : ''}
                            ${isThird ? 'bg-orange-50 font-semibold' : ''}
                            ${player.rank > 3 ? 'hover:bg-gray-50' : ''}
                          `}
                        >
                          <td className="border-2 border-gray-300 p-5 text-3xl font-black">
                            {player.rank === 1 && <span className="text-gray-900">🥇 {player.rank}</span>}
                            {player.rank === 2 && <span className="text-gray-900">🥈 {player.rank}</span>}
                            {player.rank === 3 && <span className="text-gray-900">🥉 {player.rank}</span>}
                            {player.rank > 3 && <span className="text-gray-800">{player.rank}</span>}
                          </td>
                          <td className="border-2 border-gray-300 p-5 font-bold text-2xl text-gray-900">
                            {player.name}
                          </td>
                          <td className="border-2 border-gray-300 p-5 text-2xl font-semibold text-gray-800">
                            {player.className || '-'}
                          </td>
                          <td className="border-2 border-gray-300 p-5 text-xl font-semibold text-gray-800">
                            {player.teamNames?.join(', ') || '-'}
                          </td>
                          <td className="border-2 border-gray-300 p-5 text-2xl font-semibold text-gray-800">
                            {player.gamesPlayed}
                          </td>
                          <td className="border-2 border-gray-300 p-5 text-2xl font-bold text-gray-900">
                            {player.outs}
                          </td>
                          <td className="border-2 border-gray-300 p-5 text-2xl font-bold text-gray-900">
                            {player.passes}
                          </td>
                          <td className="border-2 border-gray-300 p-5 text-2xl font-bold text-gray-900">
                            {player.sacrifices}
                          </td>
                          <td className="border-2 border-gray-300 p-5 text-2xl font-bold text-gray-900">
                            {player.cookies}
                          </td>
                          <td className="border-2 border-gray-300 p-5 font-black text-3xl bg-yellow-50 text-gray-900">
                            {player.totalPoints}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Section 4: 경기별 상세 기록 */}
          <section className="bg-gray-50 rounded-xl p-8 shadow-xl">
            <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <span className="text-4xl">📋</span>
              <span>경기별 상세 기록</span>
            </h3>

            <div className="space-y-6">
              {[...selectedGames].reverse().map((game, idx) => {
                // 경기 점수 계산
                const teamScores = game.teams.map(team => {
                  const score = game.records
                    .filter(r => team.members.some(m => m.studentId === r.studentId))
                    .reduce((sum, r) => sum + r.outs + r.passes + r.sacrifices + r.cookies, 0);
                  return { team, score };
                });

                const winner = teamScores.reduce((prev, current) =>
                  current.score > prev.score ? current : prev
                );

                // 이 경기의 MVP 계산
                const playersWithPoints = game.records.map((record) => {
                  const student = students.find((s) => s.id === record.studentId);
                  return {
                    id: record.studentId,
                    name: student?.name || '알 수 없음',
                    totalPoints: calculatePlayerPoints(record)
                  };
                });

                playersWithPoints.sort((a, b) => b.totalPoints - a.totalPoints);
                const topScore = playersWithPoints[0]?.totalPoints || 0;
                const gameMVPs = topScore > 0
                  ? playersWithPoints.filter((p) => p.totalPoints === topScore)
                  : [];

                const gameDate = new Date(game.finishedAt || game.date);

                return (
                  <details
                    key={game.id || idx}
                    className="border-4 border-gray-300 rounded-xl bg-white hover:shadow-xl transition-all"
                  >
                    <summary className="cursor-pointer p-8 hover:bg-gray-50 rounded-xl transition-colors list-none">
                      <div className="flex items-center gap-4 text-2xl">
                        {/* 승리 배지 */}
                        <span className="w-16 text-center flex-shrink-0 text-5xl">
                          🏆
                        </span>

                        {/* 팀 정보 */}
                        <div className="flex items-center gap-4">
                          {teamScores.map((ts, i) => (
                            <div key={i} className="flex items-center gap-4">
                              {i > 0 && <span className="text-gray-400 text-2xl w-14 text-center font-bold">vs</span>}
                              <span className="font-bold w-40 text-center truncate text-3xl" title={ts.team.name}>
                                {ts.team.name}
                              </span>
                              <span className={`font-black text-5xl w-20 text-center ${
                                ts.team.teamId === winner.team.teamId ? 'text-blue-600' : 'text-gray-600'
                              }`}>
                                {ts.score}
                              </span>
                            </div>
                          ))}
                        </div>

                        <span className="text-gray-300 w-8 text-center text-3xl">|</span>

                        {/* 날짜 */}
                        <span className="text-gray-700 flex items-center justify-center gap-2 w-52 font-semibold">
                          <span className="text-3xl">📅</span>
                          <span className="text-center text-xl">
                            {gameDate.toLocaleDateString('ko-KR')}
                          </span>
                        </span>

                        {/* 돋보기 아이콘 */}
                        <div className="ml-auto text-5xl text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0">
                          🔍
                        </div>
                      </div>
                    </summary>

                    {/* 상세 내용 */}
                    <div className="p-8 pt-0 space-y-6">
                      {/* MVP 정보 */}
                      {gameMVPs.length > 0 && (
                        <div className="bg-yellow-50 border-4 border-yellow-300 rounded-xl p-8">
                          <div className="text-3xl text-yellow-800 font-bold mb-6 flex items-center gap-4">
                            <span className="text-5xl">👑</span>
                            <span>
                              {gameMVPs.length === 1
                                ? '이 경기 MVP'
                                : `공동 MVP (${gameMVPs.length}명)`}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4">
                            {gameMVPs.map((mvp, mvpIdx) => (
                              <div
                                key={mvpIdx}
                                className="bg-white rounded-xl px-8 py-6 shadow-xl flex-1 min-w-[350px] flex items-center justify-between"
                              >
                                <div className="font-bold text-yellow-900 text-3xl">{mvp.name}</div>
                                <div className="font-black text-orange-600 text-4xl">
                                  {mvp.totalPoints}점
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 팀별 선수 기록 테이블은 StatsView와 동일하게 유지 */}
                    </div>
                  </details>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default SelectedGamesModalFirebase;