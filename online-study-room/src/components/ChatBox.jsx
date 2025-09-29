// src/components/ChatBox.jsx
import React, { useEffect, useRef, useState } from "react";

const ChatBox = ({ messages = [], onSend }) => {
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <>
      <div style={{ flex: 1, overflow: "auto", padding: 12, background: "#f7f8fb" }}>
        {messages.length === 0 && (
          <div className="text-center text-muted" style={{ marginTop: 20 }}>
            No messages yet — say hi 👋
          </div>
        )}

        {messages.map((m, i) => {
          const isMe = m.user === (localStorage.getItem("displayName") || "Guest");
          return (
            <div key={m.id ?? i} className={`d-flex mb-2 ${isMe ? "justify-content-end" : "justify-content-start"}`}>
              <div
                style={{
                  maxWidth: "78%",
                  background: isMe ? "#0d6efd" : "#e9ecef",
                  color: isMe ? "white" : "black",
                  padding: "8px 10px",
                  borderRadius: 8,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  {m.user}
                </div>
                <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                <div style={{ fontSize: 11, opacity: 0.7, textAlign: "right", marginTop: 6 }}>
                  {m.time}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: 10, borderTop: "1px solid #eee", display: "flex", gap: 8 }}>
        <input
          type="text"
          className="form-control"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          style={{ minWidth: 0 }} // allow flex shrinking
        />
        <button className="btn btn-primary" onClick={handleSend}>Send</button>
      </div>
    </>
  );
};

export default ChatBox;
