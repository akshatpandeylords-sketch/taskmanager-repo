const pool = require('../config/db');

// Middleware: check user is at least a member of the project
const isMember = async (req, res, next) => {
  const projectId = req.params.projectId || req.body.project_id;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    }

    req.userRole = result.rows[0].role;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Server error checking membership.' });
  }
};

// Middleware: check user is admin of the project
const isAdmin = async (req, res, next) => {
  const projectId = req.params.projectId || req.body.project_id;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    req.userRole = 'admin';
    next();
  } catch (err) {
    res.status(500).json({ error: 'Server error checking admin role.' });
  }
};

module.exports = { isMember, isAdmin };
