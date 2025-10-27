/**
 * 통계 계산 유틸리티
 * 종합 점수 계산 및 학생 스탯 업데이트
 */

import { StudentStats, GameRecord } from '@/types';

/**
 * 종합 점수 계산
 *
 * 공식: 아웃 + 패스 + 양보 + 쿠키 (모두 1점)
 *
 * @param stats - 학생의 통계
 * @returns 종합 점수
 */
export function calculateTotalScore(stats: StudentStats): number {
  const score =
    stats.outs +
    stats.passes +
    stats.sacrifices +
    stats.cookies;

  return score;
}

/**
 * 경기 기록을 기존 스탯에 누적
 *
 * @param currentStats - 현재 누적 통계
 * @param gameRecord - 경기에서 기록한 스탯
 * @returns 업데이트된 통계
 */
export function addGameRecordToStats(
  currentStats: StudentStats,
  gameRecord: GameRecord
): StudentStats {
  const updatedStats: StudentStats = {
    outs: currentStats.outs + gameRecord.outs,
    passes: currentStats.passes + gameRecord.passes,
    sacrifices: currentStats.sacrifices + gameRecord.sacrifices,
    cookies: currentStats.cookies + gameRecord.cookies,
    gamesPlayed: currentStats.gamesPlayed + 1, // 경기 수 증가
    totalScore: 0 // 임시값, 아래에서 재계산
  };

  // 종합 점수 자동 계산
  updatedStats.totalScore = calculateTotalScore(updatedStats);

  return updatedStats;
}

/**
 * 여러 경기 기록을 한 번에 누적
 *
 * @param currentStats - 현재 누적 통계
 * @param gameRecords - 경기 기록 배열
 * @returns 업데이트된 통계
 */
export function addMultipleGameRecords(
  currentStats: StudentStats,
  gameRecords: GameRecord[]
): StudentStats {
  let updatedStats = { ...currentStats };

  gameRecords.forEach(record => {
    updatedStats = addGameRecordToStats(updatedStats, record);
  });

  return updatedStats;
}

/**
 * 빈 통계 객체 생성
 *
 * @returns 초기화된 통계 객체
 */
export function createEmptyStats(): StudentStats {
  return {
    outs: 0,
    passes: 0,
    sacrifices: 0,
    cookies: 0,
    gamesPlayed: 0,
    totalScore: 0
  };
}

/**
 * 통계가 유효한지 확인
 *
 * @param stats - 검증할 통계
 * @returns 유효성 여부
 */
export function isValidStats(stats: StudentStats): boolean {
  return (
    typeof stats.outs === 'number' &&
    typeof stats.passes === 'number' &&
    typeof stats.sacrifices === 'number' &&
    typeof stats.cookies === 'number' &&
    typeof stats.gamesPlayed === 'number' &&
    typeof stats.totalScore === 'number' &&
    stats.outs >= 0 &&
    stats.passes >= 0 &&
    stats.sacrifices >= 0 &&
    stats.cookies >= 0 &&
    stats.gamesPlayed >= 0
  );
}

/**
 * 통계 객체를 안전하게 정규화
 * 음수 값이나 잘못된 값을 0으로 변환
 *
 * @param stats - 정규화할 통계
 * @returns 정규화된 통계
 */
export function normalizeStats(stats: StudentStats): StudentStats {
  const normalized: StudentStats = {
    outs: Math.max(0, stats.outs || 0),
    passes: Math.max(0, stats.passes || 0),
    sacrifices: Math.max(0, stats.sacrifices || 0),
    cookies: Math.max(0, stats.cookies || 0),
    gamesPlayed: Math.max(0, stats.gamesPlayed || 0),
    totalScore: 0 // 재계산됨
  };

  normalized.totalScore = calculateTotalScore(normalized);

  return normalized;
}
