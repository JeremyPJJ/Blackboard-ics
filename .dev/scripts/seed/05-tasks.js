// ============================================================
// 05-tasks.js
// 3 tareas: 1 con fecha límite futura, 1 pasada, 1 sin límite
// ============================================================

function seedTasks() {
  print("\n📝 Insertando tareas...");

  db.tasks.deleteMany({});

  db.tasks.insertMany([
    // === TAREA 1: ENFERMERÍA — Fecha límite FUTURA ===
    {
      _id: IDS.taskEnfer,
      courseId: IDS.courseEnfer,
      weekNumber: 2,
      sessionNumber: 2,
      title: "Informe de Signos Vitales",
      description: "<p>Elaborar un informe detallado sobre la toma de signos vitales en un paciente simulado.</p><p><strong>Requisitos:</strong></p><ul><li>Registrar los 5 signos vitales (temperatura, FC, FR, PA, SpO2)</li><li>Comparar con valores normales</li><li>Incluir conclusiones</li></ul><p>Formato: PDF. Máximo 5 páginas.</p>",
      config: {
        dueDate: new Date("2026-09-15T23:59:00Z"), // Fecha límite futura
        hasNoLimit: false,
        allowedTypes: ["pdf", "word"],
        maxFileSizeBytes: 20971520, // 20MB
        maxFiles: 3,
        allowMultipleFiles: true,
      },
      status: "publicada",
      publishedAt: new Date("2026-03-12T09:00:00Z"),
      grading: {
        type: "manual",
        weight: 20,
        maxScore: 20,
      },
      createdBy: IDS.teacherEnfer,
      reviewedCount: 1,
      createdAt: new Date("2026-03-10T08:00:00Z"),
      updatedAt: new Date("2026-03-12T09:00:00Z"),
      __v: 1,
    },

    // === TAREA 2: FARMACIA — Fecha límite PASADA (para demo de "fuera de fecha") ===
    {
      _id: IDS.taskFarma,
      courseId: IDS.courseFarma,
      weekNumber: 2,
      sessionNumber: 2,
      title: "Análisis de Interacciones Medicamentosas",
      description: "<p>Identificar y analizar las interacciones medicamentosas en 3 casos clínicos proporcionados.</p><p><strong>Casos:</strong></p><ol><li>Paciente polimedicado con warfarina + AINEs</li><li>Paciente con digoxina + diuréticos</li><li>Paciente con IMAO + ISRS</li></ol><p>Para cada caso: identificar la interacción, mecanismo, consecuencias y recomendación.</p>",
      config: {
        dueDate: new Date("2026-07-01T23:59:00Z"), // Fecha límite PASADA
        hasNoLimit: false,
        allowedTypes: ["pdf", "word", "excel"],
        maxFileSizeBytes: 15728640, // 15MB
        maxFiles: 5,
        allowMultipleFiles: true,
      },
      status: "publicada",
      publishedAt: new Date("2026-03-16T14:00:00Z"),
      grading: {
        type: "manual",
        weight: 25,
        maxScore: 20,
      },
      createdBy: IDS.teacherFarma,
      reviewedCount: 0,
      createdAt: new Date("2026-03-14T10:00:00Z"),
      updatedAt: new Date("2026-03-16T14:00:00Z"),
      __v: 1,
    },

    // === TAREA 3: LABORATORIO — SIN límite de fecha ===
    {
      _id: IDS.taskLab,
      courseId: IDS.courseLab,
      weekNumber: 1,
      sessionNumber: 1,
      title: "Práctica de Microscopía Virtual",
      description: "<p>Realizar la observación de 3 muestras histológicas utilizando el microscopio virtual y elaborar un informe con dibujos y descripciones.</p><p><strong>Muestras a observar:</strong></p><ul><li>Tejido epitelial</li><li>Tejido muscular</li><li>Tejido nervioso</li></ul><p>Para cada muestra: dibujar lo observado, identificar estructuras y describir función.</p>",
      config: {
        dueDate: null, // Sin límite
        hasNoLimit: true,
        allowedTypes: ["pdf", "image", "zip"],
        maxFileSizeBytes: 31457280, // 30MB
        maxFiles: 10,
        allowMultipleFiles: true,
      },
      status: "publicada",
      publishedAt: new Date("2026-03-12T15:00:00Z"),
      grading: {
        type: "manual",
        weight: 15,
        maxScore: 20,
      },
      createdBy: IDS.teacherLab,
      reviewedCount: 1,
      createdAt: new Date("2026-03-10T09:00:00Z"),
      updatedAt: new Date("2026-03-12T15:00:00Z"),
      __v: 1,
    },
  ]);

  print("✅ 3 tareas insertadas (1 futura, 1 pasada, 1 sin límite).");
}
