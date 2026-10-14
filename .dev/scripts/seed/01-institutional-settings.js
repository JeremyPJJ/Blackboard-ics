// ============================================================
// 01-institutional-settings.js
// Configuración institucional (singleton — máximo 1 documento)
// ============================================================

function seedInstitutionalSettings() {
  print("\n📋 Insertando configuración institucional...");

  db.institutional_settings.deleteMany({});

  db.institutional_settings.insertOne({
    _id: IDS.institutionalSettings,

    // === IDENTIDAD INSTITUCIONAL ===
    institutionName: "Instituto de Educación Superior Tecnológico Privado Ciencias de la Salud",
    logo: IDS.fileLogo,

    // === BRANDING ===
    colors: {
      primary: "#1a56db",     // Azul institucional
      secondary: "#d4a017",   // Dorado
      success: "#22c55e",     // Verde (éxito)
      danger: "#ef4444",      // Rojo (alertas)
      light: "#f3f4f6",       // Gris claro
      white: "#ffffff",       // Blanco
    },

    // === ARCHIVOS ===
    maxFileSizeBytes: 52428800, // 50MB
    allowedFileTypes: ["pdf", "word", "excel", "powerpoint", "image", "audio", "video", "zip", "richtext"],

    // === PAPELERA Y ARCHIVADO ===
    trashRetentionDays: 30,
    archiveAfterDays: 365,

    // === SEGURIDAD ===
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecial: false,
      maxAgeDays: 90,
      historyCount: 5,
    },
    jwtAccessTokenTtlMinutes: 15,
    jwtRefreshTokenTtlDays: 30,

    // === ZONA HORARIA ===
    timezone: "America/Lima",

    // === EXÁMENES ===
    examDefaultMessage: "Estimado estudiante, mantenga la honestidad académica durante el examen.",

    // === SMTP (placeholder — no configurado para demo) ===
    smtp: {
      host: null,
      port: 587,
      secure: false,
      user: null,
      pass: null,
      fromName: "Plataforma Virtual ICS",
      fromEmail: "noreply@ics.edu.pe",
    },

    // === AUDITORÍA ===
    updatedBy: IDS.superAdmin,

    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-08-20T10:00:00Z"),
  });

  print("✅ Configuración institucional insertada.");
}
