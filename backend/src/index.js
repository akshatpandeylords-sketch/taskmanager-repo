require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

const initializeDB = require('./models/schema');
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/projects.routes');
const taskRoutes = require('./routes/tasks.routes');
const { getDashboard } = require('./controllers/tasks.controller');
const authenticate = require('./middleware/auth');

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/tasks', taskRoutes);
app.get('/api/dashboard', authenticate, getDashboard);

// Serve React build in production
// __dirname = <repo-root>/backend/src
// frontend/build = <repo-root>/frontend/build
if (process.env.NODE_ENV === 'production') {
  const frontendBuild = path.join(__dirname, '..', '..', 'frontend', 'build');
  app.use(express.static(frontendBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;

initializeDB()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to initialize DB:', err.message);
    process.exit(1);
  });
