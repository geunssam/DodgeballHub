/**
 * Data Service - Firestore 버전
 *
 * 기존 localStorage 기반에서 Firestore 기반으로 전환
 * firestoreService의 함수들을 re-export하여 기존 코드와의 호환성 유지
 */

import {
  Teacher, Class, Student, Team, Game, CustomBadge,
  PlayerHistory, GameHistoryEntry, FinishedGame
} from '@/types';

// Firestore service 함수들 import
import {
  createOrUpdateTeacher,
  getTeacher,
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  batchUpdateStudents,
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  getGames,
  createGame,
  updateGame,
  deleteGame,
  getFinishedGames,
  createFinishedGame,
  updateFinishedGame,
  deleteFinishedGame,
  getCustomBadges,
  createCustomBadge,
  updateCustomBadge,
  deleteCustomBadge,
} from './firestoreService';

// ===== Authentication Helpers =====

/**
 * 현재 로그인한 교사 ID를 가져옵니다
 *
 * ⚠️ 주의: 이 함수는 클라이언트 컴포넌트에서만 사용 가능합니다.
 * NextAuth의 useSession hook을 사용하여 session.user.id를 가져오세요.
 *
 * 예시:
 * ```tsx
 * import { useSession } from 'next-auth/react';
 *
 * const { data: session } = useSession();
 * const teacherId = session?.user?.id;
 * ```
 */
export function getCurrentTeacherId(): string | null {
  console.warn('⚠️ getCurrentTeacherId()는 더 이상 사용되지 않습니다. useSession()을 사용하세요.');
  return null;
}

// ===== Teacher Operations =====
export { createOrUpdateTeacher, getTeacher };

/**
 * 교사 정보를 업데이트합니다
 */
export async function updateTeacher(
  teacherId: string,
  updates: Partial<Omit<Teacher, 'id'>>
): Promise<void> {
  const teacher = await getTeacher(teacherId);
  if (!teacher) {
    throw new Error('교사를 찾을 수 없습니다.');
  }

  await createOrUpdateTeacher(teacherId, {
    ...teacher,
    ...updates,
  });
}

// ===== Class Operations =====
export { getClasses, createClass, updateClass, deleteClass };
export { getClass as getClassById };

// ===== Student Operations =====
export { getStudents, createStudent, updateStudent, deleteStudent, batchUpdateStudents };

/**
 * 특정 학급의 모든 학생을 가져옵니다 (번호순 정렬)
 */
export async function getStudentsByClass(classId: string): Promise<Student[]> {
  const students = await getStudents(classId);
  return students.sort((a, b) => a.number - b.number);
}

/**
 * 학생 ID로 학생 정보를 가져옵니다
 */
export async function getStudentById(
  classId: string,
  studentId: string
): Promise<Student | null> {
  const students = await getStudents(classId);
  return students.find(s => s.id === studentId) || null;
}

/**
 * 학생 코드 일괄 생성
 * 여러 학생의 studentCode 필드를 한 번에 업데이트합니다
 */
export async function generateStudentCodes(
  teacherId: string,
  students: Student[],
  generateCodeFn: (teacherId: string, studentId: string) => string
): Promise<void> {
  const updates = students.map(student => ({
    studentId: student.id,
    updates: {
      studentCode: generateCodeFn(teacherId, student.id),
    },
  }));

  await batchUpdateStudents(updates);
}

// ===== Team Operations =====
export { getTeams, createTeam, updateTeam, deleteTeam };

/**
 * 팀 ID로 팀 정보를 가져옵니다
 */
export async function getTeamById(
  teacherId: string,
  teamId: string
): Promise<Team | null> {
  const teams = await getTeams(teacherId);
  return teams.find(t => t.id === teamId) || null;
}

// ===== Game Operations =====
export { getGames, createGame, updateGame, deleteGame };

/**
 * 교사 ID로 모든 경기를 가져옵니다 (getGames의 alias)
 */
export async function getGamesByTeacherId(teacherId: string): Promise<Game[]> {
  return getGames(teacherId);
}

/**
 * 경기 ID로 경기 정보를 가져옵니다
 */
export async function getGameById(
  teacherId: string,
  gameId: string
): Promise<Game | null> {
  const games = await getGames(teacherId);
  return games.find(g => g.id === gameId) || null;
}

/**
 * 특정 학급의 경기 목록을 가져옵니다
 */
