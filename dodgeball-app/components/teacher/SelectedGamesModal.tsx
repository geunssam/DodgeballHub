'use client';

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  aggregateClassScores,
  aggregatePlayerStatsForIntegratedAnalysis,
  calculatePlayerRanking,
  getMVPs,
  calculatePlayerPoints
} from '@/lib/statsHelpers';
import { FinishedGame, Team, Student } from '@/types';
import { BADGE_CATEGORIES } from '@/lib/badgeCategories';

interface SelectedGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGames: FinishedGame[];
  teams: Team[];
  students: Student[];
}

/**
 * SelectedGamesModal
 *
 * 선택된 경기들의 통합 분석 모달
 *
 * Props:
 * - isOpen: 모달 열림 상태
 * - onClose: 모달 닫기 핸들러
 * - selectedGames: 선택된 완료 경기 목록
 * - teams: 전체 팀 목록 (className 매핑용)
 * - students: 전체 학생 목록 (정확한 className 조회용)
 */
export function SelectedGamesModal({
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

  // 경기별 학급 점수 계산 (스코어보드용)
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
        // teams 배열에서 정확한 className 찾기
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

  // ============================================
  // 렌더링
  // ============================================

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        {/* 모달 헤더 */}
        <DialogHeader>
          <div className="flex items-center gap-4">
            <DialogTitle className="text-3xl font-bold">📊 통합 분석</DialogTitle>
            <DialogDescription className="text-xl text-blue-600">
              선택된 경기: {selectedGames.length}개
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* 모달 내용 */}
        <div className="space-y-6">
          {/* Section 1: 학급별 통합 스코어보드 */}
          <section className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 shadow-lg">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span>🏆</span>
              <span>학급별 통합 스코어보드</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-2xl">
                <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <tr className="font-bold">
                    <th className="border-2 border-gray-300 py-3 px-5 rounded-tl-lg">학급</th>
                    {selectedGames.map((game, idx) => (
                      <th key={game.id || idx} className="border-2 border-gray-300 py-3 px-5">
                        경기 {idx + 1}
                      </th>
                    ))}
                    <th className="border-2 border-gray-300 py-3 px-5 bg-yellow-500 rounded-tr-lg">
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
                        <td className="border-2 border-gray-300 py-3 px-5 font-bold">
                          {idx === 0 && <span className="mr-2 text-4xl">🥇</span>}
                          {className}
                        </td>
                        {selectedGames.map((game) => (
                          <td
                            key={game.id}
                            className="border-2 border-gray-300 py-3 px-5 font-semibold"
                          >
                            {data.gameScores[game.id] || 0}
                          </td>
                        ))}
                        <td className="border-2 border-gray-300 py-3 px-5 font-black text-4xl bg-yellow-100">
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
            <section className="bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 rounded-xl p-8 shadow-xl border-4 border-yellow-400">
              <div
                className={`space-y-8 ${mvps.length > 1 ? 'divide-y-4 divide-orange-300' : ''}`}
              >
                {mvps.map((mvp, idx) => (
                  <div key={mvp.id} className={idx > 0 ? 'pt-8' : ''}>
                    {/* 첫 줄: 왕관 | 통합 MVP | 폭죽 */}
                    <div className="flex items-center justify-center gap-6 mb-6">
                      <span className="text-6xl animate-bounce">👑</span>
                      <h3 className="text-5xl font-black text-yellow-900">
                        {mvps.length === 1 ? '통합 MVP' : `공동 MVP`}
                      </h3>
                      <span className="text-6xl animate-pulse">🎉</span>
                    </div>

                    {/* 둘째 줄: 이름, 학급 | 소속팀 */}
                    <div className="text-center mb-6">
                      <div className="text-5xl font-black text-orange-600 mb-3">{mvp.name}</div>
                      <div className="text-3xl text-gray-800 font-bold">
                        {mvp.className || '-'} | 소속 팀: {mvp.teamNames?.join(', ') || '-'}
                      </div>
                    </div>

                    {/* 셋째 줄: 경기 스탯 카드 */}
                    <div className="grid grid-cols-5 gap-4">
                      {/* 아웃 카드 */}
                      <div className="bg-red-100 rounded-xl p-4 shadow-lg flex items-center justify-between gap-2">
                        <div className="text-3xl">⚾</div>
                        <div className="text-xl text-red-800 font-bold">아웃</div>
                        <div className="text-3xl font-black text-red-900">{mvp.outs}</div>
                      </div>
                      {/* 통과 카드 */}
                      <div className="bg-blue-100 rounded-xl p-4 shadow-lg flex items-center justify-between gap-2">
                        <div className="text-3xl">🏃</div>
                        <div className="text-xl text-blue-800 font-bold">통과</div>
                        <div className="text-3xl font-black text-blue-900">{mvp.passes}</div>
                      </div>
                      {/* 희생 카드 */}
                      <div className="bg-purple-100 rounded-xl p-4 shadow-lg flex items-center justify-between gap-2">
                        <div className="text-3xl">🛡️</div>
                        <div className="text-xl text-purple-800 font-bold">희생</div>
                        <div className="text-3xl font-black text-purple-900">{mvp.sacrifices}</div>
                      </div>
                      {/* 쿠키 카드 */}
                      <div className="bg-orange-100 rounded-xl p-4 shadow-lg flex items-center justify-between gap-2">
                        <div className="text-3xl">🍪</div>
                        <div className="text-xl text-orange-800 font-bold">쿠키</div>
                        <div className="text-3xl font-black text-orange-900">{mvp.cookies}</div>
                      </div>
                      {/* 총점 카드 */}
                      <div className="bg-gradient-to-r from-yellow-200 to-orange-200 rounded-xl p-4 shadow-xl flex items-center justify-between gap-2">
                        <div className="text-3xl">⭐</div>
                        <div className="text-xl text-orange-900 font-black">총점</div>
                        <div className="text-3xl font-black text-orange-900">{mvp.totalPoints}</div>
                      </div>
                    </div>

                    {/* 출전 경기 수 */}
                    <div className="mt-4 text-center text-xl text-gray-700 font-semibold">
                      출전 경기: {mvp.gamesPlayed}개
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 3: 전체 선수 랭킹 */}
          <section className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span>🎖️</span>
              <span>전체 선수 랭킹</span>
              <span className="text-sm text-gray-500 font-normal">
                ({playerRanking.length}명)
              </span>
            </h3>

            {/* 랭킹 테이블 (스크롤 가능) */}
            <div className="overflow-x-auto">
              <div className="max-h-[500px] overflow-y-auto border-2 border-gray-300 rounded-lg">
                <table className="w-full text-center border-collapse">
                  <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white sticky top-0 z-10">
                    <tr className="text-xl font-bold">
                      <th className="border-2 border-gray-300 p-4 w-16">순위</th>
                      <th className="border-2 border-gray-300 p-4">이름</th>
                      <th className="border-2 border-gray-300 p-4">학급</th>
                      <th className="border-2 border-gray-300 p-4">팀</th>
                      <th className="border-2 border-gray-300 p-4">출전</th>
                      <th className="border-2 border-gray-300 p-4">⚾ 아웃</th>
                      <th className="border-2 border-gray-300 p-4">🏃 통과</th>
                      <th className="border-2 border-gray-300 p-4">🛡️ 희생</th>
                      <th className="border-2 border-gray-300 p-4">🍪 쿠키</th>
                      <th className="border-2 border-gray-300 p-4 bg-yellow-500">총점</th>
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
                          <td className="border-2 border-gray-300 p-4 text-xl font-bold">
                            {player.rank === 1 && (
                              <span className="text-gray-900">🥇 {player.rank}</span>
                            )}
                            {player.rank === 2 && (
                              <span className="text-gray-900">🥈 {player.rank}</span>
                            )}
                            {player.rank === 3 && (
                              <span className="text-gray-900">🥉 {player.rank}</span>
                            )}
                            {player.rank > 3 && <span className="text-gray-800">{player.rank}</span>}
                          </td>
                          <td className="border-2 border-gray-300 p-4 font-bold text-xl text-gray-900">
                            {player.name}
                          </td>
                          <td className="border-2 border-gray-300 p-4 text-lg font-semibold text-gray-800">
                            {player.className || '-'}
                          </td>
                          <td className="border-2 border-gray-300 p-4 text-base font-semibold text-gray-800">
                            {player.teamNames?.join(', ') || '-'}
                          </td>
                          <td className="border-2 border-gray-300 p-4 text-lg font-semibold text-gray-800">
                            {player.gamesPlayed}
                          </td>
                          <td className="border-2 border-gray-300 p-4 text-xl font-bold text-gray-900">
                            {player.outs}
                          </td>
                          <td className="border-2 border-gray-300 p-4 text-xl font-bold text-gray-900">
                            {player.passes}
                          </td>
                          <td className="border-2 border-gray-300 p-4 text-xl font-bold text-gray-900">
                            {player.sacrifices}
                          </td>
                          <td className="border-2 border-gray-300 p-4 text-xl font-bold text-gray-900">
                            {player.cookies}
                          </td>
                          <td className="border-2 border-gray-300 p-4 font-black text-xl bg-yellow-50 text-gray-900">
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
          <section className="bg-gray-50 rounded-xl p-6 shadow-lg">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span>📋</span>
              <span>경기별 상세 기록</span>
            </h3>

            <div className="space-y-4">
              {[...selectedGames].reverse().map((game, idx) => {
                // 승리 팀 찾기
                const winner =
                  game.winner ||
                  (game.teams.length >= 2 &&
                  game.finalScores[game.teams[0].teamId] > game.finalScores[game.teams[1].teamId]
                    ? game.teams[0].teamId
                    : game.teams.length >= 2 &&
                      game.finalScores[game.teams[0].teamId] < game.finalScores[game.teams[1].teamId]
                    ? game.teams[1].teamId
                    : null);

                // 경기 MVP 계산
                const gameMVPs = useMemo(() => {
                  const playersWithPoints = game.records.map((record) => {
                    const student = students.find((s) => s.id === record.studentId);
                    return {
                      id: record.studentId,
                      name: student?.name || `선수${record.studentId.slice(-4)}`,
                      totalPoints: calculatePlayerPoints(record)
                    };
                  });

                  playersWithPoints.sort((a, b) => b.totalPoints - a.totalPoints);
                  const topScore = playersWithPoints[0]?.totalPoints || 0;

                  return topScore > 0
                    ? playersWithPoints.filter((p) => p.totalPoints === topScore)
                    : [];
                }, [game.records, students]);

                // 날짜 파싱
                const gameDate = new Date(game.finishedAt || game.createdAt);

                return (
                  <details
                    key={game.id || idx}
                    className="border-2 border-gray-300 rounded-xl bg-white hover:shadow-md transition-shadow"
                  >
                    <summary className="cursor-pointer p-6 hover:bg-gray-50 rounded-xl transition-colors list-none">
                      <div className="flex items-center gap-4 text-lg">
                        {/* 승리 배지 */}
                        <span
                          className={`w-12 text-center flex-shrink-0 text-4xl ${winner ? '' : 'invisible'}`}
                        >
                          🏆
                        </span>

                        {/* 팀 정보 */}
                        {game.teams.length >= 2 && (
                          <div className="flex items-center gap-3">
                            <span
                              className="font-bold w-32 text-center truncate text-xl"
                              title={game.teams[0].name}
                            >
                              {game.teams[0].name}
                            </span>
                            <span
                              className={`font-black text-3xl w-16 text-center ${winner === game.teams[0].teamId ? 'text-blue-600' : 'text-gray-600'}`}
                            >
                              {game.finalScores[game.teams[0].teamId] || 0}
                            </span>
                            <span className="text-gray-400 text-lg w-12 text-center font-bold">
                              vs
                            </span>
                            <span
                              className={`font-black text-3xl w-16 text-center ${winner === game.teams[1].teamId ? 'text-red-600' : 'text-gray-600'}`}
                            >
                              {game.finalScores[game.teams[1].teamId] || 0}
                            </span>
                            <span
                              className="font-bold w-32 text-center truncate text-xl"
                              title={game.teams[1].name}
                            >
                              {game.teams[1].name}
                            </span>
                          </div>
                        )}

                        <span className="text-gray-300 w-6 text-center text-xl">|</span>

                        {/* 날짜 */}
                        <span className="text-gray-700 flex items-center justify-center gap-2 w-40 font-semibold">
                          <span className="text-xl">📅</span>
                          <span className="text-center">
                            {gameDate.toLocaleDateString('ko-KR')}
                          </span>
                        </span>

                        <span className="text-gray-300 w-6 text-center text-xl">|</span>

                        {/* 시간 */}
                        <span className="text-gray-700 flex items-center justify-center gap-2 w-32 font-semibold">
                          <span className="text-xl">🕐</span>
                          <span className="text-center">
                            {gameDate.toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </span>

                        <span className="text-gray-300 w-6 text-center text-xl">|</span>

                        {/* 경기 시간 */}
                        <span className="text-gray-700 flex items-center justify-center gap-2 w-28 font-semibold">
                          <span className="text-xl">⏱️</span>
                          <span className="text-center">{game.duration}분</span>
                        </span>

                        {/* 돋보기 아이콘 */}
                        <div className="ml-auto text-3xl text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0">
                          🔍
                        </div>
                      </div>
                    </summary>

                    {/* 상세 내용 */}
                    <div className="p-6 pt-0 space-y-4" onClick={(e) => e.stopPropagation()}>
                      {/* MVP 정보 */}
                      {gameMVPs.length > 0 && (
                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
                          <div className="text-xl text-yellow-800 font-bold mb-4 flex items-center gap-3">
                            <span className="text-3xl">👑</span>
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
                                className="bg-white rounded-lg px-6 py-4 shadow-md flex-1 min-w-[250px] flex items-center gap-4"
                              >
                                <div className="font-bold text-yellow-900 text-xl">{mvp.name}</div>
                                <div className="font-black text-orange-600 text-2xl ml-auto">
                                  {mvp.totalPoints}점
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 팀별 선수 기록 */}
                      {game.teams.map((team, teamIdx) => {
                        const teamColor = teamIdx === 0 ? 'blue' : 'red';
                        const bgColor = teamIdx === 0 ? 'bg-blue-50' : 'bg-red-50';
                        const textColor = teamIdx === 0 ? 'text-blue-700' : 'text-red-700';

                        return (
                          <div key={team.teamId}>
                            <h4 className={`text-xl font-bold mb-3 ${textColor}`}>
                              {team.name} 팀 선수 기록
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-lg border-collapse">
                                <thead className={bgColor}>
                                  <tr className="font-bold">
                                    <th className="border-2 border-gray-300 p-3 text-center text-gray-900">
                                      이름
                                    </th>
                                    <th className="border-2 border-gray-300 p-3 text-center text-gray-900">
                                      ⚾ 아웃
                                    </th>
                                    <th className="border-2 border-gray-300 p-3 text-center text-gray-900">
                                      🏃 통과
                                    </th>
                                    <th className="border-2 border-gray-300 p-3 text-center text-gray-900">
                                      🛡️ 희생
                                    </th>
                                    <th className="border-2 border-gray-300 p-3 text-center text-gray-900">
                                      🍪 쿠키
                                    </th>
                                    <th className="border-2 border-gray-300 p-3 text-center text-gray-900">
                                      획득 배지
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {team.members.map((member) => {
                                    const record = game.records.find(
                                      (r) => r.studentId === member.studentId
                                    );
                                    const student = students.find(
                                      (s) => s.id === member.studentId
                                    );

                                    // playerHistory에서 이 경기의 새 배지 찾기
                                    const newBadges = student?.badges
                                      .filter((b) => {
                                        // 이 경기 날짜 전후로 획득한 배지만 표시
                                        const badgeDate = new Date(b.awardedAt);
                                        const gameStart = new Date(game.createdAt);
                                        const gameEnd = new Date(game.finishedAt || game.createdAt);
                                        return badgeDate >= gameStart && badgeDate <= gameEnd;
                                      })
                                      .slice(0, 3); // 최대 3개만 표시

                                    return (
                                      <tr
                                        key={member.studentId}
                                        className={`hover:${bgColor}/50`}
                                      >
                                        <td className="border-2 border-gray-300 p-3 text-center font-bold text-gray-900">
                                          {student?.name || `선수${member.studentId.slice(-4)}`}
                                        </td>
                                        <td className="border-2 border-gray-300 p-3 text-center font-bold text-red-600">
                                          {record?.outs || 0}
                                        </td>
                                        <td className="border-2 border-gray-300 p-3 text-center font-bold text-blue-600">
                                          {record?.passes || 0}
                                        </td>
                                        <td className="border-2 border-gray-300 p-3 text-center font-bold text-purple-600">
                                          {record?.sacrifices || 0}
                                        </td>
                                        <td className="border-2 border-gray-300 p-3 text-center font-bold text-orange-600">
                                          {record?.cookies || 0}
                                        </td>
                                        <td className="border-2 border-gray-300 p-3 text-center">
                                          {newBadges && newBadges.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 justify-center">
                                              {newBadges.map((badge, bidx) => (
                                                <span
                                                  key={bidx}
                                                  className="text-xl"
                                                  title={badge.name}
                                                >
                                                  {badge.emoji}
                                                </span>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-gray-400">-</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>
          </section>
        </div>

        {/* 모달 푸터 */}
        <div className="flex justify-end mt-6">
          <Button onClick={onClose} size="lg">
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
