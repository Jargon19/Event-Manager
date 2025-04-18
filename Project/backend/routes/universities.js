const express = require('express');
const pool = require('../db');

const router = express.Router();

// POST /api/universities/create (Create University - for Superadmin)
router.post('/create', async (req, res) => {
   const { name, location, description, students } = req.body;
 
   if (!name || !location) {
     return res.status(400).json({ error: "All fields are required." });
   }
 
   try {
     const [result] = await pool.query(
       `INSERT INTO universities (name, location, description, num_students)
        VALUES (?, ?, ?, ?)`,
       [name, location, description || null, students || null]
     );
 
     res.status(201).json({ message: "University created successfully", universityId: result.insertId });
   } catch (error) {
     console.error("University creation error:", error);
     res.status(500).json({ error: "Failed to create university" });
   }
});

// GET /api/universities (Loads universities - for Register page)
router.get('/', async (req, res) => {
   try {
     const [rows] = await pool.query('SELECT university_id, name FROM universities ORDER BY name ASC');
     res.json(rows);
   } catch (error) {
     console.error("Error fetching universities:", error);
     res.status(500).json({ error: "Failed to load universities" });
   }
});

module.exports = router;