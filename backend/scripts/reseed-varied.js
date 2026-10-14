// Reseed: escenarios variados (super admin, supervisor, docentes, estudiantes de todo tipo)
// Ejecutar: mongosh "mongodb://localhost:27017/plataforma_virtual" reseed-varied.js

const HASH = "$2b$10$ue3cwGiCKv39GS6.J3dxXuD0LIr2QTXGn0KcMvaYvmJgmWgZGjaSG"; // demo123

print("=== Limpiando colecciones ===");
["users", "courses", "tasks", "attendance_registers", "forums", "filemetadata", "logs", "notifications", "refreshtokens"].forEach(c => {
  db.getCollection(c).deleteMany({});
});
print("OK");

print("=== Usuarios ===");
const users = [
  { _id: ObjectId("66a000000000000000000001"), dni: "00000001", names: "Carlos", lastNames: "Mendoza Ríos", institutionalEmail: "carlos.mendoza@ics.edu.pe", personalEmail: "cmendoza@gmail.com", phone: "999000001", role: "super_admin", status: "activo", tags: ["Super Administrador"], permissions: [], contractYear: 2026, contractSemester: 1 },
  { _id: ObjectId("66a000000000000000000002"), dni: "00000002", names: "Ana", lastNames: "Paredes Gómez", institutionalEmail: "ana.paredes@ics.edu.pe", personalEmail: "aparedes@outlook.com", phone: "999000002", role: "unidad_academica", status: "activo", tags: ["Supervisora de Docentes"], permissions: ["usuarios.ver", "usuarios.crear", "usuarios.editar", "cursos.ver", "cursos.crear", "cursos.editar", "cursos.archivar", "tareas.ver", "tareas.crear", "tareas.calificar", "asistencia.ver", "asistencia.registrar", "asistencia.modificar", "foros.crear", "foros.post", "encuestas.crear", "encuestas.ver", "ofertas.crear", "ofertas.ver", "examenes.crear", "examenes.ver"], contractYear: 2025, contractSemester: 2 },
  { _id: ObjectId("66a000000000000000000003"), dni: "00000003", names: "Rosa", lastNames: "Quispe Torres", institutionalEmail: "rosa.quispe@ics.edu.pe", personalEmail: "rquispe2020@gmail.com", phone: "999000003", role: "docente", status: "activo", tags: ["Enfermería"], permissions: [], contractYear: 2026, contractSemester: 1 },
  { _id: ObjectId("66a000000000000000000004"), dni: "00000004", names: "Jorge Luis", lastNames: "Huamán Salazar", institutionalEmail: "jorge.huaman@ics.edu.pe", personalEmail: "jhuaman@hotmail.com", phone: "999000004", role: "docente", status: "activo", tags: ["Farmacia"], permissions: [], contractYear: 2026, contractSemester: 1 },
  { _id: ObjectId("66a000000000000000000005"), dni: "00000005", names: "Carmen", lastNames: "Díaz Flores", institutionalEmail: "carmen.diaz@ics.edu.pe", personalEmail: "cdiaz@gmail.com", phone: "999000005", role: "docente", status: "activo", tags: ["Laboratorio"], permissions: [], contractYear: 2025, contractSemester: 2 },
  { _id: ObjectId("66a000000000000000000006"), dni: "00000006", names: "María", lastNames: "Torres Pineda", institutionalEmail: "maria.torres@est.ics.edu.pe", personalEmail: "mtorres@gmail.com", phone: "999000006", role: "estudiante", status: "activo", tags: ["Enfermería"], permissions: [] },
  { _id: ObjectId("66a000000000000000000007"), dni: "00000007", names: "Luis", lastNames: "Ramos Céspedes", institutionalEmail: "luis.ramos@est.ics.edu.pe", personalEmail: "lramos@gmail.com", phone: "999000007", role: "estudiante", status: "activo", tags: ["Farmacia"], permissions: [] },
  { _id: ObjectId("66a000000000000000000008"), dni: "00000008", names: "Andrea", lastNames: "Vargas Lozano", institutionalEmail: "andrea.vargas@est.ics.edu.pe", personalEmail: "avargas@gmail.com", phone: "999000008", role: "estudiante", status: "activo", tags: ["Laboratorio"], permissions: [] },
  { _id: ObjectId("66a000000000000000000009"), dni: "00000009", names: "Diego", lastNames: "Morales Ríos", institutionalEmail: "diego.morales@est.ics.edu.pe", personalEmail: "dmorales@gmail.com", phone: "999000009", role: "estudiante", status: "activo", tags: ["Matemática"], permissions: [] },
  { _id: ObjectId("66a00000000000000000000a"), dni: "00000010", names: "Valeria", lastNames: "Cruz Salas", institutionalEmail: "valeria.cruz@est.ics.edu.pe", personalEmail: "vcruz@gmail.com", phone: "999000010", role: "estudiante", status: "activo", tags: ["Economía"], permissions: [] },
  { _id: ObjectId("66a00000000000000000000b"), dni: "00000011", names: "Sofía", lastNames: "López Vera", institutionalEmail: "sofia.lopez@est.ics.edu.pe", personalEmail: "slopez@gmail.com", phone: "999000011", role: "estudiante", status: "inactivo", tags: ["Enfermería"], permissions: [] },
];

