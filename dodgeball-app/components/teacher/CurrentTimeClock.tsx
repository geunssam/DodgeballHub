'use client';

import { useEffect, useState } from 'react';

export function CurrentTimeClock() {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // 24시간 형식
      });
      setCurrentTime(timeString);
    };

    updateTime(); // 초기 렌더링
    const interval = setInterval(updateTime, 1000); // 1초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-gray-700">
      <span className="text-lg">🕐</span>
      <span className="text-lg font-mono font-semibold">
        {currentTime || '--:--:--'}
      </span>
    </div>
  );
}
