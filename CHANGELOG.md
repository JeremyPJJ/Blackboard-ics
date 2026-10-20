# Changelog — Correcciones y mejoras

## Correcciones

**Pestañas del perfil en móvil:** Se retiró la pestaña "Notificaciones" de "Mi perfil", dejando únicamente "Información personal" y "Seguridad". Se ajustó su distribución para mostrar ambas completas sin flechas de desplazamiento, permitiendo que "Información personal" ocupe dos líneas en pantallas pequeñas y evitando el recorte de "Seguridad".

**Conversaciones en tiempo real:** Se corrigió un problema por el cual las conversaciones creadas después de establecer la conexión del socket no incorporaban automáticamente al usuario a su sala correspondiente en tiempo real.

**Footer del login:** Se corrigió el footer de la página de inicio de sesión para mejorar su visualización y presentación.

**Header de la página:** Se corrigió el encabezado de la página para mejorar su estructura y presentación visual.

**Vista previa de PDF:** Se aumentó el tamaño del modal al abrir un archivo PDF para mejorar la visualización del documento y facilitar su lectura.

**Etiqueta del campo "Tipo":** Se corrigió el recorte de la etiqueta flotante del campo "Tipo" en los diálogos "Registrar Sesión" y "Nuevo Material", que aparecía cortada porque el contenido del diálogo no tenía espacio superior suficiente.

**Separación de acciones en la vista de semanas:** Se corrigió el espaciado entre los botones de agregar, editar y eliminar y los íconos de expandir/contraer de las semanas y sus secciones, que quedaban demasiado juntos en pantallas móviles.

**Vista previa de archivos:** Se corrigió el diálogo de vista previa, que quedaba bloqueado en "Cargando archivo..." cuando el archivo ya no existía en el servidor. Ahora muestra un mensaje claro con opciones para reintentar o descargar, y se eliminó el error NG0904 al renderizar PDFs asignando el origen del visor de forma segura. También se detecta el tipo de archivo por su extensión lógica cuando el servidor devuelve un tipo MIME genérico, y se agregó un botón de cierre visible en la cabecera del modal para facilitar su uso en móviles.

**Archivos duplicados al subir o reemplazar:** Se agregó protección frente a peticiones de subida idénticas concurrentes o repetidas en un intervalo de 10 segundos. El backend compara el contenido del archivo, el usuario y el contexto de la subida para reutilizar el registro y evitar copias duplicadas. También se bloqueó el guardado repetido en los diálogos de creación y edición de materiales.

**Limpieza del archivo reemplazado:** Al reemplazar un archivo de un material o de una sesión, el anterior se elimina únicamente después de guardar correctamente los cambios del curso. Se conserva si otro material del mismo curso todavía lo utiliza.

## Mejoras

**Nombres únicos para los archivos almacenados:** Se incorporó un identificador único a los nombres de almacenamiento para evitar colisiones entre archivos subidos en el mismo instante, conservando el nombre original en los metadatos.

**Rediseño del panel de notificaciones:** Se renovó por completo la interfaz del panel con un encabezado que incluye icono, subtítulo dinámico ("Tienes N notificaciones sin leer" o "Estás al día") y botón para marcar todas como leídas. Las notificaciones ahora se agrupan por día ("Hoy", "Ayer" y fecha), se muestran como tarjetas con estilo diferenciado para leídas y no leídas, iconos según el tipo, indicador de no leída y hora. Se agregó el pie "Ver todas las notificaciones" que cierra el panel y navega a Mensajería, y se corrigieron los desbordes y el desplazamiento en pantallas pequeñas.

**Rediseño del diálogo Mi perfil:** Se reorganizó el contenido en tres pestañas: "Información personal", que se muestra por defecto al abrir y presenta los datos reales del usuario y sus cursos; "Seguridad", que conserva el formulario de cambio de contraseña con sus validaciones y medidor de fortaleza; y "Notificaciones", que da acceso al panel de notificaciones mostrando el contador de no leídas. Se mantiene la tarjeta del usuario con avatar, correo y rol, se mejoró la adaptación a dispositivos móviles y la pestaña vuelve siempre a "Información personal" al reabrir el diálogo.

**Rediseño de la vista de semanas:** Se renovó la presentación de las semanas dentro de "Desarrollo del Curso": la cabecera ahora muestra un icono destacado, "Semana N" con su título como subtítulo (oculto si se repite), la fecha de creación de forma compacta y la cuenta regresiva de la sesión, con las acciones de editar y eliminar agrupadas. Las secciones internas (Sesión, Materiales, Tareas, Pasitos · Exámenes y Foros) incluyen un icono, el nombre y un contador tipo chip, y sus botones "Agregar/Nuevo" se adaptan a un botón circular "+" en pantallas angostas. También se mejoró la adaptación de materiales y tareas en móvil y la altura de las cabeceras.

