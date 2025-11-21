'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ClassCard } from '@/components/teacher/ClassCard';
import { TeamCard } from '@/components/teacher/TeamCard';
import { StudentCard } from '@/components/teacher/StudentCard';
import { ClassDetailModal } from '@/components/teacher/ClassDetailModal';
import { TeamDetailModal } from '@/components/teacher/TeamDetailModal';
import { getClasses, getStudents, getTeams, deleteClass, deleteTeam, updateClass, updateTeam, createTeam, getGamesByTeacherId, updateStudent } from '@/lib/dataService';
import { randomTeamAssignment, assignTeamColor } from '@/lib/teamUtils';
import { STORAGE_KEYS } from '@/lib/mockData';
import { Class, Student, Team, FinishedGame } from '@/types';
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react';
import { migrateStatsData, formatStatsMigrationResult, StatsMigrationResult } from '@/lib/statsMigration';
import { calculateClassStats, calculateTeamStats } from '@/lib/statsHelpers';

export default function ManagementPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [studentsByClass, setStudentsByClass] = useState<Record<string, Student[]>>({});
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('classes');

  // 페이지네이션
  const [classesPage, setClassesPage] = useState(0);
  const [teamsPage, setTeamsPage] = useState(0);
  const itemsPerPage = 4;

  // 선택된 학급/팀
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // 모달 상태
  const [isClassDetailModalOpen, setIsClassDetailModalOpen] = useState(false);
  const [selectedClassForModal, setSelectedClassForModal] = useState<Class | null>(null);

  // 스탯 마이그레이션 상태
  const [isMigratingStats, setIsMigratingStats] = useState(false);
  const [migrationResult, setMigrationResult] = useState<StatsMigrationResult | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const teacherId = localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER);
      if (!teacherId) {
        router.push('/teacher/login');
        return;
      }

      const [classList, teamList] = await Promise.all([
        getClasses(teacherId),
        getTeams(teacherId),
      ]);

      setClasses(classList);
      setTeams(teamList);

      // 각 학급의 학생 데이터 로드
      const studentsData: Record<string, Student[]> = {};
      const allStudentsList: Student[] = [];

      await Promise.all(
        classList.map(async (classItem) => {
          const students = await getStudents(classItem.id);
          studentsData[classItem.id] = students;
          allStudentsList.push(...students);
        })
      );

      setStudentsByClass(studentsData);
      setAllStudents(allStudentsList);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenameClass = async (classId: string, newName: string) => {
    try {
      const classToUpdate = classes.find(c => c.id === classId);
      if (!classToUpdate) return;

      await updateClass(classId, { ...classToUpdate, name: newName });
      await loadData();
    } catch (error) {
      console.error('Failed to rename class:', error);
      alert('학급 이름 변경에 실패했습니다.');
    }
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`정말로 "${className}" 학급을 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없으며, 학급의 모든 학생, 팀, 경기 기록이 함께 삭제됩니다.`)) {
      return;
    }

    try {
      await deleteClass(classId);
      await loadData();
      alert('학급이 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete class:', error);
      alert('학급 삭제에 실패했습니다.');
    }
  };

  const handleRenameTeam = async (teamId: string, newName: string) => {
    try {
      const teamToUpdate = teams.find(t => t.id === teamId);
      if (!teamToUpdate) return;

      await updateTeam(teamId, { ...teamToUpdate, name: newName });
      await loadData();
    } catch (error) {
      console.error('Failed to rename team:', error);
      alert('팀 이름 변경에 실패했습니다.');
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`정말로 "${teamName}" 팀을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteTeam(teamId);
      await loadData();
      alert('팀이 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete team:', error);
      alert('팀 삭제에 실패했습니다.');
    }
  };

  const handleRandomTeamGeneration = async (classId: string) => {
    try {
      const selectedClass = classes.find(c => c.id === classId);
      if (!selectedClass) {
        alert('학급을 찾을 수 없습니다.');
        return;
      }

      const students = studentsByClass[classId] || [];
      if (students.length < 2) {
        alert('최소 2명 이상의 학생이 필요합니다.');
        return;
      }

      const existingTeams = teams.filter(team =>
        team.sourceClassIds?.includes(classId) ||
        team.members.some(m => m.classId === classId)
      );

      if (existingTeams.length > 0) {
        const confirmDelete = confirm(
          `이미 ${existingTeams.length}개의 팀이 존재합니다.\n\n` +
          `기존 팀을 모두 삭제하고 새로운 랜덤 팀을 생성하시겠습니까?\n\n` +
          `⚠️ 이 작업은 되돌릴 수 없습니다.`
        );

        if (!confirmDelete) return;

        for (const team of existingTeams) {
          await deleteTeam(team.id);
        }
      }

      const teamCount = 2;
      const assignedTeams = randomTeamAssignment(students, teamCount);

      const teacherId = localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER);
      if (!teacherId) {
        alert('로그인 정보를 찾을 수 없습니다.');
        return;
      }

      for (let i = 0; i < teamCount; i++) {
        const teamName = `${selectedClass.name} 팀${i + 1}`;
        const teamColor = assignTeamColor(i);
        const teamStudents = assignedTeams[i];

        await createTeam({
          teacherId,
          name: teamName,
          color: teamColor,
          members: teamStudents.map(student => ({
            studentId: student.id,
            name: student.name,
            number: student.number,
            classId: student.classId,
            className: selectedClass.name,
            position: 'infield'
          })),
          sourceClassIds: [classId]
        });

        if (i < teamCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 2));
        }
      }

      await loadData();

      alert(
        `✅ 랜덤 팀 생성 완료!\n\n` +
        `총 ${students.length}명을 2개 팀으로 배정했습니다.\n` +
        `- ${selectedClass.name} 팀1: ${assignedTeams[0].length}명\n` +
        `- ${selectedClass.name} 팀2: ${assignedTeams[1].length}명`
      );

      setActiveTab('teams');

    } catch (error) {
      console.error('랜덤 팀 생성 실패:', error);
      alert('랜덤 팀 생성에 실패했습니다.');
    }
  };

  // 스탯 데이터 마이그레이션 (outs → hits)
  const handleMigrateStats = async () => {
    if (!confirm('기존 경기 기록의 스탯 데이터를 마이그레이션하시겠습니까?\n\n이 작업은 "outs" 프로퍼티를 "hits"로 변환합니다.')) {
      return;
    }

    setIsMigratingStats(true);
    setMigrationResult(null);

    try {
      const teacherId = localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER);
      if (!teacherId) {
        alert('로그인 정보를 찾을 수 없습니다.');
        return;
      }

      // 모든 완료된 경기 가져오기
      const finishedGames = await getGamesByTeacherId(teacherId);

      // 마이그레이션 수행
      const { migratedGames, migratedStudents, result } = migrateStatsData(
        finishedGames as FinishedGame[],
        allStudents
      );

      // 마이그레이션된 데이터 저장
      if (result.gamesUpdated > 0) {
        localStorage.setItem(
          `${STORAGE_KEYS.FINISHED_GAMES_PREFIX}${teacherId}`,
          JSON.stringify(migratedGames)
        );
      }

      if (result.studentsUpdated > 0) {
        for (const student of migratedStudents) {
          await updateStudent(student.id, student);
        }
      }

      setMigrationResult(result);
      const message = formatStatsMigrationResult(result);
      alert(message);

      // 데이터 새로고침
      await loadData();

    } catch (error) {
      console.error('❌ 스탯 마이그레이션 실패:', error);
      alert('스탯 마이그레이션에 실패했습니다.');
    } finally {
      setIsMigratingStats(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  const paginatedClasses = classes.slice(
    classesPage * itemsPerPage,
    (classesPage + 1) * itemsPerPage
  );

  const paginatedTeams = teams.slice(
    teamsPage * itemsPerPage,
    (teamsPage + 1) * itemsPerPage
  );

  return (
    <main className="min-h-screen bg-background flex flex-col pt-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/teacher/dashboard')}
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 bg-sky-100 hover:bg-sky-200 text-sky-700 font-medium rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <span>←</span>
              <span>대시보드</span>
            </Button>
            <h1 className="text-2xl font-bold text-foreground">👥 학급/팀 관리</h1>
          </div>
        </div>

        {/* 탭 헤더 - baseball-firebase 스타일 */}
        <div className="flex justify-between items-center border-b-2 border-gray-200 mb-6">
          {/* 탭 버튼들 */}
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('classes')}
              className={`px-8 py-4 font-bold text-base transition-all ${
                activeTab === 'classes'
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              📚 학급 관리
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-8 py-4 font-bold text-base transition-all ${
                activeTab === 'teams'
                  ? 'border-b-2 border-purple-500 text-purple-600 bg-purple-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              👥 팀 관리
            </button>
            <button
              onClick={() => setActiveTab('shared')}
              className={`px-8 py-4 font-bold text-base transition-all ${
                activeTab === 'shared'
                  ? 'border-b-2 border-green-500 text-green-600 bg-green-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              🤝 공유받은 항목
            </button>
          </div>

          {/* 우측 액션 버튼들 */}
          <div className="flex gap-3 pr-4">
            {/* 스탯 마이그레이션 버튼 */}
            <Button
              onClick={handleMigrateStats}
              disabled={isMigratingStats}
              size="default"
              className="bg-orange-100 text-orange-700 hover:bg-orange-200 font-semibold disabled:opacity-50"
            >
              {isMigratingStats ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-1 animate-spin" />
                  마이그레이션 중...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-1" />
                  스탯 마이그레이션
                </>
              )}
            </Button>

            {/* 현재 탭에 따라 추가 버튼 표시 */}
            {activeTab === 'classes' && (
              <Link href="/teacher/create-class">
                <Button
                  size="default"
                  className="bg-green-100 text-green-700 hover:bg-green-200 font-semibold"
                >
                  <Plus className="w-5 h-5 mr-1" />
                  새 학급
                </Button>
              </Link>
            )}
            {activeTab === 'teams' && (
              <Button
                size="default"
                className="bg-green-100 text-green-700 hover:bg-green-200 font-semibold"
                onClick={() => router.push('/teacher/class/select-for-team')}
              >
                <Plus className="w-5 h-5 mr-1" />
                새 팀
              </Button>
            )}
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="flex-1 flex flex-col">
          {/* 학급 관리 탭 */}
          {activeTab === 'classes' && (
            <div className="flex-1 flex flex-col gap-3 bg-blue-50/20 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold">학급 관리</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="px-2 py-1 bg-blue-100 rounded-md font-medium text-blue-700">
                      {classes.length}개 학급
                    </span>
                  </div>
                </div>
              </div>

              {/* 학급 카드 리스트 (상단) */}
              <div className="relative">
                {/* 학급 카드 그리드 (최대 4개) */}
                <div className="grid grid-cols-4 gap-2 px-12">
                  {paginatedClasses.map((classItem) => {
                    const students = studentsByClass[classItem.id] || [];
                    const classStats = calculateClassStats(students);
                    const totalScore = classStats.totalHits + classStats.totalPasses + classStats.totalSacrifices + classStats.totalCookies;

                    return (
                      <Card
                        key={classItem.id}
                        className="relative py-3 px-3 cursor-pointer transition-all hover:shadow-md"
                        onClick={() => {
                          setSelectedClassForModal(classItem);
                          setIsClassDetailModalOpen(true);
                        }}
                      >
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          {/* 1행: 학급명 | 인원 | 총점 */}
                          <div className="flex items-center justify-center gap-2 text-base">
                            <span className="font-bold text-foreground text-lg">
                              {classItem.name}
                            </span>
                            <span className="text-muted-foreground">|</span>
                            <span className="text-sm text-muted-foreground">
                              {students.length}명
                            </span>
                            <span className="text-muted-foreground">|</span>
                            <span className="font-bold text-base text-blue-600">
                              📊 {totalScore}
                            </span>
                          </div>

                          {/* 2행: 스탯별 점수 + 배지 */}
                          <div className="flex items-center justify-center gap-2.5 text-base">
                            <span className="flex items-center gap-0.5" title="적중">
                              <span className="text-base">🎯</span>
                              <span className="font-semibold text-base">{classStats.totalHits}</span>
                            </span>
                            <span className="flex items-center gap-0.5" title="패스">
                              <span className="text-base">✋</span>
                              <span className="font-semibold text-base">{classStats.totalPasses}</span>
                            </span>
                            <span className="flex items-center gap-0.5" title="양보">
                              <span className="text-base">❤️</span>
                              <span className="font-semibold text-base">{classStats.totalSacrifices}</span>
                            </span>
                            <span className="flex items-center gap-0.5" title="쿠키">
                              <span className="text-base">🍪</span>
                              <span className="font-semibold text-base">{classStats.totalCookies}</span>
                            </span>
                            <span className="flex items-center gap-0.5" title="배지">
                              <span className="text-base">🏆</span>
                              <span className="font-semibold text-base text-yellow-600">
                                {classStats.totalBadges}
                              </span>
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}

                  {/* 학급 없을 때 */}
                  {classes.length === 0 && (
                    <div className="col-span-4 flex items-center justify-center text-muted-foreground text-sm py-8">
                      등록된 학급이 없습니다.
                    </div>
                  )}
                </div>

                {/* 좌측/우측 화살표 */}
                {classes.length > itemsPerPage && (
                  <>
                    {classesPage > 0 && (
                      <button
                        onClick={() => setClassesPage(prev => Math.max(0, prev - 1))}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background border-2 border-border rounded-full p-2 hover:bg-primary/10 hover:border-primary transition-all"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}
                    {classesPage < Math.ceil(classes.length / itemsPerPage) - 1 && (
                      <button
                        onClick={() => setClassesPage(prev => prev + 1)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background border-2 border-border rounded-full p-2 hover:bg-primary/10 hover:border-primary transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* 페이지 인디케이터 */}
              {Math.ceil(classes.length / itemsPerPage) > 1 && (
                <div className="flex justify-center gap-1 mt-2">
                  {Array.from({ length: Math.ceil(classes.length / itemsPerPage) }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setClassesPage(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        classesPage === i
                          ? 'bg-primary w-4'
                          : 'bg-border hover:bg-primary/50'
                      }`}
                    />
                  ))}
                </div>
              )}

            </div>
          )}

          {/* 팀 관리 탭 */}
          {activeTab === 'teams' && (
            <div className="flex-1 flex flex-col gap-3 bg-purple-50/20 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold">팀 관리</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="px-2 py-1 bg-purple-100 rounded-md font-medium text-purple-700">
                      {teams.length}개 팀
                    </span>
                    <span className="px-2 py-1 bg-blue-100 rounded-md font-medium text-blue-700">
                      {classes.length}개 학급
                    </span>
                    <span className="px-2 py-1 bg-green-100 rounded-md font-medium text-green-700">
                      {allStudents.length}명 학생
                    </span>
                  </div>
                </div>
              </div>

              {/* 팀 카드 리스트 (상단) */}
              <div className="relative">
                {/* 팀 카드 그리드 (최대 4개) */}
                <div className="grid grid-cols-4 gap-2 px-12">
                  {paginatedTeams.map((team) => {
                    const teamMembers = team.members || [];
                    const teamStats = calculateTeamStats(team, allStudents);
                    const totalScore = teamStats.totalHits + teamStats.totalPasses + teamStats.totalSacrifices + teamStats.totalCookies;

                    return (
                      <Card
                        key={team.id}
                        className="relative py-3 px-3 cursor-pointer transition-all hover:shadow-md"
                        onClick={() => setSelectedTeam(team)}
                      >
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          {/* 1행: 팀 이름 | 인원 | 총점 */}
                          <div className="flex items-center justify-center gap-2 text-base">
                            <span className="font-bold text-foreground text-lg">
                              {team.name}
                            </span>
                            <span className="text-muted-foreground">|</span>
                            <span className="text-sm text-muted-foreground">
                              {teamMembers.length}명
                            </span>
                            <span className="text-muted-foreground">|</span>
                            <span className="font-bold text-base text-blue-600">
                              📊 {totalScore}
                            </span>
                          </div>

                          {/* 2행: 스탯별 점수 + 배지 */}
                          <div className="flex items-center justify-center gap-2.5 text-base">
                            <span className="flex items-center gap-0.5" title="적중">
                              <span className="text-base">🎯</span>
                              <span className="font-semibold text-base">{teamStats.totalHits}</span>
                            </span>
                            <span className="flex items-center gap-0.5" title="패스">
                              <span className="text-base">✋</span>
                              <span className="font-semibold text-base">{teamStats.totalPasses}</span>
                            </span>
                            <span className="flex items-center gap-0.5" title="양보">
                              <span className="text-base">❤️</span>
                              <span className="font-semibold text-base">{teamStats.totalSacrifices}</span>
                            </span>
                            <span className="flex items-center gap-0.5" title="쿠키">
                              <span className="text-base">🍪</span>
                              <span className="font-semibold text-base">{teamStats.totalCookies}</span>
                            </span>
                            <span className="flex items-center gap-0.5" title="배지">
                              <span className="text-base">🏆</span>
                              <span className="font-semibold text-base text-yellow-600">{teamStats.totalBadges}</span>
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}

                  {/* 팀 없을 때 */}
                  {teams.length === 0 && (
                    <div className="col-span-4 flex items-center justify-center text-muted-foreground text-sm py-8">
                      등록된 팀이 없습니다.
                    </div>
                  )}
                </div>

                {/* 좌측/우측 화살표 */}
                {teams.length > itemsPerPage && (
                  <>
                    {teamsPage > 0 && (
                      <button
                        onClick={() => setTeamsPage(prev => Math.max(0, prev - 1))}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background border-2 border-border rounded-full p-2 hover:bg-primary/10 hover:border-primary transition-all"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}
                    {teamsPage < Math.ceil(teams.length / itemsPerPage) - 1 && (
                      <button
                        onClick={() => setTeamsPage(prev => prev + 1)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background border-2 border-border rounded-full p-2 hover:bg-primary/10 hover:border-primary transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* 페이지 인디케이터 */}
              {Math.ceil(teams.length / itemsPerPage) > 1 && (
                <div className="flex justify-center gap-1 mt-2">
                  {Array.from({ length: Math.ceil(teams.length / itemsPerPage) }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setTeamsPage(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        teamsPage === i
                          ? 'bg-primary w-4'
                          : 'bg-border hover:bg-primary/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 공유받은 항목 탭 */}
          {activeTab === 'shared' && (
            <div className="flex-1 flex flex-col gap-2 bg-green-50/30 rounded-lg p-3">
              <Card className="p-8 text-center">
                <div className="text-4xl mb-4">📦</div>
                <h3 className="text-xl font-bold mb-2">공유받은 항목</h3>
                <p className="text-muted-foreground mb-4">
                  다른 선생님이 공유한 학급이나 팀이 여기에 표시됩니다.
                </p>
                <p className="text-sm text-muted-foreground">
                  (공유 기능은 향후 구현 예정)
                </p>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* 학급 상세 모달 */}
      <ClassDetailModal
        isOpen={isClassDetailModalOpen}
        onClose={() => {
          setIsClassDetailModalOpen(false);
          setSelectedClassForModal(null);
        }}
        classData={selectedClassForModal}
        students={selectedClassForModal ? (studentsByClass[selectedClassForModal.id] || []) : []}
        onRandomTeamGeneration={selectedClassForModal ? () => handleRandomTeamGeneration(selectedClassForModal.id) : undefined}
      />

      {/* 팀 상세 모달 */}
      <TeamDetailModal
        isOpen={!!selectedTeam}
        team={selectedTeam}
        allStudents={allStudents}
        onClose={() => setSelectedTeam(null)}
      />
    </main>
  );
}
