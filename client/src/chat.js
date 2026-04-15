import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { API_URL, getAuthConfig } from "./api";

const socket = io(API_URL, {
  autoConnect: true,
});

function PrivateChat({ currentUserId, currentUserName, onNotify }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const activeUserId = currentUserId || localStorage.getItem("userId");

  useEffect(() => {
    if (!activeUserId) {
      return;
    }

    socket.emit("joinUserRoom", activeUserId);
  }, [activeUserId]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/users`, getAuthConfig());
      const registeredUsers = Array.isArray(res.data) ? res.data : [];
      const otherUsers = registeredUsers.filter((user) => user._id !== activeUserId);

      setUsers(otherUsers);

      if (!selectedUser && otherUsers.length > 0) {
        setSelectedUser(otherUsers[0]);
      }
    } catch (err) {
      onNotify(err.response?.data || "Unable to load registered students.", "error");
    }
  }, [activeUserId, selectedUser, onNotify]);

  const fetchConversation = useCallback(async (selectedUserId) => {
    try {
      setIsLoading(true);
      const res = await axios.get(
        `${API_URL}/messages/${activeUserId}/${selectedUserId}`,
        getAuthConfig()
      );
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      onNotify(err.response?.data || "Unable to load conversation.", "error");
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeUserId, onNotify]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!selectedUser || !activeUserId) {
      return;
    }

    fetchConversation(selectedUser._id);
  }, [selectedUser, activeUserId, fetchConversation]);

  useEffect(() => {
    const handleIncomingMessage = (incomingMessage) => {
      const senderId = getId(incomingMessage.sender);
      const receiverId = getId(incomingMessage.receiver);

      if (
        selectedUser &&
        ((senderId === selectedUser._id && receiverId === activeUserId) ||
          (senderId === activeUserId && receiverId === selectedUser._id))
      ) {
        setMessages((prev) => {
          const exists = prev.some((msg) => msg._id === incomingMessage._id);
          return exists ? prev : [...prev, incomingMessage];
        });
      }
    };

    socket.on("receivePrivateMessage", handleIncomingMessage);

    return () => socket.off("receivePrivateMessage", handleIncomingMessage);
  }, [activeUserId, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || !selectedUser || !activeUserId || isSending) {
      return;
    }

    try {
      setIsSending(true);
      const res = await axios.post(
        `${API_URL}/messages`,
        {
          receiver: selectedUser._id,
          text: message.trim(),
        },
        getAuthConfig()
      );

      setMessages((prev) => {
        const exists = prev.some((msg) => msg._id === res.data._id);
        return exists ? prev : [...prev, res.data];
      });
      setMessage("");
    } catch (err) {
      onNotify(err.response?.data || "Unable to send message.", "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={chatShell}>
      <div style={studentStrip}>
        <div style={stripHeader}>
          <span style={stripEyebrow}>Registered students</span>
          <strong style={stripTitle}>Select who you want to chat with</strong>
        </div>

        <div style={studentList}>
          {users.length > 0 ? (
            users.map((user) => {
              const isActive = selectedUser?._id === user._id;

              return (
                <button
                  key={user._id}
                  style={isActive ? activeStudentBtn : studentBtn}
                  onClick={() => setSelectedUser(user)}
                >
                  <span style={studentAvatar}>{getInitial(user.name)}</span>
                  <span style={studentInfo}>
                    <span style={studentName}>{user.name || "Student"}</span>
                    <span style={studentEmail}>{user.email}</span>
                  </span>
                </button>
              );
            })
          ) : (
            <div style={emptyStudents}>No other registered students found.</div>
          )}
        </div>
      </div>

      <section style={conversationPanel}>
        <div style={conversationHeader}>
          <div style={conversationIdentity}>
            <span style={largeAvatar}>{getInitial(selectedUser?.name)}</span>
            <div>
              <p style={conversationEyebrow}>Private one-to-one chat</p>
              <h2 style={conversationTitle}>
                {selectedUser ? selectedUser.name : "Choose a student"}
              </h2>
              <p style={conversationSubtitle}>
                {selectedUser
                  ? `Only ${currentUserName || "you"} and ${selectedUser.name} can see this conversation.`
                  : "Select a registered student above to begin messaging."}
              </p>
            </div>
          </div>
        </div>

        <div style={messageArea}>
          {isLoading && <p style={helperText}>Loading conversation...</p>}

          {!isLoading && selectedUser && messages.length === 0 && (
            <div style={emptyConversation}>
              <h3 style={emptyTitle}>No messages yet</h3>
              <p style={emptyText}>Send the first private message to start the conversation.</p>
            </div>
          )}

          {!isLoading &&
            messages.map((msg) => {
              const isMine = getId(msg.sender) === activeUserId;

              return (
                <div key={msg._id} style={isMine ? mineRow : theirsRow}>
                  <div style={isMine ? mineBubble : theirsBubble}>
                    <span style={bubbleSender}>
                      {isMine ? "You" : msg.sender?.name || selectedUser?.name || "Student"}
                    </span>
                    <p style={bubbleText}>{msg.text}</p>
                    <span style={bubbleTime}>{formatMessageTime(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })}

          <div ref={messagesEndRef} />
        </div>

        <div style={composer}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              selectedUser
                ? `Message ${selectedUser.name || "student"} privately...`
                : "Select a student to start chatting..."
            }
            disabled={!selectedUser || isSending}
            style={messageInput}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!selectedUser || isSending}
            style={sendBtn}
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </section>
    </div>
  );
}

function getId(value) {
  return typeof value === "string" ? value : value?._id;
}

function getInitial(name) {
  return name?.trim()?.charAt(0)?.toUpperCase() || "S";
}

function formatMessageTime(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const chatShell = {
  display: "grid",
  gap: "22px",
};

const studentStrip = {
  background: "rgba(255,255,255,0.88)",
  border: "1px solid rgba(148,163,184,0.16)",
  borderRadius: "26px",
  padding: "20px",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
};

const stripHeader = {
  display: "grid",
  gap: "6px",
  marginBottom: "16px",
};

const stripEyebrow = {
  color: "#64748b",
  fontSize: "0.78rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 800,
};

const stripTitle = {
  color: "#0f172a",
  fontSize: "1.1rem",
};

const studentList = {
  display: "flex",
  gap: "12px",
  overflowX: "auto",
  paddingBottom: "4px",
};

const studentBtn = {
  minWidth: "230px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  border: "1px solid rgba(148,163,184,0.18)",
  background: "#f8fafc",
  borderRadius: "20px",
  padding: "14px",
  cursor: "pointer",
  textAlign: "left",
};

const activeStudentBtn = {
  ...studentBtn,
  background: "linear-gradient(135deg, rgba(249,115,22,0.16), rgba(37,99,235,0.18))",
  border: "1px solid rgba(37,99,235,0.34)",
  boxShadow: "0 14px 30px rgba(37,99,235,0.12)",
};

const studentAvatar = {
  width: "42px",
  height: "42px",
  borderRadius: "14px",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(135deg, #f97316, #2563eb)",
  color: "white",
  fontWeight: 900,
};

const studentInfo = {
  display: "grid",
  gap: "4px",
  minWidth: 0,
};

const studentName = {
  color: "#0f172a",
  fontWeight: 800,
};

const studentEmail = {
  color: "#64748b",
  fontSize: "0.84rem",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const emptyStudents = {
  color: "#64748b",
  padding: "18px",
};

const conversationPanel = {
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(148,163,184,0.16)",
  borderRadius: "30px",
  overflow: "hidden",
  boxShadow: "0 20px 48px rgba(15, 23, 42, 0.1)",
};

const conversationHeader = {
  padding: "22px 24px",
  background: "linear-gradient(135deg, #0f172a, #1d4ed8)",
  color: "white",
};

const conversationIdentity = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
};

const largeAvatar = {
  width: "54px",
  height: "54px",
  borderRadius: "18px",
  display: "grid",
  placeItems: "center",
  background: "rgba(255,255,255,0.16)",
  border: "1px solid rgba(255,255,255,0.2)",
  fontWeight: 900,
};

const conversationEyebrow = {
  margin: "0 0 6px",
  color: "rgba(255,255,255,0.7)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontSize: "0.76rem",
  fontWeight: 800,
};

const conversationTitle = {
  margin: "0 0 6px",
};

const conversationSubtitle = {
  margin: 0,
  color: "rgba(255,255,255,0.78)",
  lineHeight: 1.5,
};

const messageArea = {
  minHeight: "440px",
  maxHeight: "540px",
  overflowY: "auto",
  padding: "24px",
  background:
    "radial-gradient(circle at top, rgba(37,99,235,0.05), transparent 30%), #f8fafc",
};

const helperText = {
  color: "#64748b",
};

const emptyConversation = {
  background: "white",
  border: "1px dashed rgba(148,163,184,0.42)",
  borderRadius: "22px",
  padding: "28px",
  textAlign: "center",
};

const emptyTitle = {
  margin: "0 0 8px",
  color: "#0f172a",
};

const emptyText = {
  margin: 0,
  color: "#64748b",
};

const mineRow = {
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: "14px",
};

const theirsRow = {
  display: "flex",
  justifyContent: "flex-start",
  marginBottom: "14px",
};

const mineBubble = {
  maxWidth: "72%",
  background: "linear-gradient(135deg, #2563eb, #4338ca)",
  color: "white",
  borderRadius: "20px 20px 8px 20px",
  padding: "14px 16px",
  boxShadow: "0 14px 30px rgba(37,99,235,0.18)",
};

const theirsBubble = {
  ...mineBubble,
  background: "white",
  color: "#0f172a",
  border: "1px solid rgba(148,163,184,0.16)",
  borderRadius: "20px 20px 20px 8px",
  boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
};

const bubbleSender = {
  display: "block",
  fontSize: "0.8rem",
  fontWeight: 800,
  opacity: 0.82,
  marginBottom: "6px",
};

const bubbleText = {
  margin: "0 0 8px",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
};

const bubbleTime = {
  display: "block",
  fontSize: "0.76rem",
  opacity: 0.72,
  textAlign: "right",
};

const composer = {
  display: "flex",
  gap: "12px",
  padding: "18px 20px",
  background: "white",
  borderTop: "1px solid rgba(148,163,184,0.16)",
};

const messageInput = {
  flex: 1,
  border: "1px solid #cbd5e1",
  borderRadius: "999px",
  padding: "14px 16px",
  fontSize: "1rem",
  outline: "none",
  background: "#f8fafc",
};

const sendBtn = {
  border: "none",
  borderRadius: "999px",
  padding: "0 20px",
  background: "linear-gradient(135deg, #f97316, #2563eb)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

export default PrivateChat;