users.forEach(u => {
  u.password = HASH;
  u.birthDate = new Date("1998-05-15");
  u.createdAt = new Date();
  u.updatedAt = new Date();
});
db.users.insertMany(users);
print("Usuarios insertados:", users.length);

print("=== Cursos (con semanas/materials, docentes, estudiantes) ===");
const courses = [
  {
    _id: ObjectId("66b000000000000000000001"), name: "Cuidados Básicos de Enfermería", code: "ENFE-101", description: "Fundamentos de enfermería: signos vitales y protocolos básicos.", career: "Enfermería", credits: 4, year: 2026, semester: 1, cycle: 2,
    teachers: [{ userId: ObjectId("66a000000000000000000003"), role: "teacher", enrolledAt: new Date("2026-03-01") }],
    students: [
      { userId: ObjectId("66a000000000000000000006"), role: "student", enrolledAt: new Date("2026-03-02") },
      { userId: ObjectId("66a000000000000000000009"), role: "student", enrolledAt: new Date("2026-03-03") },
    ],
    weeks: [
      { number: 1, title: "Semana 1", createdAt: new Date("2026-03-01T08:00:00"), sessions: [{ number: 1, title: "Sesión 1", scheduledDate: new Date("2026-03-03T09:00:00"), materials: [] }], materials: [
        { type: "pdf", title: "Guía de Signos Vitales", description: "Material teórico", fileId: ObjectId("66f000000000000000000001") },
        { type: "link", title: "Video institucional", description: "Demostración", url: "https://es.wikipedia.org/wiki/Enfermer%C3%ADa" },
      ] },
      { number: 2, title: "Semana 2", createdAt: new Date("2026-03-08T08:00:00"), sessions: [{ number: 1, title: "Sesión 1", scheduledDate: new Date("2026-03-10T09:00:00"), materials: [] }], materials: [] },
    ],
    startDate: new Date("2026-03-01"), endDate: new Date("2026-07-31"), status: "activo",
    invitationConfig: { code: "ENFE-ABC12", isActive: true, currentUses: 2, expiresAt: new Date("2026-12-31") },
    createdAt: new Date("2026-02-15"), updatedAt: new Date("2026-02-15"),
  },
  {
    _id: ObjectId("66b000000000000000000002"), name: "Farmacología Básica", code: "FARM-101", description: "Farmacocinética y grupos farmacológicos principales.", career: "Farmacia", credits: 3, year: 2026, semester: 1, cycle: 1,
    teachers: [{ userId: ObjectId("66a000000000000000000004"), role: "teacher", enrolledAt: new Date("2026-03-01") }],
    students: [
      { userId: ObjectId("66a000000000000000000007"), role: "student", enrolledAt: new Date("2026-03-02") },
      { userId: ObjectId("66a000000000000000000008"), role: "student", enrolledAt: new Date("2026-03-04") },
    ],
    weeks: [
      { number: 1, title: "Semana 1", createdAt: new Date("2026-03-01T08:00:00"), sessions: [{ number: 1, title: "Sesión 1", scheduledDate: new Date("2026-03-04T10:00:00"), materials: [] }], materials: [{ type: "doc", title: "Farmacocinética - Apuntes", description: "Documento de clase", fileId: ObjectId("66f000000000000000000002") }] },
    ],
    startDate: new Date("2026-03-01"), endDate: new Date("2026-07-31"), status: "activo",
    invitationConfig: { code: "FARM-9XQK8", isActive: true, currentUses: 2, expiresAt: new Date("2026-12-31") },
    createdAt: new Date("2026-02-20"), updatedAt: new Date("2026-02-20"),
  },
];
db.courses.insertMany(courses);
print("Cursos insertados:", courses.length);

