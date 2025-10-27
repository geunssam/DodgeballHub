import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Student } from '@/types';

interface StudentCardProps {
  student: Student;
}

export function StudentCard({ student }: StudentCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: student.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white px-3 py-2 rounded shadow border hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center gap-2">
        {/* 드래그 핸들 */}
        <div className="text-gray-400 text-sm leading-none">⋮⋮</div>

        {/* 메인 정보 */}
        <div className="flex-1 min-w-0">
          <span className="font-bold text-sm">{student.name}</span>
          <span className="text-xs text-gray-600"> ({student.number}번)</span>
        </div>

        {/* 부가 정보 */}
        <div className="text-xs text-right whitespace-nowrap">
          <span className="text-blue-600 font-bold">{student.stats.totalScore}점</span>
          <span className="text-gray-400"> | </span>
          <span className="text-gray-500">{student.stats.gamesPlayed}경기</span>
        </div>
      </div>
    </div>
  );
}
