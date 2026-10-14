// Migración: normalizar la forma de weeks/sessions/materials al schema actual.
// El seed viejo usaba: weekNumber, sessionNumber, startDate, fileMetadataId, order, uploadedAt
// El schema usa: number, scheduledDate, fileId
// Ejecutar: mongosh "mongodb://localhost:27017/plataforma_virtual" migrate-course-shape.js

print("=== Migrando forma de weeks/sessions/materials ===");

const courses = db.courses.find({}).toArray();
let updated = 0;

courses.forEach(c => {
  let changed = false;

  if (!c.weeks || !Array.isArray(c.weeks)) return;

  c.weeks.forEach(week => {
    if (week.number === undefined && week.weekNumber !== undefined) {
      week.number = week.weekNumber;
      delete week.weekNumber;
      changed = true;
    }
    if (week.number === undefined) {
      week.number = 1;
      changed = true;
    }

    if (week.sessions && Array.isArray(week.sessions)) {
      week.sessions.forEach(session => {
        if (session.number === undefined && session.sessionNumber !== undefined) {
          session.number = session.sessionNumber;
          delete session.sessionNumber;
          changed = true;
        }
        if (session.number === undefined) {
          session.number = 1;
          changed = true;
        }
        if (session.scheduledDate === undefined && session.startDate !== undefined) {
          session.scheduledDate = session.startDate;
          delete session.startDate;
          changed = true;
        }
        if (session.materials && Array.isArray(session.materials)) {
          session.materials.forEach(mat => {
            if (mat.fileId === undefined && mat.fileMetadataId !== undefined) {
              mat.fileId = mat.fileMetadataId;
              delete mat.fileMetadataId;
              changed = true;
            }
            if (mat.order !== undefined) { delete mat.order; changed = true; }
            if (mat.uploadedAt !== undefined) { delete mat.uploadedAt; changed = true; }
          });
        }
      });
    }
  });

  if (changed) {
    db.courses.updateOne({ _id: c._id }, { $set: { weeks: c.weeks } });
    updated++;
  }
});

print("Cursos actualizados:", updated);
print("=== Migración completada ===");