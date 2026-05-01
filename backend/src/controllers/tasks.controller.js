const pool = require('../config/db');
const { validationResult } = require('express-validator');

// GET /api/projects/:projectId/tasks
const getTasks = async (req, res) => {
  const { projectId } = req.params;
  const { status, assigned_to, priority } = req.query;

  let query = `
    SELECT t.*, 
      u.name AS assigned_to_name, u.email AS assigned_to_email,
      c.name AS created_by_name,
      CASE WHEN t.due_date < NOW() AND t.status != 'done' THEN true ELSE false END AS is_overdue
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assigned_to
    LEFT JOIN users c ON c.id = t.created_by
    WHERE t.project_id = $1
  `;
  const params = [projectId];
  let idx = 2;

  if (status) { query += ` AND t.status = $${idx++}`; params.push(status); }
  if (assigned_to) { query += ` AND t.assigned_to = $${idx++}`; params.push(assigned_to); }
  if (priority) { query += ` AND t.priority = $${idx++}`; params.push(priority); }

  query += ' ORDER BY t.created_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching tasks.' });
  }
};

// POST /api/projects/:projectId/tasks
const createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { projectId } = req.params;
  const { title, description, assigned_to, due_date, priority = 'medium' } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, description, project_id, assigned_to, created_by, due_date, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, projectId, assigned_to || null, req.user.id, due_date || null, priority]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating task.' });
  }
};

// PUT /api/projects/:projectId/tasks/:taskId
const updateTask = async (req, res) => {
  const { taskId } = req.params;
  const { title, description, status, priority, assigned_to, due_date } = req.body;

  try {
    const result = await pool.query(
      `UPDATE tasks SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        assigned_to = COALESCE($5, assigned_to),
        due_date = COALESCE($6, due_date),
        updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [title, description, status, priority, assigned_to, due_date, taskId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error updating task.' });
  }
};

// DELETE /api/projects/:projectId/tasks/:taskId (admin only)
const deleteTask = async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.taskId]);
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting task.' });
  }
};

// GET /api/dashboard - summary stats for current user
const getDashboard = async (req, res) => {
  const userId = req.user.id;
  try {
    const myTasks = await pool.query(
      `SELECT t.*, p.name AS project_name,
        CASE WHEN t.due_date < NOW() AND t.status != 'done' THEN true ELSE false END AS is_overdue
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.assigned_to = $1
       ORDER BY t.due_date ASC NULLS LAST`,
      [userId]
    );

    const stats = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE t.assigned_to = $1) AS my_tasks,
        COUNT(*) FILTER (WHERE t.assigned_to = $1 AND t.status = 'done') AS completed,
        COUNT(*) FILTER (WHERE t.assigned_to = $1 AND t.status != 'done') AS open,
        COUNT(*) FILTER (WHERE t.assigned_to = $1 AND t.due_date < NOW() AND t.status != 'done') AS overdue
       FROM tasks t
       JOIN project_members pm ON pm.project_id = t.project_id
       WHERE pm.user_id = $1`,
      [userId]
    );

    res.json({
      tasks: myTasks.rows,
      stats: stats.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching dashboard.' });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, getDashboard };
