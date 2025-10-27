'use client';

import { GameTeam, Student } from '@/types';

interface DodgeballCourtProps {
  teams: GameTeam[];
  students: Student[];
  onStudentClick: (studentId: string) => void;
}

export function DodgeballCourt({ teams, students, onStudentClick }: DodgeballCourtProps) {
  const getStudentById = (id: string) => students.find(s => s.id === id);

  // 2개 팀 가정
  const teamA = teams[0];
  const teamB = teams[1];

  if (!teamA || !teamB) {
    return <div className="text-center p-8">팀 데이터를 불러오는 중...</div>;
  }

  const renderPlayerCard = (member: any, team: GameTeam) => {
    const student = getStudentById(member.studentId);
    if (!student) return null;

    const isAlive = member.currentLives > 0;
    const bgColor = isAlive ? 'bg-white' : 'bg-gray-100';

    // 팀 색상에 따른 테두리 색상 (하드코딩)
    const borderColor =
      team.color === 'red' ? 'border-red-500' :
      team.color === 'blue' ? 'border-blue-500' :
      team.color === 'green' ? 'border-green-500' :
      team.color === 'yellow' ? 'border-yellow-500' :
      team.color === 'purple' ? 'border-purple-500' :
      team.color === 'orange' ? 'border-orange-500' :
      'border-gray-500';

    return (
      <div
        key={member.studentId}
        onClick={() => onStudentClick(member.studentId)}
        className={`inline-flex items-center gap-0.5 px-1 py-1 ${bgColor} rounded cursor-pointer hover:shadow-sm transition-all border ${borderColor} max-w-fit`}
      >
        <span className="text-xs leading-none">{isAlive ? '👤' : '💀'}</span>
        <span className="text-[10px] font-bold leading-none whitespace-nowrap">{student.name}</span>
        {member.currentLives > 0 && (
          <span className="text-[10px] leading-none whitespace-nowrap">❤️×{member.currentLives}</span>
        )}
      </div>
    );
  };

  const teamAInner = teamA.members.filter(m => m.position === 'inner');
  const teamAOuter = teamA.members.filter(m => m.position === 'outer');
  const teamBInner = teamB.members.filter(m => m.position === 'inner');
  const teamBOuter = teamB.members.filter(m => m.position === 'outer');

  // 팀 색상에 따른 클래스 (하드코딩)
  const getTeamBorderClass = (color: string) => {
    switch (color) {
      case 'red': return 'border-red-500';
      case 'blue': return 'border-blue-500';
      case 'green': return 'border-green-500';
      case 'yellow': return 'border-yellow-500';
      case 'purple': return 'border-purple-500';
      case 'orange': return 'border-orange-500';
      default: return 'border-gray-500';
    }
  };

  const getTeamBgLightClass = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-50';
      case 'blue': return 'bg-blue-50';
      case 'green': return 'bg-green-50';
      case 'yellow': return 'bg-yellow-50';
      case 'purple': return 'bg-purple-50';
      case 'orange': return 'bg-orange-50';
      default: return 'bg-gray-50';
    }
  };

  const getTeamBgClass = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-100';
      case 'blue': return 'bg-blue-100';
      case 'green': return 'bg-green-100';
      case 'yellow': return 'bg-yellow-100';
      case 'purple': return 'bg-purple-100';
      case 'orange': return 'bg-orange-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto h-full">
      {/* 가로 레이아웃: B팀 외야 | A팀 내야 | 중앙선 | B팀 내야 | A팀 외야 */}
      <div className="grid grid-cols-[0.8fr_3fr_3px_3fr_0.8fr] gap-1 h-full">

        {/* B팀 외야 (왼쪽 끝) */}
        <div className={`px-1 py-1 rounded-l-lg border overflow-y-auto ${getTeamBorderClass(teamB.color)} ${getTeamBgLightClass(teamB.color)}`}>
          <h3 className="text-[9px] font-bold mb-1 text-center leading-tight">
            {teamB.name}<br/>외야
          </h3>
          <div className="flex flex-col gap-1">
            {teamBOuter.map(member => renderPlayerCard(member, teamB))}
          </div>
        </div>

        {/* A팀 내야 */}
        <div className={`px-1 py-1 border border-r-0 overflow-y-auto ${getTeamBorderClass(teamA.color)} ${getTeamBgClass(teamA.color)}`}>
          <h3 className="text-[10px] font-bold mb-1 text-center leading-tight">{teamA.name} 내야</h3>
          <div className="grid grid-cols-2 gap-1">
            {teamAInner.map(member => renderPlayerCard(member, teamA))}
          </div>
        </div>

        {/* 중앙선 */}
        <div className="bg-gray-800 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-[9px] font-bold whitespace-nowrap bg-gray-900/80 px-1 py-0.5 rounded leading-tight">
            중앙선
          </div>
        </div>

        {/* B팀 내야 */}
        <div className={`px-1 py-1 border border-l-0 overflow-y-auto ${getTeamBorderClass(teamB.color)} ${getTeamBgClass(teamB.color)}`}>
          <h3 className="text-[10px] font-bold mb-1 text-center leading-tight">{teamB.name} 내야</h3>
          <div className="grid grid-cols-2 gap-1">
            {teamBInner.map(member => renderPlayerCard(member, teamB))}
          </div>
        </div>

        {/* A팀 외야 (오른쪽 끝) */}
        <div className={`px-1 py-1 rounded-r-lg border overflow-y-auto ${getTeamBorderClass(teamA.color)} ${getTeamBgLightClass(teamA.color)}`}>
          <h3 className="text-[9px] font-bold mb-1 text-center leading-tight">
            {teamA.name}<br/>외야
          </h3>
          <div className="flex flex-col gap-1">
            {teamAOuter.map(member => renderPlayerCard(member, teamA))}
          </div>
        </div>

      </div>
    </div>
  );
}
