/**
 * 학생 코드 생성 유틸리티
 * baseball-firebase의 studentCodeGenerator.js 이식
 */

/**
 * 학생 코드 생성
 * teacherId 앞 6자리 + studentId 뒤 6자리
 * 예: "abc123-159001"
 */
export function generateStudentCode(teacherId: string, studentId: string): string {
  const teacherPart = teacherId.replace('teacher_', '').substring(0, 6);
  const studentPart = studentId.replace('student_', '').slice(-6);
  return `${teacherPart}-${studentPart}`;
}

/**
 * 학생 코드에서 teacherId 추출
 */
export function extractTeacherIdFromCode(studentCode: string): string {
  return studentCode.split('-')[0];
}

/**
 * 학생 코드 유효성 검사
 * 형식: {6자리 영숫자}-{6자리 숫자}
 * 예: abc123-159001
 */
export function isValidStudentCode(studentCode: string): boolean {
  const pattern = /^[a-zA-Z0-9]{6}-[0-9]{6}$/;
  return pattern.test(studentCode);
}
