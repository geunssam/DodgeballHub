/**
 * Firebase 초기화 및 설정
 *
 * Firebase SDK를 초기화하고 Firestore 인스턴스를 제공합니다.
 * 환경변수를 통해 Firebase Config를 관리합니다.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase Config (환경변수에서 로드)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase 앱 초기화 (중복 초기화 방지)
let app: FirebaseApp;

if (!getApps().length) {
  // Firebase 앱이 아직 초기화되지 않은 경우
  app = initializeApp(firebaseConfig);
} else {
  // 이미 초기화된 Firebase 앱 사용
  app = getApps()[0];
}

// Firestore 인스턴스 생성
export const db: Firestore = getFirestore(app);

// Firebase 앱 인스턴스 export
export default app;
