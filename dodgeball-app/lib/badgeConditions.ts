/**
 * 배지 자동 수여 조건 타입 정의 (피구용)
 */

export const CONDITION_TYPES = {
  MANUAL: 'manual',                    // 수동 부여
  AUTO_GAMES: 'auto_games',           // 경기 수
  AUTO_HITS: 'auto_hits',             // 명중
  AUTO_PASSES: 'auto_passes',         // 패스
  AUTO_SACRIFICES: 'auto_sacrifices', // 희생
  AUTO_COOKIES: 'auto_cookies',       // 쿠키
  AUTO_TOTAL_SCORE: 'auto_total_score', // 총점
  AUTO_HIT_RATE: 'auto_hit_rate',     // 명중률 (경기당 평균 명중)
} as const;

export type ConditionType = typeof CONDITION_TYPES[keyof typeof CONDITION_TYPES];

export const CONDITION_LABELS: Record<ConditionType, string> = {
  [CONDITION_TYPES.MANUAL]: '수동 부여',
  [CONDITION_TYPES.AUTO_GAMES]: '경기 수',
  [CONDITION_TYPES.AUTO_HITS]: '명중',
  [CONDITION_TYPES.AUTO_PASSES]: '패스',
  [CONDITION_TYPES.AUTO_SACRIFICES]: '희생',
  [CONDITION_TYPES.AUTO_COOKIES]: '쿠키',
  [CONDITION_TYPES.AUTO_TOTAL_SCORE]: '총점',
  [CONDITION_TYPES.AUTO_HIT_RATE]: '경기당 평균 명중',
};

export const CONDITION_DESCRIPTIONS: Record<ConditionType, string> = {
  [CONDITION_TYPES.MANUAL]: '교사가 직접 배지를 부여합니다',
  [CONDITION_TYPES.AUTO_GAMES]: '특정 횟수 이상 경기에 출전한 학생에게 자동으로 배지를 부여합니다',
  [CONDITION_TYPES.AUTO_HITS]: '특정 개수 이상 명중을 성공한 학생에게 자동으로 배지를 부여합니다',
  [CONDITION_TYPES.AUTO_PASSES]: '특정 개수 이상 패스를 성공한 학생에게 자동으로 배지를 부여합니다',
  [CONDITION_TYPES.AUTO_SACRIFICES]: '특정 개수 이상 희생을 한 학생에게 자동으로 배지를 부여합니다',
  [CONDITION_TYPES.AUTO_COOKIES]: '특정 개수 이상 쿠키를 받은 학생에게 자동으로 배지를 부여합니다',
  [CONDITION_TYPES.AUTO_TOTAL_SCORE]: '특정 점수 이상을 기록한 학생에게 자동으로 배지를 부여합니다',
  [CONDITION_TYPES.AUTO_HIT_RATE]: '경기당 평균 명중이 특정 개수 이상인 학생에게 자동으로 배지를 부여합니다',
};

// 조건 타입별 입력 필드 설정
interface ConditionInputConfig {
  field: string;
  label: string;
  type: 'number';
  min: number;
  max?: number;
  step?: number;
  placeholder: string;
  suffix: string;
}

