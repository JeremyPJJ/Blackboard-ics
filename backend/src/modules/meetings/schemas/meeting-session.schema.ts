import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MeetingSessionDocument = MeetingSession & Document;

/**
 * Sesión de sala de reuniones (design: Meetings).
 *
 * - `checkInAt`: se crea automáticamente al entrar a la sala (default ahora).
 * - `checkOutAt` / `durationMinutes`: se completan al salir (navegar, cerrar
 *   pestaña o desconectar). Ambos opcionales.
 * - Upsert idempotente: una sesión abierta por `(courseId, userId)` — ver índice
 *   parcial único `checkOutAt: null`.
 */
@Schema({ timestamps: true })
export class MeetingSession {
  @Prop({ type: String, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  checkInAt: Date;

  @Prop({ type: Date, required: false })
  checkOutAt: Date;

  @Prop({ required: false })
  durationMinutes: number;

  /**
   * Título de la reunión (Spec F2 — set-on-create). Solo se fija al CREAR la
   * sesión abierta (primer entrante); el reuso de una sesión existente nunca lo
   * sobrescribe. Opcional y retrocompatible: sesiones legacy caen en el grupo
   * "Sin título" del historial.
   */
  @Prop({ required: false })
  title?: string;
}

export const MeetingSessionSchema = SchemaFactory.createForClass(MeetingSession);

// Índices
MeetingSessionSchema.index({ courseId: 1, userId: 1 });
// Garantiza a nivel de base que no existan DOS sesiones abiertas del mismo usuario
// en el mismo curso (Spec: idempotent join — no duplicate session records).
MeetingSessionSchema.index(
  { courseId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { checkOutAt: null } },
);