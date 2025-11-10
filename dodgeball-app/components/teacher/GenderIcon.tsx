'use client';

import { cn } from '@/lib/utils';

interface GenderIconProps {
  gender?: 'male' | 'female';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function GenderIcon({ gender, size = 'md', className }: GenderIconProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-base';
      case 'md':
        return 'text-xl';
      case 'lg':
        return 'text-2xl';
      default:
        return 'text-xl';
    }
  };

  if (!gender) {
    return null;
  }

  return (
    <span className={cn(getSizeClasses(), className)}>
      {gender === 'male' ? '👨‍🎓' : '👩‍🎓'}
    </span>
  );
}
