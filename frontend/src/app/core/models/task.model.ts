export enum TaskStatus {
  BORRADOR = 'borrador',
  PUBLICADA = 'publicada',
}

export enum GradingType {
  MANUAL = 'manual',
  AUTOMATICA = 'automatica',
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  courseId: string;
  weekNumber: number;
  sessionNumber: number;
  deadline?: Date;
  noDeadline: boolean;
  allowedTypes: string[];
  maxFileSize: number;
  maxFiles: number;
  status: TaskStatus;
  gradingType: GradingType;
  maxScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum SubmissionStatus {
  ENTREGADO = 'entregado',
  REVISADO = 'revisado',
  FUERA_DE_FECHA = 'fuera_de_fecha',
  SOLICITUD_PENDIENTE = 'solicitud_pendiente',
  ACEPTADA = 'aceptada',
  RECHAZADA = 'rechazada',
}

export interface TaskSubmission {
  _id: string;
  taskId: string;
  courseId: string;
  studentId: string;
  fileIds: string[];
  comments?: string;
  status: SubmissionStatus;
  submittedAt: Date;
  gradedAt?: Date;
  gradedBy?: string;
  score?: number;
  feedback?: string;
  lateReason?: string;
  isPublished: boolean;
}
