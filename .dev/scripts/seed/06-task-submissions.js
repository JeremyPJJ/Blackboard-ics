// ============================================================
// 06-task-submissions.js
// 3 entregas: 1 on-time, 1 late, 1 sin límite
// ============================================================

function seedTaskSubmissions() {
  print("\n📤 Insertando entregas de tareas...");

  db.task_submissions.deleteMany({});

  db.task_submissions.insertMany([
    // === ENTREGA 1: María Torres → Tarea Enfermería (A TIEMPO) ===
    {
      _id: IDS.subEnfer,
      taskId: IDS.taskEnfer,
      studentId: IDS.studentEnfer1,
      courseId: IDS.courseEnfer,
      files: [
        {
          fileMetadataId: IDS.fileSubEnfer,
          originalName: "Informe_Signos_Vitales_MTorres.pdf",
          uploadedAt: new Date("2026-09-10T22:15:00Z"),
        },
      ],
      submittedAt: new Date("2026-09-10T22:15:00Z"), // Antes del deadline (2026-09-15)
      comments: "Adjunto mi informe con los registros de signos vitales del paciente simulado y mis conclusiones.",
      status: "submitted",
      isLate: false,
      lateRequest: null,
      grade: {
        score: null,
        feedback: null,
        gradedBy: null,
        gradedAt: null,
        isPublished: false,
      },
      createdAt: new Date("2026-09-10T22:15:00Z"),
      updatedAt: new Date("2026-09-10T22:15:00Z"),
      __v: 0,
    },

    // === ENTREGA 2: Diego Morales → Tarea Farmacia (FUERA DE FECHA) ===
    {
      _id: IDS.subFarma,
      taskId: IDS.taskFarma,
      studentId: IDS.studentFarma1,
      courseId: IDS.courseFarma,
      files: [
        {
          fileMetadataId: IDS.fileSubFarma,
          originalName: "Trabajo_Interacciones_DMorales.docx",
          uploadedAt: new Date("2026-07-05T23:45:00Z"),
        },
      ],
      submittedAt: new Date("2026-07-05T23:45:00Z"), // 4 días DESPUÉS del deadline (2026-07-01)
      comments: "Disculpe la demora, tuve problemas de conectividad. Adjunto el análisis de los 3 casos clínicos.",
      status: "submitted",
      isLate: true,
      lateRequest: {
        reason: "Problemas de conectividad a internet en mi zona.",
        requestedAt: new Date("2026-07-05T23:50:00Z"),
        status: "pending",
        reviewedBy: null,
        reviewedAt: null,
        reviewComment: null,
      },
      grade: {
        score: null,
        feedback: null,
        gradedBy: null,
        gradedAt: null,
        isPublished: false,
      },
      createdAt: new Date("2026-07-05T23:45:00Z"),
      updatedAt: new Date("2026-07-05T23:50:00Z"),
      __v: 1,
    },

    // === ENTREGA 3: César Peña → Tarea Laboratorio (SIN límite, entregado) ===
    {
      _id: IDS.subLab,
      taskId: IDS.taskLab,
      studentId: IDS.studentLab1,
      courseId: IDS.courseLab,
      files: [
        {
          fileMetadataId: IDS.fileSubLab,
          originalName: "Practica_Microscopia_CPeña.pdf",
          uploadedAt: new Date("2026-03-20T15:30:00Z"),
        },
      ],
      submittedAt: new Date("2026-03-20T15:30:00Z"),
      comments: "Informe de la práctica de microscopía con los dibujos de las 3 muestras observadas.",
      status: "reviewed",
      isLate: false,
      lateRequest: null,
      grade: {
        score: 17,
        feedback: "Buen trabajo. Los dibujos son detallados y las descripciones son precisas. Mejorar la sección de tejido nervioso.",
        gradedBy: IDS.teacherLab,
        gradedAt: new Date("2026-03-22T10:00:00Z"),
        isPublished: true,
      },
      createdAt: new Date("2026-03-20T15:30:00Z"),
      updatedAt: new Date("2026-03-22T10:00:00Z"),
      __v: 2,
    },
  ]);

  print("✅ 3 entregas insertadas (1 a tiempo, 1 fuera de fecha, 1 revisada con nota).");
}
