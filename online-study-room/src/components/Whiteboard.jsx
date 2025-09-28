import React, { useRef, useEffect } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

const Whiteboard = ({ roomId, onClose }) => {
  const excalidrawRef = useRef(null);

  // 🔄 Receive updates
  useEffect(() => {
    socket.on("whiteboard-update", ({ roomId: incomingRoomId, data }) => {
      if (incomingRoomId === roomId && excalidrawRef.current) {
        console.log("📥 Received whiteboard update:", data.length);
        excalidrawRef.current.updateScene({ elements: data });
      }
    });

    return () => {
      socket.off("whiteboard-update");
    };
  }, [roomId]);

  // ✍️ Send updates when local user draws
  const handleChange = (elements) => {
    console.log("📤 Sending whiteboard update:", elements.length);
    socket.emit("whiteboard-update", { roomId, data: elements });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "10%",
        left: "10%",
        width: "80%",
        height: "80%",
        background: "white",
        border: "2px solid #333",
        borderRadius: "10px",
        zIndex: 9999,
        boxShadow: "0px 4px 20px rgba(0,0,0,0.2)",
      }}
    >
      <div style={{ textAlign: "right", padding: "5px" }}>
        <button className="btn btn-danger btn-sm" onClick={onClose}>
          Close ✕
        </button>
      </div>

      <Excalidraw
        ref={excalidrawRef}
        onChange={(elements) => handleChange(elements)}
        initialData={{ elements: [], appState: { viewModeEnabled: false } }}
      />
    </div>
  );
};

export default Whiteboard;
