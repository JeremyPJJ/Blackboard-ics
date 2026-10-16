# Blackboard ICS — Plataforma Virtual

Plataforma virtual del IESTP Ciencias de la Salud, con frontend en **Angular 19** y backend en **NestJS 11**.

## Requisitos

- **Node.js 22 LTS** y npm.
- **MongoDB** local o una instancia accesible mediante URI (por ejemplo, MongoDB Atlas).
- Docker, solo si se utiliza la opción de MongoDB en contenedor indicada abajo.

## Base de datos

El proyecto utiliza **MongoDB**, una base de datos documental, mediante **Mongoose**.

La conexión se configura en `backend/.env`:

```dotenv
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=plataforma_virtual
```

- **Nombre de la base de datos:** `plataforma_virtual`.
- **Puerto predeterminado:** `27017`.
- MongoDB crea la base de datos al guardar los primeros datos; no es necesario crear tablas SQL.
- Para usar otra instancia, modifica `MONGODB_URI` y `MONGODB_DATABASE`.

## Cómo levantar el proyecto en desarrollo

Ejecuta los comandos desde la carpeta raíz del repositorio, salvo donde se indique otra ubicación. Mantén el backend y el frontend abiertos en **dos terminales independientes**.

### 1. Iniciar MongoDB

Si ya tienes MongoDB instalado, inicia su servicio y comprueba que esté disponible en `localhost:27017`.

Si prefieres usar Docker, ejecuta una sola vez:

```sh
docker run -d --name blackboard-mongo -p 27017:27017 -v blackboard-mongo-data:/data/db mongo:7
```

El volumen `blackboard-mongo-data` conserva los datos. En las siguientes ocasiones, si el contenedor está detenido, basta con:

```sh
docker start blackboard-mongo
```

### 2. Configurar e iniciar el backend

En la primera terminal:

```sh
cd backend
npm install
```

Crea el archivo de configuración a partir del ejemplo **si aún no tienes un `.env`**.

En Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

En Linux o macOS:

```sh
cp .env.example .env
```

Revisa en `backend/.env` la conexión a MongoDB. El ejemplo también incluye la configuración de JWT, archivos y el puerto del servidor (`PORT=3000`).

Desde `backend`, inicia el servidor con recarga automática:

```sh
npm run start:dev
```

El backend escucha en **http://localhost:3000**, con los endpoints bajo el prefijo **`/api`**.

### 3. Iniciar el frontend

En una segunda terminal, desde la raíz del repositorio:

```sh
cd frontend
npm install
npm start
```

Abre **http://localhost:4200** en el navegador.

En desarrollo, Angular utiliza `frontend/proxy.conf.json` para reenviar las peticiones `/api` a `http://localhost:3000`.

### Próximos arranques

Con las dependencias instaladas, el `.env` configurado y MongoDB en ejecución:

| Servicio | Carpeta | Comando |
| --- | --- | --- |
| Backend | `backend` | `npm run start:dev` |
| Frontend | `frontend` | `npm start` |

Para detener el frontend o el backend, pulsa `Ctrl+C` en su terminal. Si usas el contenedor de MongoDB, puedes detenerlo con `docker stop blackboard-mongo`.

## Compilación

Ejecuta `npm run build` dentro de `backend` o `frontend` para compilar el componente correspondiente.

## Documentación adicional

- [Credenciales de acceso](CREDENCIALES.md).
- [Historial de cambios](CHANGELOG.md).
