'use client';

/**
 * 개인정보 처리방침 모달 컴포넌트
 *
 * 개인정보 처리방침의 전체 내용을 표시하고 동의를 받습니다.
 * 아코디언 형식으로 섹션 펼치기/접기 가능.
 *
 * Baseball-Firebase의 PrivacyPolicyModal를 Next.js/TypeScript로 변환
 */

import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import {
  PRIVACY_POLICY_VERSION,
  LAST_UPDATED,
  SERVICE_OPERATOR,
  PRIVACY_POLICY_SUMMARY,
  PRIVACY_POLICY_SECTIONS,
  REQUIRED_CONSENTS,
  OPTIONAL_CONSENTS,
} from '@/lib/constants/privacyPolicy';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: (consentData: {
    version: string;
    termsAgreed: boolean;
    dataCollectionAgreed: boolean;
    marketingAgreed: boolean;
  }) => Promise<void>;
  canClose?: boolean; // 강제 동의 모드 (닫기 불가)
}

export function PrivacyPolicyModal({
  isOpen,
  onClose,
  onAgree,
  canClose = true,
}: PrivacyPolicyModalProps) {
  // 동의 상태
  const [consents, setConsents] = useState<Record<string, boolean>>({
    terms: false,
    privacy: false,
    marketing: false,
  });

  // 섹션 펼침/접힘 상태
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // 전체 펼침/접힘 상태
  const [isAllExpanded, setIsAllExpanded] = useState(false);

  // 제출 중 상태
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  /**
   * 섹션 토글
   */
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  /**
   * 전체 펼치기/접기 토글
   */
  const toggleAllSections = () => {
    const newState = !isAllExpanded;
    setIsAllExpanded(newState);

    const newExpandedSections: Record<string, boolean> = {};
    PRIVACY_POLICY_SECTIONS.forEach((section) => {
      newExpandedSections[section.id] = newState;
    });
    setExpandedSections(newExpandedSections);
  };

  /**
   * 동의 항목 토글
   */
  const toggleConsent = (consentId: string) => {
    setConsents((prev) => ({
      ...prev,
      [consentId]: !prev[consentId],
    }));
  };

  /**
   * 전체 동의
   */
  const agreeAll = () => {
    const allConsents: Record<string, boolean> = {};

    [...REQUIRED_CONSENTS, ...OPTIONAL_CONSENTS].forEach((item) => {
      allConsents[item.id] = true;
    });

    setConsents(allConsents);
  };

  /**
   * 모든 필수 항목 동의 확인
   */
  const allRequiredAgreed = REQUIRED_CONSENTS.every((item) => consents[item.id]);

  /**
   * 동의 처리
   */
  const handleAgree = async () => {
    if (!allRequiredAgreed) {
      alert('필수 항목에 모두 동의해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      await onAgree({
        version: PRIVACY_POLICY_VERSION,
        termsAgreed: consents.terms,
        dataCollectionAgreed: consents.privacy,
        marketingAgreed: consents.marketing || false,
      });
    } catch (error) {
      console.error('동의 처리 오류:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                개인정보 처리방침
              </h2>
              <p className="text-sm text-gray-500">
                버전 {PRIVACY_POLICY_VERSION} | 최종 업데이트: {LAST_UPDATED}
              </p>
            </div>

            {/* 닫기 버튼 (강제 동의 모드에서는 숨김) */}
            {canClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="닫기"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* 요약 박스 */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900 whitespace-pre-line">
              {PRIVACY_POLICY_SUMMARY}
            </p>
          </div>

          {/* 강제 동의 안내 */}
          {!canClose && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
              <p className="text-sm text-yellow-900 font-medium">
                ⚠️ 서비스 이용을 위해서는 개인정보 처리방침에 동의해야 합니다.
              </p>
            </div>
          )}
        </div>

        {/* 본문 (스크롤 가능) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 전체 펼치기/접기 버튼 */}
          <div className="flex justify-end">
            <button
              onClick={toggleAllSections}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              {isAllExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  전체 접기
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  전체 펼치기
                </>
              )}
            </button>
          </div>

          {/* 섹션들 (아코디언) */}
          {PRIVACY_POLICY_SECTIONS.map((section) => {
            const isExpanded = expandedSections[section.id];

            return (
              <div
                key={section.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* 섹션 헤더 (클릭 시 토글) */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                >
                  <span className="font-semibold text-gray-900">
                    {section.title}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>

                {/* 섹션 내용 */}
                {isExpanded && (
                  <div className="p-4 bg-white">
                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* 운영자 정보 */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">운영자 정보</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>서비스명: {SERVICE_OPERATOR.serviceName}</p>
              <p>운영자: {SERVICE_OPERATOR.name}</p>
              <p>소속: {SERVICE_OPERATOR.school}</p>
              <p>이메일: {SERVICE_OPERATOR.email}</p>
            </div>
          </div>
        </div>

        {/* 푸터 (동의 체크박스 및 버튼) */}
        <div className="p-6 border-t border-gray-200 flex-shrink-0 bg-gray-50">
          <div className="space-y-4">
            {/* 전체 동의 버튼 */}
            <button
              onClick={agreeAll}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
            >
              전체 동의
            </button>

            {/* 필수 동의 항목 */}
            <div className="space-y-2">
              {REQUIRED_CONSENTS.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={consents[item.id] || false}
                    onChange={() => toggleConsent(item.id)}
                    className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900 group-hover:text-gray-700">
                    <span className="font-semibold text-red-600">[필수]</span>{' '}
                    {item.label}
                  </span>
                </label>
              ))}
            </div>

            {/* 선택 동의 항목 */}
            {OPTIONAL_CONSENTS.length > 0 && (
              <div className="space-y-2">
                {OPTIONAL_CONSENTS.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={consents[item.id] || false}
                      onChange={() => toggleConsent(item.id)}
                      className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-600">
                      <span className="font-semibold text-gray-500">[선택]</span>{' '}
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* 동의 버튼 */}
            <div className="flex gap-3 mt-6">
              {/* 나중에 하기 버튼 (닫기 가능할 때만) */}
              {canClose && (
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  나중에 하기
                </button>
              )}

              {/* 동의하기 버튼 */}
              <button
                onClick={handleAgree}
                disabled={!allRequiredAgreed || isSubmitting}
                className={`
                  flex-1 py-3 font-semibold rounded-lg transition-colors
                  ${
                    allRequiredAgreed && !isSubmitting
                      ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {isSubmitting ? '처리 중...' : '동의하고 계속하기'}
              </button>
            </div>

            {/* 필수 동의 안내 */}
            {!allRequiredAgreed && (
              <p className="text-xs text-red-600 text-center mt-2">
                * 필수 항목에 모두 동의해야 서비스를 이용할 수 있습니다.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
