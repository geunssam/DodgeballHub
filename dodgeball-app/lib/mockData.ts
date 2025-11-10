import { Teacher, Class, Student, Team, Game, CustomBadge } from '@/types';

// ===== 교사 Mock Data =====
export const mockTeachers: Teacher[] = [
  {
    id: "teacher1",
    email: "teacher@school.com",
    name: "김교사",
    createdAt: new Date().toISOString()
  }
];

// ===== 학급 Mock Data =====
export const mockClasses: Class[] = [
  {
    id: "class1",
    teacherId: "teacher1",
    name: "5학년 3반",
    year: 2025,
    isArchived: false,
    createdAt: new Date().toISOString()
  }
];

// ===== 학생 Mock Data (11명) =====
export const mockStudents: Student[] = [
  {
    id: "student1",
    classId: "class1",
    name: "김철수",
    number: 1,
    classNumber: 3,
    accessCode: "3-1-김철수",
    stats: {
      outs: 12,
      passes: 8,
      sacrifices: 5,
      cookies: 15,
      gamesPlayed: 2,
      totalScore: 40 // 12 + 8 + 5 + 15 = 40
    },
    badges: [
      {
        id: "first_game",
        name: "첫 출전",
        emoji: "🎽",
        awardedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 전
        isAuto: true
      },
      {
        id: "first_out",
        name: "첫 아웃",
        emoji: "🎯",
        awardedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        isAuto: true
      },
      {
        id: "fire_shooter",
        name: "불꽃 슈터",
        emoji: "🔥",
        awardedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2일 전
        isAuto: true
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "student2",
    classId: "class1",
    name: "이영희",
    number: 2,
    classNumber: 3,
    accessCode: "3-2-이영희",
    stats: {
      outs: 5,
      passes: 15,
      sacrifices: 12,
      cookies: 8,
      gamesPlayed: 2,
      totalScore: 40 // 5 + 15 + 12 + 8 = 40
    },
    badges: [
      {
        id: "first_game",
        name: "첫 출전",
        emoji: "🎽",
        awardedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        isAuto: true
      },
      {
        id: "first_pass",
        name: "첫 패스",
        emoji: "🤝",
        awardedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        isAuto: true
      },
      {
        id: "kind_heart",
        name: "배려왕",
        emoji: "💚",
        awardedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3일 전
        isAuto: true
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "student3",
    classId: "class1",
    name: "박민수",
    number: 3,
    classNumber: 3,
    accessCode: "3-3-박민수",
    stats: {
      outs: 8,
      passes: 10,
      sacrifices: 7,
      cookies: 12,
      gamesPlayed: 2,
      totalScore: 37 // 8 + 10 + 7 + 12 = 37
    },
    badges: [],
    createdAt: new Date().toISOString()
  },
  {
    id: "student4",
    classId: "class1",
    name: "최지훈",
    number: 4,
    classNumber: 3,
    accessCode: "3-4-최지훈",
    stats: {
      outs: 15,
      passes: 5,
      sacrifices: 3,
      cookies: 10,
      gamesPlayed: 2,
      totalScore: 33 // 15 + 5 + 3 + 10 = 33
    },
    badges: [],
    createdAt: new Date().toISOString()
  },
  {
    id: "student5",
    classId: "class1",
    name: "정수진",
    number: 5,
    classNumber: 3,
    accessCode: "3-5-정수진",
    stats: {
      outs: 3,
      passes: 18,
      sacrifices: 15,
      cookies: 20,
      gamesPlayed: 2,
      totalScore: 56 // 3 + 18 + 15 + 20 = 56
    },
    badges: [],
    createdAt: new Date().toISOString()
  },
  {
    id: "student6",
    classId: "class1",
    name: "강민호",
    number: 6,
    classNumber: 3,
    accessCode: "3-6-강민호",
    stats: {
      outs: 10,
      passes: 12,
      sacrifices: 8,
      cookies: 15,
      gamesPlayed: 2,
      totalScore: 45 // 10 + 12 + 8 + 15 = 45
    },
    badges: [],
    createdAt: new Date().toISOString()
  },
  {
    id: "student7",
    classId: "class1",
    name: "윤서연",
    number: 7,
    classNumber: 3,
    accessCode: "3-7-윤서연",
    stats: {
      outs: 7,
      passes: 14,
      sacrifices: 10,
      cookies: 18,
      gamesPlayed: 2,
      totalScore: 49 // 7 + 14 + 10 + 18 = 49
    },
    badges: [],
    createdAt: new Date().toISOString()
  },
  {
    id: "student8",
    classId: "class1",
    name: "임동현",
    number: 8,
    classNumber: 3,
    accessCode: "3-8-임동현",
    stats: {
      outs: 13,
      passes: 6,
      sacrifices: 4,
      cookies: 8,
      gamesPlayed: 2,
      totalScore: 31 // 13 + 6 + 4 + 8 = 31
    },
    badges: [],
    createdAt: new Date().toISOString()
  },
  {
    id: "student9",
    classId: "class1",
    name: "한예린",
    number: 9,
    classNumber: 3,
    accessCode: "3-9-한예린",
    stats: {
      outs: 4,
      passes: 20,
      sacrifices: 13,
      cookies: 25,
      gamesPlayed: 2,
      totalScore: 62 // 4 + 20 + 13 + 25 = 62
    },
    badges: [],
    createdAt: new Date().toISOString()
  },
  {
    id: "student10",
    classId: "class1",
    name: "오태양",
    number: 10,
    classNumber: 3,
    accessCode: "3-10-오태양",
    stats: {
      outs: 11,
      passes: 9,
      sacrifices: 6,
      cookies: 14,
      gamesPlayed: 2,
      totalScore: 40 // 11 + 9 + 6 + 14 = 40
    },
    badges: [],
    createdAt: new Date().toISOString()
  },
  {
    id: "student11",
    classId: "class1",
    name: "서하은",
    number: 11,
    classNumber: 3,
    accessCode: "3-11-서하은",
    stats: {
      outs: 6,
      passes: 16,
      sacrifices: 11,
      cookies: 22,
      gamesPlayed: 2,
      totalScore: 55 // 6 + 16 + 11 + 22 = 55
    },
    badges: [],
    createdAt: new Date().toISOString()
  }
];

// ===== 팀 Mock Data =====
export const mockTeams: Team[] = [
  {
    id: "team_class1_1700000001000_mockred001",
    classId: "class1",
    name: "레드팀",
    color: "red",
    members: [
      { studentId: "student1", position: "infield" },
      { studentId: "student2", position: "infield" },
      { studentId: "student3", position: "infield" },
      { studentId: "student4", position: "infield" },
      { studentId: "student5", position: "infield" }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "team_class1_1700000002000_mockblue001",
    classId: "class1",
    name: "블루팀",
    color: "blue",
    members: [
      { studentId: "student6", position: "infield" },
      { studentId: "student7", position: "infield" },
      { studentId: "student8", position: "infield" },
      { studentId: "student9", position: "infield" },
      { studentId: "student10", position: "infield" },
      { studentId: "student11", position: "infield" }
    ],
    createdAt: new Date().toISOString()
  }
];

// ===== 경기 Mock Data (2개) =====
export const mockGames: Game[] = [
  {
    id: "game1",
    classIds: ["class1"],
    hostClassId: "class1",
    date: "2025-10-15T10:00:00.000Z",
    duration: 10,
    settings: {
      useOuterCourt: true,
      outerCourtRules: ["normal_catch_attack_right", "catch_revive_teammate"],
      ballAdditions: [
        { minutesBefore: 3 },
        { minutesBefore: 1 }
      ]
    },
    currentBalls: 1,
    teams: [
      {
        teamId: "team_class1_1700000001000_mockred001",
        name: "레드팀",
        color: "red",
        members: [
          { studentId: "student1", initialLives: 3, currentLives: 2, isInOuterCourt: false, position: "inner" },
          { studentId: "student3", initialLives: 3, currentLives: 1, isInOuterCourt: false, position: "inner" },
          { studentId: "student5", initialLives: 3, currentLives: 3, isInOuterCourt: false, position: "inner" },
          { studentId: "student7", initialLives: 3, currentLives: 0, isInOuterCourt: true, position: "outer" },
          { studentId: "student9", initialLives: 3, currentLives: 2, isInOuterCourt: false, position: "inner" },
          { studentId: "student11", initialLives: 3, currentLives: 1, isInOuterCourt: false, position: "inner" }
        ]
      },
      {
        teamId: "team_class1_1700000002000_mockblue001",
        name: "블루팀",
        color: "blue",
        members: [
          { studentId: "student2", initialLives: 3, currentLives: 3, isInOuterCourt: false, position: "inner" },
          { studentId: "student4", initialLives: 3, currentLives: 2, isInOuterCourt: false, position: "inner" },
          { studentId: "student6", initialLives: 3, currentLives: 1, isInOuterCourt: false, position: "inner" },
          { studentId: "student8", initialLives: 3, currentLives: 0, isInOuterCourt: true, position: "outer" },
          { studentId: "student10", initialLives: 3, currentLives: 2, isInOuterCourt: false, position: "inner" }
        ]
      }
    ],
    records: [
      { studentId: "student1", outs: 6, passes: 4, sacrifices: 2, cookies: 8 },
      { studentId: "student2", outs: 3, passes: 8, sacrifices: 6, cookies: 4 },
      { studentId: "student3", outs: 4, passes: 5, sacrifices: 3, cookies: 6 },
      { studentId: "student4", outs: 8, passes: 2, sacrifices: 1, cookies: 5 },
      { studentId: "student5", outs: 1, passes: 9, sacrifices: 7, cookies: 10 },
      { studentId: "student6", outs: 5, passes: 6, sacrifices: 4, cookies: 7 },
      { studentId: "student7", outs: 3, passes: 7, sacrifices: 5, cookies: 9 },
      { studentId: "student8", outs: 7, passes: 3, sacrifices: 2, cookies: 4 },
      { studentId: "student9", outs: 2, passes: 10, sacrifices: 6, cookies: 12 },
      { studentId: "student10", outs: 5, passes: 4, sacrifices: 3, cookies: 7 },
      { studentId: "student11", outs: 3, passes: 8, sacrifices: 5, cookies: 11 }
    ],
    winner: "team_class1_1700000001000_mockred001",
    isCompleted: true,
    createdAt: "2025-10-15T09:00:00.000Z"
  },
  {
    id: "game2",
    classIds: ["class1"],
    hostClassId: "class1",
    date: "2025-10-18T14:00:00.000Z",
    duration: 8,
    settings: {
      useOuterCourt: true,
      outerCourtRules: ["normal_catch_attack_right", "catch_self_life", "outer_hit_revive_self"],
      ballAdditions: [
        { minutesBefore: 2 }
      ]
    },
    currentBalls: 2,
    teams: [
      {
        teamId: "team_class1_1700000001000_mockred001",
        name: "레드팀",
        color: "red",
        members: [
          { studentId: "student2", initialLives: 3, currentLives: 1, isInOuterCourt: false, position: "inner" },
          { studentId: "student4", initialLives: 3, currentLives: 2, isInOuterCourt: false, position: "inner" },
          { studentId: "student6", initialLives: 3, currentLives: 0, isInOuterCourt: true, position: "outer" },
          { studentId: "student8", initialLives: 3, currentLives: 3, isInOuterCourt: false, position: "inner" },
          { studentId: "student10", initialLives: 3, currentLives: 1, isInOuterCourt: false, position: "inner" }
        ]
      },
      {
        teamId: "team_class1_1700000002000_mockblue001",
        name: "블루팀",
        color: "blue",
        members: [
          { studentId: "student1", initialLives: 3, currentLives: 2, isInOuterCourt: false, position: "inner" },
          { studentId: "student3", initialLives: 3, currentLives: 1, isInOuterCourt: false, position: "inner" },
          { studentId: "student5", initialLives: 3, currentLives: 3, isInOuterCourt: false, position: "inner" },
          { studentId: "student7", initialLives: 3, currentLives: 0, isInOuterCourt: true, position: "outer" },
          { studentId: "student9", initialLives: 3, currentLives: 2, isInOuterCourt: false, position: "inner" },
          { studentId: "student11", initialLives: 3, currentLives: 1, isInOuterCourt: false, position: "inner" }
        ]
      }
    ],
    records: [
      { studentId: "student1", outs: 6, passes: 4, sacrifices: 3, cookies: 7 },
      { studentId: "student2", outs: 2, passes: 7, sacrifices: 6, cookies: 4 },
      { studentId: "student3", outs: 4, passes: 5, sacrifices: 4, cookies: 6 },
      { studentId: "student4", outs: 7, passes: 3, sacrifices: 2, cookies: 5 },
      { studentId: "student5", outs: 2, passes: 9, sacrifices: 8, cookies: 10 },
      { studentId: "student6", outs: 5, passes: 6, sacrifices: 4, cookies: 8 },
      { studentId: "student7", outs: 4, passes: 7, sacrifices: 5, cookies: 9 },
      { studentId: "student8", outs: 6, passes: 3, sacrifices: 2, cookies: 4 },
      { studentId: "student9", outs: 2, passes: 10, sacrifices: 7, cookies: 13 },
      { studentId: "student10", outs: 6, passes: 5, sacrifices: 3, cookies: 7 },
      { studentId: "student11", outs: 3, passes: 8, sacrifices: 6, cookies: 11 }
    ],
    winner: "team_class1_1700000002000_mockblue001",
    isCompleted: true,
    createdAt: "2025-10-18T13:00:00.000Z"
  }
];

// ===== 커스텀 배지 Mock Data =====
export const mockCustomBadges: CustomBadge[] = [];

// ===== LocalStorage 키 =====
export const STORAGE_KEYS = {
  TEACHERS: 'dodgeball_teachers',
  CLASSES: 'dodgeball_classes',
  STUDENTS: 'dodgeball_students',
  TEAMS: 'dodgeball_teams',
  GAMES: 'dodgeball_games',
  CUSTOM_BADGES: 'dodgeball_custom_badges',
  CURRENT_TEACHER: 'dodgeball_current_teacher',
  PLAYER_HISTORY: 'dodgeball_player_history',    // 선수별 경기 기록
  FINISHED_GAMES: 'dodgeball_finished_games'     // 완료된 경기 목록
};

// ===== 초기화 함수 =====
export function initializeMockData() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.TEACHERS)) {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(mockTeachers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(mockClasses));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(mockStudents));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TEAMS)) {
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(mockTeams));
  }
  if (!localStorage.getItem(STORAGE_KEYS.GAMES)) {
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(mockGames));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOM_BADGES)) {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_BADGES, JSON.stringify(mockCustomBadges));
  }
}

// ===== 개발/테스트용 초기화 함수 =====
export function resetAllData() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEYS.TEACHERS);
  localStorage.removeItem(STORAGE_KEYS.CLASSES);
  localStorage.removeItem(STORAGE_KEYS.STUDENTS);
  localStorage.removeItem(STORAGE_KEYS.TEAMS);
  localStorage.removeItem(STORAGE_KEYS.GAMES);
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_BADGES);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_TEACHER);

  console.log('🔄 LocalStorage 전체 초기화 완료');
  console.log('💡 페이지를 새로고침하면 Mock Data가 다시 로드됩니다.');

  return true;
}
