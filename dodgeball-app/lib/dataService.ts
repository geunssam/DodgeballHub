import { Teacher, Class, Student, Team, Game, CustomBadge } from '@/types';
import { STORAGE_KEYS } from './mockData';

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
