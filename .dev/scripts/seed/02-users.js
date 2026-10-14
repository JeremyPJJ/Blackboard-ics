// ============================================================
// 02-users.js
// 11 usuarios: 2 admins, 3 docentes, 6 estudiantes
// Contraseña para todos: "demo123"
// ============================================================

function seedUsers() {
  print("\n👥 Insertando usuarios...");

  db.users.deleteMany({});

  const now = new Date();
  const password = DEMO_PASSWORD_HASH;

  db.users.insertMany([
    // ========================
    // ADMINISTRADORES (2)
    // ========================
    {
      _id: IDS.superAdmin,
      dni: "10234567",
      names: "Carlos",
      lastNames: "Mendoza Ríos",
      institutionalEmail: "carlos.mendoza@ics.edu.pe",
      personalEmail: "cmendoza@gmail.com",
      phone: "+51 942 555 1001",
      birthDate: new Date("1980-05-15T00:00:00Z"),
      photo: null,
      password: password,
      role: "super_admin",
      status: "activo",
      tags: ["Super Administrador"],
      permissions: [],
      lastLogin: new Date("2026-08-21T14:30:00Z"),
      createdAt: new Date("2026-01-02T08:00:00Z"),
      updatedAt: now,
    },
    {
      _id: IDS.unidadAcad,
      dni: "20345678",
      names: "Ana Lucía",
      lastNames: "Paredes Vega",
      institutionalEmail: "ana.paredes@ics.edu.pe",
      personalEmail: "aparedes@outlook.com",
      phone: "+51 951 555 2002",
      birthDate: new Date("1985-09-22T00:00:00Z"),
      photo: null,
      password: password,
      role: "unidad_academica",
      status: "activo",
      tags: ["Unidad Académica"],
      permissions: ["auditoria.ver", "monitoreo.ver"],
      lastLogin: new Date("2026-08-20T09:15:00Z"),
      createdAt: new Date("2026-01-05T10:00:00Z"),
      updatedAt: now,
    },

    // ========================
    // DOCENTES (3)
    // ========================
    {
      _id: IDS.teacherEnfer,
      dni: "30456789",
      names: "Rosa Elvira",
      lastNames: "Quispe Mamani",
      institutionalEmail: "rosa.quispe@ics.edu.pe",
      personalEmail: "rquispe2020@gmail.com",
      phone: "+51 966 555 3003",
      birthDate: new Date("1988-03-10T00:00:00Z"),
      photo: null,
      password: password,
      role: "docente",
      status: "activo",
      tags: ["Enfermería"],
      permissions: [],
      lastLogin: new Date("2026-08-21T16:45:00Z"),
      createdAt: new Date("2026-01-10T09:00:00Z"),
      updatedAt: now,
    },
    {
      _id: IDS.teacherFarma,
      dni: "40567890",
      names: "Jorge Luis",
      lastNames: "Huamán Salazar",
      institutionalEmail: "jorge.huaman@ics.edu.pe",
      personalEmail: "jhuaman@hotmail.com",
      phone: "+51 977 555 4004",
      birthDate: new Date("1990-07-18T00:00:00Z"),
      photo: null,
      password: password,
      role: "docente",
      status: "activo",
      tags: ["Farmacia"],
      permissions: [],
      lastLogin: new Date("2026-08-19T11:20:00Z"),
      createdAt: new Date("2026-01-12T14:00:00Z"),
      updatedAt: now,
    },
    {
      _id: IDS.teacherLab,
      dni: "50678901",
      names: "Carmen Sofía",
      lastNames: "Díaz Castillo",
      institutionalEmail: "carmen.diaz@ics.edu.pe",
      personalEmail: "cdiaz.lab@gmail.com",
      phone: "+51 988 555 5005",
      birthDate: new Date("1992-11-25T00:00:00Z"),
      photo: null,
      password: password,
      role: "docente",
      status: "activo",
      tags: ["Laboratorio"],
      permissions: [],
      lastLogin: new Date("2026-08-22T08:00:00Z"),
      createdAt: new Date("2026-01-15T11:00:00Z"),
      updatedAt: now,
    },

    // ========================
    // ESTUDIANTES ENFERMERÍA (3)
    // ========================
    {
      _id: IDS.studentEnfer1,
      dni: "60789012",
      names: "María Fernanda",
      lastNames: "Torres Silva",
      institutionalEmail: "maria.torres@est.ics.edu.pe",
      personalEmail: "mftorres@gmail.com",
      phone: "+51 912 555 6006",
      birthDate: new Date("2002-04-12T00:00:00Z"),
      photo: null,
      password: password,
      role: "estudiante",
      status: "activo",
      tags: ["Enfermería"],
      permissions: [],
      lastLogin: new Date("2026-08-21T20:10:00Z"),
      createdAt: new Date("2026-02-01T08:00:00Z"),
      updatedAt: now,
    },
    {
      _id: IDS.studentEnfer2,
      dni: "70890123",
      names: "Luis Alberto",
      lastNames: "Ramos Espinoza",
      institutionalEmail: "luis.ramos@est.ics.edu.pe",
      personalEmail: "lramos@gmail.com",
      phone: "+51 923 555 7007",
      birthDate: new Date("2001-08-20T00:00:00Z"),
      photo: null,
      password: password,
      role: "estudiante",
      status: "activo",
      tags: ["Enfermería"],
      permissions: [],
      lastLogin: new Date("2026-08-20T18:30:00Z"),
      createdAt: new Date("2026-02-01T08:00:00Z"),
      updatedAt: now,
    },
    {
      _id: IDS.studentEnfer3,
      dni: "80901234",
      names: "Andrea Paola",
      lastNames: "Vargas Chávez",
      institutionalEmail: "andrea.vargas@est.ics.edu.pe",
      personalEmail: "avargas@gmail.com",
      phone: "+51 934 555 8008",
      birthDate: new Date("2003-01-15T00:00:00Z"),
      photo: null,
      password: password,
      role: "estudiante",
      status: "activo",
      tags: ["Enfermería"],
      permissions: [],
      lastLogin: new Date("2026-08-22T07:45:00Z"),
      createdAt: new Date("2026-02-01T08:00:00Z"),
      updatedAt: now,
    },

    // ========================
    // ESTUDIANTES FARMACIA (2)
    // ========================
    {
      _id: IDS.studentFarma1,
      dni: "11234567",
      names: "Diego Alejandro",
      lastNames: "Morales Rojas",
      institutionalEmail: "diego.morales@est.ics.edu.pe",
      personalEmail: "dmorales@gmail.com",
      phone: "+51 945 555 1111",
      birthDate: new Date("2002-06-08T00:00:00Z"),
      photo: null,
      password: password,
      role: "estudiante",
      status: "activo",
      tags: ["Farmacia"],
      permissions: [],
      lastLogin: new Date("2026-08-21T15:20:00Z"),
      createdAt: new Date("2026-02-01T08:00:00Z"),
      updatedAt: now,
    },
    {
      _id: IDS.studentFarma2,
      dni: "22345678",
      names: "Valeria Sofía",
      lastNames: "Cruz Delgado",
      institutionalEmail: "valeria.cruz@est.ics.edu.pe",
      personalEmail: "vcruz@gmail.com",
      phone: "+51 956 555 2222",
      birthDate: new Date("2001-12-03T00:00:00Z"),
      photo: null,
      password: password,
      role: "estudiante",
      status: "activo",
      tags: ["Farmacia"],
      permissions: [],
      lastLogin: new Date("2026-08-19T19:00:00Z"),
      createdAt: new Date("2026-02-01T08:00:00Z"),
      updatedAt: now,
    },

    // ========================
    // ESTUDIANTE LABORATORIO (1)
    // ========================
    {
      _id: IDS.studentLab1,
      dni: "33456789",
      names: "César Augusto",
      lastNames: "Peña Herrera",
      institutionalEmail: "cesar.pena@est.ics.edu.pe",
      personalEmail: "cpena@gmail.com",
      phone: "+51 967 555 3333",
      birthDate: new Date("2002-09-28T00:00:00Z"),
      photo: null,
      password: password,
      role: "estudiante",
      status: "activo",
      tags: ["Laboratorio"],
      permissions: [],
      lastLogin: new Date("2026-08-22T10:15:00Z"),
      createdAt: new Date("2026-02-01T08:00:00Z"),
      updatedAt: now,
    },
  ]);

  print(`✅ 11 usuarios insertados (2 admins, 3 docentes, 6 estudiantes).`);
}
