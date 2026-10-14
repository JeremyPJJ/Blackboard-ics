// ============================================================
// cleanup.js
// Elimina la base de datos completa y la recrea vacía.
// Ejecutar ANTES de seed-main.js para empezar desde cero.
// ============================================================

// Conexión a la base de datos
const DB_NAME = "plataforma_virtual";

// Cambiar a la base de datos
db = db.getSiblingDB(DB_NAME);

print("🧹 ============================================");
print("🧹 LIMPIEZA DE BASE DE DATOS");
print("🧹 ============================================");
print(`🧹 Base de datos: ${DB_NAME}`);
print("");

// Lista de colecciones del sistema
const collections = [
  "audit_entries",
  "task_submissions",
  "tasks",
  "attendance_registers",
  "courses",
  "users",
  "file_metadata",
  "institutional_settings",
  "refresh_tokens",
];

// Eliminar cada colección
for (const col of collections) {
  const result = db.getCollection(col).drop();
  if (result) {
    print(`  🗑️  Colección '${col}' eliminada.`);
  } else {
    print(`  ⏭️  Colección '${col}' no existía.`);
  }
}

print("");
print("✅ Base de datos limpiada correctamente.");
print("✅ Ejecuta seed-main.js para insertar los datos de demo.");
