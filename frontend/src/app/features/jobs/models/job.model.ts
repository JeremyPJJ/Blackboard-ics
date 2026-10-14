/**
 * Modelos de ofertas laborales (Spec: Job Offers).
 * Los enums reflejan 1:1 los enums del backend (job.schema.ts).
 */
export enum JobStatus {
  ACTIVA = 'activa',
  CERRADA = 'cerrada',
  EXPIRADA = 'expirada',
}

export enum ApplicationStatus {
  POSTULADO = 'postulado',
  EN_ANALISIS = 'en_analisis',
  FINALISTA = 'finalista',
  NO_SELECCIONADO = 'no_seleccionado',
}

export enum JobModality {
  PRESENCIAL = 'presencial',
  REMOTO = 'remoto',
  HIBRIDO = 'hibrido',
}

export interface JobApplication {
  studentId: string;
  appliedAt: Date;
  status: ApplicationStatus;
  coverLetter?: string;
  attachments?: string[];
  notes?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export interface Job {
  _id: string;
  company: string;
  position: string;
  description?: string;
  requirements?: string[];
  career?: string;
  modality?: JobModality;
  salary?: string;
  deadline: Date;
  status: JobStatus;
  applications?: JobApplication[];
  createdBy: string;
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Payload para crear/editar una oferta (job-admin). */
export interface JobPayload {
  company: string;
  position: string;
  description?: string;
  requirements?: string[];
  career?: string;
  modality?: JobModality;
  salary?: string;
  deadline: string;
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.POSTULADO]: 'Postulado',
  [ApplicationStatus.EN_ANALISIS]: 'En análisis',
  [ApplicationStatus.FINALISTA]: 'Finalista',
  [ApplicationStatus.NO_SELECCIONADO]: 'No seleccionado',
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  [JobStatus.ACTIVA]: 'Activa',
  [JobStatus.CERRADA]: 'Cerrada',
  [JobStatus.EXPIRADA]: 'Expirada',
};
