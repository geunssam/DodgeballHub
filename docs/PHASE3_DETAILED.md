# 🏐 DodgeballHub - Phase 3: 고급 기능 (상세)

## 📌 Phase 3 개요

**목표**: 사용자 편의성 증대 및 데이터 활용 강화
**기간**: 1주
**의존성**: Phase 1, 2 완료 필수

---

## 🎯 Phase 3 완료 조건

- [ ] 경기 히스토리 조회 기능
- [ ] 경기 상세 보기 (재생 모드)
- [ ] 외야 규칙 프리셋 시스템
- [ ] 일시정지 중 스탯 수정 기능
- [ ] CSV/Excel 데이터 내보내기
- [ ] 학급 통계 리포트

---

## 📋 Step별 상세 계획

---

## Step 3-1: 경기 히스토리 시스템

**예상 소요 시간**: 3시간

### 작업 내용

#### 1. 경기 히스토리 목록 페이지 (`app/teacher/class/[classId]/history/page.tsx`)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Game } from '@/types';
import { getGames } from '@/lib/dataService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

export default function GameHistoryPage({ params }: { params: { classId: string } }) {
  const [games, setGames] = useState<Game[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'ongoing'>('all');

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    const allGames = await getGames(params.classId);
    setGames(allGames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const filteredGames = games.filter(game => {
    if (filter === 'completed') return game.isCompleted;
    if (filter === 'ongoing') return !game.isCompleted;
    return true;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">경기 히스토리</h1>

        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            전체
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
          >
            완료
          </Button>
          <Button
            variant={filter === 'ongoing' ? 'default' : 'outline'}
            onClick={() => setFilter('ongoing')}
          >
            진행중
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredGames.map(game => (
          <GameHistoryCard key={game.id} game={game} />
        ))}

        {filteredGames.length === 0 && (
          <p className="text-center text-gray-500 py-8">경기 기록이 없습니다.</p>
        )}
      </div>
    </div>
  );
}

function GameHistoryCard({ game }: { game: Game }) {
  const date = format(new Date(game.date), 'yyyy년 M월 d일 (eee) HH:mm', { locale: ko });

  const teamA = game.teams[0];
  const teamB = game.teams[1];

  const teamAAlive = teamA.members.filter(m => m.currentLives > 0).length;
  const teamBAlive = teamB.members.filter(m => m.currentLives > 0).length;

  const winner = game.winner
    ? game.teams.find(t => t.teamId === game.winner)?.name
    : null;

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <Link href={`/teacher/class/${game.classId}/game/${game.id}/detail`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">{date}</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-center">
                <p className={`font-bold ${game.winner === teamA.teamId ? 'text-green-600' : ''}`}>
                  {teamA.name}
                </p>
                <p className="text-2xl">{teamAAlive}</p>
              </div>
              <span className="text-gray-400">vs</span>
              <div className="text-center">
                <p className={`font-bold ${game.winner === teamB.teamId ? 'text-green-600' : ''}`}>
                  {teamB.name}
                </p>
                <p className="text-2xl">{teamBAlive}</p>
              </div>
            </div>
          </div>

          <div className="text-right">
            {game.isCompleted ? (
              <div>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  완료
                </span>
                {winner && <p className="mt-2 text-sm">승리: {winner}</p>}
              </div>
            ) : (
              <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                진행중
              </span>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}
```

#### 2. 경기 상세 보기 (`app/teacher/class/[classId]/game/[gameId]/detail/page.tsx`)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Game, Student } from '@/types';
import { getGameById, getStudents } from '@/lib/dataService';
import { DodgeballCourt } from '@/components/teacher/DodgeballCourt';
import { TeamLineupTable } from '@/components/teacher/TeamLineupTable';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function GameDetailPage({ params }: { params: { gameId: string } }) {
  const [game, setGame] = useState<Game | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    loadGameDetail();
  }, []);

  const loadGameDetail = async () => {
    const gameData = await getGameById(params.gameId);
    if (gameData) {
      setGame(gameData);
      const studentData = await getStudents(gameData.classId);
      setStudents(studentData);
    }
  };

  if (!game) return <div>로딩중...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">경기 상세</h1>
        <Button variant="outline" onClick={() => window.history.back()}>
          뒤로 가기
        </Button>
      </div>

      {/* 경기 정보 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-bold mb-2">경기 정보</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">경기 시간</p>
            <p>{game.duration}분</p>
          </div>
          <div>
            <p className="text-gray-500">외야 규칙</p>
            <p>{game.settings.outerCourtRules.length}개 적용</p>
          </div>
          <div>
            <p className="text-gray-500">승리 팀</p>
            <p>{game.teams.find(t => t.teamId === game.winner)?.name || '진행중'}</p>
          </div>
        </div>
      </div>

      {/* 피구 코트 & 라인업 (읽기 전용) */}
      <Tabs defaultValue="court">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="court">피구 코트</TabsTrigger>
          <TabsTrigger value="lineup">라인업 테이블</TabsTrigger>
        </TabsList>

        <TabsContent value="court" className="mt-4">
          <DodgeballCourt
            teams={game.teams}
            students={students}
            onStudentClick={() => {}} // 읽기 전용
          />
        </TabsContent>

        <TabsContent value="lineup" className="mt-4 space-y-4">
          {game.teams.map(team => (
            <TeamLineupTable
              key={team.teamId}
              team={team}
              students={students}
              gameRecords={game.records}
              onStatUpdate={() => {}} // 읽기 전용
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 체크리스트
- [ ] 경기 히스토리 목록 UI
- [ ] 필터링 기능 (전체/완료/진행중)
- [ ] 경기 상세 보기 페이지
- [ ] 읽기 전용 모드 (클릭 비활성화)
- [ ] 뒤로 가기 버튼

---

## Step 3-2: 외야 규칙 프리셋

**예상 소요 시간**: 2시간

### 작업 내용

#### `lib/outerCourtPresets.ts`

```typescript
import { OuterCourtRule } from '@/types';

export interface OuterCourtPreset {
  id: string;
  name: string;
  description: string;
  rules: OuterCourtRule[];
}

export const OUTER_COURT_PRESETS: OuterCourtPreset[] = [
  {
    id: 'preset_basic',
    name: '기본',
    description: '일반적인 피구 규칙',
    rules: ['normal_catch_attack_right']
  },
  {
    id: 'preset_revival',
    name: '부활 모드',
    description: '공 잡으면 부활하는 규칙',
    rules: [
      'normal_catch_attack_right',
      'catch_revive_teammate',
      'catch_self_life'
    ]
  },
  {
    id: 'preset_advanced',
    name: '고급',
    description: '외야에서 던져서 아웃시키면 부활',
    rules: [
      'normal_catch_attack_right',
      'catch_revive_teammate',
      'outer_hit_revive_self',
      'outer_hit_revive_teammate'
    ]
  },
  {
    id: 'preset_custom',
    name: '커스텀',
    description: '사용자 지정 규칙',
    rules: []
  }
];
```

#### 경기 설정 UI에 프리셋 추가

```typescript
'use client';

import { useState } from 'react';
import { OUTER_COURT_PRESETS } from '@/lib/outerCourtPresets';
import { OuterCourtRule } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export function OuterCourtRuleSelector() {
  const [selectedPreset, setSelectedPreset] = useState('preset_basic');
  const [customRules, setCustomRules] = useState<OuterCourtRule[]>([]);

  const currentPreset = OUTER_COURT_PRESETS.find(p => p.id === selectedPreset);

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = OUTER_COURT_PRESETS.find(p => p.id === presetId);
    if (preset && presetId !== 'preset_custom') {
      setCustomRules(preset.rules);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold">외야 규칙 프리셋</h3>

      <div className="grid grid-cols-2 gap-3">
        {OUTER_COURT_PRESETS.map(preset => (
          <Button
            key={preset.id}
            variant={selectedPreset === preset.id ? 'default' : 'outline'}
            onClick={() => handlePresetChange(preset.id)}
            className="h-auto p-4 flex flex-col items-start"
          >
            <span className="font-bold">{preset.name}</span>
            <span className="text-xs text-left">{preset.description}</span>
          </Button>
        ))}
      </div>

      {selectedPreset === 'preset_custom' && (
        <div className="space-y-2">
          <h4 className="font-medium">규칙 선택</h4>
          <Checkbox label="일반 옵션" />
          <Checkbox label="공 잡으면 팀원 부활" />
          <Checkbox label="공 잡으면 본인 하트 +1" />
          <Checkbox label="외야에서 아웃시키면 본인 부활" />
          <Checkbox label="외야에서 아웃시키면 팀원 부활" />
        </div>
      )}
    </div>
  );
}
```

### 체크리스트
- [ ] 3가지 프리셋 정의 (기본/부활/고급)
- [ ] 프리셋 선택 UI
- [ ] 커스텀 모드 (수동 선택)
- [ ] 프리셋 설명 표시

---

## Step 3-3: 일시정지 중 스탯 수정

**예상 소요 시간**: 2시간

### 작업 내용

#### 일시정지 상태에서 수정 가능하도록 변경

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function GamePlayPage() {
  const [isPaused, setIsPaused] = useState(false);
  const [gameData, setGameData] = useState<Game>(initialGameData);

  // 일시정지 중에만 스탯 수정 가능
  const canEditStats = isPaused;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">경기 진행</h1>

        <div className="flex gap-2">
          <Button onClick={() => setIsPaused(!isPaused)}>
            {isPaused ? '재개' : '일시정지'}
          </Button>
          <Button variant="destructive" onClick={handleGameEnd}>
            종료
          </Button>
        </div>
      </div>

      {isPaused && (
        <div className="bg-yellow-100 border border-yellow-400 p-3 rounded">
          <p className="text-sm">
            ⏸️ 일시정지 중입니다. 스탯을 수정할 수 있습니다.
          </p>
        </div>
      )}

      {/* 라인업 테이블 */}
      <TeamLineupTable
        team={team}
        students={students}
        gameRecords={gameData.records}
        onStatUpdate={canEditStats ? handleStatUpdate : undefined}
        readOnly={!canEditStats}
      />
    </div>
  );
}
```

#### `TeamLineupTable` 컴포넌트에 `readOnly` prop 추가

```typescript
interface TeamLineupTableProps {
  team: GameTeam;
  students: Student[];
  gameRecords: GameRecord[];
  onStatUpdate?: (studentId: string, stat: string, delta: number) => void;
  readOnly?: boolean;
}

export function TeamLineupTable({ ..., readOnly = false }: TeamLineupTableProps) {
  const StatButton = ({ ... }) => (
    <div className="flex items-center gap-1">
      <Button
        disabled={readOnly || value === 0}
        onClick={() => onStatUpdate?.(studentId, stat, -1)}
      >
        -
      </Button>
      <span>{value}</span>
      <Button
        disabled={readOnly}
        onClick={() => onStatUpdate?.(studentId, stat, 1)}
      >
        +
      </Button>
    </div>
  );

  // ...
}
```

### 체크리스트
- [ ] 일시정지 버튼 추가
- [ ] 일시정지 상태 표시
- [ ] 일시정지 중에만 스탯 수정 가능
- [ ] readOnly prop으로 버튼 비활성화

---

## Step 3-4: 데이터 내보내기 (CSV/Excel)

**예상 소요 시간**: 3시간

### 작업 내용

#### 1. CSV 내보내기 함수 (`lib/exportService.ts`)

```typescript
import { Student, Game } from '@/types';

/**
 * 학생 스탯을 CSV로 내보내기
 */
export function exportStudentsToCSV(students: Student[]): void {
  const headers = ['번호', '이름', '아웃', '패스', '양보', '쿠키', '경기 수', '종합 점수', '배지 수'];

  const rows = students.map(student => [
    student.number,
    student.name,
    student.stats.outs,
    student.stats.passes,
    student.stats.sacrifices,
    student.stats.cookies,
    student.stats.gamesPlayed,
    student.stats.totalScore,
    student.badges.length
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  downloadCSV(csvContent, `students_${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * 경기 기록을 CSV로 내보내기
 */
export function exportGameToCSV(game: Game, students: Student[]): void {
  const headers = ['번호', '이름', '팀', '하트', '아웃', '패스', '양보', '쿠키'];

  const rows = game.teams.flatMap(team =>
    team.members.map(member => {
      const student = students.find(s => s.id === member.studentId);
      const record = game.records.find(r => r.studentId === member.studentId);

      return [
        student?.number || '',
        student?.name || '',
        team.name,
        member.currentLives,
        record?.outs || 0,
        record?.passes || 0,
        record?.sacrifices || 0,
        record?.cookies || 0
      ];
    })
  );

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  downloadCSV(csvContent, `game_${game.id}_${new Date().toISOString().split('T')[0]}.csv`);
}

function downloadCSV(content: string, filename: string): void {
  // UTF-8 BOM 추가 (한글 깨짐 방지)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

#### 2. 내보내기 버튼 추가

```typescript
import { exportStudentsToCSV, exportGameToCSV } from '@/lib/exportService';
import { Button } from '@/components/ui/button';

export function ExportButtons({ students, game }: { students: Student[], game?: Game }) {
  return (
    <div className="flex gap-2">
      <Button onClick={() => exportStudentsToCSV(students)}>
        학생 스탯 내보내기 (CSV)
      </Button>

      {game && (
        <Button onClick={() => exportGameToCSV(game, students)}>
          경기 기록 내보내기 (CSV)
        </Button>
      )}
    </div>
  );
}
```

### 체크리스트
- [ ] CSV 내보내기 함수 구현
- [ ] 한글 인코딩 처리 (UTF-8 BOM)
- [ ] 학생 스탯 내보내기
- [ ] 경기 기록 내보내기
- [ ] 파일 다운로드 기능

---

## ✅ Phase 3 최종 체크리스트

- [ ] 경기 히스토리 목록 표시
- [ ] 경기 상세 보기 (읽기 전용)
- [ ] 외야 규칙 프리셋 3가지
- [ ] 커스텀 규칙 선택
- [ ] 일시정지 중 스탯 수정 가능
- [ ] CSV 내보내기 기능 (학생/경기)
- [ ] UTF-8 인코딩 처리
- [ ] 모든 기능 정상 작동

---

**다음 단계**: Phase 3 완료 후 [PHASE4_DETAILED.md](./PHASE4_DETAILED.md)로 진행

---

**작성일**: 2025-10-21
**버전**: 1.0
