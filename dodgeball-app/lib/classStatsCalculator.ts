/**
 * classStatsCalculator.ts
 * 학급별 통계를 계산하는 유틸리티 함수
 * ClassRankingWidget의 로직을 재사용 가능하게 분리
 */

import { Student, Game } from '@/types';
import { getStudents } from './dataService';
import { getGamesByTeacherId } from './dataService';
import { getPlayerHistory } from './dataService';

/**
 * 학급별 통계 인터페이스
 */
interface ClassStats {
  totalOuts: number;
  totalPasses: number;
  totalSacrifices: number;
  totalCookies: number;
  studentCount: number;
}

/**
 * 개별 학생 통계 인터페이스
 */
interface StudentStatsResult {
  outs: number;
  passes: number;
  sacrifices: number;
  cookies: number;
}

/**
 * 모든 학급의 통계를 계산
 *
 * @param teacherId - 선생님 ID
 * @returns { [className]: ClassStats }
 */
export const calculateAllClassStats = async (
  teacherId: string
): Promise<{ [className: string]: ClassStats }> => {
  try {
    // 모든 학생 가져오기 (학급별)
    const allClasses = await getClassesByTeacher(teacherId);
    const classStatsMap = new Map<string, ClassStats>();

    // 진행 중인 경기 한 번만 조회 (성능 개선)
    const activeGames = await getActiveGames(teacherId);

    // 각 학급별로 처리
    for (const cls of allClasses) {
      const students = await getStudents(cls.id);

      if (!students || students.length === 0) continue;

      // 병렬 처리로 속도 개선
      const promises = students.map(async (student) => {
        // playerHistory에서 스탯 가져오기
        const history = await getPlayerHistory(teacherId, student.id);

        let stats = {
          outs: 0,
          passes: 0,
          sacrifices: 0,
          cookies: 0
        };

        if (history && history.games) {
          history.games.forEach(game => {
            stats.outs += game.stats?.outs || 0;
            stats.passes += game.stats?.passes || 0;
            stats.sacrifices += game.stats?.sacrifices || 0;
            stats.cookies += game.stats?.cookies || 0;
          });
        }

        // 진행 중인 경기 스탯 추가
        activeGames.forEach(game => {
          const playerRecord = game.records.find(r => r.studentId === student.id);

          if (playerRecord) {
            stats.outs += playerRecord.outs || 0;
            stats.passes += playerRecord.passes || 0;
            stats.sacrifices += playerRecord.sacrifices || 0;
            stats.cookies += playerRecord.cookies || 0;
          }
        });

        return stats;
      });

      const results = await Promise.all(promises);

      // 학급별 집계
      const classStats: ClassStats = {
        totalOuts: 0,
        totalPasses: 0,
        totalSacrifices: 0,
        totalCookies: 0,
        studentCount: students.length
      };

      results.forEach(stats => {
        classStats.totalOuts += stats.outs;
        classStats.totalPasses += stats.passes;
        classStats.totalSacrifices += stats.sacrifices;
        classStats.totalCookies += stats.cookies;
      });

      classStatsMap.set(cls.name, classStats);
    }

    // Map을 Object로 변환
    const classStatsObject: { [className: string]: ClassStats } = {};
    classStatsMap.forEach((value, key) => {
      classStatsObject[key] = value;
    });

    console.log('📊 [classStatsCalculator] 학급별 통계 계산 완료:', classStatsObject);

    return classStatsObject;
  } catch (error) {
    console.error('❌ [classStatsCalculator] 학급 통계 계산 실패:', error);
    return {};
  }
};

/**
 * 특정 학급의 통계만 계산
 *
 * @param teacherId - 선생님 ID
 * @param className - 학급 이름
 * @returns ClassStats
 */
export const calculateClassStats = async (
  teacherId: string,
  className: string
): Promise<ClassStats> => {
  const allStats = await calculateAllClassStats(teacherId);
  return allStats[className] || {
    totalOuts: 0,
    totalPasses: 0,
    totalSacrifices: 0,
    totalCookies: 0,
    studentCount: 0
  };
};

/**
 * 개별 학생들의 통계를 계산
 *
 * @param teacherId - 선생님 ID
 * @param students - 학생 배열
 * @returns { [studentId]: StudentStatsResult }
 */
export const calculateStudentStats = async (
  teacherId: string,
  students: Student[]
): Promise<{ [studentId: string]: StudentStatsResult }> => {
  try {
    if (!students || students.length === 0) {
      return {};
    }

    // 진행 중인 경기 한 번만 조회 (성능 개선)
    const activeGames = await getActiveGames(teacherId);

    // 병렬 처리로 속도 개선
    const promises = students.map(async (student) => {
      const studentId = student.id;

      // playerHistory에서 스탯 가져오기
      const history = await getPlayerHistory(teacherId, studentId);

      let stats: StudentStatsResult = {
        outs: 0,
        passes: 0,
        sacrifices: 0,
        cookies: 0
      };

      if (history && history.games) {
        history.games.forEach(game => {
          stats.outs += game.stats?.outs || 0;
          stats.passes += game.stats?.passes || 0;
          stats.sacrifices += game.stats?.sacrifices || 0;
          stats.cookies += game.stats?.cookies || 0;
        });
      }

      // 진행 중인 경기 스탯 추가
      activeGames.forEach(game => {
        const playerRecord = game.records.find(r => r.studentId === studentId);

        if (playerRecord) {
          stats.outs += playerRecord.outs || 0;
          stats.passes += playerRecord.passes || 0;
          stats.sacrifices += playerRecord.sacrifices || 0;
          stats.cookies += playerRecord.cookies || 0;
        }
      });

      return { studentId, stats };
    });

    const results = await Promise.all(promises);

    // 학생 ID를 키로 하는 객체로 변환
    const studentStatsObject: { [studentId: string]: StudentStatsResult } = {};
    results.forEach(result => {
      if (result) {
        studentStatsObject[result.studentId] = result.stats;
      }
    });

    console.log('📊 [classStatsCalculator] 개별 학생 통계 계산 완료');

    return studentStatsObject;
  } catch (error) {
    console.error('❌ [classStatsCalculator] 개별 학생 통계 계산 실패:', error);
    return {};
  }
};

// ===== Helper Functions =====

/**
 * 교사의 모든 학급 가져오기
 */
async function getClassesByTeacher(teacherId: string) {
  // TODO: dataService.getClasses() 사용
  // 임시로 mockData에서 가져오기
  const { getClasses } = await import('./dataService');
  return await getClasses(teacherId);
}

/**
 * 진행 중인 경기 가져오기
 */
async function getActiveGames(teacherId: string): Promise<Game[]> {
  const allGames = await getGamesByTeacherId(teacherId);
  return allGames.filter(game => !game.isCompleted);
}
