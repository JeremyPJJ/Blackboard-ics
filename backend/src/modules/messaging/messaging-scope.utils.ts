import { BadRequestException, ForbiddenException } from '@nestjs/common';

/**
 * Helpers puros de validación de alcance de conversaciones.
 * Separados del servicio para poder unit-testear la lógica sin base de datos
 * (Spec: Messaging — validación de alcance en POST /messaging/conversations).
 *
 * Reglas (diseño #179):
 * - super_admin → cualquier participante, courseId opcional.
 * - docente/otros → el creador debe ser docente del curso y cada participante
 *   debe pertenecer al curso (students ∪ teachers).
 * - estudiante → el creador debe ser estudiante del curso y cada participante
 *   debe pertenecer al curso (students ∪ teachers).
 * - Sin courseId (salvo super_admin) → 400 Bad Request.
 * - Fuera de alcance → 403 Forbidden.
 */

export interface ScopeEnrollment {
  userId: string | { toString(): string };
}

export interface ScopeCourse {
  teachers: ScopeEnrollment[];
  students: ScopeEnrollment[];
}

export interface ScopeCreator {
  role: string;
  _id: string | { toString(): string };
}

export function assertConversationScope(
  creator: ScopeCreator,
  course: ScopeCourse | null,
  participants: string[],
): void {
  // super_admin: alcance ilimitado (puede crear incluso sin courseId)
  if (creator.role === 'super_admin') {
    return;
  }

  // courseId obligatorio salvo super_admin
  if (!course) {
    throw new BadRequestException(
      'courseId es obligatorio para crear una conversación',
    );
  }

  const creatorId = String(creator._id);
  const teacherIds = course.teachers.map((t) => String(t.userId));
  const studentIds = course.students.map((s) => String(s.userId));
  const memberIds = new Set([...teacherIds, ...studentIds]);

  // El creador debe participar del curso con el rol correspondiente
  const isCreatorMember =
    creator.role === 'estudiante'
      ? studentIds.includes(creatorId)
      : teacherIds.includes(creatorId);

  if (!isCreatorMember) {
    throw new ForbiddenException(
      'No puedes crear conversaciones en un curso en el que no participas',
    );
  }

  // Cada participante debe pertenecer al curso (students ∪ teachers)
  for (const participant of participants) {
    if (!memberIds.has(String(participant))) {
      throw new ForbiddenException(
        'Uno de los participantes no pertenece al curso de la conversación',
      );
    }
  }
}
