"use client"

import { useEffect, useState } from "react"
import "../styles/ApproveRSOPage.css"

function ApproveRSOs() {
  const [rsos, setRsos] = useState([])
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("") // "success" or "error"
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRSOs()
  }, [])

  const fetchRSOs = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/rso/pending", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })
      const data = await response.json()
      setRsos(data)
      setLoading(false)
    } catch (error) {
      setMessage("Failed to load RSOs")
      setMessageType("error")
      setLoading(false)
    }
  }

  const handleApprove = async (rsoId, rsoName) => {
    setMessage("")
    setMessageType("")
    try {
      const res = await fetch("/api/rso/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ rsoId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")

      setRsos((prev) => prev.filter((rso) => rso.rso_id !== rsoId))
      setMessage(`"${rsoName}" has been approved successfully`)
      setMessageType("success")
    } catch (err) {
      setMessage("Error: " + err.message)
      setMessageType("error")
    }
  }

  return (
    <div className="approve-container">
      <div className="approve-box">
        <div className="approve-header">
          <h2 className="approve-title">Approve RSO Requests</h2>
          <p className="approve-subtitle">Review and approve pending Registered Student Organizations</p>
        </div>

        {message && (
          <div className={`approve-message ${messageType === "success" ? "approve-success" : "approve-error"}`}>
            {message}
          </div>
        )}

        <div className="approve-content">
          {loading ? (
            <div className="approve-loading">
              <div className="approve-spinner"></div>
              <p>Loading pending RSOs...</p>
            </div>
          ) : rsos.length === 0 ? (
            <div className="approve-empty">
              <div className="approve-empty-icon">✓</div>
              <p>No RSOs pending approval</p>
              <p className="approve-empty-subtitle">All RSO requests have been processed</p>
            </div>
          ) : (
            <div className="approve-rso-list">
              {rsos.map((rso) => (
                <div key={rso.rso_id} className="approve-rso-card">
                  <div className="approve-rso-info">
                    <div className="approve-rso-header">
                      <h3 className="approve-rso-name">{rso.name}</h3>
                      <span className="approve-rso-status">Pending</span>
                    </div>
                    <div className="approve-rso-details">
                      <p className="approve-rso-university">
                        <span className="approve-detail-label">University:</span> {rso.university_name}
                      </p>
                      {rso.description && (
                        <p className="approve-rso-description">
                          <span className="approve-detail-label">Description:</span> {rso.description}
                        </p>
                      )}
                      {rso.member_count && (
                        <p className="approve-rso-members">
                          <span className="approve-detail-label">Members:</span> {rso.member_count}
                        </p>
                      )}
                      {rso.created_at && (
                        <p className="approve-rso-date">
                          <span className="approve-detail-label">Requested:</span>{" "}
                          {new Date(rso.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="approve-rso-actions">
                    <button
                      className="approve-button"
                      onClick={() => handleApprove(rso.rso_id, rso.name)}
                      aria-label={`Approve ${rso.name}`}
                    >
                      Approve RSO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ApproveRSOs
