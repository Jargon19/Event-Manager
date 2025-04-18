const express = require('express');
const authenticateToken = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();

// POST /api/rso/create (Create RSO - makes it pending)
router.post('/create', authenticateToken, async (req, res) => {
   const { name, description, members } = req.body;
   const { userId, universityId } = req.user;
 
   if (!name || !description || !members || !Array.isArray(members)) {
     return res.status(400).json({ error: "RSO name, description, and members are required." });
   }
 
   if (members.length < 4) {
     return res.status(400).json({ error: "Requires at least 5 total members." });
   }
 
   try {
     const [[adminUser]] = await pool.query(`SELECT email FROM users WHERE user_id = ?`, [userId]);
     const adminEmail = adminUser.email;
     const emailDomain = adminEmail.split('@')[1];
 
     const allEmails = [adminEmail, ...members];
     const invalidEmails = allEmails.filter(email => !email.endsWith(`@${emailDomain}`));
     if (invalidEmails.length > 0) {
       return res.status(400).json({ error: "Members must have the same email domain." });
     }
 
     const [existing] = await pool.query(`SELECT 1 FROM rsos WHERE name = ?`, [name]);
     if (existing.length > 0) {
       return res.status(409).json({ error: "RSO name already exists." });
     }
 
     const [rsoInsert] = await pool.query(
       `INSERT INTO rsos (name, admin_id, university_id, status) VALUES (?, ?, ?, ?)`,
       [name, userId, universityId, "pending"]
     );
     const rsoId = rsoInsert.insertId;
 
     for (const email of allEmails) {
       const [[existingUser]] = await pool.query(`SELECT user_id FROM users WHERE email = ?`, [email]);
       const user_id = existingUser ? existingUser.user_id : null;
 
       await pool.query(
         `INSERT INTO rso_members (rso_id, email, user_id) VALUES (?, ?, ?)`,
         [rsoId, email, user_id]
       );
     }
 
     res.status(201).json({ message: "✅ RSO created, awaiting super admin approval.", rsoId });
 
   } catch (err) {
     console.error("RSO creation error:", err);
     res.status(500).json({ error: "Failed to create RSO" });
   }
});

// POST /api/rso/approve (Approve RSA - for Superadmins)
router.post('/approve', authenticateToken, async (req, res) => {
   const { rsoId } = req.body;
   const { role } = req.user;
 
   if (role !== "super_admin") {
     return res.status(403).json({ error: "Access denied." });
   }
 
   if (!rsoId) return res.status(400).json({ error: "Missing RSO ID." });
 
   try {
     const [result] = await pool.query(
       `UPDATE rsos SET status = 'approved' WHERE rso_id = ?`,
       [rsoId]
     );
 
     if (result.affectedRows === 0) {
       return res.status(404).json({ error: "RSO not found" });
     }
 
     res.json({ message: "RSO approved." });
   } catch (err) {
     console.error("Error approving RSO:", err);
     res.status(500).json({ error: "Failed to approve RSO" });
   }
});

// POST /api/rso/join (Adds user to an RSO)
router.post('/join', authenticateToken, async (req, res) => {
   const { rso_id } = req.body;
   const { userId } = req.user;
 
   try {
     const [userRows] = await pool.query(
       'SELECT email FROM users WHERE user_id = ?',
       [userId]
     );
 
     if (userRows.length === 0) {
       return res.status(404).json({ error: "User not found" });
     }
 
     const email = userRows[0].email;
     await pool.query(
       'INSERT INTO rso_members (rso_id, user_id, email) VALUES (?, ?, ?)',
       [rso_id, userId, email]
     );
 
     res.json({ message: "Joined RSO successfully" });
   } catch (error) {
     console.error("RSO join error:", error);
     res.status(500).json({ error: "Failed to join RSO" });
   }
});

// POST /api/rso/leave (Removes user from an RSO)
router.post('/leave', authenticateToken, async (req, res) => {
   const { rso_id } = req.body;
   const user_id = req.user.userId;
 
   if (!rso_id) return res.status(400).json({ error: "Missing RSO ID" });
 
   try {
     // Step 1: Remove the user from the RSO
     await pool.query(
       "DELETE FROM rso_members WHERE rso_id = ? AND user_id = ?",
       [rso_id, user_id]
     );
 
     // Step 2: Count remaining members
     const [memberCountRows] = await pool.query(
       "SELECT COUNT(*) AS count FROM rso_members WHERE rso_id = ?",
       [rso_id]
     );
 
     const memberCount = memberCountRows[0].count;
 
     // Step 3: If under 5, delete the RSO and its members
     if (memberCount < 5) {
       await pool.query("DELETE FROM rsos WHERE rso_id = ?", [rso_id]);
       await pool.query("DELETE FROM rso_members WHERE rso_id = ?", [rso_id]);
 
       return res.json({ message: "You left the RSO. RSO has been deleted due to insufficient members." });
     }
 
     res.json({ message: "You have left the RSO." });
 
   } catch (err) {
     console.error("Leave RSO error:", err);
     res.status(500).json({ error: "Failed to leave RSO" });
   }
});

// GET /api/rso/list (Loads all RSOs that are approved)
router.get('/list', authenticateToken, async (req, res) => {
   const { userId } = req.user;
 
   try {
     const [rsos] = await pool.query(`
       SELECT r.rso_id, r.name, r.status,
         EXISTS(SELECT 1 FROM rso_members rm WHERE rm.rso_id = r.rso_id AND rm.user_id = ?) AS is_member
       FROM rsos r
       WHERE r.status = 'approved'
     `, [userId]);
 
     res.json(rsos);
   } catch (err) {
     console.error("Fetch RSOs error:", err);
     res.status(500).json({ error: "Failed to load RSOs" });
   }
});

// GET /api/rso.pending (Loads all pending RSOs)
router.get('/pending', authenticateToken, async (req, res) => {
   const { role } = req.user;
 
   if (role !== "super_admin") {
     return res.status(403).json({ error: "Access denied." });
   }
 
   try {
     const [rsos] = await pool.query(
       `SELECT r.rso_id, r.name, r.admin_id, r.university_id, u.name AS university_name
        FROM rsos r
        JOIN universities u ON r.university_id = u.university_id
        WHERE r.status = 'pending'`
     );
 
     res.json(rsos);
   } catch (err) {
     console.error("Error fetching pending RSOs:", err);
     res.status(500).json({ error: "Failed to fetch RSOs" });
   }
});

module.exports = router;
