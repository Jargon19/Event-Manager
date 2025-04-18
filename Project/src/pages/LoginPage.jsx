import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../styles/Login.css"

function LoginPage({ setUser }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, rememberMe }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      // you can use rememberMe to decide token persistence here
      localStorage.setItem("accessToken", data.accessToken)

      setUser({
        id: data.user_id,
        username: data.username,
        email: data.email,
        name: data.name,
        role: data.role,
        universityId: data.university_id,
        universityName: data.university_name,
      })

      localStorage.setItem("user", JSON.stringify(data))

      // Navigate based on role
      switch (data.role) {
        case "super_admin":
          navigate("/superadmin")
          break
        case "admin":
          navigate("/admin")
          break
        case "student":
          navigate("/student")
          break
        default:
          navigate("/dashboard")
      }
    } catch (err) {
      setError("Invalid login credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <span className="auth-icon">👤</span>
          <h2 className="auth-title">User Login</h2>
        </div>
        {error && <p className="auth-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {/* Forgot password link */}
          <div className="auth-forgot-password">
            <a href="/forgot-password">Forgot password?</a>
          </div>

          {/* Remember me checkbox */}
          <div className="auth-remember-me">
            <label>
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              Remember me
            </label>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "LOGIN"}
          </button>
        </form>

        {/* Signup link footer */}
        <div className="auth-footer">
          <p>
            Don't have an account? <a href="/register">Sign up here.</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
