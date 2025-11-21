'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getClasses, deleteClass, getGamesByTeacherId, deleteGame, getStudents, updateClass, getTeams, updateStudent } from '@/lib/dataService';
import { STORAGE_KEYS } from '@/lib/mockData';
import { Class, Game, Student, Team, FinishedGame } from '@/types';
import { ClassCard } from '@/components/teacher/ClassCard';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { GameModeSelectModal } from '@/components/teacher/GameModeSelectModal';
import { QuickGameModal } from '@/components/teacher/QuickGameModal';
import { SelectedGamesModal } from '@/components/teacher/SelectedGamesModal';
import StatsView from '@/components/teacher/StatsView';
import BadgeCollection from '@/components/badge/BadgeCollection';
import { migrateBadges, formatMigrationResult, type MigrationResult } from '@/lib/badgeMigration';

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardView, setDashboardView] = useState<'dashboard' | 'classes' | 'games' | 'stats' | 'badges'>('dashboard');
  const [teacherId, setTeacherId] = useState<string>('');

  // 모달 상태
  const [showGameModeModal, setShowGameModeModal] = useState(false);
  const [showQuickGameModal, setShowQuickGameModal] = useState(false);
  const [showSelectedGamesModal, setShowSelectedGamesModal] = useState(false);

  // 학급별 학생 데이터
  const [studentsByClass, setStudentsByClass] = useState<Record<string, Student[]>>({});

  // 통계 뷰 상태
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);

  // 페이지네이션 상태
  const [classesPage, setClassesPage] = useState(0);
  const classesPerPage = 4;

  // 마이그레이션 상태
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  useEffect(() => {
    // 로그인 체크
    const currentTeacherId = localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER);
    if (!currentTeacherId) {
      router.push('/teacher/login');
      return;
    }

    setTeacherId(currentTeacherId);

    // 학급, 경기, 팀 목록 불러오기
    loadClasses(currentTeacherId);
    loadGames(currentTeacherId);
    loadTeams(currentTeacherId);

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
      const allStudentsArray: Student[] = [];

      // 모든 학급의 학생 데이터를 병렬로 로드
      await Promise.all(
        classList.map(async (classItem) => {
          const students = await getStudents(classItem.id);
          studentsData[classItem.id] = students;
          allStudentsArray.push(...students);
        })
      );

      setStudentsByClass(studentsData);
      setAllStudents(allStudentsArray);
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

  const loadTeams = async (teacherId: string) => {
    try {
      const teamList = await getTeams(teacherId);
      setTeams(teamList);
    } catch (error) {
      console.error('Failed to load teams:', error);
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

  const handleMigrateBadges = async () => {
    if (!confirm(
      '배지 마이그레이션을 시작하시겠습니까?\n\n' +
      '모든 학생의 현재 스탯을 기반으로 배지를 재계산하여 누락된 배지를 자동으로 수여합니다.\n\n' +
      '⚠️ 이 작업은 몇 초가 걸릴 수 있습니다.'
    )) {
      return;
    }

    setIsMigrating(true);
    setMigrationResult(null);

    try {
      // 모든 학생 데이터 복사 (원본 보존)
      const studentsToMigrate = [...allStudents];

      // 마이그레이션 실행
      const result = migrateBadges(studentsToMigrate);

      // 변경된 학생 데이터 저장
      await Promise.all(
        studentsToMigrate.map(student => updateStudent(student.id, student))
      );

      // 학생 데이터 다시 로드
      const teacherId = localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER);
      if (teacherId) {
        await loadClasses(teacherId);
      }

      setMigrationResult(result);

      // 결과 표시
      alert(
        '✅ 배지 마이그레이션 완료!\n\n' +
        formatMigrationResult(result)
      );
    } catch (error) {
      console.error('Migration failed:', error);
      alert('⚠️ 배지 마이그레이션 중 오류가 발생했습니다.\n\n' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    } finally {
      setIsMigrating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div
      className={(dashboardView === 'dashboard' || dashboardView === 'badges') ? 'bg-background flex flex-col overflow-hidden h-full' : 'min-h-screen bg-background flex flex-col pt-16'}
    >
      {/* 메인 콘텐츠 */}
      <main className={`w-full mx-auto ${dashboardView === 'dashboard'
        ? 'h-full flex items-center justify-center overflow-hidden px-6'
        : dashboardView === 'badges'
          ? 'h-full overflow-hidden px-6 sm:px-8 py-8 max-w-7xl'
          : 'flex-grow py-8 max-w-7xl overflow-y-auto px-6 sm:px-8'
        }`}>
        {/* 대시보드 메인 뷰 */}
        {dashboardView === 'dashboard' && (
          <div className="w-full max-w-5xl pt-35 pb-5">
            {/* 마이그레이션 버튼 - 상단 우측 */}
            <div className="flex justify-end mb-4">
              <Button
                onClick={handleMigrateBadges}
                disabled={isMigrating || allStudents.length === 0}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 text-amber-700 border-amber-200 shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${isMigrating ? 'animate-spin' : ''}`} />
                <span>{isMigrating ? '배지 재계산 중...' : '🏆 배지 재계산'}</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6 tablet:gap-7 tablet-lg:gap-8 w-full">
              {/* 학급/팀 관리 카드 */}
              <Card
                className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 h-[240px] tablet:h-[260px] tablet-lg:h-[280px]"
                onClick={() => router.push('/teacher/management')}
              >
                <CardContent className="p-5 tablet:p-7 tablet-lg:p-9 h-full flex flex-col justify-center items-center text-center gap-2 tablet:gap-3 !pt-5 tablet:!pt-7 tablet-lg:!pt-9">
                  {/* 제목 영역 - 가로 배치 */}
                  <div className="flex items-center justify-center gap-2 tablet:gap-3 w-full">
                    <div className="text-4xl tablet:text-5xl tablet-lg:text-6xl flex-shrink-0">👥</div>
                    <div className="text-xl tablet:text-2xl tablet-lg:text-3xl font-extrabold text-foreground whitespace-nowrap">
                      학급/팀 관리
                    </div>
                  </div>

                  {/* 설명 */}
                  <p className="text-sm tablet:text-base tablet-lg:text-lg font-bold text-gray-900 whitespace-nowrap">
                    학급 및 팀 설정, 학생 관리
                  </p>

                  {/* 통계 정보 - 배지 스타일 */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="px-3 py-1.5 bg-blue-100/80 rounded-lg font-semibold text-blue-800 text-sm tablet:text-base whitespace-nowrap">
                      {classes.length}개 학급
                    </span>
                    <span className="px-3 py-1.5 bg-amber-100/80 rounded-lg font-semibold text-amber-800 text-sm tablet:text-base whitespace-nowrap">
                      🏆 {allStudents.reduce((sum, s) => sum + (s.badges?.length || 0), 0)}개 배지
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* 경기 관리 카드 */}
              <Card
                className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 bg-gradient-to-br from-green-50 to-green-100 border-green-200 h-[240px] tablet:h-[260px] tablet-lg:h-[280px]"
                onClick={() => setDashboardView('games')}
              >
                <CardContent className="p-5 tablet:p-7 tablet-lg:p-9 h-full flex flex-col justify-center items-center text-center gap-2 tablet:gap-3 !pt-5 tablet:!pt-7 tablet-lg:!pt-9">
                  {/* 제목 영역 */}
                  <div className="flex items-center justify-center gap-2 tablet:gap-3 w-full">
                    <div className="text-4xl tablet:text-5xl tablet-lg:text-6xl flex-shrink-0">🏐</div>
                    <div className="text-xl tablet:text-2xl tablet-lg:text-3xl font-extrabold text-foreground whitespace-nowrap">
                      경기 관리
                    </div>
                  </div>

                  {/* 설명 */}
                  <p className="text-sm tablet:text-base tablet-lg:text-lg font-bold text-gray-900 whitespace-nowrap">
                    진행 중 및 완료된 경기
                  </p>

                  {/* 통계 정보 */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="px-3 py-1.5 bg-green-100/80 rounded-lg font-semibold text-green-800 text-sm tablet:text-base whitespace-nowrap">
                      {games.filter(g => !g.isCompleted).length}개 진행 중
                    </span>
                    <span className="px-3 py-1.5 bg-gray-100/80 rounded-lg font-semibold text-gray-800 text-sm tablet:text-base whitespace-nowrap">
                      {games.filter(g => g.isCompleted).length}개 완료
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* 통계 카드 */}
              <Card
                className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 h-[240px] tablet:h-[260px] tablet-lg:h-[280px]"
                onClick={() => setDashboardView('stats')}
              >
                <CardContent className="p-5 tablet:p-7 tablet-lg:p-9 h-full flex flex-col justify-center items-center text-center gap-2 tablet:gap-3 !pt-5 tablet:!pt-7 tablet-lg:!pt-9">
                  {/* 제목 영역 */}
                  <div className="flex items-center justify-center gap-2 tablet:gap-3 w-full">
                    <div className="text-4xl tablet:text-5xl tablet-lg:text-6xl flex-shrink-0">📊</div>
                    <div className="text-xl tablet:text-2xl tablet-lg:text-3xl font-extrabold text-foreground whitespace-nowrap">
                      통합 통계
                    </div>
                  </div>

                  {/* 설명 */}
                  <p className="text-sm tablet:text-base tablet-lg:text-lg font-bold text-gray-900 whitespace-nowrap">
                    완료된 경기 통합 스탯
                  </p>

                  {/* 통계 정보 */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="px-3 py-1.5 bg-purple-100/80 rounded-lg font-semibold text-purple-800 text-sm tablet:text-base whitespace-nowrap">
                      {games.filter(g => g.isCompleted).length}개 완료 경기
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* 배지 도감 카드 */}
              <Card
                className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200 h-[240px] tablet:h-[260px] tablet-lg:h-[280px]"
                onClick={() => setDashboardView('badges')}
              >
                <CardContent className="p-5 tablet:p-7 tablet-lg:p-9 h-full flex flex-col justify-center items-center text-center gap-2 tablet:gap-3 !pt-5 tablet:!pt-7 tablet-lg:!pt-9">
                  {/* 제목 영역 */}
                  <div className="flex items-center justify-center gap-2 tablet:gap-3 w-full">
                    <div className="text-4xl tablet:text-5xl tablet-lg:text-6xl flex-shrink-0">🏆</div>
                    <div className="text-xl tablet:text-2xl tablet-lg:text-3xl font-extrabold text-foreground whitespace-nowrap">
                      배지 도감
                    </div>
                  </div>

                  {/* 설명 */}
                  <p className="text-sm tablet:text-base tablet-lg:text-lg font-bold text-gray-900 whitespace-nowrap">
                    획득 가능한 모든 배지
                  </p>

                  {/* 통계 정보 */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="px-3 py-1.5 bg-amber-100/80 rounded-lg font-semibold text-amber-800 text-sm tablet:text-base whitespace-nowrap">
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
                <Button
                  onClick={() => setDashboardView('dashboard')}
                  variant="ghost"
                  className="flex items-center gap-2 px-4 py-2 bg-sky-100 hover:bg-sky-200 text-sky-700 font-medium rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <span>←</span>
                  <span>대시보드</span>
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
                <Button
                  onClick={() => setDashboardView('dashboard')}
                  variant="ghost"
                  className="flex items-center gap-2 px-4 py-2 bg-sky-100 hover:bg-sky-200 text-sky-700 font-medium rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <span>←</span>
                  <span>대시보드</span>
                </Button>
                <h2 className="text-2xl font-bold text-foreground">⚾ 경기 관리</h2>
              </div>
              <Button
                size="lg"
                onClick={() => setShowGameModeModal(true)}
                className="bg-green-100 hover:bg-green-200 text-green-700 border-green-200"
              >
                🎯 새 경기 시작
              </Button>
            </div>

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
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md p-10 text-center border-2 border-dashed border-green-200">
                    <div className="mb-4">
                      <span className="text-7xl">🎯</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">
                      진행 중인 경기가 없습니다
                    </h3>
                    <p className="text-gray-500 mb-4">
                      새로운 피구 경기를 시작해보세요!
                    </p>
                    <button
                      onClick={() => setShowGameModeModal(true)}
                      className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                    >
                      🎯 경기 시작
                    </button>
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

        {/* 통계 뷰 - StatsView 컴포넌트 사용 */}
        {dashboardView === 'stats' && (
          <StatsView
            finishedGames={games.filter(g => g.isCompleted) as FinishedGame[]}
            teams={teams}
            students={allStudents}
            onBack={() => setDashboardView('dashboard')}
          />
        )}

        {/* 배지 도감 뷰 */}
        {dashboardView === 'badges' && (
          <BadgeCollection
            classId={classes[0]?.id || 'all'}
            students={allStudents}
            onBack={() => setDashboardView('dashboard')}
          />
        )}
      </main>

      {/* Modals */}
      <GameModeSelectModal
        isOpen={showGameModeModal}
        onClose={() => setShowGameModeModal(false)}
        onSelectQuick={() => {
          setShowGameModeModal(false);
          setShowQuickGameModal(true);
        }}
      />

      <QuickGameModal
        isOpen={showQuickGameModal}
        onClose={() => setShowQuickGameModal(false)}
        teams={teams}
        teacherId={teacherId}
      />

      <SelectedGamesModal
        isOpen={showSelectedGamesModal}
        onClose={() => setShowSelectedGamesModal(false)}
        selectedGames={games.filter(g => g.isCompleted && selectedGameIds.includes(g.id)) as FinishedGame[]}
        teams={teams}
        students={allStudents}
      />
    </div>
  );
}
