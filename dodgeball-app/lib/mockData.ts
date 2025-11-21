import { Teacher, Class, Student, Team, Game, CustomBadge, StudentStats } from '@/types';
import { BADGES } from './badgeSystem';

// ===== Storage Keys =====
export const STORAGE_KEYS = {
  TEACHERS: 'dodgeball_teachers',
  CLASSES: 'dodgeball_classes',
  STUDENTS: 'dodgeball_students',
  TEAMS: 'dodgeball_teams',
  GAMES: 'dodgeball_games',
  CURRENT_TEACHER: 'dodgeball_current_teacher',
  FINISHED_GAMES: 'dodgeball_finished_games',
  CUSTOM_BADGES: 'dodgeball_custom_badges',
};

// ===== 랜덤 생성 헬퍼 함수 =====
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const koreanNames = [
  '김민준', '이서윤', '박도윤', '최서준', '정예은', '강지우', '조서현', '윤하준',
  '장지민', '임서연', '한예준', '오지유', '신지호', '권수아', '황민서', '송지훈',
  '홍채원', '고준우', '배시우', '노유진', '안하린', '문준혁', '서은우', '곽서진',
  '남지윤', '유도현', '전소율', '지민재', '성하은', '표시현', '빈지안', '피승우',
  '하연우', '길나윤', '설채아', '맹시온', '여태양', '경민주', '단하율', '범서아'
];

// 스탯에 따라 배지를 자동으로 생성
const generateBadgesFromStats = (stats: StudentStats): CustomBadge[] => {
  const earnedBadges: CustomBadge[] = [];

  // 모든 배지 정의를 순회하며 조건을 만족하는 배지 추가
  Object.values(BADGES).forEach(badgeDef => {
    if (badgeDef.condition(stats)) {
      earnedBadges.push({
        id: badgeDef.id,
        name: badgeDef.name,
        emoji: badgeDef.icon,
        isAuto: true,
        awardedAt: new Date(Date.now() - getRandomInt(1, 30) * 24 * 60 * 60 * 1000).toISOString()
      });
    }
  });

  return earnedBadges;
};

// 랜덤 스탯 생성
const generateRandomStats = () => {
  const hits = getRandomInt(0, 20);
  const passes = getRandomInt(0, 25);
  const sacrifices = getRandomInt(0, 15);
  const cookies = getRandomInt(0, 20);
  const gamesPlayed = getRandomInt(1, 10);

  return {
    hits,
    passes,
    sacrifices,
    cookies,
    gamesPlayed,
    totalScore: hits + passes + sacrifices + cookies
  };
};

// ===== 교사 Mock Data =====
export const mockTeachers: Teacher[] = [
  {
    id: "teacher1",
    email: "teacher@school.com",
    name: "김교사",
    createdAt: new Date().toISOString()
  }
];

// ===== 학급 Mock Data (4개) =====
export const mockClasses: Class[] = [
  {
    id: "class1",
    teacherId: "teacher1",
    name: "5학년 1반",
    year: 2025,
    isArchived: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "class2",
    teacherId: "teacher1",
    name: "5학년 2반",
    year: 2025,
    isArchived: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "class3",
    teacherId: "teacher1",
    name: "6학년 1반",
    year: 2025,
    isArchived: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "class4",
    teacherId: "teacher1",
    name: "6학년 2반",
    year: 2025,
    isArchived: false,
    createdAt: new Date().toISOString()
  }
];

// ===== 학생 Mock Data 생성 =====
const generateStudents = (): Student[] => {
  const students: Student[] = [];
  let studentIdCounter = 1;
  let nameIndex = 0;

  mockClasses.forEach((classItem, classIndex) => {
    const studentCount = getRandomInt(8, 12); // 각 학급당 8-12명
    const classNumber = classIndex + 1;

    for (let i = 1; i <= studentCount; i++) {
      const name = koreanNames[nameIndex % koreanNames.length];
      nameIndex++;

      // 스탯 생성
      const stats = generateRandomStats();

      // 스탯에 따라 자동으로 배지 생성
      const badges = generateBadgesFromStats(stats);

      students.push({
        id: `student${studentIdCounter}`,
        classId: classItem.id,
        name: name,
        number: i,
        classNumber: classNumber,
        accessCode: `${classNumber}-${i}-${name}`,
        stats: stats,
        badges: badges,
        createdAt: new Date().toISOString()
      });

      studentIdCounter++;
    }
  });

  return students;
};

