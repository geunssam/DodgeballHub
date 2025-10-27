'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface HeartAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  currentLives: number;
  onAdjust: (delta: number) => void;
}

export function HeartAdjustModal({
  isOpen,
  onClose,
  studentName,
  currentLives,
  onAdjust,
}: HeartAdjustModalProps) {
  const handleAdjust = (delta: number) => {
    onAdjust(delta);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{studentName}</DialogTitle>
          <DialogDescription>
            현재 하트: ❤️ {currentLives}개
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="text-center">
            <p className="text-5xl font-bold mb-4">❤️ {currentLives}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleAdjust(-1)}
              variant="outline"
              size="lg"
              className="h-16 text-lg bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
              disabled={currentLives <= 0}
            >
              ➖ 하트 감소
            </Button>
            <Button
              onClick={() => handleAdjust(1)}
              variant="outline"
              size="lg"
              className="h-16 text-lg bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
            >
              ➕ 하트 증가
            </Button>
          </div>

          <Button onClick={onClose} variant="ghost" className="mt-2">
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
