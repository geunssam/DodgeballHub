'use client';

import React, { useState, useMemo } from 'react';
import { calculateMVPScore } from '@/lib/mvpCalculator';
import { calculatePlayerPoints } from '@/lib/statsHelpers';
import { PlayerBadgeDisplay } from '@/components/badge/PlayerBadgeDisplay';
import { FinishedGame, Team, Student } from '@/types';
import { Button } from '@/components/ui/button';

interface StatsViewProps {
  finishedGames: FinishedGame[];
  teams: Team[];
  students: Student[];
  onBack: () => void;
}

const StatsView = ({ finishedGames, teams, students = [], onBack }: StatsViewProps) => {
  // 경기 기록만 표시
  return (
    <div className="space-y-4">
      {/* 헤더 - Firebase 스타일 */}
      <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-sky-100 hover:bg-sky-200 text-sky-700 font-medium rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <span>←</span>
            <span>대시보드</span>
          </button>
          <h1 className="text-2xl font-bold">📋 경기 기록</h1>
        </div>
      </div>

      {finishedGames.length === 0 ? (
        <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg shadow-lg p-12 text-center">
          {/* 애니메이션 피구공 */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="text-8xl animate-bounce">🏐</div>
              <div className="absolute inset-0 text-8xl animate-ping opacity-20">🏐</div>
            </div>
          </div>

          {/* 제목 */}
          <h3 className="text-2xl font-bold text-gray-700 mb-3">
            아직 경기 기록이 없어요
          </h3>

          {/* 설명 */}
          <p className="text-gray-500 mb-6 text-lg">
            첫 경기를 시작하고 멋진 기록을 만들어보세요!
          </p>

          {/* CTA 버튼 */}
          <button
            onClick={onBack}
            className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            🏐 대시보드로 돌아가기
          </button>
        </div>
      ) : (
        <>
          {/* 📋 경기 기록 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">📋 종료된 경기 목록</h2>
                <div className="text-sm text-gray-600">
                  총 <span className="font-bold text-blue-600">{finishedGames.length}</span>개 경기
                </div>
              </div>

              <div className="space-y-4">
                {[...finishedGames].reverse().map((game, idx) => {
                  // 경기 점수 계산 - 남은 하트 개수로 계산
                  const teamScores = game.teams.map(team => {
                    // 팀원들의 남은 하트 합계
                    const remainingHearts = team.members.reduce((sum, member) =>
                      sum + member.currentLives, 0
                    );
                    return { team, score: remainingHearts };
                  });

                  // 무승부 확인
                  const maxScore = Math.max(...teamScores.map(ts => ts.score));
                  const winners = teamScores.filter(ts => ts.score === maxScore);
                  const isDraw = winners.length > 1;
                  const winner = winners[0]; // 무승부여도 일단 첫 번째 팀 선택

                  // 각 경기의 MVP 계산
                  const allPlayers = game.records.map(record => {
                    const student = students.find(s => s.id === record.studentId);
                    return {
                      ...record,
                      name: student?.name || '알 수 없음',
                      totalPoints: calculatePlayerPoints({
                        outs: record.outs,
                        passes: record.passes,
                        sacrifices: record.sacrifices,
                        cookies: record.cookies
                      })
                    };
                  }).sort((a, b) => b.totalPoints - a.totalPoints);

                  const topScore = allPlayers[0]?.totalPoints || 0;
                  const gameMVPs = topScore > 0
                    ? allPlayers.filter(p => p.totalPoints === topScore)
                    : [];

                  // 날짜 변환
                  const gameDate = new Date(game.date);

                  return (
                    <details
                      key={game.id || idx}
                      className="border-2 border-gray-300 rounded-xl bg-white hover:shadow-md transition-shadow"
                    >
                      <summary className="cursor-pointer p-6 hover:bg-gray-50 rounded-xl transition-colors list-none">
                        {/* 1열 가로 레이아웃 - 고정 너비 */}
                        <div className="flex items-center gap-4 text-xl">
                          {/* 승리/무승부 배지 */}
                          <span className={`w-12 text-center flex-shrink-0 text-4xl`}>
                            {isDraw ? '🤝' : '🏆'}
                          </span>

                          {/* 팀명과 점수 - 균형잡힌 레이아웃 */}
                          <div className="flex items-center justify-center flex-1">
                            {teamScores.map((ts, i) => {
                              const isWinner = ts.score === maxScore;
                              if (i === 0) {
                                // 첫 번째 팀
                                return (
                                  <div key={i} className="flex items-center justify-end flex-1 gap-3">
                                    <span className={`font-bold text-center truncate text-2xl ${
                                      isWinner ? 'text-blue-600' : 'text-gray-700'
                                    }`} title={ts.team.name}>
                                      {ts.team.name}
                                    </span>
                                    <div className={`flex items-center gap-1 font-black text-3xl ${
                                      isWinner ? 'text-red-500' : 'text-gray-500'
                                    }`}>
                                      <span className="text-3xl">❤️</span>
                                      <span className="text-2xl">{ts.score}</span>
                                    </div>
                                  </div>
                                );
                              } else {
                                // vs와 두 번째 팀
                                return (
                                  <React.Fragment key={i}>
                                    <span className="text-gray-400 text-xl mx-6 font-bold">vs</span>
                                    <div className="flex items-center justify-start flex-1 gap-3">
                                      <span className={`font-bold text-center truncate text-2xl ${
                                        isWinner ? 'text-blue-600' : 'text-gray-700'
                                      }`} title={ts.team.name}>
                                        {ts.team.name}
                                      </span>
                                      <div className={`flex items-center gap-1 font-black text-3xl ${
                                        isWinner ? 'text-red-500' : 'text-gray-500'
                                      }`}>
                                        <span className="text-3xl">❤️</span>
                                        <span className="text-2xl">{ts.score}</span>
                                      </div>
                                    </div>
                                  </React.Fragment>
                                );
                              }
                            })}
                          </div>

                          <span className="text-gray-300 w-6 text-center text-2xl">|</span>

                          {/* 날짜 */}
                          <span className="text-gray-700 flex items-center justify-center gap-2 w-48 font-semibold">
                            <span className="text-2xl">📅</span>
                            <span className="text-center whitespace-nowrap">{gameDate.toLocaleDateString('ko-KR')}</span>
                          </span>

                          <span className="text-gray-300 w-6 text-center text-2xl">|</span>

                          {/* 시간 */}
                          <span className="text-gray-700 flex items-center justify-center gap-2 w-32 font-semibold">
                            <span className="text-2xl">🕐</span>
                            <span className="text-center whitespace-nowrap">
                              {gameDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </span>

                          {/* 돋보기 아이콘 - 우측 끝 */}
                          <div className="ml-auto text-4xl text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0">
                            🔍
                          </div>
                        </div>
                      </summary>

                      {/* 상세 내용 */}
                      <div className="p-2 pt-0 space-y-2" onClick={(e) => e.stopPropagation()}>
                        {/* MVP 정보 (공동 MVP 지원) */}
                        {gameMVPs.length > 0 && (
                          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
                            <div className="text-2xl text-yellow-800 font-bold mb-4 flex items-center gap-3">
                              <span className="text-4xl">👑</span>
                              <span>
                                {gameMVPs.length === 1 ? '이 경기 MVP' : `공동 MVP (${gameMVPs.length}명)`}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-4">
                              {gameMVPs.map((mvp, idx) => (
                                <div key={idx} className="bg-white rounded-lg px-6 py-4 shadow-md flex-1 min-w-[300px] flex items-center gap-4">
                                  <div className="font-bold text-yellow-900 text-2xl">{mvp.name}</div>
                                  <div className="text-xl text-gray-700 flex items-center gap-4 font-semibold">
                                    <span>🎯 {mvp.hits || 0}</span>
                                    <span>✋ {mvp.passes || 0}</span>
                                    <span>❤️ {mvp.sacrifices || 0}</span>
                                    <span>🍪 {mvp.cookies || 0}</span>
                                    <span className="font-black text-orange-600 text-2xl">{mvp.totalPoints}점</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 경기 세부 내용 */}
                        <details className="mt-4" open>
                          <summary className="text-xl text-blue-600 cursor-pointer hover:text-blue-800 font-bold">
                            📊 경기 세부 내용 보기
                          </summary>

                          <div className="mt-6 space-y-6">
                            {/* 팀별 선수 기록 */}
                            {teamScores.map((ts, teamIdx) => {
                              const isWinner = ts.score === maxScore;
                              return (
                                <div key={teamIdx}>
                                  <div className="flex items-center gap-4 mb-4">
                                    <h4 className="text-2xl font-bold text-blue-700">
                                      {ts.team.name} 팀 선수 기록
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      {isWinner && (
                                        <span className="text-2xl">
                                          {isDraw ? '🤝' : '🏆'}
                                        </span>
                                      )}
                                      <span className={`flex items-center gap-1 text-xl font-bold ${
                                        isWinner ? 'text-red-500' : 'text-gray-500'
                                      }`}>
                                        <span>❤️</span>
                                        <span>{ts.score}</span>
                                      </span>
                                    </div>
                                  </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-2xl border-collapse">
                                    <thead className="bg-blue-50">
                                      <tr className="font-bold">
                                        <th className="border-2 border-gray-300 p-4 text-center text-gray-900 w-32">배지</th>
                                        <th className="border-2 border-gray-300 p-4 text-center text-gray-900 w-36">이름</th>
                                        <th className="border-2 border-gray-300 p-4 text-center text-gray-900 w-28">❤️</th>
                                        <th className="border-2 border-gray-300 p-4 text-center text-gray-900 w-24">적중</th>
                                        <th className="border-2 border-gray-300 p-4 text-center text-gray-900 w-24">패스</th>
                                        <th className="border-2 border-gray-300 p-4 text-center text-gray-900 w-24">양보</th>
                                        <th className="border-2 border-gray-300 p-4 text-center text-gray-900 w-24">쿠키</th>
                                        <th className="border-2 border-gray-300 p-4 text-center text-gray-900 w-32">획득 배지</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {ts.team.members.map((member) => {
                                        const record = game.records.find(r => r.studentId === member.studentId);
                                        const student = students.find(s => s.id === member.studentId);

                                        return (
                                          <tr key={member.studentId} className="hover:bg-blue-50/50">
                                            <td className="border-2 border-gray-300 p-4 text-center">
                                              <div className="flex justify-center">
                                                <PlayerBadgeDisplay
                                                  badges={student?.badges || []}
                                                  maxDisplay={3}
                                                  size="lg"
                                                />
                                              </div>
                                            </td>
                                            <td className="border-2 border-gray-300 p-4 text-center font-bold text-gray-900">
                                              {student?.name || '알 수 없음'}
                                            </td>
                                            <td className="border-2 border-gray-300 p-4 text-center">
                                              <span className={`font-bold text-2xl ${
                                                member.currentLives > 0 ? 'text-red-500' : 'text-gray-400'
                                              }`}>
                                                {member.currentLives}
                                              </span>
                                            </td>
                                            <td className="border-2 border-gray-300 p-4 text-center font-bold text-green-600">
                                              {record?.outs || 0}
                                            </td>
                                            <td className="border-2 border-gray-300 p-4 text-center font-bold text-blue-600">
                                              {record?.passes || 0}
                                            </td>
                                            <td className="border-2 border-gray-300 p-4 text-center font-bold text-amber-600">
                                              {record?.sacrifices || 0}
                                            </td>
                                            <td className="border-2 border-gray-300 p-4 text-center font-bold text-purple-600">
                                              {record?.cookies || 0}
                                            </td>
                                            <td className="border-2 border-gray-300 p-4 text-center">
                                              <div className="flex justify-center">
                                                {/* 획득 배지는 GameHistoryEntry에서 가져와야 함 */}
                                                <span className="text-gray-400">-</span>
                                              </div>
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
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
        </>
      )}
    </div>
  );
};

export default StatsView;