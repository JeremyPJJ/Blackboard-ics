# Seed Data — Plataforma Virtual IESTP Ciencias de la Salud

## Datos de Demo para Desarrollo Local

Este directorio contiene scripts de seed para crear datos iniciales realistas en la base de datos MongoDB local.

---

## Requisitos

- **MongoDB** corriendo en `localhost:27017`
- **mongosh** (MongoDB Shell) instalado

### Verificar MongoDB

```bash
# Verificar que MongoDB está corriendo
mongosh --eval "db.runCommand({ ping: 1 })"
```

---

## Ejecución Rápida

### Opción 1: Limpieza completa + Seed (recomendado)

```bash
cd scripts/seed
mongosh --file cleanup.js
mongosh --file seed-main.js
```

### Opción 2: Solo Seed (si la BD está vacía)

```bash
cd scripts/seed
mongosh --file seed-main.js
```

### Opción 3: Desde dentro de mongosh

```bash
mongosh
use plataforma_virtual
load("scripts/seed/seed-main.js")
```

### Opción 4: Un solo paso (limpieza + seed)

```bash
cd scripts/seed
mongosh --eval "load('cleanup.js'); load('seed-main.js')"
```

---

## Credenciales de Demo

**Contraseña para TODOS los usuarios:** `demo123`

### Administradores

| Nombre | Email | DNI | Tags |
|--------|-------|-----|------|
| Carlos Mendoza Ríos | `carlos.mendoza@ics.edu.pe` | 10234567 | Super Administrador |
| Ana Lucía Paredes Vega | `ana.paredes@ics.edu.pe` | 20345678 | Unidad Académica |

### Docentes

| Nombre | Email | DNI | Carrera | Cursos |
|--------|-------|-----|---------|--------|
| Rosa Elvira Quispe Mamani | `rosa.quispe@ics.edu.pe` | 30456789 | Enfermería | Cuidados Básicos de Enfermería |
| Jorge Luis Huamán Salazar | `jorge.huaman@ics.edu.pe` | 40567890 | Farmacia | Introducción a la Farmacología |
| Carmen Sofía Díaz Castillo | `carmen.diaz@ics.edu.pe` | 50678901 | Laboratorio | Análisis Clínicos Básicos |

### Estudiantes

| Nombre | Email | DNI | Carrera | Cursos Inscritos |
|--------|-------|-----|---------|-----------------|
| María Fernanda Torres Silva | `maria.torres@est.ics.edu.pe` | 60789012 | Enfermería | Cuidados Básicos |
| Luis Alberto Ramos Espinoza | `luis.ramos@est.ics.edu.pe` | 70890123 | Enfermería | Cuidados Básicos |
| Andrea Paola Vargas Chávez | `andrea.vargas@est.ics.edu.pe` | 80901234 | Enfermería | Cuidados Básicos |
| Diego Alejandro Morales Rojas | `diego.morales@est.ics.edu.pe` | 11234567 | Farmacia | Intro. Farmacología |
| Valeria Sofía Cruz Delgado | `valeria.cruz@est.ics.edu.pe` | 22345678 | Farmacia | Intro. Farmacología |
| César Augusto Peña Herrera | `cesar.pena@est.ics.edu.pe` | 33456789 | Laboratorio | Análisis Clínicos |

---

## Cursos de Demo

### 1. Cuidados Básicos de Enfermería (`ENFER-101`)

- **Código invitación:** `ENFER-ABC12`
- **Docente:** Rosa Elvira Quispe Mamani
- **Estudiantes:** 3 (María Torres, Luis Ramos, Andrea Vargas)
- **Estructura:** 4 semanas × 2 sesiones = 8 sesiones
- **Materiales:** 3 archivos (PDF guía, video demostración, PDF protocolo)
- **Tarea:** "Informe de Signos Vitales" (deadline: 2026-09-15, futura)
- **Asistencia:** 3 fechas cerradas

### 2. Introducción a la Farmacología (`FARMA-101`)

- **Código invitación:** `FARMA-XYZ34`
- **Docente:** Jorge Luis Huamán Salazar
- **Estudiantes:** 2 (Diego Morales, Valeria Cruz)
- **Estructura:** 3 semanas × 2 sesiones = 6 sesiones
- **Materiales:** 2 archivos (PPTX farmacocinética, PDF interacciones)
- **Tarea:** "Análisis de Interacciones Medicamentosas" (deadline: 2026-07-01, PASADA → demo "fuera de fecha")
- **Asistencia:** 2 fechas cerradas

