// ============================================================
// 07-attendance-registers.js
// 3 registros: Enfermería (3 fechas), Farmacia (2 fechas), Laboratorio (1 fecha)
// ============================================================

function seedAttendanceRegisters() {
  print("\n📅 Insertando registros de asistencia...");

  db.attendance_registers.deleteMany({});

  db.attendance_registers.insertMany([
    // === ASISTENCIA CURSO ENFERMERÍA — 3 fechas ===
    {
      _id: IDS.attEnfer,
      courseId: IDS.courseEnfer,
      dates: [
        {
          date: new Date("2026-03-03T00:00:00Z"),
          startTime: "09:00",
          endTime: "11:00",
          toleranceMinutes: 10,
          weekNumber: 1,
          sessionNumber: 1,
          status: "closed",
          records: [
            {
              studentId: IDS.studentEnfer1,
              markedAt: new Date("2026-03-03T09:05:00Z"),
              status: "presente",
              modifiedBy: null, modifiedAt: null, modificationReason: null,
            },
            {
              studentId: IDS.studentEnfer2,
              markedAt: new Date("2026-03-03T09:12:00Z"),
              status: "tardanza", // Llegó 12 min tarde, tolerancia era 10
              modifiedBy: null, modifiedAt: null, modificationReason: null,
            },
            {
              studentId: IDS.studentEnfer3,
              markedAt: null,
              status: "ausente",
              modifiedBy: null, modifiedAt: null, modificationReason: null,
            },
          ],
          createdBy: IDS.teacherEnfer,
          closedAt: new Date("2026-03-03T11:00:00Z"),
        },
        {
          date: new Date("2026-03-05T00:00:00Z"),
          startTime: "09:00",
          endTime: "11:00",
          toleranceMinutes: 10,
          weekNumber: 1,
          sessionNumber: 2,
          status: "closed",
          records: [
            {
              studentId: IDS.studentEnfer1,
              markedAt: new Date("2026-03-05T08:55:00Z"),
              status: "presente",
              modifiedBy: null, modifiedAt: null, modificationReason: null,
            },
            {
              studentId: IDS.studentEnfer2,
              markedAt: new Date("2026-03-05T09:00:00Z"),
              status: "presente",
              modifiedBy: null, modifiedAt: null, modificationReason: null,
            },
            {
              studentId: IDS.studentEnfer3,
              markedAt: new Date("2026-03-05T08:50:00Z"),
              status: "presente",
              modifiedBy: null, modifiedAt: null, modificationReason: null,
            },
          ],
          createdBy: IDS.teacherEnfer,
          closedAt: new Date("2026-03-05T11:00:00Z"),
        },
        {
          date: new Date("2026-03-10T00:00:00Z"),
          startTime: "09:00",
          endTime: "11:00",
          toleranceMinutes: 15,
          weekNumber: 2,
          sessionNumber: 1,
          status: "closed",
          records: [
            {
              studentId: IDS.studentEnfer1,
              markedAt: new Date("2026-03-10T09:02:00Z"),
              status: "presente",
              modifiedBy: null, modifiedAt: null, modificationReason: null,
            },
            {
              studentId: IDS.studentEnfer2,
              markedAt: null,
              status: "ausente",
              modifiedBy: null, modifiedAt: null, modificationReason: null,
            },
            {
              studentId: IDS.studentEnfer3,
              markedAt: new Date("2026-03-10T09:20:00Z"),
              status: "late", // 20 min tarde, tolerancia era 15
              modifiedBy: IDS.teacherEnfer,
              modifiedAt: new Date("2026-03-10T11:30:00Z"),
              modificationReason: "Corregido: llegó a las 9:20, fuera de tolerancia.",
            },
          ],
          createdBy: IDS.teacherEnfer,
          closedAt: new Date("2026-03-10T11:00:00Z"),
        },
      ],
      createdAt: new Date("2026-03-01T08:00:00Z"),
      updatedAt: new Date("2026-03-10T11:30:00Z"),
      __v: 5,
    },

    // === ASISTENCIA CURSO FARMACIA — 2 fechas ===
    {
      _id: IDS.attFarma,
      courseId: IDS.courseFarma,
      dates: [
        {
          date: new Date("2026-03-07T00:00:00Z"),
          startTime: "14:00",
          endTime: "16:00",
          toleranceMinutes: 10,
          weekNumber: 1,
          sessionNumber: 1,
          status: "closed",
          records: [
            {
              studentId: IDS.studentFarma1,
              markedAt: new Date("2026-03-07T14:03:00Z"),
              status: "presente",
              modifiedBy: null, modifiedAt: null, modificationReason: null,
            },
            {
              studentId: IDS.studentFarma2,
              markedAt: new Date("2026-03-07T14:08:00Z"),
              status: "presente",
              modifiedBy: null, modifiedAt: null, modificationReason: null,
            },
          ],
          createdBy: IDS.teacherFarma,
          closedAt: new Date("2026-03-07T16:00:00Z"),
        },
        {
          date: new Date("2026-03-09T00:00:00Z"),
          startTime: "14:00",
          endTime: "16:00",
          toleranceMinutes: 10,
          weekNumber: 1,
          sessionNumber: 2,
          status: "closed",
          records: [
            {
              studentId: IDS.studentFarma1,
              markedAt: new Date("2026-03-09T14:00:00Z"),
              status: "presente",
              modifiedBy: null, modifiedAt: null, modificationReason: null,
            },
            {
              studentId: IDS.studentFarma2,
              markedAt: null,
              status: "ausente",
              modifiedBy: null, modifiedAt: null, modificationReason: null,
            },
          ],
          createdBy: IDS.teacherFarma,
          closedAt: new Date("2026-03-09T16:00:00Z"),
        },
      ],
      createdAt: new Date("2026-03-05T08:00:00Z"),
      updatedAt: new Date("2026-03-09T16:00:00Z"),
      __v: 3,
    },

    // === ASISTENCIA CURSO LABORATORIO — 1 fecha ===
    {
      _id: IDS.attLab,
      courseId: IDS.courseLab,
      dates: [
        {
          date: new Date("2026-03-12T00:00:00Z"),
          startTime: "15:00",
          endTime: "17:00",
          toleranceMinutes: 10,
          weekNumber: 1,
          sessionNumber: 1,
          status: "closed",
          records: [
            {
              studentId: IDS.studentLab1,
              markedAt: new Date("2026-03-12T15:05:00Z"),
              status: "presente",
              modifiedBy: null, modifiedAt: null, modificationReason: null,
            },
          ],
          createdBy: IDS.teacherLab,
          closedAt: new Date("2026-03-12T17:00:00Z"),
        },
      ],
      createdAt: new Date("2026-03-10T08:00:00Z"),
      updatedAt: new Date("2026-03-12T17:00:00Z"),
      __v: 1,
    },
  ]);

  print("✅ 3 registros de asistencia insertados (Enfermería: 3 fechas, Farmacia: 2, Laboratorio: 1).");
}
