export enum CourseStatus {
  ACTIVO = 'activo',
  FINALIZADO = 'finalizado',
  CADUCADO = 'caducado',
  ARCHIVADO = 'archivado',
}

export interface Enrollment {
  userId: string;
  role: 'teacher' | 'student';
  enrolledAt: Date;
}

export interface Material {
  type: string;
  title: string;
  description?: string;
  fileId: string;
  url?: string;
}

export interface Session {
  number: number;
  title: string;
  description?: string;
  scheduledDate?: Date;
  materials: Material[];
}

export interface Week {
  number: number;
  title: string;
  description?: string;
  materials: Material[];
  sessions: Session[];
  createdAt?: Date;
}

export interface InvitationConfig {
  code: string;
  expiresAt?: Date;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
}

export interface Course {
  _id: string;
  name: string;
  code: string;
  description?: string;
  coverImage?: string;
  career: string;
  credits?: number;
  year?: number;
  semester?: number;
  cycle?: number;
  createdBy?: string;
  gradebookConfig?: {
    variables?: Array<{ key: string; label: string; weight: number; source: string }>;
    manualScores?: Record<string, number>;
  };
  teachers: Enrollment[];
  students: Enrollment[];
  weeks: Week[];
  startDate: Date;
  endDate: Date;
  expirationDate?: Date;
  status: CourseStatus;
  invitationConfig: InvitationConfig;
  createdAt: Date;
  updatedAt: Date;
}
