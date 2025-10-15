// src/components/SharedNotes.jsx - FINAL STABLE COMPONENT
import React, { useState, useEffect, useCallback } from "react";

const SharedNotes = ({ socket, roomId }) => {
    const [notes, setNotes] = useState("");
    
    // CRITICAL: Debounce function to limit server updates (like typing)
    const debounce = (func, delay) => {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    // Handler to send data to the server (debounced to avoid overwhelming the server)
    const sendUpdate = useCallback(
        debounce((content) => {
            if (socket) {
                // Event matches the handler in server.js
                socket.emit("send-notes-update", { roomId, content });
            }
        }, 300), // Send update every 300ms while typing
        [socket, roomId]
    );

    const handleChange = (e) => {
        const newContent = e.target.value;
        setNotes(newContent);
        sendUpdate(newContent); // Send the debounced update
    };

    // --- Socket Listeners ---
    useEffect(() => {
        if (!socket) return;
        
        const handleInitialOrRemoteUpdate = (content) => {
            // Update local state when receiving data from the server
            setNotes(content); 
        };

        // Event matches the handler in server.js
        socket.on("notes-update", handleInitialOrRemoteUpdate);
        
        // Cleanup function
        return () => {
            socket.off("notes-update", handleInitialOrRemoteUpdate);
        };
    }, [socket]);

    return (
        <div className="card p-3 shadow-sm" style={{ border: 'none' }}>
            <h5 className="text-center mb-3">
                <i className="bi bi-journal-text me-2"></i> Shared Notes
            </h5>
            
            <textarea
                className="form-control"
                rows="10"
                placeholder="Start typing collaborative notes here..."
                value={notes}
                onChange={handleChange}
                style={{ resize: 'none', border: '1px solid #ccc' }}
            />
            <small className="text-muted small mt-2">Notes are synced live with everyone in the room.</small>
        </div>
    );
};

export default SharedNotes;