# ⚡ TaskFlow — Team Task Manager

A full-stack web app for managing projects and tasks with role-based access control (Admin/Member).

## 🛠 Tech Stack

- **Frontend**: React 18, React Router v6, Axios
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Auth**: JWT (bcryptjs)
- **Deployment**: Railway

---

## 📁 Project Structure

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

---

## 🚀 Local Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd taskmanager

# Install backend deps
cd backend && npm install && cd ..

# Install frontend deps
cd frontend && npm install && cd ..
```

### 2. Configure environment

**Backend** — create `backend/.env`:
```
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/taskmanager
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

**Frontend** — create `frontend/.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Create PostgreSQL database

```bash
createdb taskmanager
# Schema is auto-created on first server start
```

### 4. Run

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

Visit: http://localhost:3000

---

## 🌐 Deploying to Railway

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

### Step 2 — Create Railway project
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repository

### Step 3 — Add PostgreSQL
1. In your Railway project → **New** → **Database** → **PostgreSQL**
2. Railway auto-injects `DATABASE_URL`

### Step 4 — Set environment variables
In your Railway service settings → Variables:
```
JWT_SECRET=your_very_long_secret_key_here
NODE_ENV=production
```

### Step 5 — Deploy!
Railway builds and deploys automatically. Your app will be live at the generated URL.

---

## 🔐 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/projects` | Auth | List user's projects |
| POST | `/api/projects` | Auth | Create project |
| GET | `/api/projects/:id` | Member | Get project details |
| PUT | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project |
| POST | `/api/projects/:id/members` | Admin | Add member |
| DELETE | `/api/projects/:id/members/:uid` | Admin | Remove member |

### Tasks
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/projects/:id/tasks` | Member | List tasks |
| POST | `/api/projects/:id/tasks` | Member | Create task |
| PUT | `/api/projects/:id/tasks/:tid` | Member | Update task |
| DELETE | `/api/projects/:id/tasks/:tid` | Admin | Delete task |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | My tasks + stats |

---

## ✨ Features

- 🔐 JWT Authentication (Signup / Login)
- 👥 Role-based access: **Admin** (full control) / **Member** (view & edit tasks)
- 📁 Project management with team members
- ✅ Task creation with status, priority, assignee, due date
- 📊 Kanban board + list view
- 📈 Dashboard with stats (total, completed, open, overdue)
- ⚠️ Overdue task detection
- 📱 Responsive design
