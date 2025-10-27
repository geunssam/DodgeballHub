// ===== 교사 =====
export interface Teacher {
  id: string;
  email: string;
  name: string;
  createdAt: string; // ISO 8601 형식
}

// ===== 학급 =====
export interface Class {
  id: string;
  teacherId: string;
  name: string;              // "5학년 3반"
  year: number;              // 2025
  isArchived: boolean;
  createdAt: string;
}

// ===== 학생 =====
export interface StudentStats {
  outs: number;
  passes: number;
  sacrifices: number;
  cookies: number;
  gamesPlayed: number;
  totalScore: number;
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  awardedAt: string;         // ISO 8601
  isAuto: boolean;
  reason?: string;
}

export interface Student {
  id: string;
  classId: string;
  name: string;
  number: number;            // 학생 번호
  classNumber: number;       // 반 번호
  accessCode: string;        // "3-5-김철수"
  stats: StudentStats;
  badges: Badge[];
  createdAt: string;
}

// ===== 팀 =====
export interface TeamMemberAssignment {
  studentId: string;
  name: string;              // 학생 이름
  number: number;            // 학생 번호
  classId: string;           // 학생의 원래 학급 ID
  className?: string;        // 학급명 (예: "5학년 3반")
  position: "infield" | "outfield";
}

export interface Team {
  id: string;
  teacherId: string;         // 팀을 생성한 교사 ID (학급에 독립적)
  name: string;              // "팀 A"
  color: string;             // "red", "blue", etc.
  members: TeamMemberAssignment[];
  sourceClassIds?: string[]; // 팀원들이 속한 학급 ID 목록 (통계용)
  createdAt: string;
}

// ===== 경기 =====
export type OuterCourtRule =
  | "normal_catch_attack_right"       // 일반 옵션
  | "catch_revive_teammate"           // 공 잡으면 팀원 부활
  | "catch_self_life"                 // 공 잡으면 본인 하트 +1
  | "outer_hit_revive_self"           // 외야에서 아웃시키면 본인 부활
  | "outer_hit_revive_teammate";      // 외야에서 아웃시키면 팀원 부활

export interface BallAddition {
  minutesBefore: number;
}

export interface GameSettings {
  useOuterCourt: boolean;
  outerCourtRules: OuterCourtRule[];
  ballAdditions: BallAddition[];
}

export interface TeamMember {
  studentId: string;
  initialLives: number;
  currentLives: number;
  isInOuterCourt: boolean;
  position: "inner" | "outer";
}

export interface GameTeam {
  teamId: string;
  name: string;
  color: string;
  members: TeamMember[];
}

export interface GameRecord {
  studentId: string;
  outs: number;
  passes: number;
  sacrifices: number;
  cookies: number;
}

export interface Game {
  id: string;
  teacherId: string;         // 경기를 생성한 교사 ID
  classIds: string[];        // 참여 학급들 (다중 학급 지원)
  hostClassId: string;       // 경기를 생성한 주최 학급
  date: string;              // ISO 8601
  duration: number;          // 분
  settings: GameSettings;
  currentBalls: number;
  teams: GameTeam[];
  records: GameRecord[];
  winner?: string;           // teamId
  isCompleted: boolean;
  createdAt: string;
  currentTime?: number;      // 현재 남은 시간 (초) - 실시간 저장
  isPaused?: boolean;        // 일시정지 상태
  lastUpdated?: string;      // 마지막 업데이트 시각 (ISO 8601)
}

// ===== 커스텀 배지 =====
export interface CustomBadge {
  id: string;
  teacherId: string;
  name: string;
  emoji: string;
  description: string;
  createdAt: string;
}

// ===== 자동 배지 조건 =====
export interface AutoBadgeCondition {
  id: string;
  name: string;
  emoji: string;
  condition: (stats: StudentStats) => boolean;
}
