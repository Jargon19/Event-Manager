import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useParams } from "react-router-dom"
import "../styles/Comments.css"

function EventComments() {
  const { id } = useParams() // event_id from URL
  const [event, setEvent] = useState(null)
  const [comments, setComments] = useState([])
  const [text, setText] = useState("")
  const [userId, setUserId] = useState(null) // set from token
  const [username, setUsername] = useState("") // Add username state
  const [error, setError] = useState("")
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editText, setEditText] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) return

    // Decode token manually to get userId
    const payload = JSON.parse(atob(token.split(".")[1]))
    setUserId(payload.userId)

    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem("user") || "{}")
    setUsername(userData.username || "")

    fetch(`/api/events/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then(setEvent)

    fetch(`/api/comments/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then(setComments)
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return

    setError("")
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ comment_text: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const newComment = {
        ...data,
        username: data.username || username,
        user_id: data.user_id || userId, 
      }

      setComments((prev) => [newComment, ...prev])
      setText("")
    } catch (err) {
      setError("Error: " + err.message)
    }
  }

  // Handle Enter key press in comment textarea
  const handleKeyDown = (e) => {
    // If Enter is pressed without Shift key, submit the form
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault() // Prevent default behavior (new line)
      if (text.trim()) {
        handleSubmit(e) // Submit the form
      }
    }
  }

  const handleEdit = async (comment_id) => {
    if (!editText.trim()) return

    try {
      const res = await fetch(`/api/comments/${comment_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ comment_text: editText }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Edit failed")
      }

      setComments((prev) => prev.map((c) => (c.comment_id === comment_id ? { ...c, comment_text: editText } : c)))
      setEditingCommentId(null)
      setEditText("")
    } catch (err) {
      setError("Error: " + err.message)
    }
  }

  // Handle Enter key press in edit textarea
  const handleEditKeyDown = (e, comment_id) => {
    // If Enter is pressed without Shift key, save the edit
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault() // Prevent default behavior (new line)
      if (editText.trim()) {
        handleEdit(comment_id) // Save the edit
      }
    }
  }

  const handleDelete = async (comment_id) => {
    await fetch(`/api/comments/${comment_id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
    })
    setComments((prev) => prev.filter((c) => c.comment_id !== comment_id))
  }

  if (!event)
    return (
      <div className="loading-container">
        <p>Loading event...</p>
      </div>
    )

  return (
    <div className="comments-container">
      <div className="back-button-container">
        <button className="back-button" onClick={() => navigate("/student")}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="comments-layout">
        {/* Event Details Card (Left Side) */}
        <div className="event-card">
          <div className="event-header">
            <h2>{event.name}</h2>
          </div>
          <div className="event-details">
            <p>
              <strong>Location:</strong> {event.location_name}
            </p>
            <p>
              <strong>Time:</strong> {new Date(event.event_time).toLocaleString()}
            </p>
            <div className="event-description">
              <p>{event.description}</p>
            </div>
          </div>
        </div>

        {/* Comments Card (Right Side) */}
        <div className="comments-card">
          <div className="comments-header">
            <h3>Comments</h3>
          </div>

          <div className="comments-list">
            {comments.map((c) => (
              <div key={c.comment_id} className="comment-item">
                <div className="comment-header">
                  <div className="comment-user">
                    <strong>{c.username}</strong>
                  </div>
                  {c.user_id === userId && editingCommentId !== c.comment_id && (
                    <div className="comment-actions">
                      <button
                        className="action-button edit-button"
                        onClick={() => {
                          setEditingCommentId(c.comment_id)
                          setEditText(c.comment_text)
                        }}
                        title="Edit comment"
                      >
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                      </button>
                      <button
                        className="action-button delete-button"
                        onClick={() => handleDelete(c.comment_id)}
                        title="Delete comment"
                      >
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                <div className="comment-content">
                  {editingCommentId === c.comment_id ? (
                    <div className="edit-comment-form">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, c.comment_id)}
                        rows={2}
                      />
                      <div className="edit-buttons">
                        <button className="save-button" onClick={() => handleEdit(c.comment_id)}>
                          Save
                        </button>
                        <button className="cancel-button" onClick={() => setEditingCommentId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p>{c.comment_text}</p>
                  )}
                </div>

                <div className="comment-footer">
                  <span className="comment-time">{new Date(c.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="no-comments">
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>

          <div className="comment-form-container">
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit} className="comment-form">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment..."
                rows={1}
                required
              />
              <button type="submit" className="post-comment-button">
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventComments
