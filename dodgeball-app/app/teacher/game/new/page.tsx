'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { TeamDetailModal } from '@/components/TeamDetailModal';
import { getClasses, getTeams, createGame, getStudentsByClassIds } from '@/lib/dataService';
import { STORAGE_KEYS } from '@/lib/mockData';
import { Class, Team, Student, OuterCourtRule, BallAddition, GameSettings } from '@/types';

export default function NewGamePage() {
  const router = useRouter();
  const [teacherId, setTeacherId] = useState<string>('');
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // 경기 설정
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [duration, setDuration] = useState(7); // 분
  const [initialLives, setInitialLives] = useState(1);
  const [useOuterCourt, setUseOuterCourt] = useState(true);
  const [selectedOuterCourtRule, setSelectedOuterCourtRule] = useState<OuterCourtRule>('normal_catch_attack_right');
  const [ballAdditions, setBallAdditions] = useState<BallAddition[]>([{ minutesBefore: 3 }]);

  // 팀 상세 모달
  const [selectedTeamForDetail, setSelectedTeamForDetail] = useState<Team | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 로그인 체크
      const currentTeacherId = localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER);
      if (!currentTeacherId) {
        router.push('/teacher/login');
        return;
      }
      setTeacherId(currentTeacherId);

      // 모든 학급과 팀 불러오기
      const classList = await getClasses(currentTeacherId);
      setAllClasses(classList);

      // 교사의 모든 팀 불러오기 (Phase 1: teacherId 기반)
      const teams = await getTeams(currentTeacherId);
      setAllTeams(teams);

      // 사용자가 직접 팀을 선택하도록 초기 상태는 빈 배열로 유지
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
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
      // 선택된 팀 가져오기
      const selectedTeams = allTeams.filter(t => selectedTeamIds.includes(t.id));

      // 참여 학급 ID 추출 (Phase 1: sourceClassIds 사용)
      const participatingClassIds = [...new Set(selectedTeams.flatMap(t => t.sourceClassIds || []))];

      // 호스트 학급 (첫 번째 팀의 원천 학급)
      const hostClassId = selectedTeams[0].sourceClassIds?.[0] || participatingClassIds[0];

      // Game 객체 생성
      const settings: GameSettings = {
        useOuterCourt,
        outerCourtRules: useOuterCourt ? [selectedOuterCourtRule] : [],
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
          position: 'inner' as const
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
        teacherId,
        classIds: participatingClassIds,
        hostClassId,
        date: new Date().toISOString(),
        duration, // 분 단위로 저장 (ScoreBoard에서 * 60으로 초 단위 변환)
        settings,
        currentBalls: 1,
        teams: gameTeams,
        records: gameRecords,
        isCompleted: false,
        currentTime: duration * 60 // 초기 시간을 초 단위로 저장
      });

      // 경기 진행 페이지로 이동
      router.push(`/teacher/class/${hostClassId}/game/play?gameId=${newGame.id}`);
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

  if (allTeams.length < 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md text-center">
          <p className="text-gray-600 mb-4">
            최소 2개의 팀이 필요합니다.<br />
            학급을 생성하고 팀을 편성해주세요.
          </p>
          <Link href="/teacher/dashboard">
            <Button>대시보드로 가기</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">🏐 새 경기 시작</h1>
            <p className="text-sm text-gray-600">모든 학급의 팀 중에서 선택하세요</p>
          </div>
          <Link href="/teacher/dashboard">
            <Button variant="outline" size="sm">대시보드로</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 왼쪽 컬럼: 팀 선택 + 기본 설정 */}
          <div className="space-y-4">
            {/* 팀 선택 */}
            <Card className="p-3 h-[260px] flex flex-col">
              <h2 className="text-lg font-bold mb-2 flex-shrink-0">팀 선택 (2개)</h2>
              <div className={`
                grid gap-2.5 overflow-y-auto flex-1
                ${allTeams.length <= 2
                  ? 'grid-cols-2 place-content-center'
                  : 'grid-cols-2 content-start'
                }
              `}>
              {allTeams.map((team) => {
                // Phase 1: sourceClassIds에서 학급명 가져오기
                const teamClassNames = team.sourceClassIds
                  ?.map(classId => allClasses.find(c => c.id === classId)?.name)
                  .filter(Boolean)
                  .join(', ') || '';
                const isSelected = selectedTeamIds.includes(team.id);

                return (
                  <div
                    key={team.id}
                    className={`p-2.5 border-2 rounded-lg transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleTeamSelect(team.id, checked as boolean)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                team.color === 'red' ? '#ef4444' :
                                team.color === 'blue' ? '#3b82f6' :
                                team.color === 'green' ? '#22c55e' :
                                team.color === 'yellow' ? '#eab308' :
                                team.color === 'purple' ? '#a855f7' :
                                team.color === 'orange' ? '#f97316' :
                                '#6b7280'
                            }}
                          />
                          <p className="font-bold text-sm truncate">{team.name}</p>
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {teamClassNames && `${teamClassNames} • `}
                          {team.members?.length || 0}명
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTeamForDetail(team);
                        }}
                        className="flex-shrink-0 text-blue-600 hover:text-blue-700 text-xs font-medium px-1"
                      >
                        상세
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            </Card>

            {/* 기본 설정 + 공 추가 타이밍 (2컬럼) */}
            <div className="grid grid-cols-2 gap-4 h-[144px]">
              {/* 기본 설정 */}
              <Card className="p-3 h-[144px] flex flex-col overflow-hidden">
                <h2 className="text-lg font-bold mb-2 flex-shrink-0 text-center">기본 설정</h2>
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="flex flex-col items-center">
                    <Label htmlFor="duration" className="text-xs mb-1 block text-center">경기 시간 (분)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min={1}
                      max={60}
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      className="h-8 w-16 text-center"
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <Label htmlFor="initialLives" className="text-xs mb-1 block text-center">초기 하트</Label>
                    <Input
                      id="initialLives"
                      type="number"
                      min={1}
                      max={10}
                      value={initialLives}
                      onChange={(e) => setInitialLives(parseInt(e.target.value))}
                      className="h-8 w-16 text-center"
                    />
                  </div>
                </div>
              </Card>

              {/* 공 추가 설정 */}
              <Card className="p-3 h-[144px] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-1.5 flex-shrink-0">
                  <h2 className="text-lg font-bold">공 추가 타이밍</h2>
                  <Button variant="outline" size="sm" onClick={addBallAddition} className="h-7 text-xs px-2">
                    + 타이밍 추가
                  </Button>
                </div>
                <div className="space-y-1 flex-1 overflow-y-auto">
                  {ballAdditions.map((addition, index) => (
                    <div key={index} className="flex gap-1 items-center">
                      <Label className="w-10 text-xs">종료</Label>
                      <Input
                        type="number"
                        min={0}
                        max={duration}
                        value={addition.minutesBefore}
                        onChange={(e) => updateBallAddition(index, parseInt(e.target.value))}
                        className="w-20 h-7 text-sm text-center"
                      />
                      <span className="text-xs">분 전</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeBallAddition(index)}
                        className="h-7 text-xs px-2 ml-auto"
                      >
                        삭제
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* 오른쪽 컬럼: 외야 규칙 */}
          <div>
            <Card className="p-3 h-[420px] flex flex-col">
              <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                <Checkbox
                  checked={useOuterCourt}
                  onCheckedChange={(checked) => setUseOuterCourt(checked as boolean)}
                />
                <h2 className="text-lg font-bold">외야 사용</h2>
              </div>

              {useOuterCourt && (
                <div className="space-y-2 flex-1 overflow-y-auto">
                  <label className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="radio"
                      name="outerCourtRule"
                      value="normal_catch_attack_right"
                      checked={selectedOuterCourtRule === 'normal_catch_attack_right'}
                      onChange={(e) => setSelectedOuterCourtRule(e.target.value as OuterCourtRule)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-medium text-sm">일반 옵션</p>
                      <p className="text-xs text-gray-600">던진 공 잡으면 공격권만 소유</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="radio"
                      name="outerCourtRule"
                      value="catch_revive_teammate"
                      checked={selectedOuterCourtRule === 'catch_revive_teammate'}
                      onChange={(e) => setSelectedOuterCourtRule(e.target.value as OuterCourtRule)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-medium text-sm">공 잡으면 팀원 부활</p>
                      <p className="text-xs text-gray-600">외야에서 공을 잡으면 내야 팀원 1명 부활</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="radio"
                      name="outerCourtRule"
                      value="catch_self_life"
                      checked={selectedOuterCourtRule === 'catch_self_life'}
                      onChange={(e) => setSelectedOuterCourtRule(e.target.value as OuterCourtRule)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-medium text-sm">공 잡으면 본인 하트 +1</p>
                      <p className="text-xs text-gray-600">외야에서 공을 잡으면 자신의 하트 증가</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="radio"
                      name="outerCourtRule"
                      value="outer_hit_revive_self"
                      checked={selectedOuterCourtRule === 'outer_hit_revive_self'}
                      onChange={(e) => setSelectedOuterCourtRule(e.target.value as OuterCourtRule)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-medium text-sm">외야에서 아웃시키면 본인 부활</p>
                      <p className="text-xs text-gray-600">외야에서 상대를 아웃시키면 내야로 복귀</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="radio"
                      name="outerCourtRule"
                      value="outer_hit_revive_teammate"
                      checked={selectedOuterCourtRule === 'outer_hit_revive_teammate'}
                      onChange={(e) => setSelectedOuterCourtRule(e.target.value as OuterCourtRule)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-medium text-sm">외야에서 아웃시키면 팀원 부활</p>
                      <p className="text-xs text-gray-600">외야에서 상대를 아웃시키면 팀원 1명 부활</p>
                    </div>
                  </label>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* 경기 시작 버튼 */}
        <Button
          onClick={handleStartGame}
          size="lg"
          className="w-full h-12 text-base bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 mt-6"
          disabled={selectedTeamIds.length !== 2}
        >
          🏐 경기 시작
        </Button>
      </div>

      {/* 팀 상세 모달 */}
      <TeamDetailModal
        team={selectedTeamForDetail}
        teamClass={selectedTeamForDetail?.sourceClassIds?.[0]
          ? allClasses.find(c => c.id === selectedTeamForDetail.sourceClassIds![0])
          : undefined}
        onClose={() => setSelectedTeamForDetail(null)}
      />
    </main>
  );
}
