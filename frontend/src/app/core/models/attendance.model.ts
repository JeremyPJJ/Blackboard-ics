export enum AttendanceStatus {
  PRESENTE = 'presente',
  TARDANZA = 'tardanza',
  AUSENTE = 'ausente',
  JUSTIFICADO = 'justificado',
}

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  markedAt?: Date;
  modifiedBy?: string;
  modifiedAt?: Date;
  reason?: string;
}

export interface AttendanceDate {
  date: Date;
  startTime: Date;
  endTime: Date;
  weekNumber: number;
  sessionNumber: number;
  records: AttendanceRecord[];
}

export interface AttendanceRegister {
  _id: string;
  courseId: string;
  dates: AttendanceDate[];
}