export const CONDITION_INPUT_CONFIG: Partial<Record<ConditionType, ConditionInputConfig>> = {
  [CONDITION_TYPES.MANUAL]: undefined, // 수동은 입력 필드 없음

  [CONDITION_TYPES.AUTO_GAMES]: {
    field: 'minGames',
    label: '최소 경기 수',
    type: 'number',
    min: 1,
    max: 100,
    placeholder: '예: 10',
    suffix: '경기',
  },

  [CONDITION_TYPES.AUTO_HITS]: {
    field: 'minHits',
    label: '최소 명중 개수',
    type: 'number',
    min: 1,
    max: 500,
    placeholder: '예: 20',
    suffix: '개',
  },

  [CONDITION_TYPES.AUTO_PASSES]: {
    field: 'minPasses',
    label: '최소 패스 개수',
    type: 'number',
    min: 1,
    max: 500,
    placeholder: '예: 15',
    suffix: '개',
  },

  [CONDITION_TYPES.AUTO_SACRIFICES]: {
    field: 'minSacrifices',
    label: '최소 희생 개수',
    type: 'number',
    min: 1,
    max: 100,
    placeholder: '예: 5',
    suffix: '개',
  },

  [CONDITION_TYPES.AUTO_COOKIES]: {
    field: 'minCookies',
    label: '최소 쿠키 개수',
    type: 'number',
    min: 1,
    max: 100,
    placeholder: '예: 10',
    suffix: '개',
  },

  [CONDITION_TYPES.AUTO_TOTAL_SCORE]: {
    field: 'minTotalScore',
    label: '최소 총점',
    type: 'number',
    min: 1,
    max: 10000,
    placeholder: '예: 100',
    suffix: '점',
  },

  [CONDITION_TYPES.AUTO_HIT_RATE]: {
    field: 'minHitRate',
    label: '경기당 최소 평균 명중',
    type: 'number',
    min: 0.1,
    max: 50,
    step: 0.1,
    placeholder: '예: 2.5',
    suffix: '개',
  },
};

/**
 * 조건 데이터 검증 함수
 */
export function validateConditionData(
  conditionType: ConditionType,
  conditionData: Record<string, any>
): { valid: boolean; error?: string } {
  if (conditionType === CONDITION_TYPES.MANUAL) {
    return { valid: true };
  }

  const config = CONDITION_INPUT_CONFIG[conditionType];
  if (!config) {
    return { valid: false, error: '알 수 없는 조건 타입입니다.' };
  }

  const value = conditionData[config.field];

  if (value === undefined || value === null || value === '') {
    return { valid: false, error: `${config.label}을(를) 입력하세요.` };
  }

  const numValue = Number(value);

  if (isNaN(numValue)) {
    return { valid: false, error: '숫자를 입력하세요.' };
  }

  if (config.min !== undefined && numValue < config.min) {
    return { valid: false, error: `최소값은 ${config.min}입니다.` };
  }

  if (config.max !== undefined && numValue > config.max) {
    return { valid: false, error: `최대값은 ${config.max}입니다.` };
  }

  return { valid: true };
}

/**
 * 기본 조건 데이터 생성
 */
export function getDefaultConditionData(conditionType: ConditionType): Record<string, any> | null {
  if (conditionType === CONDITION_TYPES.MANUAL) {
    return null;
  }

  const config = CONDITION_INPUT_CONFIG[conditionType];
  if (!config) return null;

  return {
    [config.field]: config.min || 0
  };
}

/**
 * 학생이 배지 조건을 만족하는지 확인
 */
export function checkConditionMet(
  conditionType: ConditionType,
  conditionData: Record<string, any> | null,
  studentStats: { hits: number; passes: number; sacrifices: number; cookies: number; gamesPlayed: number; totalScore: number }
): boolean {
  if (conditionType === CONDITION_TYPES.MANUAL) {
    return false; // 수동 배지는 자동으로 부여되지 않음
  }

  if (!conditionData) return false;

  switch (conditionType) {
    case CONDITION_TYPES.AUTO_GAMES:
      return studentStats.gamesPlayed >= (conditionData.minGames || 0);

    case CONDITION_TYPES.AUTO_HITS:
      return studentStats.hits >= (conditionData.minHits || 0);

    case CONDITION_TYPES.AUTO_PASSES:
      return studentStats.passes >= (conditionData.minPasses || 0);

    case CONDITION_TYPES.AUTO_SACRIFICES:
      return studentStats.sacrifices >= (conditionData.minSacrifices || 0);

    case CONDITION_TYPES.AUTO_COOKIES:
      return studentStats.cookies >= (conditionData.minCookies || 0);

    case CONDITION_TYPES.AUTO_TOTAL_SCORE:
      return studentStats.totalScore >= (conditionData.minTotalScore || 0);

    case CONDITION_TYPES.AUTO_HIT_RATE: {
      if (studentStats.gamesPlayed === 0) return false;
      const hitRate = studentStats.hits / studentStats.gamesPlayed;
      return hitRate >= (conditionData.minHitRate || 0);
    }

    default:
      return false;
  }
}
