import { GameDefaults } from '@/types';

const STORAGE_KEY = 'dodgeball_game_defaults';

// 초기 기본값
export const DEFAULT_GAME_SETTINGS: GameDefaults = {
  quickStart: {
    duration: 7,           // 7분
    initialLives: 1,       // 1개 하트
    ballAdditions: [],     // 공 추가 없음
  },
  detailedStart: {
    duration: 20,          // 20분
    initialLives: 5,       // 5개 하트
    ballAdditions: [{ minutesBefore: 3 }], // 3분마다 공 추가
  },
};

// localStorage에서 설정 불러오기
export function getGameDefaults(): GameDefaults {
  if (typeof window === 'undefined') {
    return DEFAULT_GAME_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load game defaults:', error);
  }

  return DEFAULT_GAME_SETTINGS;
}

// localStorage에 설정 저장하기
export function saveGameDefaults(defaults: GameDefaults): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  } catch (error) {
    console.error('Failed to save game defaults:', error);
  }
}

// 설정 초기화
export function resetGameDefaults(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset game defaults:', error);
  }
}
