# TaskFlow

Gestor de tareas con equipos — proyecto Full Stack para demostrar en entrevistas técnicas.

**Stack:** Python · FastAPI · PostgreSQL · SQLAlchemy · React · Zustand · Tailwind CSS · Docker

---

## Qué incluye

- Registro y login con JWT (bcrypt para passwords)
- Rutas protegidas en frontend y backend
- CRUD completo de tareas con filtros por estado
- Crear equipos, invitar usuarios, gestionar miembros
- Tareas personales y tareas de equipo
- Token automático en cada request (Axios interceptors)
- Logout forzado si el servidor devuelve 401
- Documentación interactiva de la API en `/docs`

---

## Arrancar en local (modo desarrollo)

### 1. Base de datos con Docker

```bash
docker run -d \
  --name taskflow-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=taskflow \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env           # Ajusta SECRET_KEY

uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env           # VITE_API_URL=http://localhost:8000
npm run dev
# → http://localhost:5173
```

---

## Arrancar con Docker Compose (todo junto)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Docs API: http://localhost:8000/docs

---

## Estructura del proyecto

```
taskflow/
├── backend/
│   ├── app/
│   │   ├── main.py           FastAPI app + CORS
│   │   ├── database.py       Conexión PostgreSQL (SQLAlchemy)
│   │   ├── models.py         ORM: users, tasks, teams, team_members
│   │   ├── schemas.py        Pydantic: validación entrada/salida
│   │   ├── auth.py           JWT + bcrypt
│   │   ├── dependencies.py   get_db, get_current_user
│   │   └── routers/
│   │       ├── auth.py       POST /auth/register  POST /auth/login  GET /auth/me
│   │       ├── tasks.py      GET POST PUT DELETE /tasks
│   │       └── teams.py      GET POST /teams  POST /teams/:id/invite
│   ├── Dockerfile
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/client.js     Axios + interceptors JWT
    │   ├── store/authStore.js Zustand con persistencia
    │   ├── App.jsx           Rutas + PrivateRoute
    │   ├── components/Navbar.jsx
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Register.jsx
    │       ├── Dashboard.jsx
    │       └── TeamManager.jsx
    ├── Dockerfile
    └── package.json
```

---

## API — Endpoints principales

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Crear cuenta |
| POST | `/auth/login` | — | Login → devuelve JWT |
| GET | `/auth/me` | ✓ | Perfil del usuario actual |
| GET | `/tasks/` | ✓ | Tareas propias + de equipos |
| POST | `/tasks/` | ✓ | Crear tarea |
| PUT | `/tasks/:id` | ✓ | Editar título, descripción, estado |
| DELETE | `/tasks/:id` | ✓ | Eliminar (solo el owner) |
| GET | `/teams/` | ✓ | Equipos en los que participo |
| POST | `/teams/` | ✓ | Crear equipo |
| GET | `/teams/:id` | ✓ | Detalle de equipo + miembros |
| POST | `/teams/:id/invite` | ✓ | Invitar usuario por email |
| DELETE | `/teams/:id/members/:uid` | ✓ | Eliminar miembro |

---

## Preguntas de entrevista frecuentes

**¿Por qué JWT y no sesiones de servidor?**
JWT es stateless: el servidor no guarda nada, escala horizontalmente sin base de datos de sesiones compartida. La desventaja es que no puedes invalidar un token antes de que expire — la solución en producción son refresh tokens con rotación o una blacklist en Redis.

**¿Cómo protegerías esto en producción?**
HTTPS obligatorio, `SECRET_KEY` larga y aleatoria (nunca en el repo), rate limiting en `/auth/login` para evitar fuerza bruta, Alembic para migraciones en lugar de `create_all`, variables de entorno gestionadas con un gestor de secretos.

**¿Qué añadirías con más tiempo?**
Refresh tokens, emails reales de invitación (SendGrid / SES), roles más granulares por equipo, tests con pytest + httpx en el backend y Vitest en el frontend, CI/CD con GitHub Actions.
