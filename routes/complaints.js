const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Raise Complaint
router.post('/', authenticateToken, async (req, res) => {
  const { title, description, assigned_to_role, assigned_to_dept, assigned_to_user_id } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO complaints (title, description, created_by, assigned_to_role, assigned_to_dept, assigned_to_user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, req.user.id, assigned_to_role, assigned_to_dept, assigned_to_user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to raise complaint' });
  }
});

// Get Complaints (Role-based)
router.get('/', authenticateToken, async (req, res) => {
  const { role, department, id } = req.user;
  try {
    let query = '';
    let params = [];

    if (role === 'student') {
      query = 'SELECT * FROM complaints WHERE created_by = $1 ORDER BY created_at DESC';
      params = [id];
    } else if (role === 'staff') {
      query = 'SELECT c.*, u.name as creator_name FROM complaints c JOIN users u ON c.created_by = u.id WHERE assigned_to_role = $1 AND (assigned_to_user_id = $2 OR (assigned_to_user_id IS NULL AND assigned_to_dept = $3)) OR created_by = $2 ORDER BY created_at DESC';
      params = ['staff', id, department];
    } else if (role === 'hod') {
      query = 'SELECT c.*, u.name as creator_name FROM complaints c JOIN users u ON c.created_by = u.id WHERE (assigned_to_role = $1 AND assigned_to_dept = $2) OR created_by = $3 ORDER BY created_at DESC';
      params = ['hod', department, id];
    } else if (role === 'principal' || role === 'admin') {
      query = 'SELECT c.*, u.name as creator_name FROM complaints c JOIN users u ON c.created_by = u.id WHERE assigned_to_role = $1 OR created_by = $2 ORDER BY created_at DESC';
      params = ['principal', id];
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// Update Status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  try {
    const result = await db.query(
      'UPDATE complaints SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
