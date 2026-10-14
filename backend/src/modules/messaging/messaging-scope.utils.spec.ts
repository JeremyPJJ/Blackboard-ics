import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { assertConversationScope } from './messaging-scope.utils';

/**
 * Pruebas del helper puro de alcance de conversaciones
 * (Spec: Messaging — super_admin, docente con estudiante suyo, compañero del
 * mismo curso, 403 con usuario de otro curso, 400 sin courseId).
 * Se testea con objetos planos, sin base de datos.
 */
describe('messaging-scope.utils (alcance de conversaciones)', () => {
  const teacherId = 'teacher-1';
  const studentAId = 'student-a';
  const studentBId = 'student-b';
  const outsiderId = 'outsider-1';

  function course(teachers: string[] = [], students: string[] = []) {
    return {
      teachers: teachers.map((userId) => ({ userId })),
      students: students.map((userId) => ({ userId })),
    };
  }

  function creator(role: string, id: string) {
    return { role, _id: id };
  }

  describe('super_admin', () => {
    it('permite cualquier participante sin courseId', () => {
      expect(() =>
        assertConversationScope(
          creator('super_admin', 'admin-1'),
          null,
          [outsiderId, studentAId],
        ),
      ).not.toThrow();
    });

    it('permite cualquier participante aunque no pertenezca al curso', () => {
      expect(() =>
        assertConversationScope(
          creator('super_admin', 'admin-1'),
          course([teacherId], [studentAId]),
          [outsiderId],
        ),
      ).not.toThrow();
    });
  });

  describe('docente', () => {
    it('permite conversación con un estudiante de su curso', () => {
      expect(() =>
        assertConversationScope(
          creator('docente', teacherId),
          course([teacherId], [studentAId]),
          [studentAId],
        ),
      ).not.toThrow();
    });

    it('permite conversación con otro docente del mismo curso', () => {
      expect(() =>
        assertConversationScope(
          creator('docente', teacherId),
          course([teacherId, 'teacher-2'], [studentAId]),
          ['teacher-2'],
        ),
      ).not.toThrow();
    });

    it('lanza 403 con un estudiante que no pertenece al curso', () => {
      expect(() =>
        assertConversationScope(
          creator('docente', teacherId),
          course([teacherId], [studentAId]),
          [outsiderId],
        ),
      ).toThrow(ForbiddenException);
    });

    it('lanza 403 si el creador no es docente del curso', () => {
      expect(() =>
        assertConversationScope(
          creator('docente', 'teacher-3'),
          course([teacherId], [studentAId]),
          [studentAId],
        ),
      ).toThrow(ForbiddenException);
    });
  });

  describe('estudiante', () => {
    it('permite conversación con un compañero del mismo curso', () => {
      expect(() =>
        assertConversationScope(
          creator('estudiante', studentAId),
          course([teacherId], [studentAId, studentBId]),
          [studentBId],
        ),
      ).not.toThrow();
    });

    it('permite conversación con el docente de su curso', () => {
      expect(() =>
        assertConversationScope(
          creator('estudiante', studentAId),
          course([teacherId], [studentAId]),
          [teacherId],
        ),
      ).not.toThrow();
    });

    it('lanza 403 con un usuario que solo pertenece a otro curso', () => {
      expect(() =>
        assertConversationScope(
          creator('estudiante', studentAId),
          course([teacherId], [studentAId]),
          [outsiderId],
        ),
      ).toThrow(ForbiddenException);
    });

    it('lanza 403 si el creador no es estudiante del curso', () => {
      expect(() =>
        assertConversationScope(
          creator('estudiante', studentBId),
          course([teacherId], [studentAId]),
          [studentAId],
        ),
      ).toThrow(ForbiddenException);
    });
  });

  describe('courseId obligatorio', () => {
    it('lanza 400 BadRequest si no hay courseId y el creador no es super_admin', () => {
      expect(() =>
        assertConversationScope(creator('docente', teacherId), null, [
          studentAId,
        ]),
      ).toThrow(BadRequestException);
    });
  });
});
