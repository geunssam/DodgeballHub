# Team Independence Refactoring - IR Documents

**프로젝트**: DodgeballHub 팀 독립성 리팩토링
**작성일**: 2025-01-22
**상태**: 설계 완료, 구현 대기

## 문서 개요

팀 관리를 학급 기반에서 교사 기반으로 전환하기 위한 상세 구현 계획 문서입니다.

## 📚 문서 목록

### 핵심 IR 문서

| 문서 | 설명 | 예상 시간 | 우선순위 |
|------|------|-----------|----------|
| [IR_PHASE1_DATA_STRUCTURE.md](./IR_PHASE1_DATA_STRUCTURE.md) | 데이터 구조 재설계 (Team, TeamMember) | 2-3시간 | Critical |
| [IR_PHASE2_DASHBOARD_REDESIGN.md](./IR_PHASE2_DASHBOARD_REDESIGN.md) | Dashboard 학급/팀 관리 분리 | 2-3시간 | High |
| [IR_PHASE3_INDEPENDENT_TEAM_PAGE.md](./IR_PHASE3_INDEPENDENT_TEAM_PAGE.md) | 독립 팀 관리 페이지 구현 | 4-5시간 | Critical |
| [IR_PHASE4_GAME_AND_CLEANUP.md](./IR_PHASE4_GAME_AND_CLEANUP.md) | 경기 설정 통합 및 정리 | 2-3시간 | Medium |

### 지원 문서

| 문서 | 설명 |
|------|------|
| [IR_MIGRATION_STRATEGY.md](./IR_MIGRATION_STRATEGY.md) | 데이터 마이그레이션 전략 및 롤백 |
| [PRD_UPDATE_PLAN.md](./PRD_UPDATE_PLAN.md) | PRD 업데이트 계획 |

## 🎯 전체 로드맵

```
Phase 1: Data Structure (2-3h)
   ↓
Phase 2: Dashboard Redesign (2-3h)
   ↓
Phase 3: Independent Team Page (4-5h)
   ↓
Phase 4: Game Setup & Cleanup (2-3h)
   ↓
Phase 5: Testing & Bug Fixes (2-3h)
```

**총 예상 시간**: 12-17시간

## 🔑 핵심 변경사항

### 1. 데이터 모델

```typescript
// Before
interface Team {
  classId: string;  // ❌ 학급에 종속됨
  teacherId: string;
  members?: TeamMember[];
}

// After
interface Team {
  teacherId: string;  // ✅ 교사 단위 관리
  members: TeamMember[];
  sourceClassIds?: string[];  // ✅ 참여 학급 추적
}

// TeamMember 개선
interface TeamMember {
  studentId: string;
  classId: string;  // ✅ 원래 학급 정보
  className?: string;  // ✅ 표시용
}
```

### 2. URL 구조

```
Before:
  /teacher/class/{classId}/teams         (학급별 팀 관리)
  /teacher/class/{classId}/game/setup    (학급별 경기 설정)

After:
  /teacher/teams                         (독립 팀 관리)
  /teacher/game/new                      (통합 경기 설정)
```

### 3. Dashboard 구조

```
Before:
  - 학급/팀 관리 (혼재)
  - 경기 관리
  - 통계

After:
  - 🏫 학급 관리 (학생만)
  - 👥 팀 관리 (팀만, 독립적)
  - 🏐 경기 관리
  - 📊 통계
```

## 📋 단계별 체크리스트

### Phase 1: Data Structure
- [ ] Team 인터페이스 수정 (`types/index.ts`)
- [ ] TeamMember 인터페이스 수정
- [ ] 마이그레이션 함수 작성 (`lib/migration.ts`)
- [ ] getTeams 함수 수정 (classId → teacherId)
- [ ] createTeam 함수 수정
- [ ] 마이그레이션 테스트

### Phase 2: Dashboard Redesign
- [ ] DashboardView 타입에 'teams' 추가
- [ ] TeamCard 컴포넌트 생성
- [ ] 메인 카드 레이아웃 재구성 (4개)
- [ ] 학급 관리 뷰 수정 (팀 편성 제거)
- [ ] 팀 관리 뷰 추가 (새로)
- [ ] 데이터 로딩 로직 수정

### Phase 3: Independent Team Page
- [ ] `/app/teacher/teams/page.tsx` 생성
- [ ] 모든 학급 학생 로딩
- [ ] 학급별 아코디언 UI
- [ ] 기존 팀 목록 표시
- [ ] 새 팀 생성 폼
- [ ] 드래그앤드롭 구현
- [ ] 팀 랜덤 배정 기능
- [ ] 팀 초기화 기능

### Phase 4: Game Setup & Cleanup
- [ ] `/app/teacher/game/new/page.tsx` 수정
- [ ] teacherId 기반 팀 로딩
- [ ] 팀 선택 UI 개선 (학급 태그)
- [ ] Game 인터페이스에 teacherId 추가
- [ ] 경기 생성 로직 수정
- [ ] 기존 페이지 리디렉션 설정
- [ ] Dashboard 링크 정리

### Phase 5: Testing & Documentation
- [ ] 전체 플로우 테스트
- [ ] 마이그레이션 테스트
- [ ] 롤백 테스트
- [ ] PRD 업데이트
- [ ] 최종 커밋

## 🚀 시작하기

### 1. 현재 작업 백업

```bash
cd /Users/iwongeun/Desktop/DodgeballHub/dodgeball-app
git checkout -b phase1/data-structure
git add .
git commit -m "chore: 팀 독립성 리팩토링 시작 전 백업"
```

### 2. Phase 1 시작

```bash
# IR_PHASE1_DATA_STRUCTURE.md 문서 참고
# Step-by-step으로 진행
```

### 3. 각 Phase 완료 후

```bash
git add .
git commit -m "feat: PhaseN - [작업 내용]"
```

## ⚠️ 주의사항

### Breaking Changes

1. **getTeams 함수**
   ```typescript
   // Before
   getTeams(classId: string)

   // After
   getTeams(teacherId: string)
   ```

2. **Team.classId 삭제**
   - 모든 Team 객체에서 `classId` 필드 제거됨
   - `sourceClassIds` 배열로 대체

3. **URL 변경**
   - 학급별 팀 관리 URL deprecated
   - 자동 리디렉션 설정됨

### 마이그레이션

- ✅ 자동 백업 생성
- ✅ 기존 데이터 보존
- ✅ 롤백 가능
- ⚠️ 한 번만 실행됨 (플래그로 체크)

### 데이터 무결성

- Student.classId는 **절대 변경하지 않음**
- 팀 배정은 TeamMember로 관리
- 학생의 원래 학급 정보 유지

## 📖 각 문서 요약

### Phase 1: Data Structure
**목표**: Team 데이터 구조를 teacherId 기반으로 변경

**주요 작업**:
- Team.classId 삭제
- TeamMember.classId/className 추가
- 마이그레이션 로직 구현
- dataService 함수 수정

**결과**: 팀이 학급에 독립적으로 존재 가능

---

### Phase 2: Dashboard Redesign
**목표**: 학급 관리와 팀 관리를 UI에서 분리

**주요 작업**:
- Dashboard 메인 카드 4개로 재구성
- TeamCard 컴포넌트 생성
- 학급 관리 뷰에서 팀 편성 제거
- 새로운 팀 관리 뷰 추가

**결과**: 사용자가 학급과 팀의 차이를 명확히 인식

---

### Phase 3: Independent Team Page
**목표**: 모든 학급 학생으로 팀을 편성할 수 있는 독립 페이지

**주요 작업**:
- `/teacher/teams` 페이지 구현
- 학급별 아코디언 UI
- 드래그앤드롭 팀원 배정
- 팀 랜덤 배정 / 초기화

**결과**: 여러 학급의 학생으로 자유롭게 팀 구성 가능

---

### Phase 4: Game Setup & Cleanup
**목표**: 경기 설정을 통합하고 기존 페이지 정리

**주요 작업**:
- `/teacher/game/new` 페이지 수정
- teacherId 기반 팀 로딩
- 기존 페이지 리디렉션
- 사용하지 않는 컴포넌트 삭제

**결과**: 모든 팀 중에서 경기 팀 선택 가능

---

### Migration Strategy
**목표**: 안전한 데이터 마이그레이션 및 롤백 전략

**주요 내용**:
- 자동 백업 생성
- 팀 데이터 변환 로직
- 검증 함수
- 롤백 함수
- 개발자 도구

**결과**: 데이터 손실 없이 안전하게 업그레이드

---

### PRD Update Plan
**목표**: PRD 문서에 v2.0 변경사항 반영

**주요 내용**:
- 프로젝트 개요 수정
- 데이터 모델 업데이트
- 페이지 구조 변경
- 마이그레이션 가이드 추가
- Changelog 작성

**결과**: 최신 아키텍처가 문서화됨

## 🤝 협업 가이드

### 코드 리뷰 포인트

1. **데이터 무결성**
   - Student.classId 변경 여부 확인
   - TeamMember.classId 누락 확인

2. **마이그레이션**
   - 백업 생성 확인
   - 검증 로직 확인

3. **UI/UX**
   - 학급/팀 구분 명확성
   - 학급 태그 표시 정확성

### 테스트 시나리오

각 Phase IR 문서에 상세한 테스트 시나리오 포함되어 있음.

## 📞 문의 및 이슈

문제 발생 시:
1. 해당 Phase IR 문서의 "위험 요소" 섹션 확인
2. Migration Strategy 문서의 롤백 절차 참고
3. 필요시 백업으로 복원

---

**작성자**: Claude Code
**최종 수정**: 2025-01-22
**다음 단계**: Phase 1 구현 시작
