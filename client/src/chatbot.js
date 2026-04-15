import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_URL, getAuthConfig } from "./api";

const SUGGESTED_PROMPTS = [
  "Suggest an event idea for first-year students.",
  "Summarize what Synergia can help students do.",
  "Give me study resource ideas for exam week.",
];

function Chatbot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi! I am your Synergia AI assistant. Ask me about events, resources, planning ideas, or student support.",
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const { isTablet, isMobile } = useResponsiveLayout();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (presetMessage) => {
    const messageToSend = (presetMessage || input).trim();

    if (!messageToSend || isSending) {
      return;
    }

    const userMsg = { sender: "user", text: messageToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      const res = await axios.post(
        `${API_URL}/chat`,
        {
          message: messageToSend,
        },
        getAuthConfig()
      );

      const botMsg = { sender: "bot", text: res.data };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        sender: "bot",
        text: err.response?.data || "Chatbot is not available right now.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={chatShell}>
      <div
        style={{
          ...chatHero,
          ...(isTablet ? chatHeroTablet : {}),
          ...(isMobile ? chatHeroMobile : {}),
        }}
      >
        <div>
          <div style={heroBadge}>AI Assistant</div>
          <h2 style={{ ...heroTitle, ...(isMobile ? heroTitleMobile : {}) }}>
            Ask Synergia anything about campus life.
          </h2>
          <p style={heroText}>
            Use the assistant to brainstorm events, discover resource ideas, or draft
            helpful student-facing content in seconds.
          </p>
        </div>

        <div style={heroStatCard}>
          <span style={heroStatLabel}>Status</span>
          <span style={heroStatValue}>{isSending ? "Thinking..." : "Ready to help"}</span>
          <span style={heroStatHint}>Fast replies for events, resources, and planning help.</span>
        </div>
      </div>

      <div style={{ ...chatLayout, ...(isTablet ? chatLayoutTablet : {}) }}>
        <aside style={{ ...sidebar, ...(isTablet ? sidebarTablet : {}) }}>
          <div style={sidebarCard}>
            <p style={sidebarEyebrow}>Try these</p>
            <h3 style={sidebarTitle}>Suggested prompts</h3>
            <div style={promptList}>
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  style={promptCard}
                  onClick={() => sendMessage(prompt)}
                  disabled={isSending}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div style={sidebarCardAlt}>
            <p style={sidebarEyebrow}>Best for</p>
            <h3 style={sidebarTitle}>Campus productivity</h3>
            <p style={sidebarBody}>
              Ask for event concepts, announcement drafts, study support ideas, or ways
              to make the dashboard more useful for students.
            </p>
          </div>
        </aside>

        <section style={chatPanel}>
          <div style={chatPanelHeader}>
            <div>
              <p style={panelEyebrow}>Live conversation</p>
              <h3 style={panelTitle}>Synergia assistant</h3>
            </div>
            <div style={statusChip}>
              <span style={statusDot} />
              <span>{isSending ? "Generating reply" : "Online"}</span>
            </div>
          </div>

          <div style={{ ...messagesArea, ...(isMobile ? messagesAreaMobile : {}) }}>
            {messages.map((msg, index) => {
              const isUser = msg.sender === "user";

              return (
                <div
                  key={`${msg.sender}-${index}`}
                  style={isUser ? userMessageRow : botMessageRow}
                >
                  {!isUser && <div style={botAvatar}>AI</div>}
                  <div
                    style={{
                      ...(isUser ? userBubble : botBubble),
                      ...(isMobile ? messageBubbleMobile : {}),
                    }}
                  >
                    <div style={messageMeta}>
                      <span style={messageSender}>{isUser ? "You" : "Synergia AI"}</span>
                    </div>
                    <p style={messageText}>{msg.text}</p>
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div style={botMessageRow}>
                <div style={botAvatar}>AI</div>
                <div style={botBubble}>
                  <div style={typingDots}>
                    <span style={typingDot} />
                    <span style={typingDot} />
                    <span style={typingDot} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div style={composer}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about events, planning, campus resources, or student support..."
              style={composerInput}
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />

            <div
              style={{
                ...composerFooter,
                ...(isMobile ? composerFooterMobile : {}),
              }}
            >
              <span style={composerHint}>Press Enter to send, Shift + Enter for a new line.</span>
              <button onClick={() => sendMessage()} disabled={isSending} style={sendBtn}>
                {isSending ? "Sending..." : "Send message"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
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

const chatShell = {
  display: "grid",
  gap: "24px",
};

const chatHero = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 2fr) minmax(260px, 1fr)",
  gap: "20px",
  background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 56%, #0ea5e9 100%)",
  color: "white",
  borderRadius: "28px",
  padding: "28px",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.16)",
};

const chatHeroTablet = {
  gridTemplateColumns: "1fr",
};

const chatHeroMobile = {
  padding: "22px",
  borderRadius: "24px",
};

const heroBadge = {
  display: "inline-flex",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.14)",
  marginBottom: "14px",
  fontSize: "0.85rem",
};

const heroTitle = {
  margin: "0 0 10px",
  fontSize: "2.2rem",
  lineHeight: 1.1,
};

const heroTitleMobile = {
  fontSize: "1.8rem",
};

const heroText = {
  margin: 0,
  color: "rgba(255,255,255,0.82)",
  lineHeight: 1.7,
  maxWidth: "56ch",
};

const heroStatCard = {
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: "22px",
  padding: "22px",
  display: "grid",
  alignContent: "start",
  gap: "8px",
};

const heroStatLabel = {
  color: "rgba(255,255,255,0.72)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontSize: "0.78rem",
};

const heroStatValue = {
  fontSize: "1.6rem",
  fontWeight: 700,
};

const heroStatHint = {
  color: "rgba(255,255,255,0.8)",
  lineHeight: 1.6,
};

const chatLayout = {
  display: "grid",
  gridTemplateColumns: "300px minmax(0, 1fr)",
  gap: "24px",
  alignItems: "start",
};

const chatLayoutTablet = {
  gridTemplateColumns: "1fr",
};

const sidebar = {
  display: "grid",
  gap: "18px",
};

const sidebarTablet = {
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
};

const sidebarCard = {
  background: "rgba(255,255,255,0.88)",
  border: "1px solid rgba(148,163,184,0.16)",
  borderRadius: "24px",
  padding: "22px",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
};

const sidebarCardAlt = {
  ...sidebarCard,
  background: "linear-gradient(180deg, #fff7ed 0%, #ffffff 100%)",
};

const sidebarEyebrow = {
  margin: "0 0 8px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontSize: "0.78rem",
  color: "#64748b",
};

const sidebarTitle = {
  margin: "0 0 12px",
  color: "#0f172a",
};

const sidebarBody = {
  margin: 0,
  color: "#475569",
  lineHeight: 1.6,
};

const promptList = {
  display: "grid",
  gap: "12px",
};

const promptCard = {
  textAlign: "left",
  border: "1px solid rgba(59,130,246,0.18)",
  background: "#f8fafc",
  color: "#0f172a",
  borderRadius: "18px",
  padding: "14px 16px",
  cursor: "pointer",
  lineHeight: 1.5,
};

const chatPanel = {
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(148,163,184,0.16)",
  borderRadius: "28px",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
  overflow: "hidden",
};

const chatPanelHeader = {
  padding: "22px 24px",
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "center",
  borderBottom: "1px solid rgba(148,163,184,0.14)",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
};

const panelEyebrow = {
  margin: "0 0 6px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontSize: "0.78rem",
  color: "#64748b",
};

const panelTitle = {
  margin: 0,
  color: "#0f172a",
};

const statusChip = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 14px",
  borderRadius: "999px",
  background: "#ecfeff",
  color: "#155e75",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const statusDot = {
  width: "8px",
  height: "8px",
  borderRadius: "999px",
  background: "#14b8a6",
};

const messagesArea = {
  height: "520px",
  overflowY: "auto",
  padding: "24px",
  background:
    "radial-gradient(circle at top, rgba(37,99,235,0.05), transparent 30%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
};

const messagesAreaMobile = {
  height: "420px",
  padding: "18px",
};

const botMessageRow = {
  display: "flex",
  alignItems: "flex-end",
  gap: "12px",
  marginBottom: "16px",
};

const userMessageRow = {
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: "16px",
};

const botAvatar = {
  width: "38px",
  height: "38px",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #1d4ed8, #0ea5e9)",
  color: "white",
  display: "grid",
  placeItems: "center",
  fontSize: "0.82rem",
  fontWeight: 700,
  boxShadow: "0 10px 24px rgba(37,99,235,0.18)",
};

const botBubble = {
  maxWidth: "78%",
  background: "#ffffff",
  border: "1px solid rgba(148,163,184,0.16)",
  color: "#0f172a",
  padding: "16px 18px",
  borderRadius: "20px 20px 20px 8px",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
};

const userBubble = {
  maxWidth: "78%",
  background: "linear-gradient(135deg, #1d4ed8, #4338ca)",
  color: "white",
  padding: "16px 18px",
  borderRadius: "20px 20px 8px 20px",
  boxShadow: "0 14px 32px rgba(37,99,235,0.2)",
};

const messageBubbleMobile = {
  maxWidth: "88%",
};

const messageMeta = {
  marginBottom: "8px",
};

const messageSender = {
  fontSize: "0.82rem",
  fontWeight: 700,
  opacity: 0.85,
};

const messageText = {
  margin: 0,
  whiteSpace: "pre-wrap",
  lineHeight: 1.7,
};

const typingDots = {
  display: "flex",
  gap: "6px",
  alignItems: "center",
  minHeight: "18px",
};

const typingDot = {
  width: "8px",
  height: "8px",
  borderRadius: "999px",
  background: "#94a3b8",
};

const composer = {
  padding: "20px 24px 24px",
  borderTop: "1px solid rgba(148,163,184,0.14)",
  background: "#ffffff",
};

const composerInput = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: "20px",
  padding: "16px 18px",
  fontSize: "1rem",
  lineHeight: 1.6,
  resize: "none",
  outline: "none",
  fontFamily: "inherit",
};

const composerFooter = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginTop: "14px",
  flexWrap: "wrap",
};

const composerFooterMobile = {
  alignItems: "stretch",
  flexDirection: "column",
};

const composerHint = {
  color: "#64748b",
  fontSize: "0.9rem",
};

const sendBtn = {
  background: "linear-gradient(135deg, #f97316, #2563eb)",
  color: "white",
  border: "none",
  padding: "12px 18px",
  borderRadius: "999px",
  cursor: "pointer",
  fontWeight: 700,
};

export default Chatbot;
