'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { getClassById, getTeams, getStudents, createGame, getClasses, getStudentsByClassIds } from '@/lib/dataService';
import { Class, Team, Student, OuterCourtRule, BallAddition, GameSettings } from '@/types';
import { ClassSelector } from '@/components/teacher/ClassSelector';

export default function GameSetupPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;

  const [classData, setClassData] = useState<Class | null>(null);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // 경기 설정
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [duration, setDuration] = useState(10); // 분
  const [initialLives, setInitialLives] = useState(3);
  const [useOuterCourt, setUseOuterCourt] = useState(true);
  const [outerCourtRules, setOuterCourtRules] = useState<OuterCourtRule[]>(['normal_catch_attack_right']);
  const [ballAdditions, setBallAdditions] = useState<BallAddition[]>([{ minutesBefore: 3 }]);

  useEffect(() => {
    loadData();
  }, [classId]);

  useEffect(() => {
    if (selectedClassIds.length > 0) {
      loadStudentsAndTeams();
    }
  }, [selectedClassIds]);

  const loadData = async () => {
    try {
      const classInfo = await getClassById(classId);
      if (!classInfo) {
        alert('학급을 찾을 수 없습니다.');
        router.push('/teacher/dashboard');
        return;
      }

      setClassData(classInfo);

      // 같은 선생님의 모든 학급 불러오기
      const classList = await getClasses(classInfo.teacherId);
      setAllClasses(classList);

      // 기본으로 현재 학급 선택
      setSelectedClassIds([classId]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsAndTeams = async () => {
    try {
      // 선택된 학급들의 학생과 팀 불러오기
      const studentList = await getStudentsByClassIds(selectedClassIds);
      setStudents(studentList);

      // 각 학급의 팀 불러오기
      const teamPromises = selectedClassIds.map(id => getTeams(id));
      const teamLists = await Promise.all(teamPromises);
      const allTeams = teamLists.flat();
      setTeams(allTeams);

      // 기본 팀 선택 초기화
      if (allTeams.length >= 2) {
        setSelectedTeamIds([allTeams[0].id, allTeams[1].id]);
      } else {
        setSelectedTeamIds([]);
      }
    } catch (error) {
      console.error('Failed to load students and teams:', error);
    }
  };

  const handleTeamSelect = (teamId: string, checked: boolean) => {
    if (checked) {
      if (selectedTeamIds.length < 2) {
        setSelectedTeamIds([...selectedTeamIds, teamId]);
      } else {
        alert('최대 2개 팀만 선택할 수 있습니다.');
      }
    } else {
      setSelectedTeamIds(selectedTeamIds.filter(id => id !== teamId));
    }
  };

  const handleRuleToggle = (rule: OuterCourtRule, checked: boolean) => {
    if (checked) {
      setOuterCourtRules([...outerCourtRules, rule]);
    } else {
      setOuterCourtRules(outerCourtRules.filter(r => r !== rule));
    }
  };

  const addBallAddition = () => {
    setBallAdditions([...ballAdditions, { minutesBefore: 1 }]);
  };

  const removeBallAddition = (index: number) => {
    setBallAdditions(ballAdditions.filter((_, i) => i !== index));
  };

  const updateBallAddition = (index: number, minutesBefore: number) => {
    const newAdditions = [...ballAdditions];
    newAdditions[index] = { minutesBefore };
    setBallAdditions(newAdditions);
  };

  const handleStartGame = async () => {
    // 유효성 검사
    if (selectedTeamIds.length !== 2) {
      alert('정확히 2개의 팀을 선택해주세요.');
      return;
    }

    if (duration < 1 || duration > 60) {
      alert('경기 시간은 1~60분 사이로 설정해주세요.');
      return;
    }

    try {
      // 선택된 팀의 멤버 가져오기
      const selectedTeams = teams.filter(t => selectedTeamIds.includes(t.id));

      // Game 객체 생성
      const settings: GameSettings = {
        useOuterCourt,
        outerCourtRules,
        ballAdditions
      };

      const gameTeams = selectedTeams.map(team => ({
        teamId: team.id,
        name: team.name,
        color: team.color,
        members: (team.members || []).map(member => ({
          studentId: member.studentId,
          initialLives,
          currentLives: initialLives,
          isInOuterCourt: false,
          position: 'infield' as const
        }))
      }));

      const gameRecords = selectedTeams.flatMap(team =>
        (team.members || []).map(member => ({
          studentId: member.studentId,
          outs: 0,
          passes: 0,
          sacrifices: 0,
          cookies: 0
        }))
      );

      const newGame = await createGame({
        teacherId: classData!.teacherId,
        classIds: selectedClassIds,
        hostClassId: classId,
        date: new Date().toISOString(),
        duration: duration * 60, // 초 단위로 변환
        settings,
        currentBalls: 1,
        currentTime: duration * 60, // 초기 시간 설정
        teams: gameTeams,
        records: gameRecords,
        isCompleted: false,
        isPaused: false // 타이머 자동 시작
      });

      // 경기 진행 페이지로 이동
      router.push(`/teacher/class/${classId}/game/play?gameId=${newGame.id}`);
    } catch (error) {
      console.error('Failed to create game:', error);
      alert('경기 생성에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (teams.length < 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md text-center">
          <p className="text-gray-600 mb-4">최소 2개의 팀이 필요합니다.</p>
          <Link href={`/teacher/class/${classId}/teams`}>
            <Button>팀 편성하러 가기</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">경기 설정</h1>
            <p className="text-gray-600">{classData?.name}</p>
          </div>
          <Link href="/teacher/dashboard">
            <Button variant="outline">대시보드로</Button>
          </Link>
        </div>

        <div className="space-y-6">
          {/* 참여 학급 선택 */}
          <ClassSelector
            availableClasses={allClasses}
            selectedClassIds={selectedClassIds}
            onSelectionChange={setSelectedClassIds}
          />

          {/* 팀 선택 */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">팀 선택 (2개)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team, index) => (
                <div
                  key={`setup_${team.classId || 'temp'}_${team.id}_${index}`}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedTeamIds.includes(team.id)
                      ? `border-${team.color}-500 bg-${team.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTeamSelect(team.id, !selectedTeamIds.includes(team.id))}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedTeamIds.includes(team.id)}
                      onCheckedChange={(checked) => handleTeamSelect(team.id, checked as boolean)}
                    />
                    <div>
                      <p className="font-bold">{team.name}</p>
                      <p className="text-sm text-gray-600">
                        {team.members?.length || 0}명
                        {team.classId && allClasses.find(c => c.id === team.classId) && (
                          <span className="ml-2 text-xs">
                            ({allClasses.find(c => c.id === team.classId)?.name})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 기본 설정 */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">기본 설정</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">경기 시간 (분)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={60}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="initialLives">초기 하트 개수</Label>
                <Input
                  id="initialLives"
                  type="number"
                  min={1}
                  max={10}
                  value={initialLives}
                  onChange={(e) => setInitialLives(parseInt(e.target.value))}
                />
              </div>
            </div>
          </Card>

          {/* 공 추가 설정 */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">공 추가 타이밍</h2>
            <div className="space-y-3">
              {ballAdditions.map((addition, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <Label className="w-24">종료</Label>
                  <Input
                    type="number"
                    min={0}
                    max={duration}
                    value={addition.minutesBefore}
                    onChange={(e) => updateBallAddition(index, parseInt(e.target.value))}
                    className="w-20"
                  />
                  <span>분 전</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeBallAddition(index)}
                    disabled={ballAdditions.length === 1}
                  >
                    삭제
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addBallAddition}>
                + 타이밍 추가
              </Button>
            </div>
          </Card>

          {/* 외야 규칙 */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Checkbox
                checked={useOuterCourt}
                onCheckedChange={(checked) => setUseOuterCourt(checked as boolean)}
              />
              <h2 className="text-xl font-bold">외야 사용</h2>
            </div>

            {useOuterCourt && (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={outerCourtRules.includes('normal_catch_attack_right')}
                    onCheckedChange={(checked) =>
                      handleRuleToggle('normal_catch_attack_right', checked as boolean)
                    }
                  />
                  <div>
                    <p className="font-medium">일반 옵션</p>
                    <p className="text-sm text-gray-600">던진 공 잡으면 공격권만 소유</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={outerCourtRules.includes('catch_revive_teammate')}
                    onCheckedChange={(checked) =>
                      handleRuleToggle('catch_revive_teammate', checked as boolean)
                    }
                  />
                  <div>
                    <p className="font-medium">공 잡으면 팀원 부활</p>
                    <p className="text-sm text-gray-600">외야에서 공을 잡으면 내야 팀원 1명 부활</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={outerCourtRules.includes('catch_self_life')}
                    onCheckedChange={(checked) =>
                      handleRuleToggle('catch_self_life', checked as boolean)
                    }
                  />
                  <div>
                    <p className="font-medium">공 잡으면 본인 하트 +1</p>
                    <p className="text-sm text-gray-600">외야에서 공을 잡으면 자신의 하트 증가</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={outerCourtRules.includes('outer_hit_revive_self')}
                    onCheckedChange={(checked) =>
                      handleRuleToggle('outer_hit_revive_self', checked as boolean)
                    }
                  />
                  <div>
                    <p className="font-medium">외야에서 아웃시키면 본인 부활</p>
                    <p className="text-sm text-gray-600">외야에서 상대를 아웃시키면 내야로 복귀</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={outerCourtRules.includes('outer_hit_revive_teammate')}
                    onCheckedChange={(checked) =>
                      handleRuleToggle('outer_hit_revive_teammate', checked as boolean)
                    }
                  />
                  <div>
                    <p className="font-medium">외야에서 아웃시키면 팀원 부활</p>
                    <p className="text-sm text-gray-600">외야에서 상대를 아웃시키면 팀원 1명 부활</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* 경기 시작 버튼 */}
          <Button
            onClick={handleStartGame}
            size="lg"
            className="w-full h-14 text-lg"
            disabled={selectedTeamIds.length !== 2}
          >
            🏐 경기 시작
          </Button>
        </div>
      </div>
    </main>
  );
}
