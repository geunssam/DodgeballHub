import { Student } from '@/types';
import { Card } from '@/components/ui/card';

interface StudentDashboardProps {
  student: Student;
}

export function StudentDashboard({ student }: StudentDashboardProps) {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* 내 정보 */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">내 정보</h2>
        <div className="space-y-2">
          <p className="text-lg">
            <span className="text-gray-600">학급:</span> {student.classNumber}반
          </p>
          <p className="text-lg">
            <span className="text-gray-600">번호:</span> {student.number}번
          </p>
          <p className="text-3xl font-bold mt-4">{student.name}</p>
        </div>
      </Card>

      {/* 내 배지 */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">내 배지 🏆</h2>
        {student.badges.length === 0 ? (
          <p className="text-gray-500 text-center py-8">아직 획득한 배지가 없습니다</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {student.badges.map(badge => (
              <div
                key={badge.id}
                className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-300"
              >
                <div className="text-5xl mb-2">{badge.emoji}</div>
                <p className="text-sm font-bold">{badge.name}</p>
                {badge.reason && (
                  <p className="text-xs text-gray-600 mt-1">{badge.reason}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 내 스탯 */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">내 스탯 📊</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">아웃</p>
            <p className="text-3xl font-bold text-orange-600">{student.stats.outs}</p>
            <p className="text-xs text-gray-500">🔥 1점</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">패스</p>
            <p className="text-3xl font-bold text-blue-600">{student.stats.passes}</p>
            <p className="text-xs text-gray-500">🤝 1점</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">양보</p>
            <p className="text-3xl font-bold text-green-600">{student.stats.sacrifices}</p>
            <p className="text-xs text-gray-500">💚 1점</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">쿠키</p>
            <p className="text-3xl font-bold text-yellow-600">{student.stats.cookies}</p>
            <p className="text-xs text-gray-500">🍪 1점</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t-2">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600">참여 경기</p>
              <p className="text-2xl font-bold">{student.stats.gamesPlayed}경기</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600">종합 점수</p>
              <p className="text-4xl font-bold text-purple-600">{student.stats.totalScore}점</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
