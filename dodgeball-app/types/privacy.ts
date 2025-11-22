/**
 * 개인정보 동의 관련 타입 정의
 */

/**
 * 개인정보 동의 기록
 */
export interface PrivacyConsent {
  /** 교사 ID (Google UID) */
  teacherId: string;

  /** 교사 이메일 */
  teacherEmail: string;

  /** 동의 유형 (교사 또는 학생) */
  consentType: 'teacher' | 'student';

  /** 개인정보 처리방침 버전 */
  version: string;

  /** 서비스 이용약관 동의 여부 */
  termsAgreed: boolean;

  /** 개인정보 수집 및 이용 동의 여부 */
  dataCollectionAgreed: boolean;

  /** 마케팅 정보 수신 동의 여부 (선택) */
  marketingAgreed: boolean;

  /** 동의 일시 (ISO 8601 형식) */
  agreedAt: string;

  /** IP 주소 (선택, 수집하지 않을 수 있음) */
  ipAddress?: string;

  /** User Agent (브라우저 정보) */
  userAgent?: string;
}

/**
 * 개인정보 처리방침 섹션
 */
export interface PrivacyPolicySection {
  /** 섹션 ID */
  id: string;

  /** 섹션 제목 */
  title: string;

  /** 섹션 내용 */
  content: string;
}

/**
 * 동의 항목 (필수/선택)
 */
export interface ConsentItem {
  /** 항목 ID */
  id: string;

  /** 항목 라벨 */
  label: string;

  /** 필수 여부 */
  required?: boolean;
}

/**
 * 서비스 운영자 정보
 */
export interface ServiceOperator {
  /** 서비스명 */
  serviceName: string;

  /** 운영자 이름 */
  name: string;

  /** 운영자 이메일 */
  email: string;

  /** 운영자 소속 (학교명 등) */
  school: string;
}
