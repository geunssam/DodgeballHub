import { useDroppable } from '@dnd-kit/core';
import { Student } from '@/types';
import { StudentCard } from './StudentCard';

interface TeamDropZoneProps {
  id: string;
  color: string;
  students: Student[];
  allStudents: Student[];
}

const colorClasses = {
  red: 'border-red-300 bg-red-50',
  blue: 'border-blue-300 bg-blue-50',
  green: 'border-green-300 bg-green-50',
  yellow: 'border-yellow-300 bg-yellow-50',
  purple: 'border-purple-300 bg-purple-50',
  orange: 'border-orange-300 bg-orange-50',
  gray: 'border-gray-300 bg-gray-50',
};

export function TeamDropZone({ id, color, students }: TeamDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const colorClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.gray;

  return (
    <div
      ref={setNodeRef}
      className={`
        h-[600px] w-full p-4 rounded-lg border-2 transition-all overflow-y-auto
        ${colorClass}
        ${isOver ? 'border-blue-500 bg-blue-100 scale-[1.02]' : ''}
      `}
    >
      <div className="space-y-2">
        {students.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            학생을 드래그해서 여기로 옮기세요
          </p>
        ) : (
          students.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))
        )}
      </div>
    </div>
  );
}
