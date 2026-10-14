export interface MeetingSession {
  _id: string;
  userId: string;
  courseId: string;
  checkInAt: string;
  checkOutAt?: string;
  durationMinutes?: number;
  title?: string | null;
}

export interface RoomParticipant {
  _id: string;
  userId: string;
  checkInAt: string;
  title?: string | null;
  displayName: string;
}

/** Sesión cerrada del historial (Spec: Meetings O5 — Resumen de reuniones). */
export interface SessionHistoryItem {
  _id: string;
  userId: string;
  checkInAt: string;
  checkOutAt?: string;
  durationMinutes?: number;
  title?: string | null;
  displayName: string;
}