print("=== Tareas ===");
const tasks = [
  { _id: ObjectId("66c000000000000000000001"), title: "Tarea 1: Signos vitales", description: "Completa la guía y sube tu respuesta.", courseId: "66b000000000000000000001", weekNumber: 1, sessionNumber: 1, deadline: new Date("2026-03-10T23:59:00"), noDeadline: false, allowedTypes: ["archivo", "foto", "texto"], maxFileSize: 10485760, maxFiles: 2, status: "publicada", gradingType: "manual", maxScore: 20, createdAt: new Date(), updatedAt: new Date() },
  { _id: ObjectId("66c000000000000000000002"), title: "Tarea 1: Grupos farmacológicos", description: "Investiga y responde el cuestionario.", courseId: "66b000000000000000000002", weekNumber: 1, sessionNumber: 1, deadline: new Date("2026-03-12T23:59:00"), noDeadline: false, allowedTypes: ["texto"], maxFileSize: 10485760, maxFiles: 1, status: "publicada", gradingType: "manual", maxScore: 15, createdAt: new Date(), updatedAt: new Date() },
];
db.tasks.insertMany(tasks);
print("Tareas insertadas:", tasks.length);

print("=== Foros ===");
db.forums.insertMany([
  { title: "Debate: Ética en Enfermería", description: "Compartan sus opiniones.", courseId: "66b000000000000000000001", weekNumber: 1, sessionNumber: 1, posts: [], isEvaluated: true, createdAt: new Date(), updatedAt: new Date() },
  { title: "Dudas generales del curso", description: "Consultas libres.", courseId: "66b000000000000000000001", weekNumber: 2, sessionNumber: 1, posts: [], isEvaluated: false, createdAt: new Date(), updatedAt: new Date() },
  { title: "Foro de Farmacología", description: "Interacciones medicamentosas.", courseId: "66b000000000000000000002", weekNumber: 1, sessionNumber: 1, posts: [], isEvaluated: false, createdAt: new Date(), updatedAt: new Date() },
]);
print("Foros insertados: 3");

print("=== Asistencia ===");
db.attendance_registers.insertOne({
  _id: ObjectId("66d000000000000000000001"), courseId: "66b000000000000000000001",
  dates: [
    { date: new Date("2026-03-03T09:00:00"), startTime: new Date("2026-03-03T09:00:00"), endTime: new Date("2026-03-03T11:00:00"), tolerance: 10, weekNumber: 1, sessionNumber: 1, records: [
      { studentId: ObjectId("66a000000000000000000006"), status: "presente", markedAt: new Date("2026-03-03T09:05:00") },
      { studentId: ObjectId("66a000000000000000000009"), status: "tardanza", markedAt: new Date("2026-03-03T09:15:00") },
    ] },
  ],
  createdAt: new Date(), updatedAt: new Date(),
});
print("Asistencia insertada: 1 registro");

print("=== Semilla completada ===");
print("Usuarios demo (contraseña: demo123):");
print(" - Super admin: carlos.mendoza@ics.edu.pe");
print(" - Supervisora: ana.paredes@ics.edu.pe");
print(" - Docentes: rosa.quispe / jorge.huaman / carmen.diaz");
print(" - Estudiantes: maria.torres / luis.ramos / andrea.vargas / diego.morales / valeria.cruz (inactivo: sofia.lopez)");