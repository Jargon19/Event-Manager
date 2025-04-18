const express = require('express');
const authenticateToken = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();

// POST /api/events/create (Creating Event)
router.post('/create', authenticateToken, async (req, res) => {
   const { name, description, location, datetime, category, contactPhone, contactEmail, visibility, rsoName } = req.body;
 
   console.log("🧾 Incoming event data:", req.body);
 
   let rsoId = null;
   if (visibility === "RSO") {
     const [rsoRows] = await pool.query(
       'SELECT rso_id, admin_id FROM rsos WHERE name = ? AND status = ?',
       [rsoName, "approved"]
     );
 
     if (rsoRows.length === 0) {
       return res.status(400).json({ error: "RSO not found or approved." });
     }
 
     const rso = rsoRows[0];
     if (rso.admin_id !== req.user.userId) {
       return res.status(403).json({ error: "Only the RSO admin can create events for this RSO." });
     }
     rsoId = rso.rso_id;
   }
 
   const { userId, universityId } = req.user;
 
   if (!name || !description || !location || !datetime || !category || !contactPhone || !contactEmail || !visibility) {
     return res.status(400).json({ error: "All fields are required." });
   }
 
   try {
     const [overlaps] = await pool.query(
       `SELECT 1 FROM events WHERE location_name = ? AND event_time = ?`,
       [location, datetime]
     );
     if (overlaps.length > 0) {
       return res.status(409).json({ error: "An event already exists at this time and location." });
     }
 
     const [result] = await pool.query(
       `INSERT INTO events 
         (name, description, location_name, event_time, category, contact_phone, contact_email, visibility, admin_id, university_id, rso_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
       [name, description, location, datetime, category, contactPhone, contactEmail, visibility, userId, universityId, rsoId]
     );
     
 
     res.status(201).json({ message: "Event created successfully", eventId: result.insertId });
   } catch (error) {
     console.error("Event creation error:", error);
     res.status(500).json({ error: "Failed to create event" });
   }
});

// GET /api/events/get (Loading All Events)
router.get('/get', authenticateToken, async (req, res) => {
   const { userId, universityId } = req.user;
 
   try {
     const [events] = await pool.query(
       `
       SELECT DISTINCT e.*
       FROM events e
       LEFT JOIN rso_members rm ON e.rso_id = rm.rso_id
       WHERE 
         e.visibility = 'public'
         OR (e.visibility = 'private' AND e.university_id = ?)
         OR (e.visibility = 'RSO' AND rm.user_id = ?)
       `,
       [universityId, userId]
     );
     res.json(events);
   } catch (err) {
     console.error("Failed to fetch student events:", err);
     res.status(500).json({ error: "Failed to fetch events" });
   }
});

// GET /api/events/:id (Loading Specific Event)
router.get('/:id', authenticateToken, async (req, res) => {
   const [rows] = await pool.query('SELECT * FROM events WHERE event_id = ?', [req.params.id]);
   if (!rows.length) return res.status(404).json({ error: 'Event not found' });
   res.json(rows[0]);
});

module.exports = router;