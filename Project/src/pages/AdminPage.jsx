"use client"

import { useState } from "react"
import "../styles/AdminPage.css"

function AdminPage() {
  const [eventData, setEventData] = useState({
    name: "",
    description: "",
    location: "",
    datetime: "",
    category: "",
    contactPhone: "",
    contactEmail: "",
    visibility: "",
  })

  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")
  const [rsoName, setRsoName] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setEventData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    setMessage("")
    setMessageType("")

    const token = localStorage.getItem("accessToken")

    try {
      const response = await fetch("/api/events/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...eventData,
          rsoName: eventData.visibility === "RSO" ? rsoName : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Creation failed.")

      setMessage("Event created successfully!")
      setMessageType("success")
      setEventData({
        name: "",
        description: "",
        location: "",
        datetime: "",
        category: "",
        contactPhone: "",
        contactEmail: "",
        visibility: "",
      })
      setRsoName("")
    } catch (err) {
      setMessage("Error: " + err.message)
      setMessageType("error")
    }
  }

  return (
    <div className="admin-container">
      <div className="admin-card">
        <div className="admin-header">
          <h2 className="admin-title">Create Event</h2>
          <p className="admin-subtitle">Fill out the form below to create a new event</p>
        </div>

        <div className="admin-form-container">
          <form className="admin-form" onSubmit={handleCreateEvent}>
            {/* Event Name - Full Width */}
            <div className="admin-form-group admin-full-width">
              <label className="admin-form-label" htmlFor="name">
                Event Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="admin-form-control"
                placeholder="Enter event name"
                value={eventData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Visibility */}
            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="visibility">
                Visibility
              </label>
              <select
                id="visibility"
                name="visibility"
                className="admin-form-control"
                value={eventData.visibility}
                onChange={handleChange}
                required
              >
                <option value="" disabled hidden>
                  Select Visibility
                </option>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="RSO">RSO</option>
              </select>
            </div>

            {/* RSO Name - Conditional */}
            {eventData.visibility === "RSO" && (
              <div className="admin-form-group">
                <label className="admin-form-label" htmlFor="rsoName">
                  RSO Name
                </label>
                <input
                  type="text"
                  id="rsoName"
                  name="rsoName"
                  className="admin-form-control"
                  placeholder="Enter RSO name"
                  value={rsoName}
                  onChange={(e) => setRsoName(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Location */}
            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="location">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                className="admin-form-control"
                placeholder="Enter location"
                value={eventData.location}
                onChange={handleChange}
                required
              />
            </div>

            {/* Date and Time */}
            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="datetime">
                Date & Time
              </label>
              <input
                type="datetime-local"
                id="datetime"
                name="datetime"
                className="admin-form-control"
                value={eventData.datetime}
                onChange={handleChange}
                required
              />
            </div>

            {/* Category */}
            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="category">
                Category
              </label>
              <input
                type="text"
                id="category"
                name="category"
                className="admin-form-control"
                placeholder="e.g. social, academic, sports"
                value={eventData.category}
                onChange={handleChange}
                required
              />
            </div>

            {/* Contact Email */}
            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="contactEmail">
                Contact Email
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                className="admin-form-control"
                placeholder="Enter contact email"
                value={eventData.contactEmail}
                onChange={handleChange}
                required
              />
            </div>

            {/* Contact Phone */}
            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="contactPhone">
                Contact Phone
              </label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                className="admin-form-control"
                placeholder="Enter phone number"
                value={eventData.contactPhone}
                onChange={handleChange}
                required
              />
            </div>

            {/* Description - Full Width */}
            <div className="admin-form-group admin-full-width">
              <label className="admin-form-label" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                className="admin-form-control"
                placeholder="Enter event description"
                value={eventData.description}
                onChange={handleChange}
                rows={3}
                required
              />
            </div>

            {/* Submit Button */}
            <button type="submit" className="admin-submit-button">
              Create Event
            </button>

            {/* Success/Error Message */}
            {message && (
              <div
                className={`admin-message ${messageType === "success" ? "admin-success-message" : "admin-error-message"}`}
              >
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminPage
