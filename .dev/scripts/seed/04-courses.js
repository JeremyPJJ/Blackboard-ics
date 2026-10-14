// ============================================================
// 04-courses.js
// 3 cursos con semanas, sesiones y materiales embebidos.
// Cada curso tiene teacher, students, invitationConfig.
// ============================================================

function seedCourses() {
  print("\n📚 Insertando cursos...");

  db.courses.deleteMany({});

  db.courses.insertMany([
    // ========================
    // CURSO 1: ENFERMERÍA — Cuidados Básicos de Enfermería
    // 4 semanas, 2 sesiones por semana = 8 sesiones
    // 3 estudiantes inscritos
    // ========================
    {
      _id: IDS.courseEnfer,
      name: "Cuidados Básicos de Enfermería",
      code: "ENFER-101",
      description: "Curso introductorio sobre los fundamentos de enfermería: signos vitales, higiene del paciente, posición anatómica y protocolos básicos de atención. Orientado a estudiantes del primer ciclo de la carrera de Enfermería.",
      coverImage: null,
      career: "Enfermería",
      status: "activo",
      startDate: new Date("2026-03-01T00:00:00Z"),
      endDate: new Date("2026-07-31T00:00:00Z"),
      expirationDate: new Date("2026-08-31T00:00:00Z"),

      teachers: [
        {
          userId: IDS.teacherEnfer,
          role: "owner",
          joinedAt: new Date("2026-02-15T10:00:00Z"),
        },
      ],
      students: [
        { userId: IDS.studentEnfer1, enrolledAt: new Date("2026-03-01T08:00:00Z"), enrolledBy: "code" },
        { userId: IDS.studentEnfer2, enrolledAt: new Date("2026-03-01T09:30:00Z"), enrolledBy: "code" },
        { userId: IDS.studentEnfer3, enrolledAt: new Date("2026-03-02T14:00:00Z"), enrolledBy: "link" },
      ],

      invitationConfig: {
        code: "ENFER-ABC12",
        isActive: true,
        expiresAt: new Date("2026-12-31T23:59:59Z"),
        maxUses: 0, // ilimitado
        currentUses: 3,
      },

      weeks: [
        {
          weekNumber: 1,
          title: "Fundamentos de Enfermería",
          startDate: new Date("2026-03-01T00:00:00Z"),
          endDate: new Date("2026-03-07T23:59:59Z"),
          sessions: [
            {
              sessionNumber: 1,
              title: "Introducción a los Signos Vitales",
              description: "Conceptos fundamentales: temperatura corporal, frecuencia cardíaca, frecuencia respiratoria, presión arterial y saturación de oxígeno.",
              startDate: new Date("2026-03-03T09:00:00Z"),
              endDate: new Date("2026-03-03T11:00:00Z"),
              status: "published",
              materials: [
                {
                  title: "Guía de Signos Vitales 2026",
                  description: "Material teórico completo sobre signos vitales y valores normales.",
                  type: "pdf",
                  fileMetadataId: IDS.fileMatEnfer1,
                  order: 1,
                  uploadedAt: new Date("2026-03-01T08:00:00Z"),
                },
                {
                  title: "Video: Demostración de Técnicas",
                  description: "Demostración práctica de toma de signos vitales.",
                  type: "video",
                  fileMetadataId: IDS.fileMatEnfer2,
                  order: 2,
                  uploadedAt: new Date("2026-03-02T10:00:00Z"),
                },
              ],
            },
            {
              sessionNumber: 2,
              title: "Taller: Práctica de Signos Vitales",
              description: "Ejercicios prácticos de medición e interpretación de signos vitales.",
              startDate: new Date("2026-03-05T09:00:00Z"),
              endDate: new Date("2026-03-05T11:00:00Z"),
              status: "published",
              materials: [],
            },
          ],
        },
        {
          weekNumber: 2,
          title: "Protocolos de Cuidado del Paciente",
          startDate: new Date("2026-03-08T00:00:00Z"),
          endDate: new Date("2026-03-14T23:59:59Z"),
          sessions: [
            {
              sessionNumber: 1,
              title: "Higiene y Posición Anatómica",
              description: "Protocolos de higiene del paciente, posiciones anatómicas y prevención de úlceras por presión.",
              startDate: new Date("2026-03-10T09:00:00Z"),
              endDate: new Date("2026-03-10T11:00:00Z"),
              status: "published",
              materials: [
                {
                  title: "Protocolo de Cuidados del Paciente",
                  description: "Guía completa de protocolos institucionales.",
                  type: "pdf",
                  fileMetadataId: IDS.fileMatEnfer3,
                  order: 1,
                  uploadedAt: new Date("2026-03-08T09:00:00Z"),
                },
              ],
            },
            {
              sessionNumber: 2,
              title: "Casos Clínicos: Cuidados Básicos",
              description: "Resolución de casos clínicos aplicando los protocolos estudiados.",
              startDate: new Date("2026-03-12T09:00:00Z"),
              endDate: new Date("2026-03-12T11:00:00Z"),
              status: "published",
              materials: [],
            },
          ],
        },
        {
          weekNumber: 3,
          title: "Administración de Medicamentos",
          startDate: new Date("2026-03-15T00:00:00Z"),
          endDate: new Date("2026-03-21T23:59:59Z"),
          sessions: [
            {
              sessionNumber: 1,
              title: "Vías de Administración",
              description: "Estudio de las principales vías de administración de medicamentos: oral, sublingual, intramuscular, endovenosa.",
              startDate: new Date("2026-03-17T09:00:00Z"),
              endDate: new Date("2026-03-17T11:00:00Z"),
              status: "published",
              materials: [],
            },
            {
              sessionNumber: 2,
              title: "Cálculo de Dosis",
              description: "Ejercicios de cálculo de dosis según peso, edad y vía de administración.",
              startDate: new Date("2026-03-19T09:00:00Z"),
              endDate: new Date("2026-03-19T11:00:00Z"),
              status: "published",
              materials: [],
            },
          ],
        },
        {
          weekNumber: 4,
          title: "Evaluación y Cierre",
          startDate: new Date("2026-03-22T00:00:00Z"),
          endDate: new Date("2026-03-28T23:59:59Z"),
          sessions: [
            {
              sessionNumber: 1,
              title: "Repaso General",
              description: "Repaso de todos los temas vistos en las semanas anteriores.",
              startDate: new Date("2026-03-24T09:00:00Z"),
              endDate: new Date("2026-03-24T11:00:00Z"),
              status: "published",
              materials: [],
            },
            {
              sessionNumber: 2,
              title: "Evaluación Final del Curso",
              description: "Evaluación escrita y práctica de los contenidos del curso.",
              startDate: new Date("2026-03-26T09:00:00Z"),
              endDate: new Date("2026-03-26T11:00:00Z"),
              status: "published",
              materials: [],
            },
          ],
        },
      ],

      createdBy: IDS.teacherEnfer,
      isDeleted: false,
      createdAt: new Date("2026-02-15T10:00:00Z"),
      updatedAt: new Date("2026-03-26T11:00:00Z"),
      __v: 12,
    },

    // ========================
    // CURSO 2: FARMACIA — Introducción a la Farmacología
    // 3 semanas, 2 sesiones por semana = 6 sesiones
    // 2 estudiantes inscritos
    // ========================
    {
      _id: IDS.courseFarma,
      name: "Introducción a la Farmacología",
      code: "FARMA-101",
      description: "Curso básico de farmacología: farmacocinética, farmacodinamia, interacciones medicamentosas y clasificación de los principales grupos farmacológicos. Dirigido a estudiantes de Farmacia.",
      coverImage: null,
      career: "Farmacia",
      status: "activo",
      startDate: new Date("2026-03-05T00:00:00Z"),
      endDate: new Date("2026-07-31T00:00:00Z"),
      expirationDate: new Date("2026-08-31T00:00:00Z"),

      teachers: [
        {
          userId: IDS.teacherFarma,
          role: "owner",
          joinedAt: new Date("2026-02-20T10:00:00Z"),
        },
      ],
      students: [
        { userId: IDS.studentFarma1, enrolledAt: new Date("2026-03-05T08:00:00Z"), enrolledBy: "code" },
        { userId: IDS.studentFarma2, enrolledAt: new Date("2026-03-05T10:00:00Z"), enrolledBy: "import" },
      ],

      invitationConfig: {
        code: "FARMA-XYZ34",
        isActive: true,
        expiresAt: new Date("2026-12-31T23:59:59Z"),
        maxUses: 0,
        currentUses: 2,
      },

      weeks: [
        {
          weekNumber: 1,
          title: "Principios de Farmacocinética",
          startDate: new Date("2026-03-05T00:00:00Z"),
          endDate: new Date("2026-03-11T23:59:59Z"),
          sessions: [
            {
              sessionNumber: 1,
              title: "Absorción y Distribución de Fármacos",
              description: "Mecanismos de absorción, biodisponibilidad y distribución de fármacos en el organismo.",
              startDate: new Date("2026-03-07T14:00:00Z"),
              endDate: new Date("2026-03-07T16:00:00Z"),
              status: "published",
              materials: [
                {
                  title: "Diapositivas: Farmacocinética General",
                  description: "Presentación completa del tema.",
                  type: "powerpoint",
                  fileMetadataId: IDS.fileMatFarma1,
                  order: 1,
                  uploadedAt: new Date("2026-03-05T08:30:00Z"),
                },
              ],
            },
            {
              sessionNumber: 2,
              title: "Metabolismo y Excreción",
              description: "Biotransformación hepática, metabolismo de fase I y II, vías de excreción.",
              startDate: new Date("2026-03-09T14:00:00Z"),
              endDate: new Date("2026-03-09T16:00:00Z"),
              status: "published",
              materials: [],
            },
          ],
        },
        {
          weekNumber: 2,
          title: "Farmacodinamia e Interacciones",
          startDate: new Date("2026-03-12T00:00:00Z"),
          endDate: new Date("2026-03-18T23:59:59Z"),
          sessions: [
            {
              sessionNumber: 1,
              title: "Receptores y Mecanismos de Acción",
              description: "Tipos de receptores, afinidad, eficacia y potencia de los fármacos.",
              startDate: new Date("2026-03-14T14:00:00Z"),
              endDate: new Date("2026-03-14T16:00:00Z"),
              status: "published",
              materials: [
                {
                  title: "Tabla de Interacciones Medicamentosas",
                  description: "Referencia rápida de las principales interacciones.",
                  type: "pdf",
                  fileMetadataId: IDS.fileMatFarma2,
                  order: 1,
                  uploadedAt: new Date("2026-03-12T11:00:00Z"),
                },
              ],
            },
            {
              sessionNumber: 2,
              title: "Taller: Análisis de Interacciones",
              description: "Ejercicios prácticos de identificación de interacciones medicamentosas.",
              startDate: new Date("2026-03-16T14:00:00Z"),
              endDate: new Date("2026-03-16T16:00:00Z"),
              status: "published",
              materials: [],
            },
          ],
        },
        {
          weekNumber: 3,
          title: "Clasificación de Fármacos",
          startDate: new Date("2026-03-19T00:00:00Z"),
          endDate: new Date("2026-03-25T23:59:59Z"),
          sessions: [
            {
              sessionNumber: 1,
              title: "Analgésicos y Antiinflamatorios",
              description: "AINEs, opioides, paracetamol: mecanismos, usos y efectos adversos.",
              startDate: new Date("2026-03-21T14:00:00Z"),
              endDate: new Date("2026-03-21T16:00:00Z"),
              status: "published",
              materials: [],
            },
            {
              sessionNumber: 2,
              title: "Antibióticos y Antivirales",
              description: "Clasificación, espectro de acción y resistencia antimicrobiana.",
              startDate: new Date("2026-03-23T14:00:00Z"),
              endDate: new Date("2026-03-23T16:00:00Z"),
              status: "published",
              materials: [],
            },
          ],
        },
      ],

      createdBy: IDS.teacherFarma,
      isDeleted: false,
      createdAt: new Date("2026-02-20T10:00:00Z"),
      updatedAt: new Date("2026-03-23T16:00:00Z"),
      __v: 8,
    },

    // ========================
    // CURSO 3: LABORATORIO — Análisis Clínicos Básicos
    // 3 semanas, 1 sesión por semana = 3 sesiones
    // 1 estudiante inscrito
    // ========================
    {
      _id: IDS.courseLab,
      name: "Análisis Clínicos Básicos",
      code: "LAB-101",
      description: "Introducción a los análisis clínicos de laboratorio: microscopía, preparación de muestras, interpretación de resultados y control de calidad. Para estudiantes de Laboratorio Clínico.",
      coverImage: null,
      career: "Laboratorio",
      status: "activo",
      startDate: new Date("2026-03-10T00:00:00Z"),
      endDate: new Date("2026-07-31T00:00:00Z"),
      expirationDate: new Date("2026-08-31T00:00:00Z"),

      teachers: [
        {
          userId: IDS.teacherLab,
          role: "owner",
          joinedAt: new Date("2026-02-25T10:00:00Z"),
        },
      ],
      students: [
        { userId: IDS.studentLab1, enrolledAt: new Date("2026-03-10T08:00:00Z"), enrolledBy: "manual" },
      ],

      invitationConfig: {
        code: "LAB-DEF56",
        isActive: true,
        expiresAt: new Date("2026-12-31T23:59:59Z"),
        maxUses: 0,
        currentUses: 1,
      },

      weeks: [
        {
          weekNumber: 1,
          title: "Introducción a la Microscopía",
          startDate: new Date("2026-03-10T00:00:00Z"),
          endDate: new Date("2026-03-16T23:59:59Z"),
          sessions: [
            {
              sessionNumber: 1,
              title: "Fundamentos del Microscopio",
              description: "Partes del microscopio, tipos de microscopía, preparación de muestras y técnicas de tinción.",
              startDate: new Date("2026-03-12T15:00:00Z"),
              endDate: new Date("2026-03-12T17:00:00Z"),
              status: "published",
              materials: [
                {
                  title: "Manual de Microscopía Virtual",
                  description: "Guía completa de uso del microscopio y técnicas básicas.",
                  type: "pdf",
                  fileMetadataId: IDS.fileMatLab1,
                  order: 1,
                  uploadedAt: new Date("2026-03-10T09:00:00Z"),
                },
                {
                  title: "Muestra Histológica: Riñón",
                  description: "Imagen de referencia de una muestra de tejido renal.",
                  type: "image",
                  fileMetadataId: IDS.fileMatLab2,
                  order: 2,
                  uploadedAt: new Date("2026-03-10T10:00:00Z"),
                },
              ],
            },
          ],
        },
        {
          weekNumber: 2,
          title: "Preparación de Muestras",
          startDate: new Date("2026-03-17T00:00:00Z"),
          endDate: new Date("2026-03-23T23:59:59Z"),
          sessions: [
            {
              sessionNumber: 1,
              title: "Técnicas de Obtención y Procesamiento",
              description: "Extracción de muestras sanguíneas, centrifugado, y preparación de laminillas.",
              startDate: new Date("2026-03-19T15:00:00Z"),
              endDate: new Date("2026-03-19T17:00:00Z"),
              status: "published",
              materials: [],
            },
          ],
        },
        {
          weekNumber: 3,
          title: "Interpretación de Resultados",
          startDate: new Date("2026-03-24T00:00:00Z"),
          endDate: new Date("2026-03-30T23:59:59Z"),
          sessions: [
            {
              sessionNumber: 1,
              title: "Valores de Referencia y Control de Calidad",
              description: "Rangos normales, interpretación de resultados alterados y control de calidad en el laboratorio.",
              startDate: new Date("2026-03-26T15:00:00Z"),
              endDate: new Date("2026-03-26T17:00:00Z"),
              status: "published",
              materials: [],
            },
          ],
        },
      ],

      createdBy: IDS.teacherLab,
      isDeleted: false,
      createdAt: new Date("2026-02-25T10:00:00Z"),
      updatedAt: new Date("2026-03-26T17:00:00Z"),
      __v: 5,
    },
  ]);

  print("✅ 3 cursos insertados con semanas, sesiones y materiales embebidos.");
}
