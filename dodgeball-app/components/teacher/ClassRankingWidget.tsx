'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ClassRankingData } from '@/types';
import { calculateAllClassStats } from '@/lib/classStatsCalculator';
import { getCurrentTeacherId } from '@/lib/dataService';

interface ClassRankingWidgetProps {
  onClassClick?: (classData: ClassRankingData) => void;
}

/**
 * 학급별 랭킹 위젯 컴포넌트
 * - 올림픽 포디움 스타일 상위 3개
 * - 나머지는 컴팩트한 리스트
 * - 클릭 시 상세 모달 표시
 */
export function ClassRankingWidget({ onClassClick }: ClassRankingWidgetProps) {
  const [rankings, setRankings] = useState<ClassRankingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      setLoading(true);

      const teacherId = getCurrentTeacherId();
      if (!teacherId) {
        console.warn('⚠️ 로그인 정보 없음');
        return;
      }

      // calculateAllClassStats 사용하여 학급별 통계 가져오기
      const classStatsMap = await calculateAllClassStats(teacherId);

      // ClassRankingData 형식으로 변환
      const classRankings: ClassRankingData[] = Object.entries(classStatsMap).map(
        ([className, stats]) => ({
          className,
          totalPoints: stats.totalOuts + stats.totalPasses + stats.totalSacrifices + stats.totalCookies,
          avgPoints: stats.studentCount > 0
            ? Math.round(
                (stats.totalOuts + stats.totalPasses + stats.totalSacrifices + stats.totalCookies) /
                  stats.studentCount
              )
            : 0,
          studentCount: stats.studentCount,
          totalOuts: stats.totalOuts,
          totalPasses: stats.totalPasses,
          totalSacrifices: stats.totalSacrifices,
          totalCookies: stats.totalCookies
        })
      );

      // 총점 기준 내림차순 정렬
      classRankings.sort((a, b) => b.totalPoints - a.totalPoints);

      console.log('🏆 [ClassRankingWidget] 학급별 랭킹 데이터:', classRankings);

      setRankings(classRankings);
    } catch (error) {
      console.error('❌ 학급 랭킹 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <h3 className="text-xl font-bold mb-3">🏆 학급별 랭킹</h3>
        <div className="text-center py-4 text-gray-500">로딩 중...</div>
      </Card>
    );
  }

  if (rankings.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-xl font-bold mb-3">🏆 학급별 랭킹</h3>
        <div className="text-center py-4 text-gray-500">학급 데이터가 없습니다.</div>
      </Card>
    );
  }

  // 상위 3개와 나머지 분리
  const topThree = rankings.slice(0, 3);
  const restOfRankings = rankings.slice(3);

  // 포디움 순서: 2등(왼쪽), 1등(중앙), 3등(오른쪽)
  const podiumOrder =
    topThree.length >= 3
      ? [topThree[1], topThree[0], topThree[2]]
      : topThree.length === 2
      ? [topThree[1], topThree[0], null]
      : topThree.length === 1
      ? [null, topThree[0], null]
      : [null, null, null];

  const renderPodiumCard = (classData: ClassRankingData | null, rank: 1 | 2 | 3) => {
    if (!classData) return <div className="flex-1"></div>;

    const podiumStyles = {
      1: {
        bg: 'bg-gradient-to-br from-yellow-100 via-yellow-200 to-yellow-300',
        text: 'text-yellow-900',
        height: 'h-96',
        badge: '🥇',
        shadow: 'shadow-2xl',
        border: 'border-4 border-yellow-200',
        scale: 'scale-105',
        marginTop: 'mt-0',
        padding: 'p-4'
      },
      2: {
        bg: 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300',
        text: 'text-gray-900',
        height: 'h-[22rem]',
        badge: '🥈',
        shadow: 'shadow-xl',
        border: 'border-4 border-gray-200',
        scale: 'scale-100',
        marginTop: 'mt-8',
        padding: 'p-4'
      },
      3: {
        bg: 'bg-gradient-to-br from-orange-100 via-orange-200 to-orange-300',
        text: 'text-orange-900',
        height: 'h-80',
        badge: '🥉',
        shadow: 'shadow-xl',
        border: 'border-4 border-orange-200',
        scale: 'scale-100',
        marginTop: 'mt-16',
        padding: 'p-1'
      }
    };

    const style = podiumStyles[rank];

    return (
      <button
        key={classData.className}
        onClick={() => onClassClick?.(classData)}
        className={`flex-1 ${style.bg} ${style.height} ${style.shadow} ${style.border} ${style.scale} ${style.marginTop} ${style.padding} rounded-2xl hover:scale-110 transition-all duration-300 flex flex-col justify-between gap-3`}
      >
        {/* 1열: 메달과 순위 */}
        <div className="flex items-center justify-center gap-3">
          <div className="text-5xl">{style.badge}</div>
          <div className={`text-4xl font-black ${style.text}`}>{rank}등</div>
        </div>

        {/* 2열: 학급명과 인원 */}
        <div className={`flex items-center justify-center gap-2 ${style.text}`}>
          <div className="text-2xl font-black">{classData.className}</div>
          <div className="text-xl font-bold flex items-center gap-1">
            <span>👥</span>
            <span>{classData.studentCount}명</span>
          </div>
        </div>

        {/* 3열: 총점 강조 */}
        <div className="bg-white bg-opacity-50 rounded-xl py-3 px-2 shadow-lg">
          <div className={`text-4xl font-black ${style.text} text-center`}>
            {classData.totalPoints.toLocaleString()}점
          </div>
        </div>

        {/* 4열: 통계 카드 (2x2 그리드) */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gradient-to-br from-red-50 to-red-100 py-3 px-4 rounded-lg flex items-center justify-center gap-2">
            <div className="text-3xl">⚾</div>
            <div className="text-base font-semibold text-red-800">아웃</div>
            <div className="text-xl font-bold text-red-800">{classData.totalOuts}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 py-3 px-4 rounded-lg flex items-center justify-center gap-2">
            <div className="text-3xl">🏃</div>
            <div className="text-base font-semibold text-blue-800">통과</div>
            <div className="text-xl font-bold text-blue-800">{classData.totalPasses}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 py-3 px-4 rounded-lg flex items-center justify-center gap-2">
            <div className="text-3xl">🛡️</div>
            <div className="text-base font-semibold text-purple-800">희생</div>
            <div className="text-xl font-bold text-purple-800">{classData.totalSacrifices}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 py-3 px-4 rounded-lg flex items-center justify-center gap-2">
            <div className="text-3xl">🍪</div>
            <div className="text-base font-semibold text-orange-800">쿠키</div>
            <div className="text-xl font-bold text-orange-800">{classData.totalCookies}</div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <Card className="p-6">
      {/* 올림픽 포디움 */}
      {topThree.length > 0 && (
        <div className="mb-8">
          <div className="flex items-end justify-center gap-4 mb-8">
            {/* 2등 (왼쪽) */}
            {renderPodiumCard(podiumOrder[0], 2)}

            {/* 1등 (중앙, 가장 높음) */}
            {renderPodiumCard(podiumOrder[1], 1)}

            {/* 3등 (오른쪽) */}
            {renderPodiumCard(podiumOrder[2], 3)}
          </div>
        </div>
      )}

      {/* 나머지 학급 목록 */}
      {restOfRankings.length > 0 && (
        <div>
          <div className="space-y-2">
            {restOfRankings.map((classData, index) => {
              const actualRank = index + 4;
              return (
                <button
                  key={classData.className}
                  onClick={() => onClassClick?.(classData)}
                  className="w-full p-3 rounded-lg hover:bg-gray-50 transition-all border border-gray-200 hover:border-gray-300 hover:shadow-md flex items-center gap-4"
                >
                  {/* 순위 */}
                  <span className="text-lg font-bold text-gray-700 min-w-[3rem]">
                    {actualRank}등
                  </span>

                  {/* 팀명 + 인원 */}
                  <div className="flex items-center gap-3 min-w-[12rem]">
                    <span className="text-xl font-bold">{classData.className}</span>
                    <span className="text-base text-gray-600 font-semibold flex items-center gap-1">
                      <span className="text-lg">👥</span>
                      <span>{classData.studentCount}명</span>
                    </span>
                  </div>

                  {/* 구분선 */}
                  <div className="h-8 w-px bg-gray-300"></div>

                  {/* 스탯 */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="bg-gradient-to-br from-red-50 to-red-100 py-4 px-6 rounded-xl flex items-center justify-center gap-2.5 flex-1">
                      <div className="text-3xl">⚾</div>
                      <div className="text-lg font-semibold text-red-800">아웃</div>
                      <div className="text-2xl font-bold text-red-800">{classData.totalOuts || 0}</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 py-4 px-6 rounded-xl flex items-center justify-center gap-2.5 flex-1">
                      <div className="text-3xl">🏃</div>
                      <div className="text-lg font-semibold text-blue-800">통과</div>
                      <div className="text-2xl font-bold text-blue-800">{classData.totalPasses || 0}</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 py-4 px-6 rounded-xl flex items-center justify-center gap-2.5 flex-1">
                      <div className="text-3xl">🛡️</div>
                      <div className="text-lg font-semibold text-purple-800">희생</div>
                      <div className="text-2xl font-bold text-purple-800">{classData.totalSacrifices || 0}</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 py-4 px-6 rounded-xl flex items-center justify-center gap-2.5 flex-1">
                      <div className="text-3xl">🍪</div>
                      <div className="text-lg font-semibold text-orange-800">쿠키</div>
                      <div className="text-2xl font-bold text-orange-800">{classData.totalCookies || 0}</div>
                    </div>
                  </div>

                  {/* 구분선 */}
                  <div className="h-8 w-px bg-gray-300"></div>

                  {/* 총점 */}
                  <div className="min-w-[8rem] text-right flex items-center justify-end gap-1">
                    <span className="text-2xl font-black text-blue-600">
                      {classData.totalPoints.toLocaleString()}
                    </span>
                    <span className="text-lg font-bold text-gray-600">점</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
