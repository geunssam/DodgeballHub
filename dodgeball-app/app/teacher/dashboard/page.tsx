'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getClasses, deleteClass, getGamesByTeacherId, deleteGame, getStudents, updateClass } from '@/lib/dataService';
import { STORAGE_KEYS } from '@/lib/mockData';
import { Class, Game, Student } from '@/types';
import { ClassCard } from '@/components/teacher/ClassCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardView, setDashboardView] = useState<'dashboard' | 'classes' | 'games'>('dashboard');

  // 학급별 학생 데이터
  const [studentsByClass, setStudentsByClass] = useState<Record<string, Student[]>>({});

  // 페이지네이션 상태
  const [classesPage, setClassesPage] = useState(0);
  const classesPerPage = 4;

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

      // 각 학급의 학생 데이터 로드
      await loadAllStudents(classList);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllStudents = async (classList: Class[]) => {
    try {
      const studentsData: Record<string, Student[]> = {};

      // 모든 학급의 학생 데이터를 병렬로 로드
      await Promise.all(
        classList.map(async (classItem) => {
          const students = await getStudents(classItem.id);
          studentsData[classItem.id] = students;
        })
      );

      setStudentsByClass(studentsData);
    } catch (error) {
      console.error('Failed to load students:', error);
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

  const handleRenameClass = async (classId: string, newName: string) => {
    try {
      const classToUpdate = classes.find(c => c.id === classId);
      if (!classToUpdate) return;

      await updateClass(classId, { ...classToUpdate, name: newName });

      // 현재 teacherId 가져오기
      const teacherId = localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER);
      if (teacherId) {
        await loadClasses(teacherId);
      }
    } catch (error) {
      console.error('Failed to rename class:', error);
      alert('학급 이름 변경에 실패했습니다.');
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
    <div className="min-h-screen bg-background flex flex-col">
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
      <main className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col ${dashboardView === 'dashboard' ? 'justify-center' : ''}`}>
        {/* 대시보드 메인 뷰 */}
        {dashboardView === 'dashboard' && (
          <div>
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              {/* 학급/팀 관리 카드 */}
              <Card
                className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
                onClick={() => router.push('/teacher/management')}
              >
                <CardContent className="p-8 h-full min-h-[280px] flex flex-col justify-center items-center text-center gap-3 !pt-8">
                  {/* 제목 영역 - 가로 배치 */}
                  <div className="flex items-center justify-center gap-3 w-full">
                    <div className="text-5xl sm:text-6xl lg:text-7xl flex-shrink-0">👥</div>
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground whitespace-nowrap">
                      학급/팀 관리
                    </div>
                  </div>

                  {/* 설명 */}
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 whitespace-nowrap">
                    학급 및 팀 설정, 학생 관리
                  </p>

                  {/* 통계 정보 - 배지 스타일 */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="px-4 py-2 bg-blue-100/80 rounded-lg font-semibold text-blue-800 text-base sm:text-lg whitespace-nowrap">
                      {classes.length}개 학급
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* 경기 관리 카드 */}
              <Card
                className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 bg-gradient-to-br from-green-50 to-green-100 border-green-200"
                onClick={() => setDashboardView('games')}
              >
                <CardContent className="p-8 h-full min-h-[280px] flex flex-col justify-center items-center text-center gap-3 !pt-8">
                  {/* 제목 영역 */}
                  <div className="flex items-center justify-center gap-3 w-full">
                    <div className="text-5xl sm:text-6xl lg:text-7xl flex-shrink-0">🏐</div>
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground whitespace-nowrap">
                      경기 관리
                    </div>
                  </div>

                  {/* 설명 */}
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 whitespace-nowrap">
                    진행 중 및 완료된 경기
                  </p>

                  {/* 통계 정보 */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="px-4 py-2 bg-green-100/80 rounded-lg font-semibold text-green-800 text-base sm:text-lg whitespace-nowrap">
                      {games.filter(g => !g.isCompleted).length}개 진행 중
                    </span>
                    <span className="px-4 py-2 bg-gray-100/80 rounded-lg font-semibold text-gray-800 text-base sm:text-lg whitespace-nowrap">
                      {games.filter(g => g.isCompleted).length}개 완료
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* 통계 카드 */}
              <Card className="cursor-not-allowed opacity-50 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-8 h-full min-h-[280px] flex flex-col justify-center items-center text-center gap-3 !pt-8">
                  {/* 제목 영역 */}
                  <div className="flex items-center justify-center gap-3 w-full">
                    <div className="text-5xl sm:text-6xl lg:text-7xl flex-shrink-0">📊</div>
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground whitespace-nowrap">
                      통합 통계
                    </div>
                  </div>

                  {/* 설명 */}
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 whitespace-nowrap">
                    완료된 경기 통합 스탯
                  </p>

                  {/* 통계 정보 */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="px-4 py-2 bg-purple-100/80 rounded-lg font-semibold text-purple-800 text-base sm:text-lg whitespace-nowrap">
                      준비 중...
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* 배지 도감 카드 */}
              <Card className="cursor-not-allowed opacity-50 bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200">
                <CardContent className="p-8 h-full min-h-[280px] flex flex-col justify-center items-center text-center gap-3 !pt-8">
                  {/* 제목 영역 */}
                  <div className="flex items-center justify-center gap-3 w-full">
                    <div className="text-5xl sm:text-6xl lg:text-7xl flex-shrink-0">🏆</div>
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground whitespace-nowrap">
                      배지 도감
                    </div>
                  </div>

                  {/* 설명 */}
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 whitespace-nowrap">
                    획득 가능한 모든 배지
                  </p>

                  {/* 통계 정보 */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="px-4 py-2 bg-amber-100/80 rounded-lg font-semibold text-amber-800 text-base sm:text-lg whitespace-nowrap">
                      📖 배지 컬렉션
                    </span>
                  </div>
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
              <>
                {/* 학급 카드 그리드 - 4열 */}
                <div className="grid grid-cols-2 tablet-lg:grid-cols-4 gap-3 tablet:gap-4 tablet-lg:gap-6">
                  {classes
                    .slice(classesPage * classesPerPage, (classesPage + 1) * classesPerPage)
                    .map((classItem) => {
                      const students = studentsByClass[classItem.id] || [];

                      return (
                        <ClassCard
                          key={classItem.id}
                          classData={classItem}
                          students={students}
                          onClick={() => router.push(`/teacher/class/${classItem.id}/students`)}
                          onRename={(newName) => handleRenameClass(classItem.id, newName)}
                          className="group"
                        />
                      );
                    })}
                </div>

                {/* 페이지네이션 */}
                {classes.length > classesPerPage && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setClassesPage(prev => Math.max(0, prev - 1))}
                      disabled={classesPage === 0}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      이전
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      {classesPage + 1} / {Math.ceil(classes.length / classesPerPage)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setClassesPage(prev => Math.min(Math.ceil(classes.length / classesPerPage) - 1, prev + 1))}
                      disabled={classesPage >= Math.ceil(classes.length / classesPerPage) - 1}
                    >
                      다음
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
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
