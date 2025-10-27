# 🏐 DodgeballHub - Phase 2: 게이미피케이션 (상세)

## 📌 Phase 2 개요

**목표**: 배지 시스템 및 종합 점수로 학생 동기부여 극대화
**기간**: 1주
**의존성**: Phase 1 완료 필수

---

## 🎯 Phase 2 완료 조건

- [ ] 자동 배지 12개 조건 정의
- [ ] 경기 종료 시 배지 자동 수여 시스템
- [ ] 배지 중복 방지 로직
- [ ] 종합 점수 계산 알고리즘
- [ ] 학급 순위 시스템
- [ ] 교사 수동 배지 생성 UI
- [ ] 배지 수여 기능
- [ ] 학생 페이지에 배지 표시

---

## 📋 Step별 상세 계획

---

## Step 2-1: 자동 배지 시스템 설계

**예상 소요 시간**: 3시간

### 작업 내용

#### 1. 배지 조건 정의 (`lib/autoBadges.ts`)

```typescript
import { StudentStats, AutoBadgeCondition } from '@/types';

export const AUTO_BADGES: AutoBadgeCondition[] = [
  // 아웃 관련 배지
  {
    id: 'badge_outs_10',
    name: '불꽃 슈터',
    emoji: '🔥',
    condition: (stats: StudentStats) => stats.outs >= 10
  },
  {
    id: 'badge_outs_30',
    name: '화염 저격수',
    emoji: '🎯',
    condition: (stats: StudentStats) => stats.outs >= 30
  },
  {
    id: 'badge_outs_50',
    name: '전설의 포수',
    emoji: '👑',
    condition: (stats: StudentStats) => stats.outs >= 50
  },

  // 패스 관련 배지
  {
    id: 'badge_passes_20',
    name: '패스의 달인',
    emoji: '🤝',
    condition: (stats: StudentStats) => stats.passes >= 20
  },
  {
    id: 'badge_passes_50',
    name: '협동의 마스터',
    emoji: '🏅',
    condition: (stats: StudentStats) => stats.passes >= 50
  },

  // 양보 관련 배지
  {
    id: 'badge_sacrifices_10',
    name: '배려왕',
    emoji: '💚',
    condition: (stats: StudentStats) => stats.sacrifices >= 10
  },
  {
    id: 'badge_sacrifices_25',
    name: '천사의 심장',
    emoji: '😇',
    condition: (stats: StudentStats) => stats.sacrifices >= 25
  },

  // 쿠키 관련 배지
  {
    id: 'badge_cookies_30',
    name: '쿠키 부자',
    emoji: '🍪',
    condition: (stats: StudentStats) => stats.cookies >= 30
  },
  {
    id: 'badge_cookies_100',
    name: '쿠키 재벌',
    emoji: '💰',
    condition: (stats: StudentStats) => stats.cookies >= 100
  },

  // 복합 배지
  {
    id: 'badge_perfect_team_player',
    name: '완벽한 팀원',
    emoji: '⭐',
    condition: (stats: StudentStats) =>
      stats.outs >= 20 && stats.passes >= 20 && stats.sacrifices >= 10
  },

  // 참여 배지
  {
    id: 'badge_games_20',
    name: '경기광',
    emoji: '🏃',
    condition: (stats: StudentStats) => stats.gamesPlayed >= 20
  },
  {
    id: 'badge_games_50',
    name: '체육 마니아',
    emoji: '💪',
    condition: (stats: StudentStats) => stats.gamesPlayed >= 50
  }
];
```

#### 2. 배지 체크 함수

```typescript
import { Student, Badge } from '@/types';
import { AUTO_BADGES } from './autoBadges';

/**
 * 학생의 스탯을 확인하여 새로 획득한 자동 배지를 반환
 */
export function checkNewBadges(student: Student): Badge[] {
  const newBadges: Badge[] = [];

  for (const autoBadge of AUTO_BADGES) {
    // 이미 획득한 배지인지 확인
    const alreadyHas = student.badges.some(b => b.id === autoBadge.id);

    if (!alreadyHas && autoBadge.condition(student.stats)) {
      newBadges.push({
        id: autoBadge.id,
        name: autoBadge.name,
        emoji: autoBadge.emoji,
        awardedAt: new Date().toISOString(),
        isAuto: true
      });
    }
  }

  return newBadges;
}
```

### 체크리스트
- [ ] `lib/autoBadges.ts` 파일 생성
- [ ] 12개 자동 배지 조건 정의
- [ ] `checkNewBadges` 함수 구현
- [ ] 중복 방지 로직 확인
- [ ] TypeScript 에러 없음

