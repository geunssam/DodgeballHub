# Google OAuth 설정 가이드

Google 로그인 기능을 사용하려면 Google Cloud Console에서 OAuth 클라이언트 ID를 생성해야 합니다.

## 📋 단계별 설정 방법

### 1단계: Google Cloud Console 접속
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. Google 계정으로 로그인

### 2단계: 프로젝트 생성 (또는 기존 프로젝트 선택)
1. 상단 메뉴에서 프로젝트 선택 드롭다운 클릭
2. "새 프로젝트" 클릭
3. 프로젝트 이름 입력 (예: "DodgeballHub")
4. "만들기" 클릭

### 3단계: OAuth 동의 화면 구성
1. 좌측 메뉴에서 "APIs & Services" > "OAuth consent screen" 선택
2. User Type 선택:
   - **외부(External)**: 누구나 Google 계정으로 로그인 가능 (권장)
   - 내부(Internal): Google Workspace 조직 내 사용자만 가능
3. "만들기" 클릭
4. 앱 정보 입력:
   - **앱 이름**: DodgeballHub (또는 원하는 이름)
   - **사용자 지원 이메일**: 본인 이메일
   - **개발자 연락처 정보**: 본인 이메일
5. "저장 후 계속" 클릭
6. 범위(Scopes) 단계는 기본값으로 "저장 후 계속"
7. 테스트 사용자 단계도 기본값으로 "저장 후 계속"

### 4단계: OAuth 클라이언트 ID 생성
1. 좌측 메뉴에서 "APIs & Services" > "Credentials" 선택
2. 상단의 "+ CREATE CREDENTIALS" 클릭
3. "OAuth client ID" 선택
4. 애플리케이션 유형 설정:
   - **애플리케이션 유형**: 웹 애플리케이션
   - **이름**: DodgeballHub Web Client (또는 원하는 이름)
5. 승인된 리디렉션 URI 추가:
   - **로컬 개발용**:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - **프로덕션용** (배포 후 추가):
     ```
     https://your-domain.vercel.app/api/auth/callback/google
     ```
6. "만들기" 클릭

### 5단계: 클라이언트 ID와 Secret 복사
1. 생성 완료 후 나타나는 팝업에서:
   - **클라이언트 ID** 복사
   - **클라이언트 보안 비밀번호(Secret)** 복사
2. 또는 Credentials 페이지에서 생성한 OAuth 2.0 클라이언트를 클릭하여 확인 가능

### 6단계: 환경변수 설정
1. 프로젝트 루트의 `.env.local` 파일 열기
2. 복사한 값들을 입력:
   ```env
   GOOGLE_CLIENT_ID=복사한-클라이언트-ID
   GOOGLE_CLIENT_SECRET=복사한-시크릿
   ```
3. 파일 저장

### 7단계: 개발 서버 재시작
```bash
npm run dev
```

## ✅ 설정 완료 체크리스트
- [ ] Google Cloud Console 프로젝트 생성
- [ ] OAuth 동의 화면 구성
- [ ] OAuth 클라이언트 ID 생성
- [ ] 리디렉션 URI 설정 (로컬: http://localhost:3000/api/auth/callback/google)
- [ ] .env.local에 GOOGLE_CLIENT_ID 입력
- [ ] .env.local에 GOOGLE_CLIENT_SECRET 입력
- [ ] 개발 서버 재시작

## 🚀 배포 시 추가 설정
Vercel에 배포할 때는 환경변수를 Vercel 대시보드에도 추가해야 합니다:

1. Vercel 프로젝트 설정 페이지로 이동
2. "Settings" > "Environment Variables" 선택
3. 다음 환경변수들을 추가:
   - `NEXTAUTH_SECRET`: (프로덕션용 새로운 secret 생성 권장)
   - `NEXTAUTH_URL`: https://your-domain.vercel.app
   - `GOOGLE_CLIENT_ID`: 동일한 클라이언트 ID
   - `GOOGLE_CLIENT_SECRET`: 동일한 시크릿
4. Google Cloud Console에서 승인된 리디렉션 URI에 프로덕션 URL 추가:
   ```
   https://your-domain.vercel.app/api/auth/callback/google
   ```

## 🔒 보안 주의사항
- ⚠️ `.env.local` 파일은 절대 Git에 커밋하지 마세요
- ⚠️ GOOGLE_CLIENT_SECRET은 공개되어서는 안 됩니다
- ⚠️ NEXTAUTH_SECRET은 강력한 랜덤 문자열을 사용하세요

## 📚 참고 자료
- [NextAuth.js 공식 문서](https://next-auth.js.org/)
- [Google OAuth 2.0 가이드](https://developers.google.com/identity/protocols/oauth2)
