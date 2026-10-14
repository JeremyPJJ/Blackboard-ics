// ============================================================
// 00-object-ids.js
// IDs fijos y predecibles para todas las referencias entre documentos.
// Esto garantiza que las relaciones sean consistentes.
// ============================================================

// --- USERS ---
const IDS = {
  // Admins
  superAdmin:    ObjectId("66a000000000000000000001"),
  unidadAcad:    ObjectId("66a000000000000000000002"),

  // Docentes
  teacherEnfer:  ObjectId("66a000000000000000000003"), // Rosa Quispe - Enfermería
  teacherFarma:  ObjectId("66a000000000000000000004"), // Jorge Huamán - Farmacia
  teacherLab:    ObjectId("66a000000000000000000005"), // Carmen Díaz - Laboratorio

  // Estudiantes Enfermería
  studentEnfer1: ObjectId("66a000000000000000000006"), // María Torres
  studentEnfer2: ObjectId("66a000000000000000000007"), // Luis Ramos
  studentEnfer3: ObjectId("66a000000000000000000008"), // Andrea Vargas

  // Estudiantes Farmacia
  studentFarma1: ObjectId("66a000000000000000000009"), // Diego Morales
  studentFarma2: ObjectId("66a00000000000000000000a"), // Valeria Cruz

  // Estudiante Laboratorio
  studentLab1:   ObjectId("66a00000000000000000000b"), // César Peña

  // --- COURSES ---
  courseEnfer: ObjectId("66b000000000000000000001"), // Cuidados Básicos de Enfermería
  courseFarma: ObjectId("66b000000000000000000002"), // Introducción a la Farmacología
  courseLab:   ObjectId("66b000000000000000000003"), // Análisis Clínicos Básicos

  // --- TASKS ---
  taskEnfer: ObjectId("66c000000000000000000001"), // Informe de Signos Vitales
  taskFarma: ObjectId("66c000000000000000000002"), // Interacciones Medicamentosas
  taskLab:   ObjectId("66c000000000000000000003"), // Práctica de Microscopía

  // --- TASK SUBMISSIONS ---
  subEnfer: ObjectId("66d000000000000000000001"), // María Torres -> Task Enfermería
  subFarma: ObjectId("66d000000000000000000002"), // Diego Morales -> Task Farmacia (late)
  subLab:   ObjectId("66d000000000000000000003"), // César Peña -> Task Laboratorio

  // --- ATTENDANCE REGISTERS ---
  attEnfer: ObjectId("66e000000000000000000001"),
  attFarma: ObjectId("66e000000000000000000002"),
  attLab:   ObjectId("66e000000000000000000003"),

  // --- FILE METADATA ---
  // Materials del curso Enfermería
  fileMatEnfer1: ObjectId("66f000000000000000000001"), // PDF - Guía de signos vitales
  fileMatEnfer2: ObjectId("66f000000000000000000002"), // Video - Demostración práctica
  fileMatEnfer3: ObjectId("66f000000000000000000003"), // PDF - Protocolo de cuidados

  // Materials del curso Farmacia
  fileMatFarma1: ObjectId("66f000000000000000000004"), // PPTX - Farmacocinética
  fileMatFarma2: ObjectId("66f000000000000000000005"), // PDF - Tabla de interacciones

  // Materials del curso Laboratorio
  fileMatLab1: ObjectId("66f000000000000000000006"), // PDF - Manual de microscopía
  fileMatLab2: ObjectId("66f000000000000000000007"), // Imagen - Muestra histológica

  // Archivos de entregas
  fileSubEnfer: ObjectId("66f000000000000000000008"), // PDF entrega de María Torres
  fileSubFarma: ObjectId("66f000000000000000000009"), // DOCX entrega de Diego Morales
  fileSubLab:   ObjectId("66f00000000000000000000a"), // PDF entrega de César Peña

  // Logo institucional
  fileLogo: ObjectId("66f00000000000000000000b"),

  // --- INSTITUTIONAL SETTINGS ---
  institutionalSettings: ObjectId("660000000000000000000001"),
};

// Contraseña hasheada con bcrypt para "demo123"
// Salt rounds: 10
// NOTA: Este hash se genera una sola vez. En producción, cada usuario tendría su propio hash.
// Para el seed, TODOS usan la misma contraseña hasheada.
const DEMO_PASSWORD_HASH = "$2b$10$ue3cwGiCKv39GS6.J3dxXuD0LIr2QTXGn0KcMvaYvmJgmWgZGjaSG";

print("✅ IDs y constantes cargados correctamente.");
