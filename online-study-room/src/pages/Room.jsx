import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Whiteboard from "../components/Whiteboard";

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const jitsiContainer = useRef(null);

  const [participants, setParticipants] = useState([]);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [socket, setSocket] = useState(null);

  const username = localStorage.getItem("username") || "Guest";
  const displayName = localStorage.getItem("displayName") || username;
  const token = localStorage.getItem("token");

  // ✅ Connect to backend
  useEffect(() => {
    const s = io("http://localhost:3001");
    setSocket(s);

    s.emit("join-room", {
      roomId,
      displayName,
      token,
    });

    s.on("participants", (list) => {
      setParticipants(list);
    });

    s.on("chat-message", (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    return () => {
      s.emit("leave-room", { roomId });
      s.disconnect();
    };
  }, [roomId, displayName, token]);

  // ✅ Embed Jitsi
  useEffect(() => {
    if (window.JitsiMeetExternalAPI) {
      const domain = "meet.jit.si";
      const options = {
        roomName: roomId,
        parentNode: jitsiContainer.current,
        width: "100%",
        height: "100%",
        userInfo: {
          displayName,
        },
        configOverwrite: {
          prejoinPageEnabled: false,
          requireDisplayName: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_POWERED_BY: false,
        },
      };
      const api = new window.JitsiMeetExternalAPI(domain, options);
      return () => api.dispose();
    } else {
      console.error("Jitsi API not loaded — check index.html script tag.");
    }
  }, [roomId, displayName]);

  // ✅ Send chat
  const sendChat = () => {
    if (chatInput.trim() && socket) {
      const msg = { sender: displayName, text: chatInput };
      socket.emit("chat-message", { roomId, ...msg });
      setChatMessages((prev) => [...prev, msg]); // add locally
      setChatInput("");
    }
  };

  // ✅ Host-only Close Room
  const closeRoom = async () => {
    if (window.confirm("Are you sure you want to close this room?")) {
      const res = await fetch(`http://localhost:3001/rooms/${roomId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        alert("Room closed successfully!");
        navigate("/dashboard");
      } else {
        alert(data.error || "Failed to close room");
      }
    }
  };

  // ✅ Exit room
  const exitRoom = () => {
    navigate("/dashboard");
  };

  return (
    <div className="d-flex vh-100">
      {/* Jitsi Video */}
      <div className="flex-grow-1 bg-dark" ref={jitsiContainer} />

      {/* Sidebar */}
      <div
        className="bg-light p-3 border-start d-flex flex-column"
        style={{ width: "320px" }}
      >
        <h5>Participants</h5>
        <ul className="list-group mb-3">
          {participants.map((p) => (
            <li
              key={p.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              {p.name}
              {p.isHost && <span className="badge bg-primary">Host</span>}
            </li>
          ))}
        </ul>

        <h6>Room Tools</h6>
        <button
          className="btn btn-success w-100 mb-2"
          onClick={() => setShowWhiteboard(true)}
        >
          Whiteboard
        </button>
        <button className="btn btn-warning w-100 mb-2">Notes (coming soon)</button>
        <button className="btn btn-info w-100 mb-3">Polls (coming soon)</button>

        {/* Chatbox */}
        <div className="flex-grow-1 d-flex flex-column mb-3 border rounded p-2 bg-white">
          <div
            className="flex-grow-1 overflow-auto mb-2"
            style={{ maxHeight: "200px" }}
          >
            {chatMessages.map((msg, idx) => (
              <div key={idx} className="mb-1">
                <strong>{msg.sender}:</strong> {msg.text}
              </div>
            ))}
          </div>
          <div className="d-flex">
            <input
              type="text"
              className="form-control"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
            />
            <button className="btn btn-primary ms-2" onClick={sendChat}>
              Send
            </button>
          </div>
        </div>

        {/* Exit / Close */}
        <button className="btn btn-outline-secondary w-100 mb-2" onClick={exitRoom}>
          Exit Room
        </button>
        {participants.find((p) => p.name === displayName && p.isHost) && (
          <button className="btn btn-danger w-100" onClick={closeRoom}>
            Close Room
          </button>
        )}

        <p className="mt-3 text-muted">Room ID: {roomId}</p>
      </div>

      {/* Floating Whiteboard */}
      <Whiteboard
        visible={showWhiteboard}
        onClose={() => setShowWhiteboard(false)}
        roomId={roomId}
      />
    </div>
  );
};

export default Room;