### 3. Análisis Clínicos Básicos (`LAB-101`)

- **Código invitación:** `LAB-DEF56`
- **Docente:** Carmen Sofía Díaz Castillo
- **Estudiantes:** 1 (César Peña)
- **Estructura:** 3 semanas × 1 sesión = 3 sesiones
- **Materiales:** 2 archivos (PDF manual microscopía, imagen muestra)
- **Tarea:** "Práctica de Microscopía Virtual" (sin límite de fecha)
- **Asistencia:** 1 fecha cerrada

---

## Escenarios de Demo Incluidos

| Escenario | Descripción | Dónde |
|-----------|-------------|-------|
| Tarea a tiempo | María Torres entregó antes del deadline | Task Enfermería |
| Tarea fuera de fecha | Diego Morales entregó 4 días tarde | Task Farmacia |
| Tarea sin límite | César Peña entregó (sin deadline) | Task Laboratorio |
| Tarea calificada | César Peña tiene nota 17/20 publicada | Task Laboratorio |
| Tarea pendiente | María Torres entregó, falta calificar | Task Enfermería |
| Tarea tardía con solicitud | Diego Morales solicitó aceptación tardía | Task Farmacia |
| Asistencia presente | María Torres — presente | Enfermería, fecha 1 |
| Asistencia tardanza | Luis Ramos — tardanza (fuera de tolerancia) | Enfermería, fecha 1 |
| Asistencia ausente | Andrea Vargas — ausente | Enfermería, fecha 1 |
| Asistencia modificada | Docente corrigió tardanza de Andrea | Enfermería, fecha 3 |
| Login fallido | Intento desde IP externa con credenciales inválidas | Audit entry #12 |
| Configuración actualizada | Super admin cambió maxFileSizeBytes | Audit entry #15 |

---

## Estructura de Archivos

```
scripts/seed/
├── README.md                    ← Este archivo
├── cleanup.js                   ← Limpia la BD completa
├── seed-main.js                 ← Script principal (orquestador)
├── 00-object-ids.js             ← IDs fijos y constantes
├── 01-institutional-settings.js ← Configuración institucional
├── 02-users.js                  ← 11 usuarios
├── 03-file-metadata.js          ← 12 metadatos de archivos
├── 04-courses.js                ← 3 cursos con semanas/sesiones/materiales
├── 05-tasks.js                  ← 3 tareas
├── 06-task-submissions.js       ← 3 entregas
├── 07-attendance-registers.js   ← 3 registros de asistencia
└── 08-audit-entries.js          ← 15 entradas de auditoría
```

---

## Validación Post-Seed

El script `seed-main.js` ejecuta validaciones automáticas al final:

1. **Conteo de documentos** — verifica que cada colección tiene la cantidad esperada
2. **Referencias cruzadas** — verifica que todos los userIds en courses existen en users
3. **Task submissions** — verifica que taskId y studentId son válidos
4. **Códigos de invitación** — verifica que son únicos

---

## Notas Técnicas

### Contraseñas
- Todas las contraseñas están hasheadas con **bcrypt** (salt rounds: 10)
- Hash para `demo123`: `$2b$10$ue3cwGiCKv39GS6.J3dxXuD0LIr2QTXGn0KcMvaYvmJgmWgZGjaSG`
- En producción, cada usuario tendría su propio hash

### Archivos Físicos
- Los `file_metadata` apuntan a rutas locales bajo `uploads/`
- Los archivos físicos NO existen en disco (solo metadatos)
- Para demo de descarga, crear archivos placeholder en esas rutas

### IDs Predecibles
- Se usan ObjectIds fijos para facilitar las referencias entre documentos
- Formato: `66a000000000000000000001` (users), `66b000000000000000000001` (courses), etc.
- Esto permite referenciar documentos sin necesidad de hacer queries de lookup

### Zona Horaria
- Todas las fechas están en UTC
- La configuración institucional especifica `America/Lima` (UTC-5)
- El frontend debe convertir a la zona horaria local

---

## Próximos Pasos

Cuando el backend NestJS esté implementado:

1. Migrar estos scripts a un `SeedService` de NestJS usando los Mongoose schemas
2. Usar `@nestjs/config` para el connection string
3. Ejecutar con `npm run seed` o similar
4. Agregar flag `--force` para limpieza + re-seed
