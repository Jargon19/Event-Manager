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
  const { username, password, rememberMe = false } = req.body;

  console.log('Login request body:', req.body);

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const [users] = await pool.query(`
      SELECT u.user_id, u.username, u.name, u.email, u.role, u.password_hash, 
             u.university_id, un.name AS university_name
      FROM users u
      LEFT JOIN universities un 
        ON u.university_id = un.university_id
      WHERE u.username = ?
    `, [username]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Build JWT payload
    const payload = {
      userId:     user.user_id,
      role:       user.role,
      universityId: user.university_id
    };

    const expiresIn = rememberMe ? '7d' : '1h';
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn }
    );

    // Strip out the password_hash before sending
    const { password_hash, ...userData } = user;

    res.json({
      ...userData,
      accessToken,
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});


// POST /api/auth/forgot-password (Enter username for forgotten password)
router.post("/forgot-password", async (req, res) => {
  const { username } = req.body;
  if (!username)
    return res.status(400).json({ error: "Username is required" });

  try {
    const [rows] = await pool.query(
      "SELECT user_id FROM users WHERE username = ?",
      [username]
    );
    if (!rows.length)
      return res.status(404).json({ error: "User not found" });

    // we “approve” the request here; no email step.
    return res.json({ message: "OK" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/reset-password (Enter new password)
router.post("/reset-password", async (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword)
    return res.status(400).json({ error: "Username and a new Password are required" });

  try {
    // hash & update
    const hash = await bcrypt.hash(newPassword, 12);
    const [result] = await pool.query(
      "UPDATE users SET password_hash = ? WHERE username = ?",
      [hash, username]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "User not found" });

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;