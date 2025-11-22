/**
 * Firestore 서비스 레이어
 *
 * Firestore 데이터베이스와 상호작용하는 모든 CRUD 함수를 제공합니다.
 * localStorage 기반 dataService.ts를 대체합니다.
 */

import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
  writeBatch,
} from 'firebase/firestore';
import type {
  Teacher,
  Class,
  Student,
  Team,
  Game,
  CustomBadge,
  FinishedGame,
} from '@/types';
import type { PrivacyConsent } from '@/types/privacy';

// ===== 교사 (Teacher) =====

/**
 * 교사 정보 생성 또는 업데이트
 * NextAuth 콜백에서 호출됩니다.
 */
export async function createOrUpdateTeacher(
  teacherId: string,
  data: Omit<Teacher, 'id'>
): Promise<void> {
  const teacherRef = doc(db, 'teachers', teacherId);
  await setDoc(teacherRef, data, { merge: true });
}

/**
 * 교사 정보 조회
 */
export async function getTeacher(teacherId: string): Promise<Teacher | null> {
  const teacherRef = doc(db, 'teachers', teacherId);
  const teacherSnap = await getDoc(teacherRef);

  if (!teacherSnap.exists()) {
    return null;
  }

  return { id: teacherSnap.id, ...teacherSnap.data() } as Teacher;
}

// ===== 학급 (Class) =====

/**
 * 특정 교사의 모든 학급 조회
 */
