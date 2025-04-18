import { useEffect, useState } from "react"
import "../styles/RSOListPage.css"

function RSOListPage() {
  const [rsos, setRsos] = useState([])
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetch("/api/rso/list", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    })
      .then((res) => res.json())
      .then(setRsos)
      .catch(() => {
        setMessage("Failed to load RSOs")
        setMessageType("error")
      })
  }, [])

  const handleJoinLeave = async (rso_id, isJoining) => {
    setMessage("")
    setMessageType("")
    try {
      const endpoint = isJoining ? "/api/rso/join" : "/api/rso/leave"

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ rso_id }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")

      // Handle special case: RSO deleted
      if (data.message?.includes("RSO has been deleted")) {
        setRsos((prev) => prev.filter((rso) => rso.rso_id !== rso_id))
      } else {
        // Update membership status
        setRsos((prev) => prev.map((rso) => (rso.rso_id === rso_id ? { ...rso, is_member: isJoining ? 1 : 0 } : rso)))
      }

      setMessage(data.message)
      setMessageType("success")
    } catch (err) {
      setMessage("Error: " + err.message)
      setMessageType("error")
    }
  }

  // Filter RSOs based on search term
  const filteredRsos = rsos.filter((rso) => rso.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // Separate RSOs into two categories
  const myRsos = filteredRsos.filter((rso) => rso.is_member === 1)
  const availableRsos = filteredRsos.filter((rso) => rso.is_member === 0)

  return (
    <div className="rso-list-container">
      <div className="rso-list-dashboard">
        <div className="rso-list-header">
          <h2 className="rso-list-title">RSOs at Your University</h2>
          <p className="rso-list-subtitle">Join or manage your Registered Student Organizations</p>

          {/* Search Bar */}
          <div className="rso-search-container">
            <input
              type="text"
              placeholder="Search RSOs by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rso-search-input"
            />
          </div>
        </div>

        {message && (
          <div className={`rso-list-message ${messageType === "success" ? "rso-list-success" : "rso-list-error"}`}>
            {message}
          </div>
        )}

        <div className="rso-list-content">
          {/* My RSOs Section */}
          <div className="rso-section">
            <h3 className="rso-section-title">
              <span className="rso-section-icon">🌟</span> My RSOs
            </h3>
            {myRsos.length === 0 ? (
              <div className="rso-empty-state">
                <p>No RSOs found.</p>
              </div>
            ) : (
              <div className="rso-cards">
                {myRsos.map((rso) => (
                  <div key={rso.rso_id} className="rso-card rso-card-member">
                    <div className="rso-card-content">
                      <h4 className="rso-card-title">{rso.name}</h4>
                      <p className="rso-card-description">{rso.description || "No description available."}</p>
                      <div className="rso-card-meta">
                        <span className="rso-card-status">Member</span>
                        <span className="rso-card-members">{rso.member_count || "?"} members</span>
                      </div>
                    </div>
                    <div className="rso-card-actions">
                      <button
                        className="rso-button-leave"
                        onClick={() => handleJoinLeave(rso.rso_id, false)}
                        aria-label={`Leave ${rso.name}`}
                      >
                        Leave RSO
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available RSOs Section */}
          <div className="rso-section">
            <h3 className="rso-section-title">
              <span className="rso-section-icon">🔍</span> Available RSOs
            </h3>
            {availableRsos.length === 0 ? (
              <div className="rso-empty-state">
                <p>No available RSOs found.</p>
              </div>
            ) : (
              <div className="rso-cards">
                {availableRsos.map((rso) => (
                  <div key={rso.rso_id} className="rso-card rso-card-available">
                    <div className="rso-card-content">
                      <h4 className="rso-card-title">{rso.name}</h4>
                      <p className="rso-card-description">{rso.description || "No description available."}</p>
                      <div className="rso-card-meta">
                        <span className="rso-card-members">{rso.member_count || "?"} members</span>
                      </div>
                    </div>
                    <div className="rso-card-actions">
                      <button
                        className="rso-button-join"
                        onClick={() => handleJoinLeave(rso.rso_id, true)}
                        aria-label={`Join ${rso.name}`}
                      >
                        Join RSO
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RSOListPage
