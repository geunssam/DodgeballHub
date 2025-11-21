import {
  Teacher, Class, Student, Team, Game, CustomBadge,
  PlayerHistory, GameHistoryEntry, FinishedGame
} from '@/types';
import { STORAGE_KEYS } from './mockData';

// ===== Authentication Helpers =====

/**
 * 현재 로그인한 교사 ID를 가져옵니다
 */
export function getCurrentTeacherId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER);
}

// ===== Data Migration =====
/**
 * 데이터 마이그레이션: outs → hits 필드명 변경
 * 앱 시작 시 한 번만 실행됨
 */
export function migrateStudentStatsFields(): void {
  if (typeof window === 'undefined') return;

  const MIGRATION_KEY = 'dodgeball_migration_outs_to_hits';

  // 이미 마이그레이션 완료된 경우 스킵
  if (localStorage.getItem(MIGRATION_KEY) === 'completed') {
    return;
  }

  console.log('🔄 학생 stats 필드 마이그레이션 시작...');

  const students = getFromStorage<Student>(STORAGE_KEYS.STUDENTS);
  let migratedCount = 0;

  console.log(`📊 전체 학생 수: ${students.length}명`);
  if (students.length > 0) {
    console.log('📋 첫 번째 학생 stats:', students[0].stats);
    console.log('🔍 outs 필드 존재?', 'outs' in (students[0].stats || {}));
    console.log('🔍 hits 필드 존재?', 'hits' in (students[0].stats || {}));
  }

  const migratedStudents = students.map(student => {
    if (student.stats && 'outs' in student.stats && !('hits' in student.stats)) {
      migratedCount++;
      console.log(`✏️ 마이그레이션: ${student.name} - outs: ${(student.stats as any).outs}`);
      return {
        ...student,
        stats: {
          hits: (student.stats as any).outs || 0,
          passes: student.stats.passes || 0,
          sacrifices: student.stats.sacrifices || 0,
          cookies: student.stats.cookies || 0,
          gamesPlayed: student.stats.gamesPlayed || 0,
          totalScore: student.stats.totalScore || 0
        }
      };
    }
    return student;
  });

  if (migratedCount > 0) {
    saveToStorage(STORAGE_KEYS.STUDENTS, migratedStudents);
    console.log(`✅ 학생 stats 필드 마이그레이션 완료: ${migratedCount}명`);
  } else {
    console.log('✅ 마이그레이션 대상 없음 (이미 최신 버전)');
  }

  // 마이그레이션 완료 플래그 저장
  localStorage.setItem(MIGRATION_KEY, 'completed');
}

// ===== Helper Functions =====
function getFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(key);
  if (!data) return [];

  try {
    return JSON.parse(data);
  } catch (error) {
    console.error(`⚠️ JSON 파싱 오류 발생 (${key}):`, error);
    console.error('손상된 데이터:', data.substring(0, 200));

    // 손상된 데이터 삭제
    localStorage.removeItem(key);
    console.log(`✅ ${key} 초기화 완료. 페이지를 새로고침하세요.`);

    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;

  try {
    const jsonString = JSON.stringify(data);
    localStorage.setItem(key, jsonString);
  } catch (error) {
    console.error(`⚠️ localStorage 저장 오류 (${key}):`, error);
    console.error('저장 시도한 데이터 크기:', JSON.stringify(data).length, 'bytes');

    // QuotaExceededError 처리
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      alert('저장 공간이 부족합니다. 일부 데이터를 삭제해주세요.');
    }
  }
}

/**
 * 카운터 변수 (일괄 생성 시 중복 방지)
 */
let idCounter = 0;

/**
 * 고유 ID 생성 헬퍼
 * Firebase 마이그레이션 시 이 함수만 교체하면 됨
 */
function generateUniqueId(prefix: string): string {
  // 브라우저 표준 UUID 사용 (가장 강력한 고유성 보장)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  // 폴백: 타임스탬프 + 카운터 + 랜덤 문자열 (triple protection)
  idCounter = (idCounter + 1) % 10000; // 0-9999 순환
  return `${prefix}_${Date.now()}_${idCounter}_${Math.random().toString(36).substr(2, 9)}`;

  // Firebase 마이그레이션 시:
  // return doc(collection(db, prefix)).id; // Firestore 자동 ID 사용
}

// ===== Teachers =====
export async function getTeachers(): Promise<Teacher[]> {
  return getFromStorage<Teacher>(STORAGE_KEYS.TEACHERS);
}

export async function getTeacherById(id: string): Promise<Teacher | null> {
  const teachers = await getTeachers();
  return teachers.find(t => t.id === id) || null;
}

// ===== Classes =====
export async function getClasses(teacherId: string): Promise<Class[]> {
  const classes = getFromStorage<Class>(STORAGE_KEYS.CLASSES);
  return classes.filter(c => c.teacherId === teacherId && !c.isArchived);
}

export async function getClassById(id: string): Promise<Class | null> {
  const classes = getFromStorage<Class>(STORAGE_KEYS.CLASSES);
  return classes.find(c => c.id === id) || null;
}

export async function createClass(data: Omit<Class, 'id' | 'createdAt'>): Promise<Class> {
  const classes = getFromStorage<Class>(STORAGE_KEYS.CLASSES);
  const newClass: Class = {
    ...data,
    id: `class_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  classes.push(newClass);
  saveToStorage(STORAGE_KEYS.CLASSES, classes);
  return newClass;
}

export async function updateClass(id: string, data: Partial<Class>): Promise<Class> {
  const classes = getFromStorage<Class>(STORAGE_KEYS.CLASSES);
  const index = classes.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Class not found');

  classes[index] = { ...classes[index], ...data };
  saveToStorage(STORAGE_KEYS.CLASSES, classes);
  return classes[index];
}

export async function deleteClass(id: string): Promise<void> {
  // 학급 삭제 시 연관된 데이터도 함께 삭제
  const classes = getFromStorage<Class>(STORAGE_KEYS.CLASSES);
  const students = getFromStorage<Student>(STORAGE_KEYS.STUDENTS);
  const teams = getFromStorage<Team>(STORAGE_KEYS.TEAMS);
  const games = getFromStorage<Game>(STORAGE_KEYS.GAMES);

  // 학급 제거
  const filteredClasses = classes.filter(c => c.id !== id);
  saveToStorage(STORAGE_KEYS.CLASSES, filteredClasses);

  // 해당 학급의 학생 제거
  const filteredStudents = students.filter(s => s.classId !== id);
  saveToStorage(STORAGE_KEYS.STUDENTS, filteredStudents);

  // 해당 학급 관련 팀 제거 (sourceClassIds에 포함된 경우)
  const filteredTeams = teams.filter(t => !t.sourceClassIds?.includes(id));
  saveToStorage(STORAGE_KEYS.TEAMS, filteredTeams);

  // 해당 학급 관련 게임 제거 (classIds에 포함된 경우)
  const filteredGames = games.filter(g => !g.classIds.includes(id));
  saveToStorage(STORAGE_KEYS.GAMES, filteredGames);
}

// ===== Students =====
export async function getStudents(classId: string): Promise<Student[]> {
  const students = getFromStorage<Student>(STORAGE_KEYS.STUDENTS);
  return students.filter(s => s.classId === classId);
}

export async function getStudentById(id: string): Promise<Student | null> {
  const students = getFromStorage<Student>(STORAGE_KEYS.STUDENTS);
  return students.find(s => s.id === id) || null;
}

export async function getStudentByAccessCode(code: string): Promise<Student | null> {
  const students = getFromStorage<Student>(STORAGE_KEYS.STUDENTS);
  return students.find(s => s.accessCode === code) || null;
}

/**
 * studentCode로 학생 찾기
 */
export async function getStudentByStudentCode(code: string): Promise<Student | null> {
  const students = getFromStorage<Student>(STORAGE_KEYS.STUDENTS);
  return students.find(s => s.studentCode === code) || null;
}

/**
 * 코드 없는 학생 필터링
 */
export async function getStudentsWithoutCode(teacherId: string): Promise<Student[]> {
  const classes = await getClasses(teacherId);
  const allStudents: Student[] = [];

  for (const cls of classes) {
    const students = await getStudents(cls.id);
    allStudents.push(...students);
  }

  // studentCode가 없는 학생들만 필터링
  return allStudents.filter(s => !s.studentCode);
}

/**
 * 코드 일괄 생성
 * @param teacherId - 교사 ID
 * @param students - 코드를 생성할 학생 목록
 * @param generateCodeFn - 코드 생성 함수
 */
export async function generateStudentCodes(
  teacherId: string,
  students: Student[],
  generateCodeFn: (teacherId: string, studentId: string) => string
): Promise<void> {
  const allStudents = getFromStorage<Student>(STORAGE_KEYS.STUDENTS);

  for (const student of students) {
    const code = generateCodeFn(teacherId, student.id);
    const index = allStudents.findIndex(s => s.id === student.id);

    if (index !== -1) {
      allStudents[index].studentCode = code;
    }
  }

  saveToStorage(STORAGE_KEYS.STUDENTS, allStudents);
}

export async function createStudent(data: Omit<Student, 'id' | 'createdAt'>): Promise<Student> {
  const students = getFromStorage<Student>(STORAGE_KEYS.STUDENTS);

  const newStudent: Student = {
    ...data,
    id: generateUniqueId('student'),
    createdAt: new Date().toISOString()
  };
  students.push(newStudent);
  saveToStorage(STORAGE_KEYS.STUDENTS, students);
  return newStudent;
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<Student> {
  const students = getFromStorage<Student>(STORAGE_KEYS.STUDENTS);
  const index = students.findIndex(s => s.id === id);
  if (index === -1) throw new Error('Student not found');

  students[index] = { ...students[index], ...data };
  saveToStorage(STORAGE_KEYS.STUDENTS, students);
  return students[index];
}

export async function deleteStudent(id: string): Promise<void> {
  const students = getFromStorage<Student>(STORAGE_KEYS.STUDENTS);
  const filtered = students.filter(s => s.id !== id);
  saveToStorage(STORAGE_KEYS.STUDENTS, filtered);
}

// ===== Teams =====
export async function getTeams(teacherId: string): Promise<Team[]> {
  const teams = getFromStorage<Team>(STORAGE_KEYS.TEAMS);
  return teams.filter(t => t.teacherId === teacherId);
}

export async function getTeamById(id: string): Promise<Team | null> {
  const teams = getFromStorage<Team>(STORAGE_KEYS.TEAMS);
  return teams.find(t => t.id === id) || null;
}

export async function createTeam(data: Omit<Team, 'id' | 'createdAt'>): Promise<Team> {
  const teams = getFromStorage<Team>(STORAGE_KEYS.TEAMS);

  // sourceClassIds 계산
  const sourceClassIds = data.members.length > 0
    ? Array.from(new Set(data.members.map(m => m.classId).filter(Boolean)))
    : [];

  // 고유 ID 생성 + 중복 검증 로직
  let uniqueId: string;
  let attempts = 0;

  do {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    uniqueId = `team_${data.teacherId}_${timestamp}_${random}`;
    attempts++;
  } while (teams.some(t => t.id === uniqueId) && attempts < 10);

  if (attempts >= 10) {
    throw new Error('Failed to generate unique team ID after 10 attempts');
  }

  const newTeam: Team = {
    ...data,
    members: data.members || [],
    sourceClassIds,
    id: uniqueId,
    createdAt: new Date().toISOString()
  };

  teams.push(newTeam);
  saveToStorage(STORAGE_KEYS.TEAMS, teams);
  return newTeam;
}

export async function updateTeam(id: string, data: Partial<Team>): Promise<Team> {
  const teams = getFromStorage<Team>(STORAGE_KEYS.TEAMS);
  const index = teams.findIndex(t => t.id === id);
  if (index === -1) throw new Error('Team not found');

  teams[index] = {
    ...teams[index],
    ...data,
    members: data.members !== undefined ? data.members : (teams[index].members || [])
  };
  saveToStorage(STORAGE_KEYS.TEAMS, teams);
  return teams[index];
}

export async function deleteTeam(id: string): Promise<void> {
  const teams = getFromStorage<Team>(STORAGE_KEYS.TEAMS);
  const filtered = teams.filter(t => t.id !== id);
  saveToStorage(STORAGE_KEYS.TEAMS, filtered);
}

// ===== Games =====
export async function getGames(classId: string): Promise<Game[]> {
  const games = getFromStorage<Game>(STORAGE_KEYS.GAMES);
  return games.filter(g => g.classIds.includes(classId));
}

export async function getGamesByTeacherId(teacherId: string): Promise<Game[]> {
  const games = getFromStorage<Game>(STORAGE_KEYS.GAMES);
  return games.filter(g => g.teacherId === teacherId);
}

export async function getStudentsByClassIds(classIds: string[]): Promise<Student[]> {
  const students = getFromStorage<Student>(STORAGE_KEYS.STUDENTS);
  return students.filter(s => classIds.includes(s.classId));
}

export async function getGameById(id: string): Promise<Game | null> {
  const games = getFromStorage<Game>(STORAGE_KEYS.GAMES);
  return games.find(g => g.id === id) || null;
}

export async function createGame(data: Omit<Game, 'id' | 'createdAt'>): Promise<Game> {
  const games = getFromStorage<Game>(STORAGE_KEYS.GAMES);
  const newGame: Game = {
    ...data,
    id: `game_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  games.push(newGame);
  saveToStorage(STORAGE_KEYS.GAMES, games);
  return newGame;
}

export async function updateGame(id: string, data: Partial<Game>): Promise<Game> {
  const games = getFromStorage<Game>(STORAGE_KEYS.GAMES);
  const index = games.findIndex(g => g.id === id);
  if (index === -1) throw new Error('Game not found');

  games[index] = { ...games[index], ...data };
  saveToStorage(STORAGE_KEYS.GAMES, games);
  return games[index];
}

export async function deleteGame(id: string): Promise<void> {
  const games = getFromStorage<Game>(STORAGE_KEYS.GAMES);
  const filtered = games.filter(g => g.id !== id);
  saveToStorage(STORAGE_KEYS.GAMES, filtered);
}

// ===== Custom Badges =====
export async function getCustomBadges(teacherId: string): Promise<CustomBadge[]> {
  const badges = getFromStorage<CustomBadge>(STORAGE_KEYS.CUSTOM_BADGES);
  return badges.filter(b => b.teacherId === teacherId);
}

export async function createCustomBadge(data: Omit<CustomBadge, 'id' | 'createdAt'>): Promise<CustomBadge> {
  const badges = getFromStorage<CustomBadge>(STORAGE_KEYS.CUSTOM_BADGES);
  const newBadge: CustomBadge = {
    ...data,
    id: `badge_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  badges.push(newBadge);
  saveToStorage(STORAGE_KEYS.CUSTOM_BADGES, badges);
  return newBadge;
}

export async function deleteCustomBadge(id: string): Promise<void> {
  const badges = getFromStorage<CustomBadge>(STORAGE_KEYS.CUSTOM_BADGES);
  const filtered = badges.filter(b => b.id !== id);
  saveToStorage(STORAGE_KEYS.CUSTOM_BADGES, filtered);
}

// ===== Player History (선수별 경기 기록) =====

/**
 * 특정 선수의 경기 기록을 조회합니다
 */
export async function getPlayerHistory(teacherId: string, playerId: string): Promise<PlayerHistory | null> {
  const key = `${STORAGE_KEYS.PLAYER_HISTORY}_${teacherId}`;
  const allHistories = getFromStorage<PlayerHistory>(key);
  return allHistories.find(h => h.playerId === playerId) || null;
}

/**
 * 선수의 경기 기록을 업데이트합니다
 */
export async function updatePlayerHistory(
  teacherId: string,
  playerId: string,
  gameEntry: GameHistoryEntry
): Promise<void> {
  const key = `${STORAGE_KEYS.PLAYER_HISTORY}_${teacherId}`;
  const allHistories = getFromStorage<PlayerHistory>(key);

  const existingIndex = allHistories.findIndex(h => h.playerId === playerId);

  if (existingIndex !== -1) {
    // 기존 기록 업데이트
    allHistories[existingIndex].games.push(gameEntry);
    allHistories[existingIndex].updatedAt = new Date().toISOString();
  } else {
    // 새 기록 생성
    allHistories.push({
      playerId,
      games: [gameEntry],
      updatedAt: new Date().toISOString()
    });
  }

  saveToStorage(key, allHistories);
}

/**
 * 교사의 모든 선수 경기 기록을 조회합니다
 */
export async function getAllPlayerHistories(teacherId: string): Promise<PlayerHistory[]> {
  const key = `${STORAGE_KEYS.PLAYER_HISTORY}_${teacherId}`;
  return getFromStorage<PlayerHistory>(key);
}

/**
 * 선수의 상세 경기 기록을 조회합니다 (FinishedGame과 조인)
 */
export async function getPlayerDetailedHistory(teacherId: string, playerId: string): Promise<FinishedGame[]> {
  const history = await getPlayerHistory(teacherId, playerId);
  if (!history) return [];

  const finishedGames = await getFinishedGames(teacherId);
  const gameMap = new Map(finishedGames.map(g => [g.id, g]));

  return history.games
    .map(entry => gameMap.get(entry.gameId))
    .filter((game): game is FinishedGame => game !== undefined);
}

// ===== Finished Games (완료된 경기) =====

/**
 * 완료된 경기를 저장합니다
 */
export async function saveFinishedGame(teacherId: string, game: FinishedGame): Promise<void> {
  const key = `${STORAGE_KEYS.FINISHED_GAMES}_${teacherId}`;
  const finishedGames = getFromStorage<FinishedGame>(key);

  // 중복 체크
  const existingIndex = finishedGames.findIndex(g => g.id === game.id);
  if (existingIndex !== -1) {
    finishedGames[existingIndex] = game;
  } else {
    finishedGames.push(game);
  }

  saveToStorage(key, finishedGames);
}

/**
 * 완료된 경기 목록을 조회합니다
 */
export async function getFinishedGames(teacherId: string, limit?: number): Promise<FinishedGame[]> {
  const key = `${STORAGE_KEYS.FINISHED_GAMES}_${teacherId}`;
  const finishedGames = getFromStorage<FinishedGame>(key);

  // 날짜순 정렬 (최신순)
  const sorted = finishedGames.sort((a, b) =>
    new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime()
  );

  return limit ? sorted.slice(0, limit) : sorted;
}

/**
 * 완료된 경기 목록을 실시간으로 구독합니다
 * (localStorage 기반이므로 storage 이벤트 사용)
 *
 * @returns unsubscribe 함수
 */
export function subscribeToFinishedGames(
  teacherId: string,
  callback: (games: FinishedGame[]) => void
): () => void {
  const key = `${STORAGE_KEYS.FINISHED_GAMES}_${teacherId}`;

  // 초기 데이터 전달
  getFinishedGames(teacherId).then(callback);

  // storage 이벤트 리스너 (다른 탭에서 변경 시)
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === key) {
      getFinishedGames(teacherId).then(callback);
    }
  };

  window.addEventListener('storage', handleStorageChange);

  // unsubscribe 함수
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}
