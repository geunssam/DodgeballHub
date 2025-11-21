'use client';

import { Student } from '@/types';

interface ClassRankingData {
  studentId: string;
  name: string;
  gamesPlayed: number;
  outs: number;
  passes: number;
  sacrifices: number;
  cookies: number;
  totalPoints: number;
}

interface StudentClassRankingProps {
  currentStudentId: string;
  classStudents: Student[];
}

export function StudentClassRanking({ currentStudentId, classStudents }: StudentClassRankingProps) {
  // 반 랭킹 데이터 계산
  const rankingData: ClassRankingData[] = classStudents.map(student => ({
    studentId: student.id,
    name: student.name,
    gamesPlayed: student.stats.gamesPlayed,
    outs: student.stats.hits || 0,
    passes: student.stats.passes || 0,
    sacrifices: student.stats.sacrifices || 0,
    cookies: student.stats.cookies || 0,
    totalPoints: student.stats.totalScore || 0
  }));

  // 총점 기준 내림차순 정렬
  rankingData.sort((a, b) => b.totalPoints - a.totalPoints);

  if (rankingData.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="bg-gradient-to-r from-green-100 to-teal-100 px-4 py-2 rounded-lg inline-block mb-4">
          <h2 className="text-3xl font-bold text-black flex items-center gap-2">
            🏆 우리 반 랭킹
          </h2>
        </div>
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">👥</div>
          <p className="text-lg">아직 랭킹 데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="bg-gradient-to-r from-green-100 to-teal-100 px-4 py-2 rounded-lg inline-block mb-4">
        <h2 className="text-3xl font-bold text-black flex items-center gap-2">
          🏆 우리 반 랭킹
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left text-base">순위</th>
              <th className="p-3 text-left text-base">이름</th>
              <th className="p-3 text-center text-base">경기 수</th>
              <th className="p-3 text-center text-base">아웃</th>
              <th className="p-3 text-center text-base">패스</th>
              <th className="p-3 text-center text-base">양보</th>
              <th className="p-3 text-center text-base">쿠키</th>
              <th className="p-3 text-center text-base">총점</th>
            </tr>
          </thead>
          <tbody>
            {rankingData.map((player, index) => {
              const isMe = player.studentId === currentStudentId;
              return (
                <tr
                  key={player.studentId}
                  className={`border-t ${isMe ? 'bg-blue-50 font-bold' : 'hover:bg-gray-50'}`}
                >
                  <td className="p-3 text-base">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `${index + 1}위`}
                  </td>
                  <td className="p-3 text-base">
                    {player.name}
                    {isMe && ' (나)'}
                  </td>
                  <td className="p-3 text-center text-base">{player.gamesPlayed}</td>
                  <td className="p-3 text-center text-base">{player.outs}</td>
                  <td className="p-3 text-center text-base">{player.passes}</td>
                  <td className="p-3 text-center text-base">{player.sacrifices}</td>
                  <td className="p-3 text-center text-base">{player.cookies}</td>
                  <td className="p-3 text-center text-base">{player.totalPoints}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
