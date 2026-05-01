Team Task Manager

I built TaskFlow as a full-stack web application that lets teams create projects, assign tasks, and track progress — all with role-based access control so admins and members each have the right level of access.

Tech Stack

- Frontend: React 18, React Router v6, Axios
- Backend: Node.js, Express
- Database: PostgreSQL
- Auth: JWT (bcryptjs)
- Deployment: Railway


Project Structure

```
taskmanager/
├── backend/
│   └── src/
│       ├── config/         # DB connection
│       ├── controllers/    # auth, projects, tasks
│       ├── middleware/     # JWT auth, role checks
│       ├── models/         # DB schema init
│       └── routes/         # API routes
├── frontend/
│   └── src/
│       ├── components/     # Layout, Auth components
│       ├── context/        # AuthContext
│       ├── pages/          # Dashboard, Projects, ProjectDetail
│       └── utils/          # Axios API instance
├── railway.toml
└── nixpacks.toml
```

Running Locally

1. Clone the repo

```bash
git clone <your-repo>
cd taskmanager
```
2. Install dependencies

```bash
# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

3. Set up environment variables

Create backend/.env:
```
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/taskmanager
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

Create frontend/.env:
```
REACT_APP_API_URL=http://localhost:5000/api
```

4. Create the database

```bash
createdb taskmanager
# The schema (tables) is created automatically on first run — no migrations needed
```

5. Start the app

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

Then open http://localhost:3000

---

Deployment (Railway)

I deployed this on Railway with a managed PostgreSQL database. Here's how to do it yourself:

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

1. Go to railway.app, create a New Project and deploy from GitHub, then select your repo
2. Add a PostgreSQL database via New > Database > PostgreSQL (Railway auto-injects DATABASE_URL)
3. Add these environment variables in your service settings:
```
JWT_SECRET=your_very_long_secret_key_here
NODE_ENV=production
```
4. Generate a domain under Settings > Networking and you're live!

---

API Reference

Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register a new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |

Projects
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/projects | Auth | List all projects you're part of |
| POST | /api/projects | Auth | Create a new project |
| GET | /api/projects/:id | Member | Get project details and members |
| PUT | /api/projects/:id | Admin | Update project info |
| DELETE | /api/projects/:id | Admin | Delete project |
| POST | /api/projects/:id/members | Admin | Add a member by email |
| DELETE | /api/projects/:id/members/:uid | Admin | Remove a member |

Tasks
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/projects/:id/tasks | Member | List tasks (filterable) |
| POST | /api/projects/:id/tasks | Member | Create a task |
| PUT | /api/projects/:id/tasks/:tid | Member | Update a task |
| DELETE | /api/projects/:id/tasks/:tid | Admin | Delete a task |

Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard | Get your assigned tasks and stats |

---

Features I Built

- JWT Authentication — secure signup and login with hashed passwords
- Role-based access — Admins can manage members and delete tasks; Members can create and update tasks
- Project management — create projects, invite team members by email, assign roles
- Task tracking — set status (To Do / In Progress / Done), priority, assignee, and due date
- Kanban board and List view — switch between views depending on how you like to work
- Dashboard — see all your assigned tasks and a summary of open, completed, and overdue items
- Overdue detection — tasks past their due date are automatically flagged
- Responsive design — works on mobile and desktop
