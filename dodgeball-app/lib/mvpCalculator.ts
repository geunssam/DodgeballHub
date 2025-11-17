import { StudentStats } from '@/types';

/**
 * MVP Calculator
 *
 * 선수들의 스탯을 기반으로 MVP 점수를 계산하고,
 * 최고 점수를 가진 선수를 MVP로 선정하는 유틸리티
 */

/**
 * MVP 점수 계산 가중치 (피구 맞춤 - 모두 동일)
 * - 아웃: 1점
 * - 통과: 1점
 * - 희생: 1점
 * - 쿠키: 1점
 */
const MVP_WEIGHTS = {
  hits: 1,
  passes: 1,
  sacrifices: 1,
  cookies: 1
};

/**
 * 선수의 스탯을 기반으로 MVP 점수 계산
 */
export function calculateMVPScore(stats: StudentStats): number {
  if (!stats) return 0;

  return (
    (stats.hits || 0) * MVP_WEIGHTS.hits +
    (stats.passes || 0) * MVP_WEIGHTS.passes +
    (stats.sacrifices || 0) * MVP_WEIGHTS.sacrifices +
    (stats.cookies || 0) * MVP_WEIGHTS.cookies
  );
}

/**
 * 선수 정보 인터페이스 (MVP 계산용)
 */
interface PlayerWithStats {
  playerId: string;
  playerName: string;
  stats: StudentStats;
}

/**
 * MVP 결과 인터페이스
 */
interface MVPResult {
  playerId: string;
  playerName: string;
  score: number;
  stats: StudentStats;
}

/**
 * 여러 선수들 중에서 MVP 선정 (단일 MVP)
 */
export function findMVP(players: PlayerWithStats[]): MVPResult | null {
  if (!players || players.length === 0) {
    return null;
  }

  let mvp: MVPResult | null = null;
  let maxScore = -1;

  players.forEach(player => {
    const score = calculateMVPScore(player.stats);

    if (score > maxScore) {
      maxScore = score;
      mvp = {
        playerId: player.playerId,
        playerName: player.playerName,
        score: score,
        stats: player.stats
      };
    }
  });

  return mvp;
}

/**
 * MVP 점수를 기준으로 선수들을 정렬
 *
 * @param players - 선수 배열
 * @param descending - true면 내림차순(기본), false면 오름차순
 * @returns MVP 점수로 정렬된 선수 배열
 */
export function sortPlayersByMVPScore(
  players: PlayerWithStats[],
  descending: boolean = true
): PlayerWithStats[] {
  if (!players || players.length === 0) {
    return [];
  }

  return [...players].sort((a, b) => {
    const scoreA = calculateMVPScore(a.stats);
    const scoreB = calculateMVPScore(b.stats);

    return descending ? scoreB - scoreA : scoreA - scoreB;
  });
}

/**
 * MVP 점수 범위에 따른 등급 계산
 */
export function getMVPGrade(score: number): string {
  if (score >= 50) return 'S';
  if (score >= 30) return 'A';
  if (score >= 15) return 'B';
  if (score >= 5) return 'C';
  return 'D';
}

/**
 * MVP 점수를 사람이 읽기 쉬운 텍스트로 변환
 */
export function getMVPScoreDescription(score: number, stats: StudentStats): string {
  const contributions: string[] = [];

  if (stats.hits > 0) {
    contributions.push(`아웃 ${stats.hits}회`);
  }
  if (stats.passes > 0) {
    contributions.push(`통과 ${stats.passes}회`);
  }
  if (stats.sacrifices > 0) {
    contributions.push(`희생 ${stats.sacrifices}회`);
  }
  if (stats.cookies > 0) {
    contributions.push(`쿠키 ${stats.cookies}개`);
  }

  return contributions.length > 0
    ? `${score}점 (${contributions.join(', ')})`
    : `${score}점`;
}

/**
 * 등급별 설명 가져오기
 */
export function getMVPGradeDescription(grade: string): string {
  const descriptions: { [key: string]: string } = {
    'S': '레전드',
    'A': '우수',
    'B': '양호',
    'C': '보통',
    'D': '노력 필요'
  };

  return descriptions[grade] || '';
}
