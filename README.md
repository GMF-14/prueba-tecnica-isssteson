# Prueba Técnica ISSSTESON — Sistema de Administración de Citas

Sistema para administrar citas médicas: catálogos de médicos y pacientes, y creación/edición/cancelación/consulta de citas, con login protegido por JWT.

Monorepo con:

- **`backend/`** — API REST en .NET 8, arquitectura por capas (Domain / Application / Infrastructure / Api), Entity Framework Core, SQL Server, JWT, Swagger.
- **`frontend/`** — SPA en React 19 + TypeScript (Vite, TanStack Router/Query, Zustand, React Hook Form + Zod, shadcn/ui, Tailwind CSS, react-big-calendar, Framer Motion, SweetAlert2).
- **`docker-compose.yml`** — levanta los 3 servicios (SQL Server, backend, frontend) con un solo comando.

## Requisitos previos

Para correrlo con Docker (recomendado) solo necesitas:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (con Docker Compose v2)

Para desarrollo local sin Docker necesitas además:

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 22+](https://nodejs.org/) y [pnpm](https://pnpm.io/) (`corepack enable` es suficiente si usas una versión reciente de Node)

## Levantar el proyecto con Docker (recomendado)

Desde la raíz del repositorio:

```bash
docker compose up -d
```

Esto construye las 3 imágenes, levanta SQL Server, espera a que esté disponible (healthcheck), aplica las migraciones de EF Core automáticamente al arrancar el backend (incluye datos de ejemplo: usuario admin, médicos, pacientes y varias citas) y sirve el frontend con Nginx.

| Servicio          | URL                                                          |
| ----------------- | ------------------------------------------------------------ |
| Frontend          | http://localhost:8080                                        |
| Backend / Swagger | http://localhost:5291/swagger                                |
| SQL Server        | `localhost,1433` (usuario `sa`, password `Citas#2026DevPwd`) |

Para detenerlo:

```bash
docker compose down
```

Para reiniciar desde cero (borra los datos de la base de datos):

```bash
docker compose down -v
docker compose up -d
```

### Credenciales de acceso

```
Usuario:    admin
Contraseña: Admin123!
```

## Desarrollo local (sin Docker)

Se puede correr el backend y el frontend directo en la máquina, usando solo el SQL Server de Docker:

```bash
# 1. Levanta únicamente la base de datos
docker compose up -d sqlserver

# 2. Backend (desde backend/)
cd backend
dotnet tool restore          # instala dotnet-ef (herramienta local del repo)
dotnet run --project src/Citas.Api
# Escucha en http://localhost:5291 — aplica migraciones y datos de ejemplo automáticamente.

# 3. Frontend (desde la raíz, en otra terminal)
pnpm install
pnpm dev
# Escucha en http://localhost:5173, y ya apunta a http://localhost:5291/api (ver frontend/.env)
```

## Tests

```bash
# Backend (xUnit) — reglas de negocio de Citas
cd backend
dotnet test

# Frontend (Vitest + React Testing Library)
pnpm test
```

## Variables de entorno

| Variable                                     | Dónde                              | Para qué                                                               |
| -------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------- |
| `ConnectionStrings__Default`                 | Backend (`appsettings.json` / env) | Cadena de conexión a SQL Server.                                       |
| `Jwt:Secret` / `Jwt:Issuer` / `Jwt:Audience` | Backend (`appsettings.json`)       | Firma y validación de los JWT.                                         |
| `VITE_API_URL`                               | Frontend (`frontend/.env`)         | Base URL de la API. En Docker se deja como `/api` (Nginx la redirige). |

> Los secretos de `appsettings.json` (contraseña de SQL Server y clave de JWT) son valores de **desarrollo**, pensados para levantar el proyecto localmente sin configuración extra — en un entorno real saldrían de variables de entorno o un gestor de secretos, nunca del repositorio.

## Reglas de negocio implementadas

- Login con usuario/contraseña (hash con BCrypt) y JWT; todos los endpoints de catálogos y citas están protegidos con `[Authorize]`.
- No se permiten dos citas para el mismo médico con horarios que se traslapen.
- Toda cita dura exactamente 30 minutos (se calcula en el backend, no se puede alterar desde el cliente).
- No se puede agendar una cita en una fecha anterior a hoy.
- Cancelar una cita es un cambio de estado (`Cancelada`), no un borrado — conserva el historial.
- Dar de baja un médico o paciente es una baja lógica (`Activo = false`), para no perder el historial de citas ya asociadas.

## Estructura del backend (arquitectura por capas)

```
backend/
├── src/
│   ├── Citas.Domain/          # Entidades y enums, sin dependencias externas
│   ├── Citas.Application/     # DTOs, interfaces de servicios, reglas de negocio
│   ├── Citas.Infrastructure/  # EF Core, migraciones, JWT, implementaciones de servicios
│   └── Citas.Api/             # Controllers, Program.cs, Swagger
└── tests/
    └── Citas.Tests/           # Tests unitarios (xUnit) de las reglas de negocio de Citas
```

## Estructura del frontend

```
frontend/src/
├── routes/       # Páginas, con TanStack Router (file-based): login, citas, médicos, pacientes
├── features/     # Lógica y componentes específicos de cada dominio (citas, médicos, pacientes, auth)
├── components/   # Componentes de UI compartidos (shadcn/ui) y AppHeader
├── stores/       # Estado global con Zustand (sesión del usuario)
├── lib/          # Cliente de Axios, utilidades, alertas de SweetAlert2
└── test/         # Configuración de Vitest
```
