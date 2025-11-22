# 🔥 Firebase 설정 가이드

이 가이드는 **dodgeball-app**에 Firebase Firestore를 연동하기 위한 단계별 설정 방법입니다.

---

## 📋 Step 1: Firebase 프로젝트 생성

1. **Firebase Console 접속**
   - 브라우저에서 https://console.firebase.google.com 접속
   - Google 계정으로 로그인 (이미 로그인되어 있을 수 있음)

2. **프로젝트 추가**
   - "프로젝트 추가" 또는 "Add project" 클릭
   - **프로젝트 이름**: `dodgeball-hub` 입력
   - "계속" 클릭

3. **Google Analytics 설정**
   - "이 프로젝트에 Google Analytics 사용 설정" **끄기** (선택 사항)
   - 또는 사용하려면 계정 선택
   - "프로젝트 만들기" 클릭
   - 프로젝트 생성 완료까지 약 30초 소요

---

## 📋 Step 2: Firestore Database 생성

1. **Firestore Database 메뉴 선택**
   - 왼쪽 사이드바에서 "Firestore Database" 클릭
   - 또는 "빌드" → "Firestore Database" 선택

2. **데이터베이스 만들기**
   - "데이터베이스 만들기" 버튼 클릭
   - **모드 선택**:
     - ✅ **프로덕션 모드로 시작** 선택
     - (보안 규칙을 직접 작성할 예정이므로)
   - "다음" 클릭

3. **Firestore 위치 설정**
   - **권장 위치**: `asia-northeast3 (Seoul)` 또는 `asia-northeast1 (Tokyo)`
   - 위치는 나중에 변경할 수 없으므로 신중히 선택
   - "사용 설정" 클릭
   - 데이터베이스 생성 완료까지 약 1-2분 소요

---

## 📋 Step 3: 웹 앱 등록 및 Firebase Config 받기

1. **프로젝트 설정 이동**
   - Firebase Console 왼쪽 상단의 "⚙️ 설정(톱니바퀴)" 아이콘 클릭
   - "프로젝트 설정" 선택

2. **웹 앱 추가**
   - "내 앱" 섹션으로 스크롤
   - **웹 아이콘** `</>` 클릭 (HTML 태그 모양)

3. **앱 등록**
   - **앱 닉네임**: `dodgeball-web` 입력
   - **Firebase Hosting 설정**: ❌ 체크 해제 (Vercel 사용)
   - "앱 등록" 클릭

4. **Firebase SDK 구성 복사**
   - 다음 화면에서 `firebaseConfig` 객체가 표시됩니다
   - **중요**: 아래 값들을 모두 복사해두세요!

```javascript
const firebaseConfig = {
  apiKey: "AIza...",                                    // 복사 필요!
  authDomain: "dodgeball-hub.firebaseapp.com",          // 복사 필요!
  projectId: "dodgeball-hub",                           // 복사 필요!
  storageBucket: "dodgeball-hub.firebasestorage.app",   // 복사 필요!
  messagingSenderId: "123456789",                       // 복사 필요!
  appId: "1:123456789:web:abcdef"                       // 복사 필요!
};
```

5. **복사 완료 후**
   - "콘솔로 이동" 클릭

---

## 📋 Step 4: 승인된 도메인 등록

### 4-1. Authentication 메뉴 이동
- 왼쪽 사이드바에서 "Authentication" 클릭
- 또는 "빌드" → "Authentication" 선택

### 4-2. 도메인 등록
- 상단 탭에서 "Settings" 클릭
- 아래로 스크롤하여 "Authorized domains" 섹션 찾기
- 기본적으로 다음 도메인이 자동 등록되어 있습니다:
  - ✅ `localhost`
  - ✅ `dodgeball-hub.firebaseapp.com`

### 4-3. Vercel 도메인 추가
- "도메인 추가" 버튼 클릭
- **추가할 도메인**: `dodgeball-fedowvo05-zoomwk432-5168s-projects.vercel.app`
- "추가" 클릭

> **참고**: 나중에 커스텀 도메인을 연결하면 여기에 추가로 등록해야 합니다.

---

## ✅ 설정 완료 확인

이제 다음 정보를 모두 준비해야 합니다:

### Firebase Config 6개 값:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dodgeball-hub.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=dodgeball-hub
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=dodgeball-hub.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

---

## 🚀 다음 단계

Firebase Console 설정이 완료되면, Claude에게 다음과 같이 말씀해주세요:

**"Firebase 설정 완료했어. Config 값은:"**

그리고 위에서 복사한 6개의 값을 붙여넣어주세요. 그러면 나머지 코드 구현을 계속 진행하겠습니다!

---

## 📞 문제 발생 시

- Firebase Console에서 오류가 발생하면 스크린샷을 찍어서 보내주세요
- Config 값을 찾을 수 없다면: 프로젝트 설정 → 내 앱 → 웹 앱 선택 → "SDK 설정 및 구성" 섹션 확인

