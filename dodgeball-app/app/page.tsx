import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-4xl px-6">
        {/* 타이틀 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">🏐 DodgeballHub</h1>
          <p className="text-xl text-gray-600">초등학교 피구 경기 관리 시스템</p>
        </div>

        {/* 선택 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 교사 로그인 */}
          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">👨‍🏫</div>
              <h2 className="text-2xl font-bold">교사</h2>
              <p className="text-gray-600 mb-6">
                학급 관리 및 경기 진행
              </p>
              <Link href="/teacher/login" className="block">
                <Button size="lg" className="w-full text-lg py-6">
                  교사 로그인
                </Button>
              </Link>
            </div>
          </Card>

          {/* 학생 페이지 */}
          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">👦</div>
              <h2 className="text-2xl font-bold">학생</h2>
              <p className="text-gray-600 mb-6">
                내 스탯 및 배지 확인
              </p>
              <Link href="/student" className="block">
                <Button size="lg" variant="outline" className="w-full text-lg py-6">
                  학생 페이지
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
