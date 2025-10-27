'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getClasses, deleteClass, getGamesByTeacherId, deleteGame } from '@/lib/dataService';
import { STORAGE_KEYS } from '@/lib/mockData';
import { Class, Game } from '@/types';

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardView, setDashboardView] = useState<'dashboard' | 'classes' | 'games'>('dashboard');

  useEffect(() => {
    // 로그인 체크
    const teacherId = localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER);
    if (!teacherId) {
      router.push('/teacher/login');
      return;
    }

    // 학급 및 경기 목록 불러오기
    loadClasses(teacherId);
    loadGames(teacherId);

    // sessionStorage에서 대시보드 뷰 상태 확인
    const savedView = sessionStorage.getItem('dashboardView');
    if (savedView === 'games') {
      setDashboardView('games');
      sessionStorage.removeItem('dashboardView'); // 한 번 사용 후 제거
    }
  }, [router]);

  const loadClasses = async (teacherId: string) => {
    try {
      const classList = await getClasses(teacherId);
      setClasses(classList);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGames = async (teacherId: string) => {
    try {
      const gameList = await getGamesByTeacherId(teacherId);
      // 최신순 정렬 (날짜 기준)
      gameList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setGames(gameList);
    } catch (error) {
      console.error('Failed to load games:', error);
    }
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`정말로 "${className}" 학급을 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없으며, 학급의 모든 학생, 팀, 경기 기록이 함께 삭제됩니다.`)) {
      return;
    }

    try {
      await deleteClass(classId);

      // 현재 teacherId 가져오기
      const teacherId = localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER);
      if (teacherId) {
        await loadClasses(teacherId);
      }

      alert('학급이 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete class:', error);
      alert('학급 삭제에 실패했습니다.');
    }
  };

  const handleDeleteGame = async (gameId: string, gameTitle: string, isCompleted: boolean) => {
    const status = isCompleted ? '완료된' : '진행 중인';
    if (!confirm(`정말로 "${gameTitle}" ${status} 경기를 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      await deleteGame(gameId);

      // 현재 teacherId 가져오기
      const teacherId = localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER);
      if (teacherId) {
        await loadGames(teacherId);
      }

      // FloatingControl에게 경기 삭제 알림
      window.dispatchEvent(new CustomEvent('gameStateChanged'));

      alert('경기가 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete game:', error);
      alert('경기 삭제에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_TEACHER);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 상단 네비게이션 바 */}
      <nav className="bg-card shadow-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏐</span>
              <h1 className="text-xl font-bold text-card-foreground">
                DodgeballHub
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <p className="text-sm font-semibold text-card-foreground">김교사 선생님</p>
              <Button onClick={handleLogout} variant="destructive" size="sm">
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 대시보드 메인 뷰 */}
        {dashboardView === 'dashboard' && (
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-8">대시보드</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 학급/팀 관리 카드 */}
              <Card
                className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
                onClick={() => setDashboardView('classes')}
              >
                <CardHeader>
                  <div className="text-5xl mb-2">👥</div>
                  <CardTitle className="text-xl">학급/팀 관리</CardTitle>
                  <CardDescription>팀 생성 및 선수 관리</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">{classes.length}</p>
                  <p className="text-sm text-muted-foreground">개 팀</p>
                </CardContent>
              </Card>

              {/* 경기 관리 카드 */}
              <Card
                className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 bg-gradient-to-br from-green-50 to-green-100 border-green-200"
                onClick={() => setDashboardView('games')}
              >
                <CardHeader>
                  <div className="text-5xl mb-2">⚾</div>
                  <CardTitle className="text-xl">경기 관리</CardTitle>
                  <CardDescription>진행 중 및 완료된 경기</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{games.filter(g => !g.isCompleted).length}</p>
                      <p className="text-xs text-muted-foreground">진행 중</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-600">{games.filter(g => g.isCompleted).length}</p>
                      <p className="text-xs text-muted-foreground">완료</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 통계 카드 */}
              <Card className="cursor-not-allowed opacity-50 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader>
                  <div className="text-5xl mb-2">📊</div>
                  <CardTitle className="text-xl">통계</CardTitle>
                  <CardDescription>선수 및 팀 통계</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">준비 중...</p>
                </CardContent>
              </Card>

              {/* 설정 카드 */}
              <Card className="cursor-not-allowed opacity-50 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardHeader>
                  <div className="text-5xl mb-2">⚙️</div>
                  <CardTitle className="text-xl">설정</CardTitle>
                  <CardDescription>앱 설정 및 환경설정</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">준비 중...</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* 학급 관리 뷰 */}
        {dashboardView === 'classes' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <Button onClick={() => setDashboardView('dashboard')} variant="ghost">
                  ← 대시보드
                </Button>
                <h2 className="text-2xl font-bold text-foreground">👥 학급 관리</h2>
              </div>
              <Link href="/teacher/create-class">
                <Button>+ 학급 생성</Button>
              </Link>
            </div>

            {classes.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500 mb-4">아직 생성된 학급이 없습니다.</p>
                <Link href="/teacher/create-class">
                  <Button>첫 학급 만들기</Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((classItem) => (
                  <Card key={classItem.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold">{classItem.name}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClass(classItem.id, classItem.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 -mt-2 -mr-2"
                      >
                        삭제
                      </Button>
                    </div>
                    <p className="text-gray-600 mb-4">{classItem.year}학년도</p>
                    <div className="space-y-3">
                      <Link href={`/teacher/class/${classItem.id}/students`}>
                        <Button variant="outline" className="w-full h-11">
                          학생 관리
                        </Button>
                      </Link>
                      <Link href={`/teacher/class/${classItem.id}/teams`}>
                        <Button variant="outline" className="w-full h-11">
                          팀 편성
                        </Button>
                      </Link>
                      <Link href={`/teacher/class/${classItem.id}/game/setup`}>
                        <Button className="w-full h-11">
                          경기 시작
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 경기 관리 뷰 */}
        {dashboardView === 'games' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <Button onClick={() => setDashboardView('dashboard')} variant="ghost">
                  ← 대시보드
                </Button>
                <h2 className="text-2xl font-bold text-foreground">⚾ 경기 관리</h2>
              </div>
              <Link href="/teacher/game/new">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  ⚾ 새 경기 시작
                </Button>
              </Link>
            </div>

            {/* 새 경기 추가 카드 */}
            <Card className="mb-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <span className="text-3xl">🏐</span>
                  새 경기 추가
                </CardTitle>
                <CardDescription>
                  모든 학급의 팀 중에서 선택하여 경기를 시작하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/teacher/game/new">
                  <Button size="lg" className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                    경기 시작하기
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* 진행 중인 경기 섹션 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-green-500">●</span>
                  진행 중인 경기
                </CardTitle>
              </CardHeader>
              <CardContent>
                {games.filter(g => !g.isCompleted).length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">진행 중인 경기가 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {games.filter(g => !g.isCompleted).map((game) => (
                      <div
                        key={game.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-green-50 border-green-200"
                      >
                        <div className="flex justify-between items-center">
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => router.push(`/teacher/class/${game.hostClassId}/game/play?gameId=${game.id}`)}
                          >
                            <h4 className="font-semibold text-lg">
                              {game.teams.map(t => t.name).join(' vs ')}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {new Date(game.date).toLocaleString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/teacher/class/${game.hostClassId}/game/play?gameId=${game.id}`)}
                            >
                              경기 보기
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGame(game.id, game.teams.map(t => t.name).join(' vs '), game.isCompleted);
                              }}
                              className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                            >
                              삭제
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 완료된 경기 섹션 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-gray-500">●</span>
                  완료된 경기
                </CardTitle>
              </CardHeader>
              <CardContent>
                {games.filter(g => g.isCompleted).length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">완료된 경기가 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {games.filter(g => g.isCompleted).map((game) => (
                      <div
                        key={game.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-gray-50"
                      >
                        <div className="flex justify-between items-center">
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => router.push(`/teacher/class/${game.hostClassId}/game/play?gameId=${game.id}`)}
                          >
                            <h4 className="font-semibold text-lg">
                              {game.teams.map(t => t.name).join(' vs ')}
                              {game.winner && <span className="ml-2 text-yellow-600">🏆</span>}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {new Date(game.date).toLocaleString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {game.winner && (
                              <p className="text-sm text-green-600 font-medium mt-1">
                                승리 팀: {game.teams.find(t => t.teamId === game.winner)?.name || '알 수 없음'}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/teacher/class/${game.hostClassId}/game/play?gameId=${game.id}`)}
                            >
                              결과 보기
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGame(game.id, game.teams.map(t => t.name).join(' vs '), game.isCompleted);
                              }}
                              className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                            >
                              삭제
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
