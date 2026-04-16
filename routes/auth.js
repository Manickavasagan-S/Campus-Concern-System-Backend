const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Register
router.post('/register', async (req, res) => {
  const { name, roll_number, password, department, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (name, roll_number, password, department, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, roll_number, department, role',
      [name, roll_number, hashedPassword, department, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed. Roll number might already exist.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { roll_number, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE roll_number = $1', [roll_number]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role, department: user.department },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token, user: { id: user.id, name: user.name, roll_number: user.roll_number, role: user.role, department: user.department } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get Staff by Department
router.get('/staff/:department', async (req, res) => {
  const { department } = req.params;
  try {
    const result = await db.query(
      "SELECT id, name FROM users WHERE role = 'staff' AND department = $1",
      [department]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Middleware to verify Admin/Principal
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403);
    if (decoded.role !== 'principal' && decoded.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
    req.user = decoded;
    next();
  });
};

// Create HOD (Admin only)
router.post('/create-hod', verifyAdmin, async (req, res) => {
  const { name, roll_number, password, department } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (name, roll_number, password, department, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, roll_number, department, role',
      [name, roll_number, hashedPassword, department, 'hod']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'An HOD already exists for this department or roll number is taken.' });
    }
    res.status(500).json({ error: 'Failed to create HOD' });
  }
});

module.exports = router;
