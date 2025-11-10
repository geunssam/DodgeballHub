'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Student, FinishedGame } from '@/types';
import { getPlayerDetailedHistory, getCurrentTeacherId } from '@/lib/dataService';
import { BADGE_CATEGORIES } from '@/lib/badgeCategories';

interface StudentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  maxGames?: number;
}

interface GameHistoryDisplay {
  gameId: string;
  date: string;
  team: string;
  score: {
    our: number;
    opponent: number;
  };
  result: 'win' | 'loss' | 'draw';
  stats: {
    outs: number;
    passes: number;
    sacrifices: number;
    cookies: number;
  };
  newBadges: string[];
  isDeleted?: boolean;
}

/**
 * 학생의 최근 경기 기록을 모달로 표시하는 컴포넌트
 */
export function StudentHistoryModal({
  isOpen,
  onClose,
  student,
  maxGames = 3
}: StudentHistoryModalProps) {
  const [games, setGames] = useState<GameHistoryDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && student) {
      loadGames();
    }
  }, [isOpen, student]);

  const loadGames = async () => {
    setLoading(true);
    try {
      const teacherId = getCurrentTeacherId();
      if (!teacherId || !student) return;

      const history = await getPlayerDetailedHistory(teacherId, student.id);

      // FinishedGame → GameHistoryDisplay 변환
      const displayGames: GameHistoryDisplay[] = history.map((game) => {
        // 학생이 속한 팀 찾기
        const studentTeam = game.teams.find((team) =>
          team.members.some((m) => m.studentId === student.id)
        );

        // 상대 팀 찾기
        const opponentTeam = game.teams.find((team) => team.teamId !== studentTeam?.teamId);

        // 팀 점수
        const ourScore = studentTeam ? game.finalScores[studentTeam.teamId] || 0 : 0;
        const opponentScore = opponentTeam ? game.finalScores[opponentTeam.teamId] || 0 : 0;

        // 승패 판정
        let result: 'win' | 'loss' | 'draw' = 'draw';
        if (ourScore > opponentScore) result = 'win';
        else if (ourScore < opponentScore) result = 'loss';

        // 학생 스탯 찾기
        const studentRecord = game.records.find((r) => r.studentId === student.id);

        return {
          gameId: game.id,
          date: game.finishedAt,
          team: studentTeam?.name || '알 수 없음',
          score: {
            our: ourScore,
            opponent: opponentScore
          },
          result,
          stats: {
            outs: studentRecord?.outs || 0,
            passes: studentRecord?.passes || 0,
            sacrifices: studentRecord?.sacrifices || 0,
            cookies: studentRecord?.cookies || 0
          },
          newBadges: [], // TODO: playerHistory에서 newBadges 가져오기
          isDeleted: false
        };
      });

      // 최근 N경기만 필터링 (날짜 기준 내림차순)
      const sortedHistory = [...displayGames].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const recentGames = sortedHistory.slice(0, maxGames);

      console.log(`📊 [StudentHistoryModal] ${student.name} 최근 ${maxGames}경기 로드:`, recentGames);
      setGames(recentGames);
    } catch (error) {
      console.error('❌ [StudentHistoryModal] 경기 기록 불러오기 실패:', error);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  // 누적 통계 계산
  const totalStats = games.reduce(
    (acc, game) => ({
      outs: acc.outs + (game.stats.outs || 0),
      passes: acc.passes + (game.stats.passes || 0),
      sacrifices: acc.sacrifices + (game.stats.sacrifices || 0),
      cookies: acc.cookies + (game.stats.cookies || 0),
      wins: acc.wins + (game.result === 'win' ? 1 : 0)
    }),
    { outs: 0, passes: 0, sacrifices: 0, cookies: 0, wins: 0 }
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const handleViewFullHistory = () => {
    onClose();
    // TODO: 학생 전체 기록 페이지로 이동
    // router.push('/teacher/student-stats');
  };

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{student.name}의 최근 경기 기록</DialogTitle>
          <DialogDescription>최근 {maxGames}경기 성적을 확인할 수 있습니다</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">로딩 중...</div>
        ) : games.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-4xl mb-4">🏐</p>
            <p className="text-lg">아직 출전한 경기가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 누적 통계 요약 */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3 text-blue-900">📊 누적 통계</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚾</span>
                  <span className="text-sm text-muted-foreground">아웃:</span>
                  <span className="font-bold text-lg">{totalStats.outs}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏃</span>
                  <span className="text-sm text-muted-foreground">통과:</span>
                  <span className="font-bold text-lg">{totalStats.passes}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛡️</span>
                  <span className="text-sm text-muted-foreground">희생:</span>
                  <span className="font-bold text-lg">{totalStats.sacrifices}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🍪</span>
                  <span className="text-sm text-muted-foreground">쿠키:</span>
                  <span className="font-bold text-lg">{totalStats.cookies}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-300">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">승리:</span>
                  <span className="font-bold text-lg text-blue-600">
                    {totalStats.wins}승 {games.length - totalStats.wins}패
                  </span>
                  <span className="text-sm text-muted-foreground ml-auto">
                    승률{' '}
                    {games.length > 0 ? Math.round((totalStats.wins / games.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* 최근 경기 목록 */}
            <div>
              <h3 className="font-bold text-lg mb-3">📅 최근 {maxGames}경기</h3>
              <div className="space-y-2">
                {games.map((game, index) => {
                  const isDeleted = game.isDeleted || false;
                  const isWin = game.result === 'win';
                  const bgColor = isDeleted
                    ? 'bg-gray-50'
                    : isWin
                    ? 'bg-blue-50'
                    : 'bg-red-50';
                  const borderColor = isDeleted
                    ? 'border-gray-300'
                    : isWin
                    ? 'border-blue-200'
                    : 'border-red-200';
                  const resultColor = isDeleted
                    ? 'text-gray-500'
                    : isWin
                    ? 'text-blue-600'
                    : 'text-red-600';
                  const resultEmoji = isDeleted ? '🗑️' : isWin ? '✅' : '❌';
                  const resultText = isDeleted ? '삭제된 경기' : isWin ? '승리' : '패배';

                  return (
                    <div
                      key={game.gameId || index}
                      className={`${bgColor} border-2 ${borderColor} rounded-lg p-3 ${
                        isDeleted ? 'opacity-75' : ''
                      }`}
                    >
                      {/* 첫 번째 줄: 날짜, 팀명, 점수, 승패 */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {formatDate(game.date)}
                        </span>
                        <span className={`text-sm font-semibold ${isDeleted ? 'text-gray-500' : ''}`}>
                          {game.team}
                        </span>
                        {!isDeleted && (
                          <span className="text-sm font-bold">
                            {game.score.our}:{game.score.opponent}
                          </span>
                        )}
                        <span className={`${resultColor} font-bold text-sm ml-auto`}>
                          {resultEmoji} {resultText}
                        </span>
                      </div>

                      {/* 두 번째 줄: 스탯 */}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <span>⚾</span>
                          <span className="font-semibold">{game.stats.outs}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span>🏃</span>
                          <span className="font-semibold">{game.stats.passes}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span>🛡️</span>
                          <span className="font-semibold">{game.stats.sacrifices}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span>🍪</span>
                          <span className="font-semibold">{game.stats.cookies}</span>
                        </span>
                      </div>

                      {/* 세 번째 줄: 획득 배지 (있을 경우만) */}
                      {game.newBadges && game.newBadges.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-opacity-50">
                          <div className="flex gap-1 flex-wrap">
                            {game.newBadges.map((badgeId, badgeIndex) => {
                              // BADGE_CATEGORIES에서 배지 찾기
                              const allBadges = Object.values(BADGE_CATEGORIES).flatMap(
                                (cat) => cat.badges
                              );
                              const badge = allBadges.find((b) => b.id === badgeId);
                              return badge ? (
                                <span
                                  key={badge.id || `badge-${badgeIndex}`}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold"
                                  title={badge.name}
                                >
                                  <span>{badge.icon}</span>
                                  <span>{badge.name}</span>
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleViewFullHistory} disabled={games.length === 0}>
            전체 기록 보기
          </Button>
          <Button onClick={onClose}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
