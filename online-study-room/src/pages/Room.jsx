// src/pages/Room.jsx - THE FINAL, STABLE VERSION with ALL FEATURES
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { io } from "socket.io-client";
import Whiteboard from "../components/Whiteboard"; 
import RoomTodoList from "../components/RoomTodoList"; 
import SharedNotes from "../components/SharedNotes"; 

const CUSTOM_BLUE = '#4903fc'; 

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const jitsiContainer = useRef(null);

    const [participants, setParticipants] = useState([]);
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const [showTodoList, setShowTodoList] = useState(false); 
    const [showNotes, setShowNotes] = useState(false); 
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [polls, setPolls] = useState([]);
    const [socket, setSocket] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showPollForm, setShowPollForm] = useState(false); 
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState('');

    const username = localStorage.getItem("username") || "Guest";
    const displayName = localStorage.getItem("displayName") || username;
    const token = localStorage.getItem("token");

    // CRITICAL: Socket Connection and Logic
    useEffect(() => {
        if (!displayName || displayName === 'Guest') return;
        
        const s = io("http://localhost:3001");
        setSocket(s);

        s.on('connect', () => {
             s.emit("join-room", { roomId, displayName, token });
             setLoading(false);
        });
        
        // Listeners
        const handleChatMessage = (msg) => { setChatMessages((prev) => [...prev, msg]); };
        s.on("participants", (list) => setParticipants(list));
        s.on("chat-message", handleChatMessage);
        s.on("poll-created", (newPoll) => { setPolls((prev) => [...prev, newPoll]); });
        s.on("poll-updated", (updatedPoll) => {
            setPolls((prev) => prev.map(p => p.pollId === updatedPoll.pollId ? updatedPoll : p));
        });
        s.on("room-closed", () => {
             alert("The host has closed the room.");
             s.disconnect();
             navigate("/dashboard");
        });
        s.on('connect_error', (err) => {
             console.error("Socket connection error:", err);
             setLoading(false);
             alert("Failed to connect to the study room server. Check your backend!");
             navigate("/dashboard");
        });
        
        return () => {
            s.emit("leave-room", { roomId, displayName }); 
            s.off("chat-message", handleChatMessage);
            s.disconnect();
        };
    }, [roomId, displayName, token, navigate]); 

    // Jitsi Embed (Stable Logic with Timeout) - unchanged
    useEffect(() => {
        let api = null;
        if (!displayName || displayName === 'Guest') return; 

        const loadJitsi = setTimeout(() => {
            if (jitsiContainer.current && window.JitsiMeetExternalAPI) {
                const domain = "meet.jit.si";
                const options = {
                    roomName: roomId,
                    parentNode: jitsiContainer.current,
                    width: "100%",
                    height: "100%",
                    userInfo: { displayName },
                    configOverwrite: { prejoinPageEnabled: false, requireDisplayName: false },
                    interfaceConfigOverwrite: { SHOW_JITSI_WATERMARK: false, SHOW_POWERED_BY: false },
                };
                api = new window.JitsiMeetExternalAPI(domain, options);
            } else if (!window.JitsiMeetExternalAPI) {
                 console.warn("Jitsi API not found. Video conferencing may not work.");
            }
        }, 1000); 

        return () => {
             clearTimeout(loadJitsi);
             if (api) api.dispose();
        };
    }, [roomId, displayName]); 

    // Send chat (unchanged)
    const sendChat = () => {
        if (chatInput.trim() && socket) {
            const msg = { sender: displayName, text: chatInput, ts: Date.now() };
            socket.emit("chat-message", { roomId, ...msg });
            setChatInput(""); 
        }
    };

    // Host creates a poll (unchanged logic)
    const handleCreatePollSubmit = (e) => {
        e.preventDefault();
        if (!socket || !pollQuestion.trim() || !pollOptions.trim()) {
            return;
        }
        
        const options = pollOptions.split(/\r?\n|,/).map(o => o.trim()).filter(o => o.length > 0);
        if (options.length < 2) {
            alert("Please provide at least two distinct options (one per line is best).");
            return;
        }

        socket.emit("poll-create", {  
            roomId, 
            question: pollQuestion, 
            options, 
            createdBy: displayName 
        });
        
        setPollQuestion('');
        setPollOptions('');
        setShowPollForm(false);
    };

    // Vote (unchanged)
    const votePoll = (pollId, optId) => { 
        if (!socket) return;
        socket.emit("poll-vote", { pollId, optId, voter: displayName });
    };

    // Close Room Function (unchanged)
    const closeRoom = async () => {
        if (!window.confirm("Are you sure you want to close this room? This action cannot be undone.")) return;
        
        try {
            const res = await fetch(`http://localhost:3001/rooms/${roomId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            
            if (res.ok) {
                console.log("Room closure request sent successfully.");
            } else {
                alert(data.error || "Failed to close room");
            }
        } catch (err) {
            console.error("Close room network error:", err);
            alert("Network error while trying to close the room.");
        }
    };

    const exitRoom = () => navigate("/dashboard");
    const isHost = participants.find((p) => p.name === displayName)?.isHost;


    if (loading) {
        return <div className="text-center mt-5">Attempting to join room...</div>;
    }

    return (
        <div className="d-flex vh-100">
            {/* JITSI VIDEO CONTAINER */}
            {(displayName && displayName !== 'Guest') ? (
                <div className="flex-grow-1 bg-dark" ref={jitsiContainer} style={{ minHeight: '100vh' }}/>
            ) : (
                <div className="flex-grow-1 bg-dark d-flex align-items-center justify-content-center">
                    <div className="text-center text-white p-5 border border-warning rounded">
                        <h4 className="mb-3">Waiting for authenticated user...</h4>
                        <p>The conference is starting once user data is confirmed.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/login')}>Login</button>
                    </div>
                </div>
            )}


            {/* Sidebar (Participants, Tools, Chat) */}
            <div className="bg-light p-3 border-start d-flex flex-column" style={{ width: "320px", overflowY: 'auto' }}>
                
                {/* POLISHED ROOM HEADER */}
                <div className="card shadow-sm p-3 mb-3 bg-white border-primary border-2">
                    <h5 className="card-title text-primary d-flex align-items-center mb-2">
                        <i className="bi bi-person-video2 me-2"></i> Current Session
                    </h5>
                    <div className="d-flex justify-content-between align-items-center border-top pt-2">
                        <div className="text-start">
                            <small className="text-muted d-block fw-bold">HOST</small>
                            <strong className="fs-6">{participants.find(p => p.isHost)?.name || 'N/A'}</strong>
                        </div>
                        <div className="vr mx-3"></div> 
                        <div className="text-end">
                            <small className="text-muted d-block fw-bold">STUDYING</small>
                            <strong className="fs-5 text-success">
                                <i className="bi bi-people-fill me-1"></i> {participants.length}
                            </strong>
                        </div>
                    </div>
                    <small className="text-center mt-2 text-info">Room ID: {roomId}</small>
                </div>

                {/* 1. PARTICIPANT LIST */}
                <h5 className="mt-2">Participants</h5>
                <ul className="list-group mb-3">
                    {participants.map((p) => (
                        <li key={p.name} className="list-group-item d-flex justify-content-between align-items-center">
                            {p.name}
                            {p.isHost && <span className="badge bg-primary">Host</span>}
                        </li>
                    ))}
                </ul>

                {/* 2. ROOM TOOLS - FINAL CUSTOM COLORS AND SIZING */}
                <h5 className="mt-2 text-dark">Room Tools</h5>
                
                {/* NEW: SHARED NOTES BUTTON */}
                <button
                    className="btn btn-sm w-100 mb-2 shadow-sm d-flex align-items-center justify-content-center"
                    style={showNotes ? {backgroundColor: CUSTOM_BLUE, borderColor: CUSTOM_BLUE, color: 'white'} : {color: CUSTOM_BLUE, borderColor: CUSTOM_BLUE}} 
                    onClick={() => setShowNotes(!showNotes)}
                >
                    <i className={`bi ${showNotes ? 'bi-journal-text' : 'bi-journal-plus'} me-2 fs-6`}></i> Shared Notes
                </button>

                {/* SHARED NOTES RENDER */}
                {showNotes && (
                    <div className="mb-3">
                        <SharedNotes
                            socket={socket} 
                            roomId={roomId} 
                        />
                    </div>
                )}
                
                {/* Whiteboard Button (Below Notes) */}
                <button
                    className="btn btn-sm w-100 mb-2 shadow-sm d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: CUSTOM_BLUE, borderColor: CUSTOM_BLUE, color: 'white' }} 
                    onClick={() => setShowWhiteboard(true)}
                >
                    <i className="bi bi-easel-fill me-2 fs-6"></i> Whiteboard
                </button>
                
                {/* Shared To-Do List Button (Collapsible Dropdown) */}
                <button 
                    className={`btn btn-sm w-100 mb-3 shadow-sm d-flex align-items-center justify-content-center`} 
                    onClick={() => setShowTodoList(!showTodoList)}
                    style={showTodoList ? {backgroundColor: CUSTOM_BLUE, borderColor: CUSTOM_BLUE, color: 'white'} : {color: CUSTOM_BLUE, borderColor: CUSTOM_BLUE}} 
                >
                   <i className={`bi ${showTodoList ? 'bi-caret-up-fill' : 'bi-list-check me-2 fs-6'}`}></i> Shared To-Do List
                </button>

                {/* SHARED TODO LIST RENDER */}
                {showTodoList && (
                    <div className="mb-3">
                        <RoomTodoList 
                            socket={socket} 
                            roomId={roomId} 
                            displayName={displayName} 
                        />
                    </div>
                )}
                
                {/* INLINE POLL CREATION FORM - PROFESSIONAL BOX */}
                {isHost && (
                    <div className="card p-3 mb-3 shadow-sm" style={{ borderColor: CUSTOM_BLUE, borderWidth: '2px' }}> 
                        <h6 className="text-dark mb-3 d-flex align-items-center">
                             <i className="bi bi-bar-chart-fill me-2" style={{ color: CUSTOM_BLUE }}></i> Create Poll
                        </h6>
                        
                        {!showPollForm && (
                            <button
                                className="btn w-100 btn-sm shadow-sm"
                                onClick={() => setShowPollForm(true)}
                                disabled={!socket}
                                style={{ backgroundColor: CUSTOM_BLUE, borderColor: CUSTOM_BLUE, color: 'white' }}
                            >
                                <i className="bi bi-patch-question me-1"></i> Start New Poll
                            </button>
                        )}
                        
                        {showPollForm && (
                            <form onSubmit={handleCreatePollSubmit}>
                                <div className="mb-2">
                                    <input 
                                        type="text" 
                                        className="form-control form-control-sm mb-2" 
                                        placeholder="Type your poll question" 
                                        value={pollQuestion}
                                        onChange={(e) => setPollQuestion(e.target.value)}
                                        required
                                    />
                                    <textarea 
                                        className="form-control form-control-sm" 
                                        placeholder="List options here (one per line, please)" 
                                        rows="3"
                                        value={pollOptions}
                                        onChange={(e) => setPollOptions(e.target.value)}
                                        required
                                    />
                                    <small className="text-muted small">Enter options on separate lines or separate by commas.</small>
                                </div>
                                <div className="d-flex gap-2">
                                    <button type="submit" className="btn btn-sm flex-grow-1"
                                        style={{ backgroundColor: CUSTOM_BLUE, borderColor: CUSTOM_BLUE, color: 'white' }}
                                    >
                                        Send Poll
                                    </button>
                                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowPollForm(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
                
                {/* 3. LIVE POLLS DISPLAY */}
                {polls.length > 0 && (
                    <div className="mb-3">
                        <h6 className="text-dark">Live Polls</h6>
                        {polls.map((p) => (
                            <div key={p.pollId} className="card p-2 mb-2">
                                <div className="fw-bold">{p.question}</div>
                                {p.options.map((o) => (
                                    <div key={o.optId} className="d-flex align-items-center gap-2 my-1">
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => votePoll(p.pollId, o.optId)}
                                            disabled={p.closed} 
                                        >
                                            {o.text} ({o.votes} votes) 
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
                
                {/* 4. CHATBOX (unchanged) */}
                <h6 className="mt-3 text-dark">Room Chat</h6>
                <div className="flex-grow-1 d-flex flex-column mb-3 border rounded p-2 bg-white" style={{ minHeight: '150px' }}>
                    <div className="flex-grow-1 overflow-auto mb-2">
                        {chatMessages.map((msg, idx) => (
                            <div key={idx} className={`mb-1 ${msg.sender === displayName ? 'text-end' : ''}`}>
                                <small className="text-muted">{msg.sender}:</small> <strong>{msg.text}</strong>
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
                <button className="btn btn-outline-secondary w-100 mb-2 mt-auto" onClick={exitRoom}>
                    Exit Room
                </button>
                {isHost && ( 
                    <button className="btn btn-danger w-100" onClick={closeRoom}>
                        Close Room (Host)
                    </button>
                )}
            </div>

            {/* Whiteboard */}
            <Whiteboard
                visible={showWhiteboard}
                onClose={() => setShowWhiteboard(false)}
                roomId={roomId}
                socket={socket} 
            />
        </div>
    );
};

export default Room;