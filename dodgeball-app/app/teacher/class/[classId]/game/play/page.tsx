'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Game, Student } from '@/types';
import { getGameById, getStudents, updateGame, updateStudent, getStudentById } from '@/lib/dataService';
import { DodgeballCourt } from '@/components/teacher/DodgeballCourt';
import { ScoreBoard } from '@/components/teacher/ScoreBoard';
import { TeamLineupTable } from '@/components/teacher/TeamLineupTable';

export default function GamePlayPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const classId = params.classId as string;
  const gameId = searchParams.get('gameId');

  const [gameData, setGameData] = useState<Game | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) {
      alert('경기 ID가 없습니다.');
      router.push(`/teacher/class/${classId}/game/setup`);
      return;
    }

    loadData();

    // FloatingControl에서 변경 시 즉시 동기화 (양방향 연동)
    // 단, 타이머는 자체적으로 관리하므로 데이터만 업데이트
    const handleGameStateChange = async () => {
      if (!gameId) return;

      const game = await getGameById(gameId);
      if (game) {
        setGameData(game);
      }
    };

    window.addEventListener('gameStateChanged', handleGameStateChange);

    return () => {
      window.removeEventListener('gameStateChanged', handleGameStateChange);
    };
  }, [gameId]);

  const loadData = async () => {
    try {
      if (!gameId) return;

      const [game, studentList] = await Promise.all([
        getGameById(gameId),
        getStudents(classId)
      ]);

      if (!game) {
        alert('경기를 찾을 수 없습니다.');
        router.push(`/teacher/class/${classId}/game/setup`);
        return;
      }

      setGameData(game);
      setStudents(studentList);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 하트 감소 핸들러 (코트에서 클릭 시)
  const handleStudentClick = async (studentId: string) => {
    console.log('🏐 handleStudentClick called:', studentId);
    if (!gameData || gameData.isCompleted) return;

    const newTeams = gameData.teams.map(team => ({
      ...team,
      members: team.members.map(member => {
        if (member.studentId === studentId && member.currentLives > 0) {
          const newLives = member.currentLives - 1;
          return {
            ...member,
            currentLives: newLives,
            position: newLives === 0 ? ('outer' as const) : member.position,
            isInOuterCourt: newLives === 0
          };
        }
        return member;
      })
    }));

    const updated = { ...gameData, teams: newTeams };
    setGameData(updated);
    await updateGame(gameData.id, updated);

    // FloatingControl에 즉시 반영
    window.dispatchEvent(new CustomEvent('gameStateChanged'));
  };

  // 스탯 업데이트 핸들러 (라인업 테이블에서)
  const handleStatUpdate = async (
    studentId: string,
    stat: 'outs' | 'passes' | 'sacrifices' | 'cookies',
    delta: number
  ) => {
    console.log('📊 handleStatUpdate called:', studentId, stat, delta);
    if (!gameData || gameData.isCompleted) return;

    const newRecords = gameData.records.map(record => {
      if (record.studentId === studentId) {
        const oldValue = record[stat];
        const newValue = Math.max(0, oldValue + delta);
        return { ...record, [stat]: newValue };
      }
      return record;
    });

    const updated = { ...gameData, records: newRecords };
    setGameData(updated);
    await updateGame(gameData.id, updated);

    // FloatingControl에 즉시 반영
    window.dispatchEvent(new CustomEvent('gameStateChanged'));
  };

  // 목숨(하트) 업데이트 핸들러
  const handleLifeUpdate = async (studentId: string, delta: number) => {
    console.log('❤️ handleLifeUpdate called:', studentId, delta);
    if (!gameData || gameData.isCompleted) return;

    const newTeams = gameData.teams.map(team => ({
      ...team,
      members: team.members.map(member => {
        if (member.studentId === studentId) {
          const newLives = Math.max(0, member.currentLives + delta);
          console.log(`  Old lives: ${member.currentLives}, New lives: ${newLives}`);
          return {
            ...member,
            currentLives: newLives,
            position: newLives === 0 ? ('outer' as const) : (newLives > 0 && member.position === 'outer' ? 'inner' as const : member.position),
            isInOuterCourt: newLives === 0
          };
        }
        return member;
      })
    }));

    const updated = { ...gameData, teams: newTeams };
    setGameData(updated);
    await updateGame(gameData.id, updated);

    // FloatingControl에 즉시 반영
    window.dispatchEvent(new CustomEvent('gameStateChanged'));
  };

  // 공 추가 핸들러
  const handleBallAddition = async () => {
    if (!gameData || gameData.isCompleted) return;

    const updated = { ...gameData, currentBalls: gameData.currentBalls + 1 };
    setGameData(updated);
    await updateGame(gameData.id, updated);

    // FloatingControl에 즉시 반영
    window.dispatchEvent(new CustomEvent('gameStateChanged'));
  };

  // 타이머 업데이트 핸들러 (실시간 저장)
  const handleTimeUpdate = async (time: number, paused: boolean) => {
    if (!gameData || gameData.isCompleted) return;

    const updated = {
      ...gameData,
      currentTime: time,
      isPaused: paused,
      lastUpdated: new Date().toISOString()
    };

    // setGameData를 호출하지 않음 - GameTimer의 리렌더링을 방지
    // localStorage만 업데이트 (이벤트 발행 제거 - 무한 루프 방지)
    await updateGame(gameData.id, updated);

    // FloatingControl은 자체 타이머로 동기화됨 - 이벤트 불필요
  };

  // 경기 종료 핸들러
  const handleGameEnd = async () => {
    if (!gameData) return;

    if (!confirm('경기를 종료하시겠습니까?')) return;

    try {
      // 승리 팀 판정 (생존 인원수 많은 팀)
      const winner = gameData.teams.reduce((prev, current) => {
        const prevAlive = prev.members.filter(m => m.currentLives > 0).length;
        const currentAlive = current.members.filter(m => m.currentLives > 0).length;
        return currentAlive > prevAlive ? current : prev;
      });

      // 각 학생 누적 스탯 업데이트
      for (const record of gameData.records) {
        const student = await getStudentById(record.studentId);
        if (!student) continue;

        // 총점 계산: 모든 스탯 1점씩
        const gameScore = record.outs + record.passes + record.sacrifices + record.cookies;

        const newStats = {
          outs: student.stats.outs + record.outs,
          passes: student.stats.passes + record.passes,
          sacrifices: student.stats.sacrifices + record.sacrifices,
          cookies: student.stats.cookies + record.cookies,
          gamesPlayed: student.stats.gamesPlayed + 1,
          totalScore: 0 // 아래에서 계산
        };

        // 누적 총점 계산
        newStats.totalScore = newStats.outs + newStats.passes + newStats.sacrifices + newStats.cookies;

        await updateStudent(student.id, { stats: newStats });
      }

      // 경기 데이터 저장
      await updateGame(gameData.id, {
        ...gameData,
        winner: winner.teamId,
        isCompleted: true
      });

      // FloatingControl에게 경기 종료 알림 (custom event)
      window.dispatchEvent(new CustomEvent('gameStateChanged'));

      alert(`${winner.name} 승리!`);

      // 대시보드로 이동하면서 경기 뷰 표시
      sessionStorage.setItem('dashboardView', 'games');
      router.push('/teacher/dashboard');

      // 페이지 새로고침으로 게임 목록 갱신
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Failed to end game:', error);
      alert('경기 종료에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>경기 데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <main className="flex-grow p-2 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex flex-col gap-2">
        {/* 헤더: 네비게이션 */}
        <div className="flex gap-2 flex-shrink-0">
          <Link href="/teacher/dashboard">
            <Button variant="outline" size="sm">
              🏠 대시보드
            </Button>
          </Link>
          <Link href="/teacher/dashboard">
            <Button variant="outline" size="sm" onClick={() => {
              // 대시보드의 경기 관리 탭으로 이동하도록 상태 저장
              sessionStorage.setItem('dashboardView', 'games');
            }}>
              ⚾ 경기 관리
            </Button>
          </Link>
        </div>

        {/* 타이머 & 피구 코트 통합 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 flex-shrink-0">
          {/* 좌측: 타이머 영역 */}
          <div className="flex-shrink-0">
            <ScoreBoard
              game={gameData}
              onBallAddition={handleBallAddition}
              onGameEnd={handleGameEnd}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>

          {/* 우측: 피구 코트 */}
          <div className="bg-white rounded-lg shadow-lg p-1.5 flex flex-col">
            <h2 className="text-[10px] font-bold mb-0.5 text-center flex-shrink-0">🏐 피구 코트</h2>
            <div className="flex-1 min-h-0">
              <DodgeballCourt
                teams={gameData.teams}
                students={students}
                onStudentClick={handleStudentClick}
              />
            </div>
          </div>
        </div>

        {/* 팀 라인업 테이블 (나머지 공간 차지) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 flex-1 min-h-0">
          {gameData.teams.map((team, index) => (
            <TeamLineupTable
              key={`play_${gameData.id}_${team.teamId}_${index}`}
              team={team}
              students={students}
              gameRecords={gameData.records}
              onStatUpdate={handleStatUpdate}
              onLifeUpdate={handleLifeUpdate}
            />
          ))}
        </div>
        </div>
      </main>
    </div>
  );
}
