'use client';

import { GameTeam, Student, GameRecord } from '@/types';

interface TeamLineupTableProps {
  team: GameTeam;
  students: Student[];
  gameRecords: GameRecord[];
  onStatUpdate: (studentId: string, stat: 'outs' | 'passes' | 'sacrifices' | 'cookies', delta: number) => void;
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
    stat: 'outs' | 'passes' | 'sacrifices' | 'cookies';
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
        className={`h-8 text-sm px-2 rounded-l font-bold ${
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
        className={`h-8 text-sm px-2 rounded-r font-bold min-w-[40px] ${bgColor} ${hoverColor} ${textColor}`}
      >
        <span className="font-extrabold text-sm">{value}</span>
      </button>
    </div>
  );

  // 하트(목숨) 버튼 - 빨간색 스타일 (3버튼: [-] [숫자] [+])
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
        className={`h-8 text-sm px-2 rounded-l font-bold ${
          value === 0
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-red-100 hover:bg-red-200 text-red-600'
        }`}
      >
        -
      </button>
      <div className="h-8 text-sm px-2.5 bg-red-50 border-y border-red-200 flex items-center justify-center min-w-[35px]">
        <span className="font-extrabold text-sm text-red-800">{value}</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log('💚 Life plus clicked:', studentId, value);
          onLifeUpdate(studentId, 1);
        }}
        disabled={value >= maxValue}
        className={`h-8 text-sm px-2 rounded-r font-bold ${
          value >= maxValue
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-red-100 hover:bg-red-200 text-red-600'
        }`}
      >
        +
      </button>
    </div>
  );

  const aliveCount = team.members.filter(m => m.currentLives > 0).length;
  const totalLives = team.members.reduce((sum, m) => sum + m.currentLives, 0);

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
      case 'cyan': return 'bg-cyan-100 border-cyan-500';
      default: return 'bg-gray-100 border-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-full">
      {/* 팀 정보 헤더 */}
      <div className={`${getTeamHeaderClass(team.color)} px-3 py-2 flex-shrink-0 flex items-center justify-between border-2`}>
        <h3 className="font-bold text-xl text-black flex-1 text-center">{team.name}</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-black">팀원 수: {aliveCount}</span>
          <div className="flex items-center gap-1">
            <span className="text-base">❤️</span>
            <span className="text-base font-bold text-black">×{totalLives}</span>
          </div>
        </div>
      </div>

      {/* 테이블 헤더 - 고정 */}
      <div className="overflow-x-auto flex-shrink-0">
        <table className="w-full">
          <colgroup>
            <col style={{ width: '55px' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '60px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '105px' }} />
            <col style={{ width: '105px' }} />
            <col style={{ width: '105px' }} />
            <col style={{ width: '105px' }} />
          </colgroup>
          <thead className="bg-gray-100">
            <tr>
              <th className="p-5 text-center text-black font-bold text-base">번호</th>
              <th className="p-5 text-center text-black font-bold text-base">이름</th>
              <th className="p-5 text-center text-black font-bold text-base">배지</th>
              <th className="p-5 text-center text-black font-bold text-base">하트</th>
              <th className="p-5 text-center text-black font-bold text-base">아웃 🔥</th>
              <th className="p-5 text-center text-black font-bold text-base">패스 🤝</th>
              <th className="p-5 text-center text-black font-bold text-base">양보 👼</th>
              <th className="p-5 text-center text-black font-bold text-base">쿠키 🍪</th>
            </tr>
          </thead>
        </table>
      </div>

      {/* 본문 - 스크롤 가능 */}
      <div className="overflow-y-auto overflow-x-auto flex-1">
        <table className="w-full h-full">
          <colgroup>
            <col style={{ width: '55px' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '60px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '105px' }} />
            <col style={{ width: '105px' }} />
            <col style={{ width: '105px' }} />
            <col style={{ width: '105px' }} />
          </colgroup>
          <tbody>
            {team.members.map(member => {
              const student = getStudentById(member.studentId);
              const record = getRecordByStudentId(member.studentId);
              if (!student || !record) return null;

              return (
                <tr key={member.studentId} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-1.5 text-center text-sm font-bold align-middle">{student.number}</td>
                  <td className="py-2 px-1.5 text-center text-sm font-bold align-middle">{student.name}</td>
                  <td className="py-2 px-1.5 text-center text-xl align-middle">
                    {student.badges[0]?.emoji || '-'}
                  </td>
                  <td className="py-2 text-center align-middle">
                    <LifeButton
                      studentId={member.studentId}
                      value={member.currentLives}
                      maxValue={10}
                    />
                  </td>
                  <td className="py-2 text-center align-middle">
                    <StatButton
                      studentId={member.studentId}
                      stat="outs"
                      value={record.outs}
                      bgColor="bg-green-100"
                      hoverColor="hover:bg-green-200"
                      textColor="text-green-800"
                    />
                  </td>
                  <td className="py-2 text-center align-middle">
                    <StatButton
                      studentId={member.studentId}
                      stat="passes"
                      value={record.passes}
                      bgColor="bg-blue-100"
                      hoverColor="hover:bg-blue-200"
                      textColor="text-blue-700"
                    />
                  </td>
                  <td className="py-2 text-center align-middle">
                    <StatButton
                      studentId={member.studentId}
                      stat="sacrifices"
                      value={record.sacrifices}
                      bgColor="bg-purple-100"
                      hoverColor="hover:bg-purple-200"
                      textColor="text-purple-700"
                    />
                  </td>
                  <td className="py-2 text-center align-middle">
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
