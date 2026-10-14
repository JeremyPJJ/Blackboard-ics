# Plataforma Virtual IESTP Ciencias de la Salud

## 🔑 Credenciales de Acceso (Demo)

**Contraseña de todos los usuarios demo: `demo123`**

| Usuario | Correo | Rol | Estado |
|---------|--------|-----|--------|
| Carlos Mendoza | `carlos.mendoza@ics.edu.pe` | **Super Administrador** | Activo |
| Ana Paredes | `ana.paredes@ics.edu.pe` | **Unidad Académica** (Supervisora de Docentes) | Activo |
| Rosa Quispe | `rosa.quispe@ics.edu.pe` | **Docente** (Enfermería) | Activo |
| Jorge Huamán | `jorge.huaman@ics.edu.pe` | **Docente** (Farmacia) | Activo |
| Carmen Díaz | `carmen.diaz@ics.edu.pe` | **Docente** (Laboratorio) | Activo |
| María Torres | `maria.torres@est.ics.edu.pe` | **Estudiante** (Enfermería) | Activo |
| Luis Ramos | `luis.ramos@est.ics.edu.pe` | **Estudiante** (Farmacia) | Activo |
| Andrea Vargas | `andrea.vargas@est.ics.edu.pe` | **Estudiante** (Laboratorio) | Activo |
| Diego Morales | `diego.morales@est.ics.edu.pe` | **Estudiante** (Matemática) | Activo |
| Valeria Cruz | `valeria.cruz@est.ics.edu.pe` | **Estudiante** (Economía) | Activo |
| Sofía López | `sofia.lopez@est.ics.edu.pe` | **Estudiante** (Enfermería) | **Inactivo** |

---

## 👥 Roles del Sistema

### 1. Super Administrador (`super_admin`)
- Acceso TOTAL al sistema (todos los permisos, sin restricción)
- Gestiona usuarios, cursos, encuestas, exámenes, ofertas, auditoría, logs
- No puede ser eliminado

### 2. Unidad Académica (`unidad_academica`) — Supervisora de Docentes
**Permisos explícitos asignados (Ana Paredes):**
- `usuarios.ver`, `usuarios.crear`, `usuarios.editar`
- `cursos.ver`, `cursos.crear`, `cursos.editar`, `cursos.archivar`
- `tareas.ver`, `tareas.crear`, `tareas.calificar`
- `asistencia.ver`, `asistencia.registrar`, `asistencia.modificar`
- `foros.crear`, `foros.post`
- `encuestas.crear`, `encuestas.ver`
- `ofertas.crear`, `ofertas.ver`
- `examenes.crear`, `examenes.ver`

### 3. Docente (`docente`)
**Permisos por defecto del rol** (si no tiene permisos explícitos):
- `cursos.ver`, `cursos.crear`, `cursos.editar`, `cursos.archivar`
- `tareas.ver`, `tareas.crear`, `tareas.editar`, `tareas.eliminar`, `tareas.calificar`
- `asistencia.ver`, `asistencia.registrar`, `asistencia.modificar`
- `foros.crear`, `foros.post`
- `encuestas.crear`, `encuestas.ver`
- **Regla**: solo ve/gestiona SUS cursos (el backend lo fuerza)

### 4. Estudiante (`estudiante`)
**Permisos por defecto del rol:**
- `cursos.ver`, `tareas.ver`, `tareas.entregar`, `foros.post`
- **No puede** crear/editar/eliminar tareas, cursos, materiales ni gestionar asistencia
- Solo ve sus cursos inscritos

### 5. Secretaría (`secretaria`) y Soporte (`soporte`)
- Roles staff: ven dashboard administrativo y usuarios (`usuarios.ver`, `cursos.ver`)

---

## 🔐 Cómo funcionan los permisos (2 niveles)

1. **Por rol**: cada rol tiene permisos por defecto (tabla arriba)
2. **Permisos individuales**: se asignan por usuario en el formulario de usuario
   - **Si el usuario tiene permisos explícitos, se usan SOLO esos** (anulan los del rol)
   - El backend **rechaza** acciones sin permiso (403)
   - El frontend **oculta** los botones/acciones sin permiso

### Catálogo completo de permisos

| Módulo | Permisos |
|--------|----------|
| Usuarios | `usuarios.ver`, `usuarios.crear`, `usuarios.editar`, `usuarios.eliminar` |
| Cursos | `cursos.ver`, `cursos.crear`, `cursos.editar`, `cursos.archivar`, `cursos.eliminar` |
| Tareas | `tareas.ver`, `tareas.crear`, `tareas.editar`, `tareas.eliminar`, `tareas.calificar`, `tareas.entregar` |
| Asistencia | `asistencia.ver`, `asistencia.registrar`, `asistencia.modificar` |
| Foros | `foros.crear`, `foros.post` |
| Encuestas | `encuestas.crear`, `encuestas.ver` |
| Exámenes | `examenes.crear`, `examenes.ver` |
| Ofertas | `ofertas.crear`, `ofertas.ver` |

---

## 🎓 Datos de ejemplo (seed)

- **2 cursos**: "Cuidados Básicos de Enfermería" (código de unión `ENFE-ABC12`) y "Farmacología Básica" (`FARM-9XQK8`)
- **2 tareas** publicadas
- **3 foros** (1 evaluado)
- **1 registro de asistencia**

Para restaurar los datos demo: `mongosh "mongodb://localhost:27017/plataforma_virtual" backend/scripts/reseed-varied.js`

> ⚠️ Este documento contiene credenciales de **DEMO** — no usar en producción.