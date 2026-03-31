// online-study-room/src/components/Whiteboard.jsx - IMPROVED WITH DEBOUNCING & ERROR HANDLING
import React, { useEffect, useRef, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

const Whiteboard = ({ visible, onClose, roomId, socket }) => { 
    const [excalidrawAPI, setExcalidrawAPI] = useState(null);
    const debounceTimeoutRef = useRef(null);
    const isUpdatingRef = useRef(false);
    const latestDataRef = useRef(null);
    const lastElementsHashRef = useRef("");
    const [syncError, setSyncError] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Handle incoming whiteboard updates
    useEffect(() => {
        if (!roomId || !socket) return;
        
        const handleUpdate = (data) => {
            try {
                if (data && data.elements) {
                    latestDataRef.current = data.elements;
                    if (excalidrawAPI) {
                        isUpdatingRef.current = true;
                        excalidrawAPI.updateScene({ 
                            elements: data.elements,
                            commitToHistory: false
                        });
                        setIsSyncing(false);
                        setTimeout(() => { isUpdatingRef.current = false; }, 100);
                    }
                }
            } catch (err) {
                console.error("Error updating whiteboard scene:", err);
                setSyncError("Failed to sync drawing changes");
            }
        };

        const handleError = (err) => {
            console.error("Whiteboard socket error:", err);
            setSyncError("Connection error - changes may not sync");
        };

        socket.on("whiteboard-update", handleUpdate);
        socket.on("error", handleError);
        
        return () => {
            socket.off("whiteboard-update", handleUpdate);
            socket.off("error", handleError);
        };
    }, [roomId, socket, excalidrawAPI]);

    // Send updates when drawing changes (debounced)
    const handleChange = (elements, appState) => {
        if (!roomId || !socket || isUpdatingRef.current) return;

        // Excalidraw fires onChange for ANY state change (scroll, zoom, hover).
        // Only trigger network sync when the actual drawn elements change.
        if (!elements) return;
        const currentHash = elements.map(e => e.id + e.version).join('|');
        if (lastElementsHashRef.current === currentHash) {
            return; // No drawing change, ignore!
        }
        lastElementsHashRef.current = currentHash;

        // Clear previous timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        setIsSyncing(true);
        setSyncError(null);

        // Debounce the emit to avoid sending too many updates
        debounceTimeoutRef.current = setTimeout(() => {
            try {
                socket.emit("whiteboard-update", { 
                    roomId, 
                    data: { elements: elements || [] } 
                });
                setIsSyncing(false); // Clear syncing indicator on successful emit
            } catch (err) {
                console.error("Error sending whiteboard update:", err);
                setSyncError("Failed to send drawing");
                setIsSyncing(false);
            }
        }, 300); // 300ms debounce
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

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
                    className="btn d-flex align-items-center justify-content-center"
                    style={{
                        position: "absolute",
                        top: 20,
                        right: 20,
                        zIndex: 2100,
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        backdropFilter: "blur(10px)",
                        color: "#4a4a4a",
                        border: "1px solid rgba(0,0,0,0.08)",
                        borderRadius: "30px",
                        padding: "8px 20px",
                        fontSize: "0.95rem",
                        fontWeight: "700",
                        letterSpacing: "0.5px",
                        transition: "all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
                        cursor: "pointer"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#ff4d4f";
                        e.currentTarget.style.color = "white";
                        e.currentTarget.style.border = "1px solid #ff4d4f";
                        e.currentTarget.style.transform = "scale(1.05) translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 10px 25px rgba(255, 77, 79, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
                        e.currentTarget.style.color = "#4a4a4a";
                        e.currentTarget.style.border = "1px solid rgba(0,0,0,0.08)";
                        e.currentTarget.style.transform = "scale(1) translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.08)";
                    }}
                >
                    <i className="bi bi-x-circle-fill me-2" style={{ fontSize: "1.1rem" }}></i>
                    Close
                </button>

                {/* Sync Status Indicator */}
                {isSyncing && (
                    <div
                        style={{
                            position: "absolute",
                            top: 60,
                            right: 20,
                            zIndex: 2100,
                            fontSize: '0.85rem',
                            padding: '5px 10px',
                            backgroundColor: '#e3f2fd',
                            borderRadius: '4px',
                            color: '#1976d2'
                        }}
                    >
                        <i className="bi bi-hourglass-split me-2"></i>Syncing...
                    </div>
                )}

                {syncError && (
                    <div
                        style={{
                            position: "absolute",
                            top: 60,
                            right: 20,
                            zIndex: 2100,
                            fontSize: '0.85rem',
                            padding: '5px 10px',
                            backgroundColor: '#ffebee',
                            borderRadius: '4px',
                            color: '#c62828'
                        }}
                    >
                        <i className="bi bi-exclamation-circle me-2"></i>{syncError}
                    </div>
                )}

                <Excalidraw
                    excalidrawAPI={(api) => setExcalidrawAPI(api)}
                    onChange={handleChange}
                    initialData={{ 
                        elements: latestDataRef.current || [], 
                        appState: { viewBackgroundColor: "#fff" } 
                    }}
                />
            </div>
        </div>
    );
};

export default Whiteboard;