export async function getGamesByClass(
  teacherId: string,
  classId: string
): Promise<Game[]> {
  const games = await getGames(teacherId);
  return games.filter(g => g.classId === classId);
}

// ===== Finished Game Operations =====
export { getFinishedGames, createFinishedGame, updateFinishedGame, deleteFinishedGame };

/**
 * 완료된 경기 ID로 정보를 가져옵니다
 */
export async function getFinishedGameById(
  teacherId: string,
  gameId: string
): Promise<FinishedGame | null> {
  const games = await getFinishedGames(teacherId);
  return games.find(g => g.id === gameId) || null;
}

/**
 * 특정 학급의 완료된 경기 목록을 가져옵니다
 */
export async function getFinishedGamesByClass(
  teacherId: string,
  classId: string
): Promise<FinishedGame[]> {
  const games = await getFinishedGames(teacherId);
  return games.filter(g => g.classId === classId);
}

// ===== Custom Badge Operations =====
export { getCustomBadges, createCustomBadge, updateCustomBadge, deleteCustomBadge };

/**
 * 배지 ID로 배지 정보를 가져옵니다
 */
export async function getCustomBadgeById(
  teacherId: string,
  badgeId: string
): Promise<CustomBadge | null> {
  const badges = await getCustomBadges(teacherId);
  return badges.find(b => b.id === badgeId) || null;
}

// ===== Player History Operations =====

/**
 * 학생의 경기 기록 히스토리를 가져옵니다
 *
 * 참고: Firestore에서는 finishedGames에서 해당 학생이 참여한 경기를 필터링하여 반환
 */
export async function getPlayerHistory(
  teacherId: string,
  studentId: string
): Promise<PlayerHistory> {
  const finishedGames = await getFinishedGames(teacherId);

  const gameHistory: GameHistoryEntry[] = finishedGames
    .filter(game => {
      // 학생이 참여한 경기만 필터링
      const allPlayers = [
        ...game.team1.players,
        ...game.team2.players,
      ];
      return allPlayers.some(p => p.id === studentId);
    })
    .map(game => {
      // 학생이 어느 팀인지 찾기
      const isTeam1 = game.team1.players.some(p => p.id === studentId);
      const playerTeam = isTeam1 ? game.team1 : game.team2;
      const opponentTeam = isTeam1 ? game.team2 : game.team1;

      // 학생의 플레이어 정보 찾기
      const player = playerTeam.players.find(p => p.id === studentId);

      return {
        gameId: game.id,
        date: game.date,
        classId: game.classId,
        teamName: playerTeam.name,
        opponentTeamName: opponentTeam.name,
        won: playerTeam.score > opponentTeam.score,
        teamScore: playerTeam.score,
        opponentScore: opponentTeam.score,
        stats: player?.stats || {
          hits: 0,
          passes: 0,
          sacrifices: 0,
          cookies: 0,
        },
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    studentId,
    games: gameHistory,
  };
}

/**
 * 학생의 경기 기록을 업데이트합니다
 *
 * 참고: Firestore에서는 finishedGame을 업데이트하는 방식으로 동작
 */
export async function updatePlayerHistory(
  teacherId: string,
  studentId: string,
  gameId: string,
  stats: {
    hits: number;
    passes: number;
    sacrifices: number;
    cookies: number;
  }
): Promise<void> {
  const game = await getFinishedGameById(teacherId, gameId);
  if (!game) {
    throw new Error('완료된 경기를 찾을 수 없습니다.');
  }

  // 학생이 속한 팀 찾기 및 stats 업데이트
  const isTeam1 = game.team1.players.some(p => p.id === studentId);
  if (isTeam1) {
    game.team1.players = game.team1.players.map(p =>
      p.id === studentId ? { ...p, stats } : p
    );
  } else {
    game.team2.players = game.team2.players.map(p =>
      p.id === studentId ? { ...p, stats } : p
    );
  }

  await updateFinishedGame(gameId, game);
}

// ===== Migration =====

/**
 * 데이터 마이그레이션 함수 (더 이상 사용되지 않음)
 *
 * Firestore로 전환하면서 필요 없어진 함수입니다.
 * localStorage → Firestore 마이그레이션은 migrateToFirestore.ts를 사용하세요.
 */
export function migrateStudentStatsFields(): void {
  console.warn('⚠️ migrateStudentStatsFields()는 더 이상 사용되지 않습니다.');
}
