// ============================================================
// seed-main.js
// Script principal de seed data para la demo.
// Ejecutar con: mongosh --file seed-main.js
// O desde mongosh: load("seed-main.js")
// ============================================================

// Configuración de la base de datos
const DB_NAME = "plataforma_virtual";
db = db.getSiblingDB(DB_NAME);

print("🌱 ============================================");
print("🌱 SEED DATA — PLATAFORMA VIRTUAL IESTP");
print("🌱 ============================================");
print(`🌱 Base de datos: ${DB_NAME}`);
print(`🌱 Fecha de ejecución: ${new Date().toISOString()}`);
print("");

// ============================================================
// PASO 0: Cargar IDs y constantes
// ============================================================
print("📦 Paso 0/8: Cargando IDs y constantes...");
load("00-object-ids.js");

// ============================================================
// PASO 1: Configuración institucional
// ============================================================
print("📦 Paso 1/8: Configuración institucional...");
load("01-institutional-settings.js");
seedInstitutionalSettings();

// ============================================================
// PASO 2: Usuarios (DEBE ir antes de courses, tasks, etc.)
// ============================================================
print("📦 Paso 2/8: Usuarios...");
load("02-users.js");
seedUsers();

// ============================================================
// PASO 3: Metadatos de archivos (DEBE ir antes de courses y submissions)
// ============================================================
print("📦 Paso 3/8: Metadatos de archivos...");
load("03-file-metadata.js");
seedFileMetadata();

// ============================================================
// PASO 4: Cursos
// ============================================================
print("📦 Paso 4/8: Cursos...");
load("04-courses.js");
seedCourses();

// ============================================================
// PASO 5: Tareas
// ============================================================
print("📦 Paso 5/8: Tareas...");
load("05-tasks.js");
seedTasks();

// ============================================================
// PASO 6: Entregas de tareas
// ============================================================
print("📦 Paso 6/8: Entregas de tareas...");
load("06-task-submissions.js");
seedTaskSubmissions();

// ============================================================
// PASO 7: Registros de asistencia
// ============================================================
print("📦 Paso 7/8: Registros de asistencia...");
load("07-attendance-registers.js");
seedAttendanceRegisters();

// ============================================================
// PASO 8: Entradas de auditoría
// ============================================================
print("📦 Paso 8/8: Entradas de auditoría...");
load("08-audit-entries.js");
seedAuditEntries();

// ============================================================
// VALIDACIÓN FINAL
// ============================================================
print("\n🔍 ============================================");
print("🔍 VALIDACIÓN DE DATOS");
print("🔍 ============================================");

const validations = [
  { col: "institutional_settings", expected: 1 },
  { col: "users", expected: 11 },
  { col: "file_metadata", expected: 12 },
  { col: "courses", expected: 3 },
  { col: "tasks", expected: 3 },
  { col: "task_submissions", expected: 3 },
  { col: "attendance_registers", expected: 3 },
  { col: "audit_entries", expected: 15 },
];

let allOk = true;
for (const v of validations) {
  const count = db.getCollection(v.col).countDocuments();
  const status = count === v.expected ? "✅" : "❌";
  if (count !== v.expected) allOk = false;
  print(`  ${status} ${v.col}: ${count} documentos (esperado: ${v.expected})`);
}

print("");

// Validar referencias cruzadas
print("🔗 Validando referencias cruzadas...");

// Verificar que todos los teachers en courses existen como users
const courseTeacherIds = db.courses.aggregate([
  { $unwind: "$teachers" },
  { $group: { _id: null, ids: { $addToSet: "$teachers.userId" } } },
]).toArray();

if (courseTeacherIds.length > 0) {
  const missingTeachers = db.users.countDocuments({
    _id: { $in: courseTeacherIds[0].ids },
  });
  const status = missingTeachers === courseTeacherIds[0].ids.length ? "✅" : "❌";
  print(`  ${status} Teachers en courses → users: ${missingTeachers}/${courseTeacherIds[0].ids.length}`);
}

// Verificar que todos los students en courses existen como users
const courseStudentIds = db.courses.aggregate([
  { $unwind: "$students" },
  { $group: { _id: null, ids: { $addToSet: "$students.userId" } } },
]).toArray();

if (courseStudentIds.length > 0) {
  const missingStudents = db.users.countDocuments({
    _id: { $in: courseStudentIds[0].ids },
  });
  const status = missingStudents === courseStudentIds[0].ids.length ? "✅" : "❌";
  print(`  ${status} Students en courses → users: ${missingStudents}/${courseStudentIds[0].ids.length}`);
}

// Verificar que los task_submissions referencian tareas y usuarios válidos
const subTaskIds = db.task_submissions.distinct("taskId");
const validTasks = db.tasks.countDocuments({ _id: { $in: subTaskIds } });
print(`  ${validTasks === subTaskIds.length ? "✅" : "❌"} TaskSubmissions → Tasks: ${validTasks}/${subTaskIds.length}`);

const subStudentIds = db.task_submissions.distinct("studentId");
const validStudents = db.users.countDocuments({ _id: { $in: subStudentIds } });
print(`  ${validStudents === subStudentIds.length ? "✅" : "❌"} TaskSubmissions → Users: ${validStudents}/${subStudentIds.length}`);

// Verificar códigos de invitación únicos
const invCodes = db.courses.distinct("invitationConfig.code");
print(`  ${invCodes.length === 3 ? "✅" : "❌"} Códigos de invitación únicos: ${invCodes.join(", ")}`);

print("");
if (allOk) {
  print("🎉 ============================================");
  print("🎉 ¡SEED DATA COMPLETADO EXITOSAMENTE!");
  print("🎉 ============================================");
  print("");
  print("📊 Resumen:");
  print("  • 1 configuración institucional");
  print("  • 11 usuarios (2 admins, 3 docentes, 6 estudiantes)");
  print("  • 12 archivos (7 materiales, 3 entregas, 1 logo, 1 institucional)");
  print("  • 3 cursos con semanas, sesiones y materiales");
  print("  • 3 tareas (1 futura, 1 pasada, 1 sin límite)");
  print("  • 3 entregas (1 a tiempo, 1 tardía, 1 revisada)");
  print("  • 3 registros de asistencia (6 fechas total)");
  print("  • 15 entradas de auditoría");
  print("");
  print("🔑 Contraseña para TODOS los usuarios: demo123");
  print("📧 Login: usar institutionalEmail de cada usuario");
  print("");
} else {
  print("❌ ADVERTENCIA: Algunas validaciones fallaron. Revisa los datos.");
}
