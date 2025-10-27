import { Student } from '@/types';

/**
 * Fisher-Yates 셔플 알고리즘
 * 배열을 무작위로 섞습니다
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 학생들을 N개의 팀으로 랜덤하게 균등 배분합니다
 * 홀수인 경우 앞 팀부터 1명씩 더 배정됩니다
 *
 * @param students - 배정할 학생 목록
 * @param teamCount - 생성할 팀 개수 (2~6)
 * @returns 팀별로 배분된 학생 배열의 배열
 *
 * @example
 * // 11명을 2팀으로 나누면: [6명, 5명]
 * randomTeamAssignment(students, 2)
 *
 * @example
 * // 11명을 3팀으로 나누면: [4명, 4명, 3명]
 * randomTeamAssignment(students, 3)
 */
export function randomTeamAssignment(
  students: Student[],
  teamCount: number
): Student[][] {
  if (teamCount < 2 || teamCount > 6) {
    throw new Error('팀 개수는 2~6개 사이여야 합니다');
  }

  if (students.length === 0) {
    return Array(teamCount).fill([]);
  }

  // 학생들을 랜덤하게 섞기
  const shuffledStudents = shuffleArray(students);

  // 팀별 기본 인원 수 계산
  const baseSize = Math.floor(students.length / teamCount);
  const remainder = students.length % teamCount;

  const teams: Student[][] = [];
  let currentIndex = 0;

  // 각 팀에 학생 배정
  for (let i = 0; i < teamCount; i++) {
    // 나머지가 있으면 앞 팀부터 1명씩 더 배정
    const teamSize = i < remainder ? baseSize + 1 : baseSize;
    teams.push(shuffledStudents.slice(currentIndex, currentIndex + teamSize));
    currentIndex += teamSize;
  }

  return teams;
}

/**
 * 팀 색상 목록
 * 순서대로 팀에 할당됩니다
 */
export const TEAM_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'] as const;

/**
 * 팀 색상 한글 이름
 */
export const TEAM_COLOR_NAMES: Record<typeof TEAM_COLORS[number], string> = {
  red: '빨강',
  blue: '파랑',
  green: '초록',
  yellow: '노랑',
  purple: '보라',
  orange: '주황'
};

/**
 * 팀 이름 생성 옵션
 */
export type TeamNamingStyle = 'numbered' | 'colored';

/**
 * 팀 이름을 자동으로 생성합니다
 *
 * @param index - 팀 인덱스 (0부터 시작)
 * @param style - 이름 스타일 ('numbered': 팀1, 팀2 | 'colored': 레드팀, 블루팀)
 * @returns 생성된 팀 이름
 */
export function generateTeamName(index: number, style: TeamNamingStyle = 'numbered'): string {
  if (style === 'numbered') {
    return `팀${index + 1}`;
  } else {
    const colorIndex = index % TEAM_COLORS.length;
    const colorName = TEAM_COLOR_NAMES[TEAM_COLORS[colorIndex]];
    return `${colorName}팀`;
  }
}

/**
 * 팀 색상을 자동으로 할당합니다
 *
 * @param index - 팀 인덱스 (0부터 시작)
 * @returns 할당된 색상
 */
export function assignTeamColor(index: number): typeof TEAM_COLORS[number] {
  return TEAM_COLORS[index % TEAM_COLORS.length];
}

/**
 * 팀 배분 정보를 계산합니다
 *
 * @param totalStudents - 전체 학생 수
 * @param teamCount - 팀 개수
 * @returns 각 팀의 예상 인원 수 배열
 */
export function calculateTeamSizes(totalStudents: number, teamCount: number): number[] {
  const baseSize = Math.floor(totalStudents / teamCount);
  const remainder = totalStudents % teamCount;

  const sizes: number[] = [];
  for (let i = 0; i < teamCount; i++) {
    sizes.push(i < remainder ? baseSize + 1 : baseSize);
  }

  return sizes;
}
