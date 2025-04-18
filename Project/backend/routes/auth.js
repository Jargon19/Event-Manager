const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

// POST /api/auth/register (Register)
router.post('/register', async (req, res) => {
  const { username, name, email, password, confirmPassword, role, university_name } = req.body;

  console.log('Register body:', req.body);

  if (!name || !email || !password || !role || !university_name || !username) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const [uniRows] = await pool.query(
      'SELECT university_id FROM universities WHERE LOWER(name) = ?',
      [university_name.toLowerCase()]
    );
    
    if (!uniRows.length) return res.status(400).json({ error: 'University not found' });
    const university_id = uniRows[0].university_id;

    const [existing] = await pool.query('SELECT 1 FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      'INSERT INTO users (username, name, email, password_hash, role, university_id) VALUES (?, ?, ?, ?, ?, ?)',
      [username, name, email, hashedPassword, role, university_id]
    );

    const payload = {
      userId: result.insertId,
      role,
      universityId: university_id
    };
    
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
    
    res.status(201).json({
      id: result.insertId,
      name,
      email,
      role,
      username,
      university_id,
      accessToken
    });
    
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login (Login)
router.post('/login', async (req, res) => {
  const { username, password} = req.body;

  console.log('Login request body:', req.body);

  if (!username || !password) {
    return res.status(400).json({ error: 'Email, password and role are required' });
  }

  try {
    // Get user with university info
    const [users] = await pool.query(`
      SELECT u.user_id, u.username, u.name, u.email, u.role, u.password_hash, 
         u.university_id, un.name AS university_name
      FROM users u
      LEFT JOIN universities un ON u.university_id = un.university_id
      WHERE u.username = ?
    `, [username]);

    if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    
    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    // Create token payload
    const payload = {
      userId: user.user_id,
      role: user.role,
      universityId: user.university_id
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    const { password_hash, ...userData } = user;

    res.json({
      ...userData,
      accessToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;