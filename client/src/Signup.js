import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "./api";

function Signup({ onSwitchToLogin, onNotify }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      onNotify("Please fill in name, email, and password.", "error");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/signup`, {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      onNotify(res.data);
      onSwitchToLogin();
    } catch (err) {
      onNotify(err.response?.data || "Error occurred", "error");
      console.log(err);
    }
  };

  return (
    <>
      <div style={formHeadingGroup}>
        <span style={formEyebrow}>Create account</span>
        <h1 style={formTitle}>Start your Synergia space</h1>
        <p style={formSubtitle}>
          Join the student hub to publish events, share resources, and use the
          campus AI assistant.
        </p>
      </div>

      <div style={formFields}>
        <label style={fieldLabel}>
          Full name
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={input}
          />
        </label>

        <label style={fieldLabel}>
          Email address
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input}
          />
        </label>

        <label style={fieldLabel}>
          Password
          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
          />
        </label>
      </div>

      <button onClick={handleSignup} style={primaryBtn}>
        Create account
      </button>

      <p style={switchText}>
        Already have an account?{" "}
        <button onClick={onSwitchToLogin} style={switchBtn}>
          Login
        </button>
      </p>
    </>
  );
}

const formHeadingGroup = {
  marginBottom: "24px",
};

const formEyebrow = {
  display: "inline-flex",
  color: "#2563eb",
  background: "#dbeafe",
  padding: "7px 12px",
  borderRadius: "999px",
  fontSize: "0.78rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "14px",
};

const formTitle = {
  margin: "0 0 10px",
  color: "#0f172a",
  fontSize: "2rem",
  lineHeight: 1.1,
};

const formSubtitle = {
  margin: 0,
  color: "#64748b",
  lineHeight: 1.6,
};

const formFields = {
  display: "grid",
  gap: "16px",
  marginBottom: "22px",
};

const fieldLabel = {
  display: "grid",
  gap: "8px",
  color: "#334155",
  fontWeight: 700,
};

const input = {
  border: "1px solid #cbd5e1",
  borderRadius: "16px",
  padding: "14px 16px",
  fontSize: "1rem",
  outline: "none",
  background: "#f8fafc",
};

const primaryBtn = {
  width: "100%",
  border: "none",
  borderRadius: "16px",
  padding: "15px 18px",
  color: "white",
  background: "linear-gradient(135deg, #f97316, #2563eb)",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 16px 32px rgba(37,99,235,0.22)",
};

const switchText = {
  margin: "20px 0 0",
  textAlign: "center",
  color: "#64748b",
};

const switchBtn = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  cursor: "pointer",
  fontWeight: 800,
};

export default Signup;
