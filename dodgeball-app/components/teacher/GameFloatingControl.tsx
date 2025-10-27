'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Game, Student } from '@/types';
import { getGamesByTeacherId, updateGame, getStudentById } from '@/lib/dataService';
import { STORAGE_KEYS } from '@/lib/mockData';

type SizeMode = 'compact' | 'medium' | 'large';

export function GameFloatingControl() {
  const router = useRouter();
  const pathname = usePathname();
  const [gameData, setGameData] = useState<Game | null>(null);
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [sizeMode, setSizeMode] = useState<SizeMode>('medium');
  const [isMinimized, setIsMinimized] = useState(false);
  const [localTime, setLocalTime] = useState<number | null>(null); // 로컬 타이머 상태

  // 경기 화면인지 확인
  const isGamePage = pathname?.includes('/game/play');

  // 진행 중인 경기 감지 및 로드
  useEffect(() => {
    const loadOngoingGame = async () => {
      const teacherId = localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER);
      if (!teacherId) return;

      const games = await getGamesByTeacherId(teacherId);
      const ongoing = games.find(g => !g.isCompleted);

      if (ongoing) {
        setGameData(ongoing);
        // localStorage의 currentTime을 직접 표시 (읽기 전용)
        setLocalTime(ongoing.currentTime ?? (ongoing.duration * 60));

        // 선수 정보 로드
        const studentMap: Record<string, Student> = {};
        for (const team of ongoing.teams) {
          for (const member of team.members) {
            const student = await getStudentById(member.studentId);
            if (student) {
              studentMap[member.studentId] = student;
            }
          }
        }
        setStudents(studentMap);
      } else {
        setGameData(null);
        setLocalTime(null);
      }
    };

    // 초기 로드 (1회만)
    loadOngoingGame();

    // 경기 상태 변경 이벤트 리스너 (이벤트 기반 동기화만 사용)
    const handleGameStateChange = () => {
      loadOngoingGame();
    };

    window.addEventListener('gameStateChanged', handleGameStateChange);

    return () => {
      window.removeEventListener('gameStateChanged', handleGameStateChange);
    };
  }, []);

  // 독립 타이머 제거 - 이벤트 기반 동기화만 사용
  // FloatingControl은 읽기 전용으로 동작하며, 경기 화면의 GameTimer만 시간을 관리합니다.

  // 하트 조절 핸들러
  const handleHeartAdjust = async (teamIndex: number, studentId: string, delta: number) => {
    if (!gameData) return;

    const newTeams = gameData.teams.map((team, idx) => {
      if (idx === teamIndex) {
        return {
          ...team,
          members: team.members.map(member => {
            if (member.studentId === studentId) {
              const newLives = Math.max(0, member.currentLives + delta);
              return {
                ...member,
                currentLives: newLives,
                position: newLives === 0 ? ('outer' as const) : (newLives > 0 && member.position === 'outer' ? 'inner' as const : member.position),
                isInOuterCourt: newLives === 0
              };
            }
            return member;
          })
        };
      }
      return team;
    });

    const updated = { ...gameData, teams: newTeams };
    setGameData(updated);
    await updateGame(gameData.id, updated);

    // 경기 화면에 즉시 반영
    window.dispatchEvent(new CustomEvent('gameStateChanged'));
  };

  // 일시정지/재개
  const handleTogglePause = async () => {
    if (!gameData) return;
    const updated = { ...gameData, isPaused: !gameData.isPaused };
    setGameData(updated);
    await updateGame(gameData.id, updated);

    // 경기 화면에 즉시 반영
    window.dispatchEvent(new CustomEvent('gameStateChanged'));
  };

  // 경기 종료
  const handleGameEnd = async () => {
    if (!gameData || !confirm('경기를 종료하시겠습니까?')) return;

    const winner = gameData.teams.reduce((prev, current) => {
      const prevAlive = prev.members.filter(m => m.currentLives > 0).length;
      const currentAlive = current.members.filter(m => m.currentLives > 0).length;
      return currentAlive > prevAlive ? current : prev;
    });

    await updateGame(gameData.id, {
      ...gameData,
      winner: winner.teamId,
      isCompleted: true
    });

    // 경기 화면에 즉시 반영
    window.dispatchEvent(new CustomEvent('gameStateChanged'));

    alert(`${winner.name} 승리!`);
    setGameData(null);
  };

  // 경기로 돌아가기
  const handleGoToGame = () => {
    if (!gameData) return;
    router.push(`/teacher/class/${gameData.hostClassId}/game/play?gameId=${gameData.id}`);
  };

  // 크기 변경
  const cycleSizeMode = () => {
    setSizeMode(prev => {
      if (prev === 'compact') return 'medium';
      if (prev === 'medium') return 'large';
      return 'compact';
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 팀 컬러 헬퍼 함수
  const getTeamBgClass = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-100';
      case 'blue': return 'bg-blue-100';
      case 'green': return 'bg-green-100';
      case 'yellow': return 'bg-yellow-100';
      case 'purple': return 'bg-purple-100';
      case 'orange': return 'bg-orange-100';
      default: return 'bg-gray-100';
    }
  };

  const getTeamTextClass = (color: string) => {
    switch (color) {
      case 'red': return 'text-red-700';
      case 'blue': return 'text-blue-700';
      case 'green': return 'text-green-700';
      case 'yellow': return 'text-yellow-700';
      case 'purple': return 'text-purple-700';
      case 'orange': return 'text-orange-700';
      default: return 'text-gray-700';
    }
  };

  const getTeamBorderClass = (color: string) => {
    switch (color) {
      case 'red': return 'border-red-300';
      case 'blue': return 'border-blue-300';
      case 'green': return 'border-green-300';
      case 'yellow': return 'border-yellow-300';
      case 'purple': return 'border-purple-300';
      case 'orange': return 'border-orange-300';
      default: return 'border-gray-300';
    }
  };

  // 표시 조건: 진행 중인 경기가 있고, 경기 화면이 아닐 때
  if (!gameData || isGamePage) return null;

  // 크기별 스타일 설정
  const cardWidth = sizeMode === 'compact' ? 'w-80' : sizeMode === 'medium' ? 'w-[520px]' : 'w-[800px]';
  const cardPadding = sizeMode === 'large' ? 'p-3' : 'p-1';
  const cardGap = sizeMode === 'large' ? 'gap-3' : 'gap-1';
  const fontSize = sizeMode === 'large' ? 'text-sm' : 'text-xs';
  const buttonSize = sizeMode === 'large' ? 'w-6 h-6 text-sm' : 'w-4 h-4 text-xs';

  return (
    <>
      <div className={`fixed top-4 right-4 bg-white rounded-lg shadow-2xl border-2 border-blue-200 z-50 ${cardWidth}`}>
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏐</span>
            <span className="font-bold text-sm">진행 중인 경기</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-white hover:bg-white/20 text-xs"
              onClick={cycleSizeMode}
              title="크기 조절"
            >
              🔎 확대/축소
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-white hover:bg-white/20"
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? '펼치기' : '접기'}
            >
              {isMinimized ? '▼' : '▲'}
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-100px)]">
            {/* 경기 정보 */}
            <div className="text-center border-b pb-3">
              <h3 className="font-bold text-lg">
                {gameData.teams.map(t => t.name).join(' vs ')}
              </h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-2xl font-bold">
                  ⏱️ {formatTime(localTime ?? (gameData.duration * 60))}
                </span>
                {gameData.isPaused && (
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                    일시정지
                  </span>
                )}
              </div>
            </div>

            {/* 컨트롤 버튼 */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleTogglePause}
                className="text-base font-medium"
              >
                {gameData.isPaused ? '▶️ 재개' : '⏸️ 일시정지'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGameEnd}
                className="text-base font-medium bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
              >
                🛑 경기종료
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGoToGame}
                className="text-base font-medium bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
              >
                🏐 경기로 가기
              </Button>
            </div>

            {/* 팀별 선수 카드 - compact 모드에서는 숨김 */}
            {sizeMode !== 'compact' && (
              <div className="grid grid-cols-2 gap-3">
                {gameData.teams.map((team, teamIndex) => (
                  <div key={team.teamId} className="space-y-1">
                    {/* 팀 헤더 - 팀 컬러 적용 */}
                    <div className={`${getTeamBgClass(team.color)} ${getTeamBorderClass(team.color)} border-2 rounded-t p-2`}>
                      <h4 className={`font-bold text-lg text-center ${getTeamTextClass(team.color)}`}>
                        {team.name}
                      </h4>
                      <p className={`text-base text-center opacity-75`}>
                        생존: {team.members.filter(m => m.currentLives > 0).length}명 / 하트: {team.members.reduce((sum, m) => sum + m.currentLives, 0)}개
                      </p>
                    </div>

                    {/* 3x3 그리드 선수 카드 - 팀 컬러 배경 */}
                    <div className={`${getTeamBgClass(team.color)} ${getTeamBorderClass(team.color)} border-2 border-t-0 rounded-b p-2`}>
                      <div className={`grid grid-cols-3 ${cardGap} max-h-64 overflow-y-auto`}>
                        {team.members
                          .filter(m => m.currentLives > 0)
                          .slice(0, 9)
                          .map(member => {
                            const student = students[member.studentId];
                            return (
                              <div
                                key={member.studentId}
                                className={`bg-white border rounded ${cardPadding} text-center`}
                              >
                                {/* 이름 */}
                                <div className={`${fontSize} font-medium truncate mb-1`}>
                                  {student?.name || '?'}
                                </div>

                                {/* 하트 + 버튼 */}
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleHeartAdjust(teamIndex, member.studentId, -1)}
                                    disabled={member.currentLives === 0}
                                    className={`
                                      ${buttonSize} rounded leading-none
                                      ${member.currentLives === 0
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                                      }
                                    `}
                                  >
                                    −
                                  </button>

                                  <span className={`${fontSize} font-semibold ${
                                    member.currentLives === 0 ? 'text-gray-400' : 'text-red-500'
                                  }`}>
                                    ❤️{member.currentLives}
                                  </span>

                                  <button
                                    onClick={() => handleHeartAdjust(teamIndex, member.studentId, +1)}
                                    className={`${buttonSize} rounded bg-green-100 text-green-600 hover:bg-green-200 leading-none`}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
