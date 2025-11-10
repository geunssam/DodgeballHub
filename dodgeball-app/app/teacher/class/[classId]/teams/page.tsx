'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getClassById, getStudents, getTeams, createTeam, updateTeam, deleteTeam, updateStudent, getClasses } from '@/lib/dataService';
import { Class, Student, Team } from '@/types';
import { STORAGE_KEYS } from '@/lib/mockData';
import { StudentCard } from '@/components/StudentCard';
import { TeamDropZone } from '@/components/TeamDropZone';
import { RandomTeamModal } from '@/components/RandomTeamModal';
import { AddTeamModal } from '@/components/AddTeamModal';
import { AddClassStudentsModal } from '@/components/AddClassStudentsModal';
import { randomTeamAssignment, generateTeamName, assignTeamColor, TeamNamingStyle } from '@/lib/teamUtils';

export default function TeamsPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;

  const [classData, setClassData] = useState<Class | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showRandomModal, setShowRandomModal] = useState(false);
  const [showAddClassStudentsModal, setShowAddClassStudentsModal] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState<Class[]>([]);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const teamsPerPage = 3;

  // 페이지네이션 계산
  const totalPages = Math.ceil(teams.length / teamsPerPage);
  const startIndex = (currentPage - 1) * teamsPerPage;
  const endIndex = startIndex + teamsPerPage;
  const currentPageTeams = teams.slice(startIndex, endIndex);
  const isLastPage = currentPage === totalPages || teams.length === 0;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    try {
      // 현재 선생님 ID 가져오기
      const currentTeacherId = localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER);
      if (!currentTeacherId) {
        router.push('/teacher/login');
        return;
      }

      const [classInfo, students, teamList, allClasses] = await Promise.all([
        getClassById(classId),
        getStudents(classId),
        getTeams(currentTeacherId),
        getClasses(currentTeacherId)
      ]);

      if (!classInfo) {
        alert('학급을 찾을 수 없습니다.');
        router.push('/teacher/dashboard');
        return;
      }

      setClassData(classInfo);

      // 중복 학생 체크 및 제거
      const uniqueStudents = Array.from(
        new Map(students.map(s => [s.id, s])).values()
      );

      // 중복이 있었다면 경고 로그
      if (uniqueStudents.length !== students.length) {
        console.warn(`⚠️ 중복 학생 발견! 총 ${students.length}명 중 ${uniqueStudents.length}명이 고유함`);
        console.log('중복 제거 전:', students.map(s => s.id));
        console.log('중복 제거 후:', uniqueStudents.map(s => s.id));
      }

      setAllStudents(uniqueStudents);

      // 현재 학급의 팀만 필터링 (sourceClassIds에 현재 classId가 포함된 팀)
      const currentClassTeams = teamList.filter(team =>
        team.sourceClassIds?.includes(classId) ||
        team.members.some(m => m.classId === classId)
      );
      setTeams(currentClassTeams);

      // 현재 학급을 제외한 다른 학급들
      setTeacherClasses(allClasses.filter(c => c.id !== classId));

      // 배정되지 않은 학생 계산 (현재 학급 팀의 멤버만 고려)
      const assignedStudentIds = new Set(
        currentClassTeams.flatMap(team => (team.members || []).map(m => m.studentId))
      );
      const unassigned = uniqueStudents.filter(s => !assignedStudentIds.has(s.id));
      setUnassignedStudents(unassigned);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = async (teamName: string) => {
    try {
      if (!classData) return;

      // 자동으로 색상 배정 (팀 순서에 따라)
      const teamColor = assignTeamColor(teams.length);

      await createTeam({
        teacherId: classData.teacherId,
        name: teamName,
        color: teamColor,
        members: []
      });

      setShowAddTeamModal(false);
      await loadData();

      // 새로 생성된 팀이 있는 페이지로 이동
      const newTotalPages = Math.ceil((teams.length + 1) / teamsPerPage);
      setCurrentPage(newTotalPages);
    } catch (error) {
      console.error('Failed to create team:', error);
      alert('팀 생성에 실패했습니다.');
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`${teamName} 팀을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteTeam(teamId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete team:', error);
      alert('팀 삭제에 실패했습니다.');
    }
  };

  const handleRandomTeamAssignment = async (teamCount: number, namingStyle: TeamNamingStyle) => {
    try {
      if (!classData) return;

      // 기존 팀 모두 삭제
      for (const team of teams) {
        await deleteTeam(team.id);
      }

      // 현재 학급의 모든 학생 사용 (allStudents는 이미 현재 학급만 필터링됨)
      const studentsToAssign = allStudents;
      if (studentsToAssign.length === 0) {
        alert('팀에 배정할 학생이 없습니다.');
        return;
      }

      const assignedTeams = randomTeamAssignment(studentsToAssign, teamCount);

      // 새 팀 생성 및 학생 배정 (시간차 두기)
      for (let i = 0; i < teamCount; i++) {
        const teamName = generateTeamName(i, namingStyle);
        const teamColor = assignTeamColor(i);
        const teamStudents = assignedTeams[i];

        await createTeam({
          teacherId: classData.teacherId,
          name: teamName,
          color: teamColor,
          members: teamStudents.map(student => ({
            studentId: student.id,
            name: student.name,
            number: student.number,
            classId: student.classId,
            className: classData.name,
            position: 'infield'
          }))
        });

        // 각 팀 생성 후 2ms 대기 (타임스탬프 중복 방지)
        if (i < teamCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 2));
        }
      }

      setShowRandomModal(false);
      await loadData();
      setCurrentPage(1); // 첫 페이지로 이동
      alert(`${teamCount}개 팀이 랜덤으로 편성되었습니다!`);
    } catch (error) {
      console.error('Failed to assign random teams:', error);
      alert('랜덤 팀 편성에 실패했습니다.');
    }
  };

  const handleAddStudentsFromOtherClass = async (studentIds: string[], sourceClassId: string) => {
    try {
      // 선택된 학생들의 classId를 현재 학급으로 변경
      for (const studentId of studentIds) {
        await updateStudent(studentId, { classId: classId });
      }

      setShowAddClassStudentsModal(false);
      await loadData(); // 데이터 새로고침
      alert(`${studentIds.length}명의 학생이 추가되었습니다!`);
    } catch (error) {
      console.error('Failed to add students:', error);
      alert('학생 추가에 실패했습니다.');
    }
  };

  const handleResetAllTeams = async () => {
    if (teams.length === 0) {
      alert('삭제할 팀이 없습니다.');
      return;
    }

    if (!confirm(`모든 팀(${teams.length}개)을 삭제하고 학생들을 미배정 상태로 되돌리시겠습니까?`)) {
      return;
    }

    try {
      // 모든 팀 삭제
      for (const team of teams) {
        await deleteTeam(team.id);
      }

      await loadData(); // 데이터 새로고침
      setCurrentPage(1); // 첫 페이지로 이동
      alert('모든 팀이 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to reset teams:', error);
      alert('팀 초기화에 실패했습니다.');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    console.log('🎯 Drag started:', event.active.id);
    const studentId = event.active.id as string;
    const student = allStudents.find(s => s.id === studentId);
    setActiveStudent(student || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('🎯 Drag ended:', { activeId: active.id, overId: over?.id });
    setActiveStudent(null);

    if (!over) {
      console.log('❌ No drop target');
      return;
    }

    const studentId = active.id as string;
    const targetId = over.id as string;

    // "unassigned"로 드롭한 경우
    if (targetId === 'unassigned') {
      // 모든 팀에서 해당 학생 제거
      for (const team of teams) {
        if ((team.members || []).some(m => m.studentId === studentId)) {
          await updateTeam(team.id, {
            members: (team.members || []).filter(m => m.studentId !== studentId)
          });
        }
      }
      await loadData();
      return;
    }

    // 팀으로 드롭한 경우
    const targetTeam = teams.find(t => t.id === targetId);
    if (!targetTeam) {
      console.log('❌ Target team not found:', { targetId, availableTeams: teams.map(t => t.id) });
      return;
    }
    console.log('✅ Target team found:', targetTeam.name);

    // 이미 해당 팀에 있는지 확인
    if ((targetTeam.members || []).some(m => m.studentId === studentId)) {
      return;
    }

    // 다른 팀에서 제거
    for (const team of teams) {
      if (team.id !== targetId && (team.members || []).some(m => m.studentId === studentId)) {
        await updateTeam(team.id, {
          members: (team.members || []).filter(m => m.studentId !== studentId)
        });
      }
    }

    // 학생 정보 찾기
    const student = allStudents.find(s => s.id === studentId);
    if (!student || !classData) return;

    // 새 팀에 추가
    await updateTeam(targetTeam.id, {
      members: [
        ...(targetTeam.members || []),
        {
          studentId,
          name: student.name,
          number: student.number,
          classId: student.classId,
          className: classData.name,
          position: 'infield' // 기본값
        }
      ]
    });

    await loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-grow p-6">
        <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            팀 편성 <span className="text-gray-600 text-2xl">({teams.length}팀)</span>
          </h1>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowRandomModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              disabled={allStudents.length === 0}
            >
              🎲 팀 랜덤 배정
            </Button>
            <Button
              onClick={handleResetAllTeams}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              disabled={teams.length === 0}
            >
              팀 초기화
            </Button>
            <Link href="/teacher/dashboard">
              <Button variant="outline">대시보드로</Button>
            </Link>
          </div>
        </div>

        {/* 페이지네이션 네비게이션 */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 p-0"
              >
                ◀
              </Button>

              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-10 h-10 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 p-0"
              >
                ▶
              </Button>
            </div>

            <p className="text-sm text-gray-600">
              현재 {currentPage}페이지 / {totalPages}페이지
            </p>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* 4컬럼 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 미배정 학생 카드 (항상 표시) */}
            <div>
              {/* 헤더 카드 */}
              <div className="flex justify-between items-center px-4 py-3 mb-3 rounded-lg border-2 bg-gray-100 border-gray-300">
                <h3 className="text-lg font-bold text-gray-800">
                  미배정 학생 <span className="text-gray-600">({unassignedStudents.length}명)</span>
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddClassStudentsModal(true)}
                  className="h-8 px-3 text-xs"
                >
                  + 학급 추가
                </Button>
              </div>

              {/* 드롭존 */}
              <TeamDropZone
                id="unassigned"
                color="gray"
                students={unassignedStudents}
                allStudents={allStudents}
              />
            </div>

            {/* 현재 페이지의 팀들 */}
            {currentPageTeams.map((team, index) => {
              const teamStudents = (team.members || [])
                .map(m => allStudents.find(s => s.id === m.studentId))
                .filter(Boolean) as Student[];

              // 팀 색상에 따른 배경 클래스 매핑 (Tailwind는 동적 클래스 생성 불가)
              const colorClasses = {
                red: 'bg-red-100 border-red-300',
                blue: 'bg-blue-100 border-blue-300',
                green: 'bg-green-100 border-green-300',
                yellow: 'bg-yellow-100 border-yellow-300',
                purple: 'bg-purple-100 border-purple-300',
                pink: 'bg-pink-100 border-pink-300',
                orange: 'bg-orange-100 border-orange-300',
                teal: 'bg-teal-100 border-teal-300',
                indigo: 'bg-indigo-100 border-indigo-300',
                cyan: 'bg-cyan-100 border-cyan-300',
              }[team.color] || 'bg-gray-100 border-gray-300';

              return (
                <div key={`team_${team.id}_${index}`}>
                  {/* 헤더 카드 */}
                  <div className={`
                    flex justify-between items-center
                    px-4 py-3 mb-3 rounded-lg border-2
                    ${colorClasses}
                  `}>
                    <h3 className="text-lg font-bold text-gray-800">
                      {team.name} <span className="text-gray-600">({teamStudents.length}명)</span>
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTeam(team.id, team.name)}
                      className="text-red-500 hover:text-red-700 h-8 px-3"
                    >
                      삭제
                    </Button>
                  </div>

                  {/* 드롭존 */}
                  <TeamDropZone
                    id={team.id}
                    color={team.color}
                    students={teamStudents}
                    allStudents={allStudents}
                  />
                </div>
              );
            })}

            {/* 마지막 페이지에만 새 팀 추가 카드 */}
            {isLastPage && (
              <div>
                {/* 헤더 카드 */}
                <div className="px-4 py-3 mb-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-400 text-center">새 팀 추가</h3>
                </div>

                {/* 새 팀 추가 버튼 */}
                <button
                  onClick={() => setShowAddTeamModal(true)}
                  className="h-[600px] w-full rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-blue-500"
                >
                  <div className="text-5xl">➕</div>
                  <div className="text-lg font-medium">새 팀 추가</div>
                  <div className="text-sm">클릭하여 팀을 생성하세요</div>
                </button>
              </div>
            )}
          </div>

          <DragOverlay>
            {activeStudent ? (
              <div className="bg-white p-3 rounded shadow-lg border-2 border-blue-500">
                <p className="font-bold">{activeStudent.name}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* 팀 추가 모달 */}
        {showAddTeamModal && (
          <AddTeamModal
            onConfirm={handleAddTeam}
            onCancel={() => setShowAddTeamModal(false)}
          />
        )}

        {/* 랜덤 팀 편성 모달 */}
        {showRandomModal && (
          <RandomTeamModal
            totalStudents={allStudents.length}
            onConfirm={handleRandomTeamAssignment}
            onCancel={() => setShowRandomModal(false)}
          />
        )}

        {/* 다른 학급 학생 추가 모달 */}
        {showAddClassStudentsModal && (
          <AddClassStudentsModal
            currentClassId={classId}
            teacherClasses={teacherClasses}
            onConfirm={handleAddStudentsFromOtherClass}
            onCancel={() => setShowAddClassStudentsModal(false)}
          />
        )}
        </div>
      </main>
    </div>
  );
}
