export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  UNIDAD_ACADEMICA = 'unidad_academica',
  SECRETARIA = 'secretaria',
  SOPORTE = 'soporte',
  DOCENTE = 'docente',
  ESTUDIANTE = 'estudiante',
}

export enum UserStatus {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
}

export interface User {
  _id: string;
  dni: string;
  names: string;
  lastNames: string;
  institutionalEmail: string;
  personalEmail?: string;
  phone?: string;
  birthDate?: Date;
  photo?: string;
  role: UserRole;
  tags: string[];
  permissions: string[];
  status: UserStatus;
  contractYear?: number;
  contractSemester?: number;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    _id: string;
    institutionalEmail: string;
    names: string;
    lastNames: string;
    role: UserRole;
    tags: string[];
  };
}
