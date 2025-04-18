import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/AuthPages.css";

function ResetPasswordPage() {
  const [searchParams]   = useSearchParams();
  const usernameParam    = searchParams.get("username") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [status,      setStatus]      = useState("");
  const [loading,     setLoading]     = useState(false);
  const navigate                         = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    if (newPassword !== confirm) {
      setStatus("Passwords do not match.");
      return;
    }

    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: usernameParam, newPassword }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Reset failed");
      }
      setStatus("Password reset! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Reset Password</h2>
        {status && <p>{status}</p>}
        <form onSubmit={handleSubmit}>
          <input type="text" value={usernameParam} disabled />

          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
          />

          <button disabled={loading}>
            {loading ? "..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
