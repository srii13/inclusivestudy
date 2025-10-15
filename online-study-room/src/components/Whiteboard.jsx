// online-study-room/src/components/Whiteboard.jsx - FINAL STABLE CODE
import React, { useEffect, useRef } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

const Whiteboard = ({ visible, onClose, roomId, socket }) => { 
    const excalidrawRef = useRef(null);

    // ✅ Sync updates
    useEffect(() => {
        if (!roomId || !socket) return;
        
        const handleUpdate = (data) => {
             if (excalidrawRef.current) {
                excalidrawRef.current.updateScene(data); 
            }
        };

        socket.on("whiteboard-update", handleUpdate);
        
        return () => {
            socket.off("whiteboard-update", handleUpdate);
        };
    }, [roomId, socket]);

    // ✅ Send updates when drawing changes
    const handleChange = (elements, appState) => {
        if (roomId && socket) {
            socket.emit("whiteboard-update", { roomId, data: { elements, appState } });
        }
    };

    if (!visible) return null;

    return (
        <div
            className="whiteboard-overlay"
            style={{
                position: "fixed", 
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(0,0,0,0.8)", 
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 2000, 
            }}
        >
            <div
                className="whiteboard-container"
                style={{
                    width: "90%",
                    height: "90%",
                    background: "white",
                    borderRadius: "12px", 
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)" 
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: 15,
                        right: 15,
                        zIndex: 2100,
                        fontSize: '1.2rem',
                        padding: '5px 10px'
                    }}
                    className="btn btn-danger"
                >
                    ✖ Close
                </button>
                <Excalidraw
                    ref={excalidrawRef}
                    onChange={handleChange}
                    initialData={{ elements: [], appState: { viewBackgroundColor: "#fff" } }}
                />
            </div>
        </div>
    );
};

export default Whiteboard;