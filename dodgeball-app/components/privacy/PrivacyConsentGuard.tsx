'use client';

/**
 * 개인정보 동의 가드 컴포넌트
 *
 * 로그인한 교사가 개인정보 처리방침에 동의했는지 확인하고,
 * 동의하지 않았으면 강제로 동의 모달을 표시합니다.
 *
 * Baseball-Firebase의 PrivacyConsentGuard를 Next.js/TypeScript로 변환
 */

import { useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import {
  checkPrivacyConsent,
  savePrivacyConsent,
  createOrUpdateTeacher,
} from '@/lib/firestoreService';
import { PRIVACY_POLICY_VERSION } from '@/lib/constants/privacyPolicy';
import type { PrivacyConsent } from '@/types/privacy';

interface PrivacyConsentGuardProps {
  children: ReactNode;
}

export function PrivacyConsentGuard({ children }: PrivacyConsentGuardProps) {
  const { data: session, status } = useSession();
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isCheckingConsent, setIsCheckingConsent] = useState(true);

  useEffect(() => {
    const checkConsent = async () => {
      // 로그인 전이거나 세션 로딩 중이면 체크 안함
      if (status === 'loading') {
        setIsCheckingConsent(true);
        return;
      }

      // 로그인하지 않았으면 가드 통과
      if (status === 'unauthenticated' || !session?.user?.id) {
        setHasConsent(true);
        setIsCheckingConsent(false);
        return;
      }

      try {
        // Firestore에서 동의 이력 확인
        const consent = await checkPrivacyConsent(
          session.user.id,
          PRIVACY_POLICY_VERSION
        );

        if (consent) {
          // 동의 이력 있음 → 통과
          console.log('✅ 개인정보 동의 확인됨:', consent.agreedAt);
          setHasConsent(true);
          setShowModal(false);
        } else {
          // 동의 이력 없음 → 강제 모달 표시
          console.log('⚠️ 개인정보 동의 필요:', session.user.email);
          setHasConsent(false);
          setShowModal(true);
        }
      } catch (error) {
        console.error('동의 확인 중 오류:', error);
        // 오류 발생 시 일단 통과 (서비스 이용 가능하도록)
        setHasConsent(true);
      } finally {
        setIsCheckingConsent(false);
      }
    };

    checkConsent();
  }, [session?.user?.id, session?.user?.email, status]);

  /**
   * 동의 처리
   */
  const handleAgree = async (consentData: {
    version: string;
    termsAgreed: boolean;
    dataCollectionAgreed: boolean;
    marketingAgreed: boolean;
  }) => {
    if (!session?.user?.id || !session?.user?.email) {
      console.error('세션 정보가 없습니다.');
      return;
    }

    try {
      // 1. ✅ 개인정보 동의 기록 저장
      await savePrivacyConsent({
        teacherId: session.user.id,
        teacherEmail: session.user.email,
        consentType: 'teacher',
        version: consentData.version,
        termsAgreed: consentData.termsAgreed,
        dataCollectionAgreed: consentData.dataCollectionAgreed,
        marketingAgreed: consentData.marketingAgreed,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      });

      console.log('✅ 개인정보 동의 저장 완료');

      // 2. ✅ 동의 후 처음으로 교사 정보를 Firestore에 저장
      await createOrUpdateTeacher(session.user.id, {
        email: session.user.email,
        name: session.user.name || '',
        createdAt: new Date().toISOString(),
      });

      console.log('✅ 교사 정보 DB 저장 완료');

      setHasConsent(true);
      setShowModal(false);
    } catch (error) {
      console.error('동의 처리 중 오류:', error);
      alert('동의 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 로딩 중
  if (isCheckingConsent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">개인정보 동의 확인 중...</p>
        </div>
      </div>
    );
  }

  // 동의하지 않았으면 강제 모달 표시 (배경 블러 처리)
  if (!hasConsent && session?.user && status === 'authenticated') {
    return (
      <>
        {/* 배경 블러 처리 + 클릭 방지 */}
        <div className="blur-sm pointer-events-none select-none">
          {children}
        </div>

        {/* 강제 동의 모달 (닫기 불가) */}
        <PrivacyPolicyModal
          isOpen={showModal}
          onClose={() => {}} // 닫기 불가
          onAgree={handleAgree}
          canClose={false} // 강제 동의
        />
      </>
    );
  }

  // 정상 렌더링
  return <>{children}</>;
}
