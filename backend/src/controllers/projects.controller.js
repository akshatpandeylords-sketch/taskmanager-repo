const pool = require('../config/db');
const { validationResult } = require('express-validator');

// GET /api/projects - get all projects user is a member of
const getProjects = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, pm.role AS user_role, u.name AS owner_name,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) AS member_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) AS task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status != 'done') AS open_tasks
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id
       JOIN users u ON u.id = p.owner_id
       WHERE pm.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching projects.' });
  }
};

// GET /api/projects/:projectId
const getProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      `SELECT p.*, pm.role AS user_role, u.name AS owner_name
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id
       JOIN users u ON u.id = p.owner_id
       WHERE p.id = $1 AND pm.user_id = $2`,
      [projectId, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found.' });

    // Get members
    const members = await pool.query(
      `SELECT u.id, u.name, u.email, pm.role, pm.joined_at
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1`,
      [projectId]
    );

    res.json({ ...result.rows[0], members: members.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// POST /api/projects - create project (user becomes admin)
const createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const project = await client.query(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, req.user.id]
    );

    const projectId = project.rows[0].id;

    // Creator becomes admin
    await client.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [projectId, req.user.id, 'admin']
    );

    await client.query('COMMIT');
    res.status(201).json(project.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error creating project.' });
  } finally {
    client.release();
  }
};

// PUT /api/projects/:projectId - update (admin only)
const updateProject = async (req, res) => {
  const { name, description } = req.body;
  const { projectId } = req.params;

  try {
    const result = await pool.query(
      'UPDATE projects SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, projectId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error updating project.' });
  }
};

// DELETE /api/projects/:projectId (admin only)
const deleteProject = async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.projectId]);
    res.json({ message: 'Project deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting project.' });
  }
};

// POST /api/projects/:projectId/members - add member (admin only)
const addMember = async (req, res) => {
  const { email, role = 'member' } = req.body;
  const { projectId } = req.params;

  try {
    const user = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found.' });

    const userId = user.rows[0].id;
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3',
      [projectId, userId, role]
    );

    res.status(201).json({ message: 'Member added.', user: user.rows[0], role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error adding member.' });
  }
};

// DELETE /api/projects/:projectId/members/:userId (admin only)
const removeMember = async (req, res) => {
  const { projectId, userId } = req.params;
  try {
    await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    res.json({ message: 'Member removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error removing member.' });
  }
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject, addMember, removeMember };
