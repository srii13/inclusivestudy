import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import Whiteboard from "../components/Whiteboard";

const Room = () => {
  const { roomId } = useParams();
  const [showWhiteboard, setShowWhiteboard] = useState(false);

  const jitsiContainer = useRef(null);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    // ✅ Connect to backend via Socket.IO
    const socket = io("http://localhost:3001");

    socket.emit("join-room", {
      roomId,
      displayName: localStorage.getItem("username") || "Guest",
      token: localStorage.getItem("token"),
    });

    socket.on("participants", (list) => {
      setParticipants(list);
    });

    return () => {
      socket.emit("leave-room", { roomId });
      socket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    // ✅ Embed Jitsi Meet
    if (window.JitsiMeetExternalAPI) {
      const domain = "meet.jit.si"; // free Jitsi server
      const options = {
        roomName: roomId,
        parentNode: jitsiContainer.current,
        width: "100%",
        height: "100%",
        userInfo: {
          displayName: localStorage.getItem("username") || "Guest",
        },
        configOverwrite: {
          prejoinPageEnabled: false, // 🚀 skip prejoin page
          requireDisplayName: false, // 🚀 don’t force login
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_POWERED_BY: false,
        },
      };
      const api = new window.JitsiMeetExternalAPI(domain, options);
      return () => api.dispose();
    } else {
      console.error("❌ Jitsi API not loaded — check index.html script tag.");
    }
  }, [roomId]);

  return (
    <div className="d-flex vh-100">
      {/* Jitsi Video Call */}
      <div className="flex-grow-1 bg-dark" ref={jitsiContainer} />

      {/* Sidebar */}
      <div
        className="bg-light p-3 border-start"
        style={{ width: "250px", overflowY: "auto" }}
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
        <button className="btn btn-warning w-100 mb-2">Notes</button>
        <button className="btn btn-info w-100">Polls</button>

        {/* Floating Whiteboard */}
        {showWhiteboard && (
          <Whiteboard
            roomId={roomId}
            onClose={() => setShowWhiteboard(false)}
          />
        )}

        <p className="mt-3 text-muted">Room ID: {roomId}</p>
      </div>
    </div>
  );
};

export default Room;
