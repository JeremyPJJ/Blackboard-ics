// Migración: limpiar semanas/sesiones null en cursos (array con huecos).
// Ejecutar: mongosh "mongodb://localhost:27017/plataforma_virtual" migrate-fix-null-weeks.js

print("=== Limpiando semanas/sesiones null ===");

const courses = db.courses.find({}).toArray();
let fixed = 0;

courses.forEach(c => {
  if (!c.weeks || !Array.isArray(c.weeks)) return;
  let changed = false;

  const cleanWeeks = c.weeks.map((w, wi) => {
    if (!w || typeof w !== 'object') {
      changed = true;
      return { number: wi + 1, title: `Semana ${wi + 1}`, sessions: [] };
    }
    if (w.sessions && Array.isArray(w.sessions)) {
      const cleanSessions = w.sessions.map((s, si) => {
        if (!s || typeof s !== 'object') {
          changed = true;
          return { number: si + 1, title: `Sesión ${si + 1}`, materials: [] };
        }
        if (!s.materials) s.materials = [];
        return s;
      });
      if (JSON.stringify(w.sessions) !== JSON.stringify(cleanSessions)) {
        w.sessions = cleanSessions;
        changed = true;
      }
    } else {
      w.sessions = [];
      changed = true;
    }
    return w;
  });

  if (changed) {
    db.courses.updateOne({ _id: c._id }, { $set: { weeks: cleanWeeks } });
    fixed++;
  }
});

print("Cursos corregidos:", fixed);
print("=== Migración completada ===");