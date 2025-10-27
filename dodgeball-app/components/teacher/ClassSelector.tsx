'use client';

import { Class } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ClassSelectorProps {
  availableClasses: Class[];
  selectedClassIds: string[];
  onSelectionChange: (classIds: string[]) => void;
}

export function ClassSelector({ availableClasses, selectedClassIds, onSelectionChange }: ClassSelectorProps) {
  const toggleClass = (classId: string) => {
    if (selectedClassIds.includes(classId)) {
      onSelectionChange(selectedClassIds.filter(id => id !== classId));
    } else {
      onSelectionChange([...selectedClassIds, classId]);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4">참여 학급 선택</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {availableClasses.map(cls => {
          const isSelected = selectedClassIds.includes(cls.id);
          return (
            <Button
              key={cls.id}
              variant={isSelected ? 'default' : 'outline'}
              onClick={() => toggleClass(cls.id)}
              className="h-16"
            >
              {cls.name}
            </Button>
          );
        })}
      </div>
      {selectedClassIds.length === 0 && (
        <p className="text-sm text-red-500 mt-3">최소 1개 학급을 선택하세요</p>
      )}
    </Card>
  );
}
