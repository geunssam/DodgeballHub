'use client';

import { GameTeam, Student, GameRecord } from '@/types';
import { PlayerBadgeDisplay } from '@/components/badge/PlayerBadgeDisplay';

interface TeamLineupTableProps {
  team: GameTeam;
  students: Student[];
  gameRecords: GameRecord[];
  onStatUpdate: (studentId: string, stat: 'hits' | 'passes' | 'sacrifices' | 'cookies', delta: number) => void;
  onLifeUpdate: (studentId: string, delta: number) => void;
}

export function TeamLineupTable({ team, students, gameRecords, onStatUpdate, onLifeUpdate }: TeamLineupTableProps) {
  const getStudentById = (id: string) => students.find(s => s.id === id);
  const getRecordByStudentId = (id: string) => gameRecords.find(r => r.studentId === id);

  // baseball-firebase 스타일: [-] [숫자] 2버튼 구조 (숫자 클릭 시 +1)
  const StatButton = ({
    studentId,
    stat,
    value,
    bgColor,
    hoverColor,
    textColor
  }: {
    studentId: string;
    stat: 'hits' | 'passes' | 'sacrifices' | 'cookies';
    value: number;
    bgColor: string;
    hoverColor: string;
    textColor: string;
  }) => (
    <div className="flex items-center justify-center gap-0.5">
      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log('🔴 Minus button clicked:', studentId, stat, value);
          onStatUpdate(studentId, stat, -1);
        }}
        disabled={value === 0}
        className={`h-6 text-xs px-1.5 rounded-l font-bold ${
          value === 0
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-red-100 hover:bg-red-200 text-red-600'
        }`}
      >
        -
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log('🟢 Plus button clicked:', studentId, stat, value);
          onStatUpdate(studentId, stat, 1);
        }}
        className={`h-6 text-xs px-2 rounded-r font-bold min-w-[40px] ${bgColor} ${hoverColor} ${textColor}`}
      >
        <span className="font-extrabold text-sm">{value}</span>
      </button>
    </div>
  );

  // 하트(목숨) 버튼 - 2버튼 구조 ([-] [숫자 클릭 시 +1])
  const LifeButton = ({
    studentId,
    value,
    maxValue = 3
  }: {
    studentId: string;
    value: number;
    maxValue?: number;
  }) => (
    <div className="flex items-center justify-center gap-0.5">
      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log('❤️ Life minus clicked:', studentId, value);
          onLifeUpdate(studentId, -1);
        }}
        disabled={value === 0}
        className={`h-6 text-xs px-1.5 rounded-l font-bold ${
          value === 0
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-red-100 hover:bg-red-200 text-red-600'
        }`}
      >
        -
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log('💚 Life plus clicked:', studentId, value);
          onLifeUpdate(studentId, 1);
        }}
        className={`h-6 text-xs px-2 rounded-r font-bold min-w-[40px] bg-red-100 hover:bg-red-200 text-red-600`}
      >
        <span className="font-extrabold text-sm">{value}</span>
      </button>
    </div>
  );

  const aliveCount = team.members.filter(m => m.currentLives > 0).length;
  const totalLives = team.members.reduce((sum, m) => sum + m.currentLives, 0);

  // Baseball 스타일: 카드 전체 배경 (반투명)
  const getTeamCardBackgroundClass = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-50/30 border-red-100';
      case 'blue': return 'bg-blue-50/30 border-blue-100';
      case 'green': return 'bg-green-50/30 border-green-100';
      case 'yellow': return 'bg-yellow-50/30 border-yellow-100';
      case 'purple': return 'bg-purple-50/30 border-purple-100';
      case 'orange': return 'bg-orange-50/30 border-orange-100';
      case 'pink': return 'bg-pink-50/30 border-pink-100';
      case 'teal': return 'bg-teal-50/30 border-teal-100';
      case 'indigo': return 'bg-indigo-50/30 border-indigo-100';
      case 'cyan': return 'bg-cyan-50/30 border-cyan-100';
      default: return 'bg-gray-50/30 border-gray-100';
    }
  };

  // 피구 코트와 동일한 배경색 함수 (배경 + 테두리 통합)
  const getTeamHeaderClass = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-100 border-red-500';
      case 'blue': return 'bg-blue-100 border-blue-500';
      case 'green': return 'bg-green-100 border-green-500';
      case 'yellow': return 'bg-yellow-100 border-yellow-500';
      case 'purple': return 'bg-purple-100 border-purple-500';
      case 'orange': return 'bg-orange-100 border-orange-500';
      case 'pink': return 'bg-pink-100 border-pink-500';
      case 'teal': return 'bg-teal-100 border-teal-500';
      case 'indigo': return 'bg-indigo-100 border-indigo-500';
      case 'cyan': return 'bg-cyan-100 border-cyan-100';
      default: return 'bg-gray-100 border-gray-500';
    }
  };

  // 팀명 파스텔톤 배경색
  const getTeamNameBgClass = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-100';
      case 'blue': return 'bg-blue-100';
      case 'green': return 'bg-green-100';
      case 'yellow': return 'bg-yellow-100';
      case 'purple': return 'bg-purple-100';
      case 'orange': return 'bg-orange-100';
      case 'pink': return 'bg-pink-100';
      case 'teal': return 'bg-teal-100';
      case 'indigo': return 'bg-indigo-100';
      case 'cyan': return 'bg-cyan-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className={`${getTeamCardBackgroundClass(team.color)} rounded-lg shadow-lg border-2 flex flex-col h-[450px]`}>
      {/* 팀 정보 헤더 - Baseball 스타일 반투명 */}
      <div className="bg-white/80 px-4 py-4 flex-shrink-0 flex items-center justify-between rounded-t-lg border-b-2 border-gray-200">
        <h3 className={`font-bold text-2xl text-black flex-1 text-center ${getTeamNameBgClass(team.color)} px-6 py-2 rounded-lg`}>{team.name}</h3>
        <div className="flex items-center gap-3 ml-4">
          <span className="text-xl font-bold text-black">팀원: {aliveCount}</span>
          <div className="flex items-center gap-1">
            <span className="text-xl">❤️</span>
            <span className="text-xl font-bold text-black">×{totalLives}</span>
          </div>
        </div>
      </div>

      {/* 단일 테이블 - Baseball 스타일 */}
      <div className="overflow-y-auto overflow-x-auto flex-1 min-h-0">
        <table className="w-full h-full">
          <colgroup>
            <col style={{ width: '75px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '70px' }} />
            <col style={{ width: '140px' }} />
            <col style={{ width: '130px' }} />
            <col style={{ width: '130px' }} />
            <col style={{ width: '130px' }} />
            <col style={{ width: '130px' }} />
          </colgroup>
          <thead className="sticky top-0 bg-gray-100 z-10 shadow-sm">
            <tr>
              <th className="py-2 text-center text-black font-bold text-xl whitespace-nowrap">번호</th>
              <th className="py-2 text-center text-black font-bold text-xl whitespace-nowrap">이름</th>
              <th className="py-2 text-center text-black font-bold text-xl whitespace-nowrap"></th>
              <th className="py-2 text-center text-black font-bold text-xl whitespace-nowrap">하트 ❤️</th>
              <th className="py-2 text-center text-black font-bold text-xl whitespace-nowrap">히트 🔥</th>
              <th className="py-2 text-center text-black font-bold text-xl whitespace-nowrap">패스 🤝</th>
              <th className="py-2 text-center text-black font-bold text-xl whitespace-nowrap">양보 👼</th>
              <th className="py-2 text-center text-black font-bold text-xl whitespace-nowrap">쿠키 🍪</th>
            </tr>
          </thead>
          <tbody className="h-full">
            {team.members.map(member => {
              const student = getStudentById(member.studentId);
              const record = getRecordByStudentId(member.studentId);
              if (!student || !record) return null;

              return (
                <tr key={member.studentId} className="border-b hover:bg-gray-50" style={{ height: `${100 / team.members.length}%` }}>
                  <td className="text-center text-lg font-bold align-middle whitespace-nowrap">{student.number}</td>
                  <td className="text-center text-lg font-bold align-middle whitespace-nowrap">{student.name}</td>
                  <td className="text-center align-middle whitespace-nowrap">
                    <PlayerBadgeDisplay
                      badges={student.badges}
                      size="sm"
                      maxDisplay={3}
                      direction="horizontal"
                    />
                  </td>
                  <td className="text-center align-middle">
                    <LifeButton
                      studentId={member.studentId}
                      value={member.currentLives}
                      maxValue={99}
                    />
                  </td>
                  <td className="text-center align-middle">
                    <StatButton
                      studentId={member.studentId}
                      stat="hits"
                      value={record.hits}
                      bgColor="bg-green-100"
                      hoverColor="hover:bg-green-200"
                      textColor="text-green-800"
                    />
                  </td>
                  <td className="text-center align-middle">
                    <StatButton
                      studentId={member.studentId}
                      stat="passes"
                      value={record.passes}
                      bgColor="bg-blue-100"
                      hoverColor="hover:bg-blue-200"
                      textColor="text-blue-700"
                    />
                  </td>
                  <td className="text-center align-middle">
                    <StatButton
                      studentId={member.studentId}
                      stat="sacrifices"
                      value={record.sacrifices}
                      bgColor="bg-purple-100"
                      hoverColor="hover:bg-purple-200"
                      textColor="text-purple-700"
                    />
                  </td>
                  <td className="text-center align-middle">
                    <StatButton
                      studentId={member.studentId}
                      stat="cookies"
                      value={record.cookies}
                      bgColor="bg-yellow-100"
                      hoverColor="hover:bg-yellow-200"
                      textColor="text-yellow-800"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
