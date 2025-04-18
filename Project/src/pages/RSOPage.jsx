"use client"

import { useState } from "react"
import "../styles/RSOPage.css"

function CreateRSOPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [members, setMembers] = useState([""]) // Start with one member input
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("") // "success" or "error"

  const MAX_MEMBERS = 10

  const handleAddMember = () => {
    if (members.length < MAX_MEMBERS) {
      setMembers([...members, ""])
    }
  }

  const handleRemoveMember = (index) => {
    const updated = [...members]
    updated.splice(index, 1)
    setMembers(updated)
  }

  const handleMemberChange = (index, value) => {
    const updated = [...members]
    updated[index] = value
    setMembers(updated)
  }

  const handleCreateRSO = async (e) => {
    e.preventDefault()
    setMessage("")
    setMessageType("")

    try {
      const response = await fetch("/api/rso/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ name, description, members }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Creation failed.")

      setMessage("RSO created, awaiting super admin approval.")
      setMessageType("success")
      setName("")
      setDescription("")
      setMembers([""])
    } catch (err) {
      setMessage("Error: " + err.message)
      setMessageType("error")
    }
  }

  return (
    <div className="rso-container">
      <div className="rso-box">
        <div className="rso-header">
          <h2 className="rso-title">Create RSO</h2>
          <p className="rso-subtitle">Create a new Registered Student Organization</p>
        </div>

        {message && (
          <div className={`rso-message ${messageType === "success" ? "rso-success" : "rso-error"}`}>{message}</div>
        )}

        <form onSubmit={handleCreateRSO} className="rso-form">
          <div className="rso-form-group">
            <label htmlFor="rso-name" className="rso-label">
              RSO Name
            </label>
            <input
              id="rso-name"
              type="text"
              placeholder="Enter organization name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rso-input"
            />
          </div>

          <div className="rso-form-group">
            <label htmlFor="rso-description" className="rso-label">
              RSO Description
            </label>
            <textarea
              id="rso-description"
              placeholder="Describe the purpose and activities of your organization"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              className="rso-textarea"
            />
          </div>

          <div className="rso-form-group">
            <label className="rso-label">Additional Members (min. 4)</label>
            <div className="rso-members-list">
              {members.map((email, idx) => (
                <div key={idx} className="rso-member-row">
                  <input
                    type="email"
                    placeholder="Member Email"
                    value={email}
                    onChange={(e) => handleMemberChange(idx, e.target.value)}
                    required
                    className="rso-input"
                  />
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(idx)}
                      className="rso-button-secondary rso-button-icon"
                      aria-label="Remove member"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {members.length < MAX_MEMBERS && (
              <button type="button" onClick={handleAddMember} className="rso-button-secondary rso-button-add">
                + Add Member
              </button>
            )}
          </div>

          <button type="submit" className="rso-button-primary">
            Create RSO
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateRSOPage
