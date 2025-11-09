'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ClassCard } from '@/components/teacher/ClassCard';
import { TeamCard } from '@/components/teacher/TeamCard';
import { getClasses, getStudents, getTeams, deleteClass, deleteTeam, updateClass, updateTeam } from '@/lib/dataService';
import { STORAGE_KEYS } from '@/lib/mockData';
import { Class, Student, Team } from '@/types';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

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
    <main className="min-h-screen bg-background flex flex-col">
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
            <div className="flex-1 flex flex-col gap-2 bg-blue-50/30 rounded-lg p-3">
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

              {classes.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">아직 생성된 학급이 없습니다.</p>
                  <Link href="/teacher/create-class">
                    <Button>첫 학급 만들기</Button>
                  </Link>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 md:gap-6 mt-4">
                    {paginatedClasses.map((classItem) => {
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
                  {classes.length > itemsPerPage && (
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
                        {classesPage + 1} / {Math.ceil(classes.length / itemsPerPage)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setClassesPage(prev => Math.min(Math.ceil(classes.length / itemsPerPage) - 1, prev + 1))}
                        disabled={classesPage >= Math.ceil(classes.length / itemsPerPage) - 1}
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

          {/* 팀 관리 탭 */}
          {activeTab === 'teams' && (
            <div className="flex-1 flex flex-col gap-2 bg-purple-50/30 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold">팀 관리</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="px-2 py-1 bg-purple-100 rounded-md font-medium text-purple-700">
                      {teams.length}개 팀
                    </span>
                  </div>
                </div>
              </div>

              {teams.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">아직 생성된 팀이 없습니다.</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    학급을 먼저 생성한 후, 학급 페이지에서 팀을 편성하세요.
                  </p>
                  <Button onClick={() => setActiveTab('classes')}>
                    학급 관리로 이동
                  </Button>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 md:gap-6 mt-4">
                    {paginatedTeams.map((team) => (
                      <TeamCard
                        key={team.id}
                        team={team}
                        allStudents={allStudents}
                        onClick={() => {
                          // 팀의 sourceClassIds 중 첫 번째 학급으로 이동
                          const classId = team.sourceClassIds?.[0] || team.members[0]?.classId;
                          if (classId) {
                            router.push(`/teacher/class/${classId}/teams`);
                          }
                        }}
                        onRename={(newName) => handleRenameTeam(team.id, newName)}
                        className="group"
                      />
                    ))}
                  </div>

                  {/* 페이지네이션 */}
                  {teams.length > itemsPerPage && (
                    <div className="flex justify-center items-center gap-4 mt-8">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTeamsPage(prev => Math.max(0, prev - 1))}
                        disabled={teamsPage === 0}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        이전
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        {teamsPage + 1} / {Math.ceil(teams.length / itemsPerPage)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTeamsPage(prev => Math.min(Math.ceil(teams.length / itemsPerPage) - 1, prev + 1))}
                        disabled={teamsPage >= Math.ceil(teams.length / itemsPerPage) - 1}
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
    </main>
  );
}