export async function getClasses(teacherId: string): Promise<Class[]> {
  const q = query(
    collection(db, 'classes'),
    where('teacherId', '==', teacherId),
    where('isArchived', '==', false),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Class[];
}

/**
 * 특정 학급 조회
 */
export async function getClass(classId: string): Promise<Class | null> {
  const classRef = doc(db, 'classes', classId);
  const classSnap = await getDoc(classRef);

  if (!classSnap.exists()) {
    return null;
  }

  return { id: classSnap.id, ...classSnap.data() } as Class;
}

/**
 * 학급 생성
 */
export async function createClass(
  teacherId: string,
  classData: Omit<Class, 'id' | 'teacherId' | 'createdAt'>
): Promise<string> {
  const classRef = await addDoc(collection(db, 'classes'), {
    ...classData,
    teacherId,
    createdAt: new Date().toISOString(),
  });

  return classRef.id;
}

/**
 * 학급 정보 업데이트
 */
export async function updateClass(
  classId: string,
  updates: Partial<Omit<Class, 'id' | 'teacherId'>>
): Promise<void> {
  const classRef = doc(db, 'classes', classId);
  await updateDoc(classRef, updates);
}

/**
 * 학급 삭제 (아카이브)
 */
export async function deleteClass(classId: string): Promise<void> {
  const classRef = doc(db, 'classes', classId);
  await updateDoc(classRef, { isArchived: true });
}

// ===== 학생 (Student) =====

/**
 * 특정 학급의 모든 학생 조회
 */
export async function getStudents(classId: string): Promise<Student[]> {
  const q = query(
    collection(db, 'students'),
    where('classId', '==', classId),
    orderBy('number', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Student[];
}

/**
 * 여러 학급의 모든 학생 조회
 */
export async function getStudentsByClassIds(
  classIds: string[]
): Promise<Student[]> {
  if (classIds.length === 0) return [];

  const q = query(
    collection(db, 'students'),
    where('classId', 'in', classIds),
    orderBy('classId'),
    orderBy('number', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Student[];
}

/**
 * 특정 학생 조회
 */
export async function getStudent(studentId: string): Promise<Student | null> {
  const studentRef = doc(db, 'students', studentId);
  const studentSnap = await getDoc(studentRef);

  if (!studentSnap.exists()) {
    return null;
  }

  return { id: studentSnap.id, ...studentSnap.data() } as Student;
}

/**
 * 학생 생성
 */
export async function createStudent(
  studentData: Omit<Student, 'id' | 'createdAt'>
): Promise<string> {
  const studentRef = await addDoc(collection(db, 'students'), {
    ...studentData,
    createdAt: new Date().toISOString(),
  });

  return studentRef.id;
}

/**
 * 학생 정보 업데이트
 */
export async function updateStudent(
  studentId: string,
  updates: Partial<Omit<Student, 'id'>>
): Promise<void> {
  const studentRef = doc(db, 'students', studentId);
  await updateDoc(studentRef, updates);
}

/**
 * 학생 삭제
 */
export async function deleteStudent(studentId: string): Promise<void> {
  const studentRef = doc(db, 'students', studentId);
  await deleteDoc(studentRef);
}

/**
 * 여러 학생의 스탯/배지 일괄 업데이트
 */
export async function batchUpdateStudents(
  updates: { studentId: string; updates: Partial<Omit<Student, 'id'>> }[]
): Promise<void> {
  const batch = writeBatch(db);

  updates.forEach(({ studentId, updates }) => {
    const studentRef = doc(db, 'students', studentId);
    batch.update(studentRef, updates);
  });

  await batch.commit();
}

// ===== 팀 (Team) =====

/**
 * 특정 교사의 모든 팀 조회
 */
export async function getTeams(teacherId: string): Promise<Team[]> {
  const q = query(
    collection(db, 'teams'),
    where('teacherId', '==', teacherId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Team[];
}

/**
 * 특정 팀 조회
 */
export async function getTeam(teamId: string): Promise<Team | null> {
  const teamRef = doc(db, 'teams', teamId);
  const teamSnap = await getDoc(teamRef);

  if (!teamSnap.exists()) {
    return null;
  }

  return { id: teamSnap.id, ...teamSnap.data() } as Team;
}

/**
 * 팀 생성
 */
export async function createTeam(
  teacherId: string,
  teamData: Omit<Team, 'id' | 'teacherId' | 'createdAt'>
): Promise<string> {
  const teamRef = await addDoc(collection(db, 'teams'), {
    ...teamData,
    teacherId,
    createdAt: new Date().toISOString(),
  });

  return teamRef.id;
}

/**
 * 팀 정보 업데이트
 */
export async function updateTeam(
  teamId: string,
  updates: Partial<Omit<Team, 'id' | 'teacherId'>>
): Promise<void> {
  const teamRef = doc(db, 'teams', teamId);
  await updateDoc(teamRef, updates);
}

/**
 * 팀 삭제
 */
export async function deleteTeam(teamId: string): Promise<void> {
  const teamRef = doc(db, 'teams', teamId);
  await deleteDoc(teamRef);
}

// ===== 경기 (Game) =====

/**
 * 특정 교사의 모든 경기 조회
 */
export async function getGames(teacherId: string): Promise<Game[]> {
  const q = query(
    collection(db, 'games'),
    where('teacherId', '==', teacherId),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Game[];
}

/**
 * 진행 중인 경기만 조회
 */
export async function getActiveGames(teacherId: string): Promise<Game[]> {
  const q = query(
    collection(db, 'games'),
    where('teacherId', '==', teacherId),
    where('isCompleted', '==', false),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Game[];
}

/**
 * 특정 경기 조회
 */
export async function getGame(gameId: string): Promise<Game | null> {
  const gameRef = doc(db, 'games', gameId);
  const gameSnap = await getDoc(gameRef);

  if (!gameSnap.exists()) {
    return null;
  }

  return { id: gameSnap.id, ...gameSnap.data() } as Game;
}

/**
 * 경기 생성
 */
export async function createGame(
  teacherId: string,
  gameData: Omit<Game, 'id' | 'teacherId' | 'createdAt'>
): Promise<string> {
  const gameRef = await addDoc(collection(db, 'games'), {
    ...gameData,
    teacherId,
    createdAt: new Date().toISOString(),
  });

  return gameRef.id;
}

/**
 * 경기 정보 업데이트 (실시간 경기 진행 중)
 */
export async function updateGame(
  gameId: string,
  updates: Partial<Omit<Game, 'id' | 'teacherId'>>
): Promise<void> {
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, {
    ...updates,
    lastUpdated: new Date().toISOString(),
  });
}

/**
 * 경기 삭제
 */
export async function deleteGame(gameId: string): Promise<void> {
  const gameRef = doc(db, 'games', gameId);
  await deleteDoc(gameRef);
}

// ===== 완료된 경기 (Finished Game) =====

/**
 * 특정 교사의 완료된 경기 조회
 */
export async function getFinishedGames(
  teacherId: string
): Promise<FinishedGame[]> {
  const q = query(
    collection(db, 'finishedGames'),
    where('teacherId', '==', teacherId),
    orderBy('finishedAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FinishedGame[];
}

/**
 * 완료된 경기 생성
 */
export async function createFinishedGame(
  finishedGameData: Omit<FinishedGame, 'id'>
): Promise<string> {
  const finishedGameRef = await addDoc(
    collection(db, 'finishedGames'),
    finishedGameData
  );

  return finishedGameRef.id;
}

/**
 * 완료된 경기 업데이트
 */
export async function updateFinishedGame(
  gameId: string,
  updates: Partial<Omit<FinishedGame, 'id'>>
): Promise<void> {
  const gameRef = doc(db, 'finishedGames', gameId);
  await updateDoc(gameRef, updates);
}

/**
 * 완료된 경기 삭제
 */
export async function deleteFinishedGame(gameId: string): Promise<void> {
  const gameRef = doc(db, 'finishedGames', gameId);
  await deleteDoc(gameRef);
}

// ===== 커스텀 배지 (Custom Badge) =====

/**
 * 특정 교사의 커스텀 배지 조회
 */
export async function getCustomBadges(
  teacherId: string
): Promise<CustomBadge[]> {
  const q = query(
    collection(db, 'customBadges'),
    where('teacherId', '==', teacherId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CustomBadge[];
}

/**
 * 커스텀 배지 생성
 */
export async function createCustomBadge(
  teacherId: string,
  badgeData: Omit<CustomBadge, 'id' | 'teacherId' | 'createdAt'>
): Promise<string> {
  const badgeRef = await addDoc(collection(db, 'customBadges'), {
    ...badgeData,
    teacherId,
    createdAt: new Date().toISOString(),
  });

  return badgeRef.id;
}

/**
 * 커스텀 배지 업데이트
 */
export async function updateCustomBadge(
  badgeId: string,
  updates: Partial<Omit<CustomBadge, 'id' | 'teacherId'>>
): Promise<void> {
  const badgeRef = doc(db, 'customBadges', badgeId);
  await updateDoc(badgeRef, updates);
}

/**
 * 커스텀 배지 삭제
 */
export async function deleteCustomBadge(badgeId: string): Promise<void> {
  const badgeRef = doc(db, 'customBadges', badgeId);
  await deleteDoc(badgeRef);
}

// ===== Privacy Consent Operations =====

/**
 * 개인정보 동의 이력 확인
 *
 * @param teacherId - 교사 ID (Google UID)
 * @param requiredVersion - 요구되는 개인정보 처리방침 버전
 * @returns 동의 이력 (없으면 null)
 */
export async function checkPrivacyConsent(
  teacherId: string,
  requiredVersion: string
): Promise<PrivacyConsent | null> {
  try {
    const consentRef = doc(db, 'privacyConsents', teacherId);
    const consentSnap = await getDoc(consentRef);

    if (!consentSnap.exists()) {
      return null;
    }

    const consent = consentSnap.data() as PrivacyConsent;

    // 버전 확인
    if (consent.version !== requiredVersion) {
      console.warn(
        `동의 버전 불일치: ${consent.version} !== ${requiredVersion}`
      );
      return null;
    }

    return consent;
  } catch (error) {
    console.error('개인정보 동의 확인 중 오류:', error);
    throw error;
  }
}

/**
 * 개인정보 동의 저장
 *
 * @param consentData - 동의 정보 (agreedAt 제외)
 */
export async function savePrivacyConsent(
  consentData: Omit<PrivacyConsent, 'agreedAt'>
): Promise<void> {
  try {
    const consentRef = doc(db, 'privacyConsents', consentData.teacherId);

    const dataToSave: PrivacyConsent = {
      ...consentData,
      agreedAt: new Date().toISOString(),
    };

    await setDoc(consentRef, dataToSave);

    console.log('✅ 개인정보 동의 저장 완료:', consentData.teacherId);
  } catch (error) {
    console.error('개인정보 동의 저장 중 오류:', error);
    throw error;
  }
}
