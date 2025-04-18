"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "../styles/StudentPage.css"

function StudentPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const navigate = useNavigate()

  // fetch helper
  const fetchEvents = async (endpoint) => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to load events")
      setEvents(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // initial load
  useEffect(() => {
    fetchEvents("/api/events/get")
  }, [])

  // debounce searchTerm
  useEffect(() => {
    const handler = setTimeout(() => {
      const q = searchTerm.trim()
      if (q) {
        fetchEvents(`/api/events/search?name=${encodeURIComponent(q)}`)
      } else {
        fetchEvents("/api/events/get")
      }
    }, 250)

    return () => clearTimeout(handler)
  }, [searchTerm])

  // Navigate to event comments page
  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}/comments`)
  }

  return (
    <div className="student-container">
      <div className="student-dashboard">
        <div className="dashboard-header">
          <h2 className="dashboard-title">Student Dashboard</h2>
          <p className="dashboard-subtitle">Browse events, rate them, and leave comments.</p>

          {/* Search Bar - No Icon */}
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Search events by name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="events-container">
          {loading && <div className="loading-message">Loading events...</div>}

          {error && <div className="error-message">Error: {error}</div>}

          {!loading && !error && events.length === 0 && (
            <div className="no-events-message">No events available at the moment.</div>
          )}

          {!loading && !error && events.length > 0 && (
            <ul className="event-list">
              {events.map((event) => (
                <li key={event.event_id}>
                  <div className="event-card" onClick={() => handleEventClick(event.event_id)}>
                    <div className="event-header">
                      <h3 className="event-title">{event.name}</h3>
                    </div>

                    <div className="event-content">
                      <p className="event-detail">
                        <strong>Type:</strong> {event.visibility}
                      </p>
                      <p className="event-detail">
                        <strong>Location:</strong> {event.location_name}
                      </p>
                      <p className="event-detail">
                        <strong>Time:</strong> {new Date(event.event_time).toLocaleString()}
                      </p>
                      <p className="event-description">{event.description}</p>
                    </div>

                    <div className="event-footer">
                      <div className="event-comments">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                        View comments
                      </div>
                      <span>Click to view details</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentPage
