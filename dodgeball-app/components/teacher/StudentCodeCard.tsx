'use client';

import { Student } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface StudentCodeCardProps {
  student: Student;
}

/**
 * 개별 학생 코드 카드 컴포넌트
 * baseball-firebase의 StudentCodeCard.jsx 이식
 */
export function StudentCodeCard({ student }: StudentCodeCardProps) {
  const router = useRouter();

  // 코드 복사 기능
  const handleCopy = async () => {
    if (!student.studentCode) {
      toast.error('학생 코드가 없습니다');
      return;
    }

    try {
      await navigator.clipboard.writeText(student.studentCode);
      toast.success('✅ 코드가 복사되었습니다!', {
        description: `${student.name}: ${student.studentCode}`
      });
    } catch (error) {
      console.error('복사 실패:', error);
      toast.error('코드 복사에 실패했습니다');
    }
  };

  // 페이지 미리보기 기능
  const handleViewPage = () => {
    if (!student.studentCode) {
      toast.error('학생 코드가 없습니다');
      return;
    }

    // URL 파라미터로 studentCode 전달
    router.push(`/student?code=${student.studentCode}`);
  };

  // 성별 아이콘
  const genderIcon = student.gender === 'male' ? '👨‍🎓' : student.gender === 'female' ? '👩‍🎓' : '👤';

  return (
    <Card className="hover:shadow-lg transition-shadow min-w-[350px]">
      <CardContent className="p-6 space-y-4">
        {student.studentCode ? (
          <>
            {/* 상단: 이름 + 버튼 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{genderIcon}</span>
                <span className="font-bold text-lg">{student.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleCopy}
                  className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 whitespace-nowrap px-4 py-2"
                >
                  📋 코드복사
                </Button>
                <Button
                  size="sm"
                  onClick={handleViewPage}
                  className="text-sm bg-green-100 hover:bg-green-200 text-green-700 whitespace-nowrap px-4 py-2"
                >
                  🔍 미리보기
                </Button>
              </div>
            </div>

            {/* 하단: 코드 박스 */}
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <div className="text-base font-mono font-bold text-blue-600 select-all whitespace-nowrap overflow-x-auto">
                {student.studentCode}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* 코드 없을 때: 이름만 */}
            <div className="flex items-center gap-3">
              <span className="text-3xl">{genderIcon}</span>
              <span className="font-bold text-lg">{student.name}</span>
            </div>

            {/* 경고 박스 */}
            <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-lg text-center">
              <div className="text-yellow-600 text-base">⚠️ 코드 없음</div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
