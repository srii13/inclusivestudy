// src/components/SharedNotes.jsx - FINAL STABLE COMPONENT
import React, { useState, useEffect, useCallback, useRef } from "react";

const SharedNotes = ({ socket, roomId }) => {
    const [notes, setNotes] = useState("");
    const [isDictating, setIsDictating] = useState(false);
    const [isReading, setIsReading] = useState(false);
    const recognitionRef = useRef(null);
    
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

    // --- Inclusive Learning Features ---
    const toggleDictation = () => {
        if (isDictating && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsDictating(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support Speech Recognition. Try using Google Chrome or Edge.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        
        recognition.onstart = () => setIsDictating(true);
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setNotes(prev => {
                const newContent = prev + (prev.length > 0 && !prev.endsWith(' ') ? " " : "") + transcript;
                sendUpdate(newContent);
                return newContent;
            });
        };
        
        recognition.onerror = (e) => {
            console.error("Dictation error", e);
            setIsDictating(false);
        };
        
        recognition.onend = () => {
            setIsDictating(false);
        };
        
        try {
            recognition.start();
        } catch (e) {
            console.error(e);
            setIsDictating(false);
        }
    };

    const toggleReader = () => {
        if (isReading) {
            window.speechSynthesis.cancel();
            setIsReading(false);
            return;
        }
        
        if (!notes.trim()) return;

        const utterance = new SpeechSynthesisUtterance(notes);
        utterance.rate = 0.9; // Read slightly slower for accessibility
        utterance.onend = () => setIsReading(false);
        utterance.onerror = () => setIsReading(false);
        
        setIsReading(true);
        window.speechSynthesis.speak(utterance);
    };

    const handleDownloadNotes = () => {
        if (!notes.trim()) {
            alert("Shared notes are empty.");
            return;
        }
        const element = document.createElement("a");
        const file = new Blob([notes], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        // Include the room id and current short date for the filename
        element.download = `Shared_Notes_${roomId}_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(element); // Important for FireFox
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="glass-panel border-0 p-3 h-100 d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="text-white fw-bold m-0">
                    <i className="bi bi-journal-text me-2 text-gradient"></i> Shared Notes
                </h5>
                <div className="d-flex gap-2">
                    <button 
                        className="btn btn-sm btn-outline-success shadow-sm"
                        onClick={handleDownloadNotes}
                        title="Download as .txt"
                        style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                    >
                        <i className="bi bi-cloud-arrow-down"></i>
                    </button>
                    <button 
                        className={`btn btn-sm shadow-sm ${isReading ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={toggleReader}
                        title="Read Aloud"
                        style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                    >
                        <i className={`bi ${isReading ? 'bi-volume-up-fill' : 'bi-volume-up'}`}></i>
                    </button>
                    <button 
                        className={`btn btn-sm shadow-sm ${isDictating ? 'btn-danger pulse-animation' : 'btn-outline-danger'}`}
                        onClick={toggleDictation}
                        title="Dictate (Speech to Text)"
                        style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                    >
                        <i className={`bi ${isDictating ? 'bi-mic-fill' : 'bi-mic'}`}></i>
                    </button>
                </div>
            </div>
            
            <textarea
                className="form-control premium-input flex-grow-1"
                rows="10"
                placeholder={isDictating ? "Listening... Speak now." : "Start typing collaborative notes here..."}
                value={notes}
                onChange={handleChange}
                style={{ resize: 'none', transition: 'all 0.3s ease', borderColor: isDictating ? '#ef4444' : 'rgba(255,255,255,0.1)' }}
            />
            <small className="text-secondary small mt-2 d-block text-end">Notes are synced live with everyone in the room.</small>
        </div>
    );
};

export default SharedNotes;