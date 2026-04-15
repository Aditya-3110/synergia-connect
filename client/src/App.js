import React, { useState, useEffect } from "react";
import axios from "axios";
import Signup from "./Signup";
import Dashboard from "./dashboard";
import Toast from "./Toast";
import { API_URL, getAuthConfig } from "./api";

function App() {
  const [isLogin, setIsLogin] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [toast, setToast] = useState(null);
  const { isTablet, isMobile } = useResponsiveLayout();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUserName = localStorage.getItem("userName");
    const storedUserId = localStorage.getItem("userId");

    if (token) {
      setIsLogin("dashboard");
    }

    if (storedUserName) {
      setUserName(storedUserName);
    }

    if (storedUserId) {
      setUserId(storedUserId);
    }

    if (token && (!storedUserName || !storedUserId)) {
      fetchUserProfile(token);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const res = await axios.get(`${API_URL}/me`, getAuthConfig(token));

      localStorage.setItem("userName", res.data.name || "");
      localStorage.setItem("userId", res.data.id || "");
      setUserName(res.data.name || "");
      setUserId(res.data.id || "");
    } catch (err) {
      console.error("Unable to fetch user profile", err);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showToast("Please enter email and password.", "error");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/login`, {
        email: email.trim(),
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userName", res.data.user?.name || "");
      localStorage.setItem("userId", res.data.user?.id || "");
      setUserName(res.data.user?.name || "");
      setUserId(res.data.user?.id || "");
      showToast("Login successful.");
      setIsLogin("dashboard");
    } catch (err) {
      showToast(err.response?.data || "Login failed.", "error");
    }
  };

  return (
    <>
      {(isLogin === "login" || isLogin === "signup") && (
        <div
          style={{
            ...authShell,
            ...(isTablet ? authShellTablet : {}),
            ...(isMobile ? authShellMobile : {}),
          }}
        >
          <div style={authBackgroundOrbOne} />
          <div style={authBackgroundOrbTwo} />

          <section
            style={{
              ...authHero,
              ...(isTablet ? authHeroTablet : {}),
              ...(isMobile ? authHeroMobile : {}),
            }}
          >
            <div style={brandLockup}>
              <span style={brandMark}>S</span>
              <div>
                <span style={brandName}>
                  Syner<span style={brandAccent}>gia</span>
                </span>
                <span style={brandTagline}>Campus activity command center</span>
              </div>
            </div>

            <div style={heroCopy}>
              <span style={heroBadge}>Student hub</span>
              <h1 style={{ ...heroTitle, ...(isMobile ? heroTitleMobile : {}) }}>
                One place for events, resources, and AI help.
              </h1>
              <p style={heroText}>
                Manage campus activities, share useful study material, and ask your
                assistant questions based on your Synergia data.
              </p>
            </div>

            <div style={{ ...featureGrid, ...(isMobile ? featureGridMobile : {}) }}>
              <div style={featureCard}>
                <strong>Events</strong>
                <span>Create, edit, and discover what is happening next.</span>
              </div>
              <div style={featureCard}>
                <strong>Resources</strong>
                <span>Keep links and learning material easy to access.</span>
              </div>
              <div style={featureCard}>
                <strong>AI Chat</strong>
                <span>Ask questions about your project data in natural language.</span>
              </div>
            </div>
          </section>

          <section style={{ ...authCard, ...(isMobile ? authCardMobile : {}) }}>
            {isLogin === "login" && (
              <>
                <div style={formHeadingGroup}>
                  <span style={formEyebrow}>Welcome back</span>
                  <h1 style={formTitle}>Login to Synergia</h1>
                  <p style={formSubtitle}>
                    Continue managing your dashboard, resources, and smart assistant.
                  </p>
                </div>

                <div style={formFields}>
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
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={input}
                    />
                  </label>
                </div>

                <button onClick={handleLogin} style={primaryBtn}>
                  Login
                </button>

                <p style={switchText}>
                  Don't have an account?{" "}
                  <button onClick={() => setIsLogin("signup")} style={switchBtn}>
                    Signup
                  </button>
                </p>
              </>
            )}

            {isLogin === "signup" && (
              <Signup
                onSwitchToLogin={() => setIsLogin("login")}
                onNotify={showToast}
              />
            )}
          </section>
        </div>
      )}

      {isLogin === "dashboard" && <Dashboard userName={userName} userId={userId} />}
      <Toast toast={toast} />
    </>
  );
}

function useResponsiveLayout() {
  const [width, setWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    isTablet: width <= 1024,
    isMobile: width <= 640,
  };
}

const authShell = {
  minHeight: "100vh",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.15fr) minmax(360px, 0.85fr)",
  alignItems: "center",
  gap: "36px",
  padding: "48px",
  boxSizing: "border-box",
  position: "relative",
  overflow: "hidden",
  background:
    "radial-gradient(circle at 20% 15%, rgba(249,115,22,0.2), transparent 28%), linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #fff7ed 100%)",
};

const authShellTablet = {
  gridTemplateColumns: "1fr",
  padding: "32px",
};

const authShellMobile = {
  padding: "18px",
  gap: "20px",
};

const authBackgroundOrbOne = {
  position: "absolute",
  width: "320px",
  height: "320px",
  borderRadius: "999px",
  background: "rgba(37,99,235,0.16)",
  top: "-100px",
  right: "18%",
  filter: "blur(4px)",
};

const authBackgroundOrbTwo = {
  position: "absolute",
  width: "260px",
  height: "260px",
  borderRadius: "999px",
  background: "rgba(249,115,22,0.18)",
  bottom: "-90px",
  left: "12%",
  filter: "blur(4px)",
};

const authHero = {
  position: "relative",
  zIndex: 1,
  background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 56%, #f97316 100%)",
  color: "white",
  borderRadius: "34px",
  minHeight: "640px",
  padding: "36px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  boxShadow: "0 30px 80px rgba(15, 23, 42, 0.22)",
};

const authHeroTablet = {
  minHeight: "auto",
  gap: "40px",
};

const authHeroMobile = {
  padding: "24px",
  borderRadius: "24px",
};

const brandLockup = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
};

const brandMark = {
  width: "48px",
  height: "48px",
  borderRadius: "16px",
  display: "grid",
  placeItems: "center",
  background: "rgba(255,255,255,0.16)",
  border: "1px solid rgba(255,255,255,0.2)",
  fontWeight: 900,
};

const brandName = {
  display: "block",
  fontSize: "1.5rem",
  fontWeight: 900,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const brandAccent = {
  color: "#fed7aa",
};

const brandTagline = {
  display: "block",
  color: "rgba(255,255,255,0.72)",
  marginTop: "4px",
};

const heroCopy = {
  maxWidth: "620px",
};

const heroBadge = {
  display: "inline-flex",
  padding: "8px 14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.14)",
  marginBottom: "18px",
  fontWeight: 700,
};

const heroTitle = {
  margin: "0 0 18px",
  fontSize: "clamp(2.5rem, 5vw, 5rem)",
  lineHeight: 0.95,
  maxWidth: "9ch",
};

const heroTitleMobile = {
  fontSize: "2.6rem",
  maxWidth: "11ch",
};

const heroText = {
  margin: 0,
  color: "rgba(255,255,255,0.82)",
  lineHeight: 1.7,
  maxWidth: "56ch",
};

const featureGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "14px",
};

const featureGridMobile = {
  gridTemplateColumns: "1fr",
};

const featureCard = {
  display: "grid",
  gap: "8px",
  padding: "18px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "rgba(255,255,255,0.82)",
  lineHeight: 1.45,
};

const authCard = {
  position: "relative",
  zIndex: 1,
  background: "rgba(255,255,255,0.9)",
  border: "1px solid rgba(148,163,184,0.18)",
  borderRadius: "30px",
  padding: "34px",
  boxShadow: "0 28px 70px rgba(15, 23, 42, 0.14)",
  backdropFilter: "blur(20px)",
};

const authCardMobile = {
  padding: "24px",
  borderRadius: "24px",
};

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

export default App;
