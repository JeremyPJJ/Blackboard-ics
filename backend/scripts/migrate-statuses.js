// Migración: normalizar statuses de inglés a español
// Ejecutar con: mongosh "mongodb://localhost:27017/plataforma_virtual" migrate-statuses.js

print("=== Migrando statuses de inglés a español ===");

const c1 = db.courses.updateMany({status: "active"}, {$set: {status: "activo"}});
print("Courses active→activo:", c1.modifiedCount);

const c2 = db.courses.updateMany({status: "finished"}, {$set: {status: "finalizado"}});
print("Courses finished→finalizado:", c2.modifiedCount);

const t1 = db.tasks.updateMany({status: "published"}, {$set: {status: "publicada"}});
print("Tasks published→publicada:", t1.modifiedCount);

const t2 = db.tasks.updateMany({status: "draft"}, {$set: {status: "borrador"}});
print("Tasks draft→borrador:", t2.modifiedCount);

const a1 = db.attendance_registers.updateMany(
  {},
  {$set: {"dates.$[].records.$[r].status": "presente"}},
  {arrayFilters: [{"r.status": "present"}]}
);
print("Attendance present→presente:", a1.modifiedCount);

const a2 = db.attendance_registers.updateMany(
  {},
  {$set: {"dates.$[].records.$[r].status": "tardanza"}},
  {arrayFilters: [{"r.status": "late"}]}
);
print("Attendance late→tardanza:", a2.modifiedCount);

const a3 = db.attendance_registers.updateMany(
  {},
  {$set: {"dates.$[].records.$[r].status": "ausente"}},
  {arrayFilters: [{"r.status": "absent"}]}
);
print("Attendance absent→ausente:", a3.modifiedCount);

const badCourses = db.courses.countDocuments({status: {$nin: ["activo", "finalizado", "caducado", "archivado"]}});
const badTasks = db.tasks.countDocuments({status: {$nin: ["borrador", "publicada"]}});
print("\n=== Verificación ===");
print("Cursos con status inválido:", badCourses);
print("Tareas con status inválido:", badTasks);
print("\n=== Migración completada ===");