export const mockStudents: Student[] = generateStudents();

// ===== 팀 Mock Data =====
export const mockTeams: Team[] = [
  {
    id: "team1",
    teacherId: "teacher1",
    classId: "class1",
    name: "레드팀",
    color: "red",
    members: mockStudents
      .filter(s => s.classId === "class1")
      .slice(0, 5)
      .map(s => ({ studentId: s.id, name: s.name })),
    createdAt: new Date().toISOString()
  },
  {
    id: "team2",
    teacherId: "teacher1",
    classId: "class1",
    name: "블루팀",
    color: "blue",
    members: mockStudents
      .filter(s => s.classId === "class1")
      .slice(5, 10)
      .map(s => ({ studentId: s.id, name: s.name })),
    createdAt: new Date().toISOString()
  }
];

// ===== 경기 Mock Data =====
export const mockGames: Game[] = [
  {
    id: "game1",
    teacherId: "teacher1",
    classIds: ["class1"],
    hostClassId: "class1",
    date: new Date().toISOString(),
    duration: 10, // 10분
    settings: {
      useOuterCourt: true,
      outerCourtRules: ["normal_catch_attack_right"],
      ballAdditions: []
    },
    currentBalls: 1,
    teams: [
      {
        teamId: "team1",
        name: "레드팀",
        color: "red",
        members: mockTeams[0].members.map(m => ({
          studentId: m.studentId,
          initialLives: 1,
          currentLives: 1,
          isInOuterCourt: false,
          position: "inner" as const
        }))
      },
      {
        teamId: "team2",
        name: "블루팀",
        color: "blue",
        members: mockTeams[1].members.map(m => ({
          studentId: m.studentId,
          initialLives: 1,
          currentLives: 1,
          isInOuterCourt: false,
          position: "inner" as const
        }))
      }
    ],
    records: [
      ...mockTeams[0].members.map(m => ({
        studentId: m.studentId,
        hits: 0,
        passes: 0,
        sacrifices: 0,
        cookies: 0
      })),
      ...mockTeams[1].members.map(m => ({
        studentId: m.studentId,
        hits: 0,
        passes: 0,
        sacrifices: 0,
        cookies: 0
      }))
    ],
    isCompleted: false,
    createdAt: new Date().toISOString(),
    currentTime: 600, // 10분 = 600초
    isPaused: false,
    lastUpdated: new Date().toISOString()
  }
];

// ===== 커스텀 배지 Mock Data =====
export const mockCustomBadges: CustomBadge[] = [
  {
    id: "custom1",
    name: "노력상",
    emoji: "💪",
    description: "꾸준히 노력하는 모습이 멋져요!",
    isAuto: false,
    awardedAt: new Date().toISOString()
  },
  {
    id: "custom2",
    name: "친구사랑",
    emoji: "❤️",
    description: "친구를 배려하는 마음이 아름다워요",
    isAuto: false,
    awardedAt: new Date().toISOString()
  }
];

// ===== 초기화 함수 =====
export function initializeMockData() {
  if (typeof window === 'undefined') return;

  // 각 키에 대해 데이터가 없으면 mock 데이터로 초기화
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

  if (!localStorage.getItem(STORAGE_KEYS.FINISHED_GAMES)) {
    localStorage.setItem(STORAGE_KEYS.FINISHED_GAMES, JSON.stringify([]));
  }

  // 기본 교사 로그인 설정
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_TEACHER, mockTeachers[0].id);
  }
}
