// ============================================================
// 03-file-metadata.js
// 12 archivos: 7 materiales de curso, 3 entregas, 1 logo, 1 placeholder
// Los archivos físicos NO existen en disco (solo metadatos para la demo).
// En producción, estos archivos estarían en /uploads/
// ============================================================

function seedFileMetadata() {
  print("\n📁 Insertando metadatos de archivos...");

  db.file_metadata.deleteMany({});

  db.file_metadata.insertMany([
    // === MATERIALES CURSO ENFERMERÍA ===
    {
      _id: IDS.fileMatEnfer1,
      originalName: "Guia_Signos_Vitales_2026.pdf",
      mimeType: "application/pdf",
      sizeBytes: 2457600, // ~2.4MB
      checksum: "sha256:a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
      storageStrategy: "local",
      localPath: "uploads/materials/enfer-001/semana1/guia_signos_vitales.pdf",
      s3Config: { bucket: null, region: null, key: null },
      context: { type: "material", referenceId: IDS.courseEnfer },
      uploadedBy: IDS.teacherEnfer,
      isDeleted: false,
      createdAt: new Date("2026-03-01T08:00:00Z"),
      updatedAt: new Date("2026-03-01T08:00:00Z"),
    },
    {
      _id: IDS.fileMatEnfer2,
      originalName: "Demostracion_Tecnicas_Enfermeria.mp4",
      mimeType: "video/mp4",
      sizeBytes: 15728640, // ~15MB
      checksum: "sha256:b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
      storageStrategy: "local",
      localPath: "uploads/materials/enfer-001/semana1/demo_tecnicas.mp4",
      s3Config: { bucket: null, region: null, key: null },
      context: { type: "material", referenceId: IDS.courseEnfer },
      uploadedBy: IDS.teacherEnfer,
      isDeleted: false,
      createdAt: new Date("2026-03-02T10:00:00Z"),
      updatedAt: new Date("2026-03-02T10:00:00Z"),
    },
    {
      _id: IDS.fileMatEnfer3,
      originalName: "Protocolo_Cuidados_Paciente.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1843200, // ~1.8MB
      checksum: "sha256:c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
      storageStrategy: "local",
      localPath: "uploads/materials/enfer-001/semana2/protocolo_cuidados.pdf",
      s3Config: { bucket: null, region: null, key: null },
      context: { type: "material", referenceId: IDS.courseEnfer },
      uploadedBy: IDS.teacherEnfer,
      isDeleted: false,
      createdAt: new Date("2026-03-08T09:00:00Z"),
      updatedAt: new Date("2026-03-08T09:00:00Z"),
    },

    // === MATERIALES CURSO FARMACIA ===
    {
      _id: IDS.fileMatFarma1,
      originalName: "Diapositivas_Farmacocinetica.pptx",
      mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      sizeBytes: 4521984, // ~4.3MB
      checksum: "sha256:d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
      storageStrategy: "local",
      localPath: "uploads/materials/farma-001/semana1/farmacocinetica.pptx",
      s3Config: { bucket: null, region: null, key: null },
      context: { type: "material", referenceId: IDS.courseFarma },
      uploadedBy: IDS.teacherFarma,
      isDeleted: false,
      createdAt: new Date("2026-03-05T08:30:00Z"),
      updatedAt: new Date("2026-03-05T08:30:00Z"),
    },
    {
      _id: IDS.fileMatFarma2,
      originalName: "Tabla_Interacciones_Medicamentosas.pdf",
      mimeType: "application/pdf",
      sizeBytes: 921600, // ~900KB
      checksum: "sha256:e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
      storageStrategy: "local",
      localPath: "uploads/materials/farma-001/semana2/interacciones.pdf",
      s3Config: { bucket: null, region: null, key: null },
      context: { type: "material", referenceId: IDS.courseFarma },
      uploadedBy: IDS.teacherFarma,
      isDeleted: false,
      createdAt: new Date("2026-03-12T11:00:00Z"),
      updatedAt: new Date("2026-03-12T11:00:00Z"),
    },

    // === MATERIALES CURSO LABORATORIO ===
    {
      _id: IDS.fileMatLab1,
      originalName: "Manual_Microscopia_Virtual.pdf",
      mimeType: "application/pdf",
      sizeBytes: 3276800, // ~3.1MB
      checksum: "sha256:f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7",
      storageStrategy: "local",
      localPath: "uploads/materials/lab-001/semana1/manual_microscopia.pdf",
      s3Config: { bucket: null, region: null, key: null },
      context: { type: "material", referenceId: IDS.courseLab },
      uploadedBy: IDS.teacherLab,
      isDeleted: false,
      createdAt: new Date("2026-03-10T09:00:00Z"),
      updatedAt: new Date("2026-03-10T09:00:00Z"),
    },
    {
      _id: IDS.fileMatLab2,
      originalName: "Muestra_Histologica_Riñon.png",
      mimeType: "image/png",
      sizeBytes: 524288, // ~512KB
      checksum: "sha256:a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8",
      storageStrategy: "local",
      localPath: "uploads/materials/lab-001/semana1/muestra_rinon.png",
      s3Config: { bucket: null, region: null, key: null },
      context: { type: "material", referenceId: IDS.courseLab },
      uploadedBy: IDS.teacherLab,
      isDeleted: false,
      createdAt: new Date("2026-03-10T10:00:00Z"),
      updatedAt: new Date("2026-03-10T10:00:00Z"),
    },

    // === ARCHIVOS DE ENTREGAS ===
    {
      _id: IDS.fileSubEnfer,
      originalName: "Informe_Signos_Vitales_MTorres.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1048576, // ~1MB
      checksum: "sha256:b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9",
      storageStrategy: "local",
      localPath: "uploads/submissions/66c000000000000000000001/66d000000000000000000001/informe.pdf",
      s3Config: { bucket: null, region: null, key: null },
      context: { type: "submission", referenceId: IDS.taskEnfer },
      uploadedBy: IDS.studentEnfer1,
      isDeleted: false,
      createdAt: new Date("2026-09-10T22:15:00Z"),
      updatedAt: new Date("2026-09-10T22:15:00Z"),
    },
    {
      _id: IDS.fileSubFarma,
      originalName: "Trabajo_Interacciones_DMorales.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: 819200, // ~800KB
      checksum: "sha256:c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0",
      storageStrategy: "local",
      localPath: "uploads/submissions/66c000000000000000000002/66d000000000000000000002/trabajo.docx",
      s3Config: { bucket: null, region: null, key: null },
      context: { type: "submission", referenceId: IDS.taskFarma },
      uploadedBy: IDS.studentFarma1,
      isDeleted: false,
      createdAt: new Date("2026-07-05T23:45:00Z"), // Fuera de fecha (deadline era 2026-07-01)
      updatedAt: new Date("2026-07-05T23:45:00Z"),
    },
    {
      _id: IDS.fileSubLab,
      originalName: "Practica_Microscopia_CPeña.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1536000, // ~1.5MB
      checksum: "sha256:d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1",
      storageStrategy: "local",
      localPath: "uploads/submissions/66c000000000000000000003/66d000000000000000000003/practica.pdf",
      s3Config: { bucket: null, region: null, key: null },
      context: { type: "submission", referenceId: IDS.taskLab },
      uploadedBy: IDS.studentLab1,
      isDeleted: false,
      createdAt: new Date("2026-03-20T15:30:00Z"),
      updatedAt: new Date("2026-03-20T15:30:00Z"),
    },

    // === LOGO INSTITUCIONAL ===
    {
      _id: IDS.fileLogo,
      originalName: "logo_ics_oficial.png",
      mimeType: "image/png",
      sizeBytes: 102400, // ~100KB
      checksum: "sha256:e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2",
      storageStrategy: "local",
      localPath: "uploads/institutional/logo.png",
      s3Config: { bucket: null, region: null, key: null },
      context: { type: "institutional_logo", referenceId: IDS.institutionalSettings },
      uploadedBy: IDS.superAdmin,
      isDeleted: false,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    },
  ]);

  print("✅ 12 metadatos de archivos insertados.");
}
