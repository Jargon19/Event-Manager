const express = require('express');
const authenticateToken = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();

// GET /api/comments/:event_id (Loading Comments)
router.get('/:event_id', authenticateToken, async (req, res) => {
   const [comments] = await pool.query(
     `
     SELECT c.comment_id, c.event_id, c.user_id, u.username, c.comment_text, c.created_at
     FROM comments c
     JOIN users u ON c.user_id = u.user_id
     WHERE c.event_id = ?
     ORDER BY c.created_at DESC
     `,
     [req.params.event_id]
   );
   res.json(comments);
});

// POST /api/comments/:event_id (Adding Comments)
router.post('/:event_id', authenticateToken, async (req, res) => {
   const { comment_text } = req.body;
   const user_id = req.user.userId;
 
   const [result] = await pool.query(
     `INSERT INTO comments (event_id, user_id, comment_text, created_at)
      VALUES (?, ?, ?, NOW())`,
     [req.params.event_id, user_id, comment_text]
   );
 
   res.status(201).json({
     comment_id: result.insertId,
     event_id: req.params.event_id,
     user_id,
     comment_text,
     created_at: new Date()
   });
});

// DELETE /api/comments/:comment_id (Deleting Comments)
router.delete('/:comment_id', authenticateToken, async (req, res) => {
   const user_id = req.user.userId;
   const comment_id = req.params.comment_id;
 
   const [rows] = await pool.query('SELECT * FROM comments WHERE comment_id = ?', [comment_id]);
   if (!rows.length || rows[0].user_id !== user_id) {
     return res.status(403).json({ error: "Not authorized to delete this comment" });
   }
 
   await pool.query('DELETE FROM comments WHERE comment_id = ?', [comment_id]);
   res.json({ message: "Comment deleted" });
});

// PUT /api/comments/:comment_id (Editing Comments)
router.put('/:comment_id', authenticateToken, async (req, res) => {
   const { comment_text } = req.body;
   const { comment_id } = req.params;
   const user_id = req.user.userId;
 
   if (!comment_text) return res.status(400).json({ error: "Comment text is required" });
 
   // Make sure the comment belongs to this user
   const [rows] = await pool.query('SELECT * FROM comments WHERE comment_id = ?', [comment_id]);
   if (!rows.length) return res.status(404).json({ error: "Comment not found" });
   if (rows[0].user_id !== user_id) return res.status(403).json({ error: "Unauthorized" });
 
   await pool.query('UPDATE comments SET comment_text = ? WHERE comment_id = ?', [comment_text, comment_id]);
 
   res.json({ message: "Comment updated" });
});

module.exports = router;