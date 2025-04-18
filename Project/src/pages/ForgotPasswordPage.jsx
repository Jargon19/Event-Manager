import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AuthPages.css";

function ForgotPasswordRequestPage() {
  const [username, setUsername] = useState("");
  const [status, setStatus]     = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate                = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setStatus("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "User not found");
      }
      navigate(`/reset-password?username=${encodeURIComponent(username)}`);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Forgot Password</h2>
        {status && <p className="auth-error">{status}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <button disabled={loading}>
            {loading ? "..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordRequestPage;