---

## Step 2-2: 경기 종료 시 배지 자동 수여

**예상 소요 시간**: 2시간

### 작업 내용

#### `lib/gameEndHandler.ts` - 경기 종료 핸들러

```typescript
import { Game, Student } from '@/types';
import { getStudentById, updateStudent } from './dataService';
import { checkNewBadges } from './badgeService';

export async function handleGameEnd(game: Game): Promise<void> {
  const newBadgesMap: Record<string, Badge[]> = {};

  // 1. 각 학생의 누적 스탯 업데이트
  for (const record of game.records) {
    const student = await getStudentById(record.studentId);
    if (!student) continue;

    // 누적 스탯 계산
    const newStats = {
      outs: student.stats.outs + record.outs,
      passes: student.stats.passes + record.passes,
      sacrifices: student.stats.sacrifices + record.sacrifices,
      cookies: student.stats.cookies + record.cookies,
      gamesPlayed: student.stats.gamesPlayed + 1,
      totalScore: 0 // 아래에서 계산
    };

    newStats.totalScore = calculateTotalScore(newStats);

    // 2. 새로운 배지 체크
    const updatedStudent = { ...student, stats: newStats };
    const newBadges = checkNewBadges(updatedStudent);

    if (newBadges.length > 0) {
      newBadgesMap[student.id] = newBadges;
      updatedStudent.badges = [...student.badges, ...newBadges];
    }

    // 3. 학생 데이터 업데이트
    await updateStudent(student.id, {
      stats: newStats,
      badges: updatedStudent.badges
    });
  }

  // 4. 새 배지 획득 알림 표시
  showNewBadgesNotification(newBadgesMap);
}

function calculateTotalScore(stats: StudentStats): number {
  return (
    stats.outs * 2 +
    stats.passes * 1 +
    stats.sacrifices * 1.5 +
    stats.cookies * 0.5
  );
}

function showNewBadgesNotification(badgesMap: Record<string, Badge[]>) {
  // Toast 알림으로 표시
  Object.entries(badgesMap).forEach(([studentId, badges]) => {
    badges.forEach(badge => {
      console.log(`🎉 새 배지 획득: ${badge.emoji} ${badge.name}`);
      // 실제로는 toast UI로 표시
    });
  });
}
```

### 체크리스트
- [ ] 경기 종료 핸들러 구현
- [ ] 누적 스탯 계산 정확성 확인
- [ ] 종합 점수 계산식 구현
- [ ] 배지 자동 수여 작동
- [ ] 새 배지 알림 표시

---

## Step 2-3: 학급 순위 시스템

**예상 소요 시간**: 2시간

### 작업 내용

#### `lib/rankingService.ts`

```typescript
import { Student } from '@/types';
import { getStudents } from './dataService';

export interface RankedStudent {
  rank: number;
  student: Student;
}

/**
 * 학급 학생들을 종합 점수 기준으로 정렬하여 순위 반환
 */
export async function getClassRanking(classId: string): Promise<RankedStudent[]> {
  const students = await getStudents(classId);

  // 종합 점수 내림차순 정렬
  const sorted = students.sort((a, b) => b.stats.totalScore - a.stats.totalScore);

  // 순위 부여 (동점자 처리)
  let currentRank = 1;
  const ranked: RankedStudent[] = sorted.map((student, index) => {
    if (index > 0 && sorted[index - 1].stats.totalScore !== student.stats.totalScore) {
      currentRank = index + 1;
    }

    return {
      rank: currentRank,
      student
    };
  });

  return ranked;
}

/**
 * TOP N 학생 반환
 */
export async function getTopStudents(classId: string, topN: number = 10): Promise<RankedStudent[]> {
  const ranking = await getClassRanking(classId);
  return ranking.slice(0, topN);
}
```

#### `components/student/RankingDisplay.tsx`

```typescript
import { RankedStudent } from '@/lib/rankingService';
import { Card } from '@/components/ui/card';

interface RankingDisplayProps {
  ranking: RankedStudent[];
  currentStudentId?: string;
}

export function RankingDisplay({ ranking, currentStudentId }: RankingDisplayProps) {
  return (
    <Card className="p-4">
      <h3 className="text-xl font-bold mb-4">🏆 학급 순위 TOP 10</h3>

      <div className="space-y-2">
        {ranking.map(({ rank, student }) => {
          const isMe = student.id === currentStudentId;
          const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';

          return (
            <div
              key={student.id}
              className={`flex items-center gap-3 p-3 rounded ${
                isMe ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50'
              }`}
            >
              <span className="font-bold text-lg w-12">
                {medalEmoji || `${rank}위`}
              </span>
              <span className="flex-1 font-medium">{student.name}</span>
              <span className="text-sm text-gray-600">
                {student.classNumber}반 {student.number}번
              </span>
              <span className="font-bold text-lg text-blue-600">
                {student.stats.totalScore}점
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
```

### 체크리스트
- [ ] 순위 알고리즘 구현
- [ ] 동점자 처리 로직
- [ ] TOP 10 표시 UI
- [ ] 본인 강조 표시
- [ ] 메달 이모지 (1~3위)

---

## Step 2-4: 교사 수동 배지 시스템

**예상 소요 시간**: 3시간

### 작업 내용

#### 1. 커스텀 배지 생성 UI (`components/teacher/CreateCustomBadgeModal.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createCustomBadge } from '@/lib/dataService';

interface CreateCustomBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
}

export function CreateCustomBadgeModal({ isOpen, onClose, teacherId }: CreateCustomBadgeModalProps) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    if (!name || !emoji) {
      alert('이름과 이모지는 필수입니다!');
      return;
    }

    await createCustomBadge({
      teacherId,
      name,
      emoji,
      description
    });

    alert('배지가 생성되었습니다!');
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setEmoji('');
    setDescription('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>커스텀 배지 생성</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">배지 이름 *</Label>
            <Input
              id="name"
              placeholder="예: 리더십 배지"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="emoji">이모지 *</Label>
            <Input
              id="emoji"
              placeholder="🌟"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={2}
            />
          </div>

          <div>
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              placeholder="이 배지는 팀을 잘 이끄는 학생에게 수여됩니다."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>취소</Button>
            <Button onClick={handleCreate}>생성</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

#### 2. 배지 수여 UI (`components/teacher/AwardBadgeModal.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomBadge, Student } from '@/types';
import { updateStudent } from '@/lib/dataService';

interface AwardBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  customBadges: CustomBadge[];
}

export function AwardBadgeModal({ isOpen, onClose, student, customBadges }: AwardBadgeModalProps) {
  const [selectedBadgeId, setSelectedBadgeId] = useState('');
  const [reason, setReason] = useState('');

  const handleAward = async () => {
    const badge = customBadges.find(b => b.id === selectedBadgeId);
    if (!badge) return;

    // 중복 체크
    if (student.badges.some(b => b.id === badge.id)) {
      alert('이미 이 배지를 보유하고 있습니다!');
      return;
    }

    const newBadge = {
      id: badge.id,
      name: badge.name,
      emoji: badge.emoji,
      awardedAt: new Date().toISOString(),
      isAuto: false,
      reason
    };

    await updateStudent(student.id, {
      badges: [...student.badges, newBadge]
    });

    alert(`${badge.emoji} ${badge.name} 배지를 수여했습니다!`);
    onClose();
    setReason('');
    setSelectedBadgeId('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{student.name} 학생에게 배지 수여</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>배지 선택</Label>
            <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
              <SelectTrigger>
                <SelectValue placeholder="배지를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {customBadges.map(badge => (
                  <SelectItem key={badge.id} value={badge.id}>
                    {badge.emoji} {badge.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">수여 사유</Label>
            <Textarea
              id="reason"
              placeholder="예: 친구들을 잘 도와주었어요!"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>취소</Button>
            <Button onClick={handleAward} disabled={!selectedBadgeId}>수여</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 체크리스트
- [ ] 커스텀 배지 생성 모달 UI
- [ ] 배지 수여 모달 UI
- [ ] 중복 수여 방지
- [ ] 수여 사유 입력 기능
- [ ] 수여 완료 알림

---

## ✅ Phase 2 최종 체크리스트

- [ ] 12개 자동 배지 조건 정의 완료
- [ ] `checkNewBadges` 함수 작동
- [ ] 경기 종료 시 배지 자동 수여
- [ ] 배지 중복 방지 로직 확인
- [ ] 종합 점수 계산식 구현
- [ ] 학급 순위 알고리즘 작동
- [ ] TOP 10 순위 UI 표시
- [ ] 커스텀 배지 생성 기능
- [ ] 배지 수여 기능
- [ ] 학생 페이지에 배지 표시
- [ ] 새 배지 알림 표시

---

**다음 단계**: Phase 2 완료 후 [PHASE3_DETAILED.md](./PHASE3_DETAILED.md)로 진행

---

**작성일**: 2025-10-21
**버전**: 1.0
