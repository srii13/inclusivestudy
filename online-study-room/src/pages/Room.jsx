// src/pages/Room.jsx - IMPROVED WITH AUTO-RECONNECTION
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSocketConnection } from "../hooks/useSocketConnection";
import Whiteboard from "../components/Whiteboard"; 
import RoomTodoList from "../components/RoomTodoList"; 
import SharedNotes from "../components/SharedNotes"; 

const CUSTOM_BLUE = '#4903fc'; 

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const jitsiContainer = useRef(null);

    const [participants, setParticipants] = useState([]);
    const [activeTool, setActiveTool] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showPollForm, setShowPollForm] = useState(false); 
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState('');
    const [activeTab, setActiveTab] = useState('chat');

    // Inclusive Learning Additions
    const [isDictating, setIsDictating] = useState(false);
    const [isReadingMessageId, setIsReadingMessageId] = useState(null);
    const [qnaList, setQnaList] = useState([]);
    const [qnaInput, setQnaInput] = useState("");
    const recognitionRef = useRef(null);

    const username = localStorage.getItem("username") || "Guest";
    const displayName = localStorage.getItem("displayName") || username;
    const token = localStorage.getItem("token");

    // Use the new socket hook with auto-reconnection
    const { socket, isConnected, isReconnecting, error: socketError } = useSocketConnection(roomId, displayName, token);

    // Set up socket listeners
    useEffect(() => {
        if (!socket) return;

        const handleChatMessage = (msg) => { 
            setChatMessages((prev) => [...prev, msg]); 
        };

        const handleParticipants = (list) => {
            setParticipants(list);
            setLoading(false);
        };

        const handleConnect = () => {
            setLoading(false);
        };

        // Register listeners
        socket.on("participants", handleParticipants);
        socket.on("chat-message", handleChatMessage);
        socket.on("poll-created", (newPoll) => { 
            setPolls((prev) => [...prev, newPoll]); 
        });
        socket.on("poll-updated", (updatedPoll) => {
            setPolls((prev) => prev.map(p => p.pollId === updatedPoll.pollId ? updatedPoll : p));
        });
        socket.on("qna-sync", (syncData) => setQnaList(syncData));
        socket.on("qna-update", (updateData) => setQnaList(updateData));

        socket.on("room-closed", () => {
            alert("The host has closed the room.");
            socket.disconnect();
            navigate("/dashboard");
        });
        socket.on("connect", handleConnect);

        // Cleanup listeners
        return () => {
            socket.off("chat-message", handleChatMessage);
            socket.off("participants", handleParticipants);
            socket.off("connect", handleConnect);
            socket.off("qna-sync");
            socket.off("qna-update");
        };
    }, [socket, navigate]);

    // ✅ JITSI STABILITY FIX: Ensures API is ready and configures bypass
    useEffect(() => {
        let api = null;
        
        if (!displayName || displayName === 'Guest' || !window.JitsiMeetExternalAPI) {
             return; 
        }

        const loadJitsi = setTimeout(() => {
            if (jitsiContainer.current) {
                const domain = "meet.jit.si";
                const options = {
                    roomName: roomId,
                    parentNode: jitsiContainer.current,
                    width: "100%",
                    height: "100%",
                    userInfo: { displayName },
                    configOverwrite: { 
                        prejoinPageEnabled: false, 
                        requireDisplayName: false,
                        startWithVideoMuted: true,
                        startWithAudioMuted: false,
                        requireDisplayNameOnLoad: false, 
                        disableModeratorIndicator: true, 
                        enableUserRolesBasedOnAuth: false,
                    },
                    interfaceConfigOverwrite: { SHOW_JITSI_WATERMARK: false, SHOW_POWERED_BY: false },
                };
                
                api = new window.JitsiMeetExternalAPI(domain, options);
            }
        }, 500); 

        return () => {
             clearTimeout(loadJitsi);
             if (api) api.dispose(); 
        };
    }, [roomId, displayName]); 

    // --- Function Definitions ---
    const toggleChatDictation = () => {
        if (isDictating && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsDictating(false);
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support Speech Recognition. Try using Chrome or Edge.");
            return;
        }
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        
        recognition.onstart = () => setIsDictating(true);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setChatInput(prev => prev + (prev.length > 0 && !prev.endsWith(' ') ? " " : "") + transcript);
        };
        recognition.onerror = e => { console.error(e); setIsDictating(false); };
        recognition.onend = () => setIsDictating(false);
        try { recognition.start(); } catch (e) { setIsDictating(false); }
    };

    const readMessageAloud = (text, idx) => {
        if (isReadingMessageId === idx) {
            window.speechSynthesis.cancel();
            setIsReadingMessageId(null);
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.onend = () => setIsReadingMessageId(null);
        utterance.onerror = () => setIsReadingMessageId(null);
        setIsReadingMessageId(idx);
        window.speechSynthesis.speak(utterance);
    };

    const sendChat = () => {
        if (chatInput.trim() && socket) {
            const msg = { sender: displayName, text: chatInput, ts: Date.now() };
            socket.emit("chat-message", { roomId, ...msg });
            setChatInput(""); 
        }
    };

    const sendQna = () => {
        if (qnaInput.trim() && socket) {
            socket.emit("ask-qna", { roomId, text: qnaInput });
            setQnaInput("");
        }
    };
    
    const upvoteQna = (questionId) => {
        if (socket) {
            // Using a persistent local identifier for upvoting (fallback to displayName if socket.id rotates)
            socket.emit("upvote-qna", { roomId, questionId, voterId: displayName });
        }
    };

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

    const votePoll = (pollId, optId) => { 
        if (!socket) return;
        socket.emit("poll-vote", { pollId, optId, voter: displayName });
    };

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
            {/* JITSI VIDEO CONTAINER - CONDITIONAL RENDER */}
            {(displayName && displayName !== 'Guest' && window.JitsiMeetExternalAPI) ? (
                <div className="flex-grow-1 bg-dark" ref={jitsiContainer} style={{ minHeight: '100vh' }}/>
            ) : (
                // Fallback display during authentication/loading
                <div className="flex-grow-1 bg-dark d-flex align-items-center justify-content-center">
                    <div className="text-center text-white p-5 border border-warning rounded">
                        <h4 className="mb-3">Authenticating User / Loading Video Library...</h4>
                        <p>Please ensure the Jitsi script is loaded in index.html and you are logged in.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/login')}>Login</button>
                    </div>
                </div>
            )}


            {/* Sidebar (Participants, Tools, Chat) */}
            <div className="glass-panel border-start-0 border-top-0 border-bottom-0 d-flex flex-column rounded-0" style={{ width: "400px", zIndex: 10, backdropFilter: 'blur(30px)' }}>
                
                {/* HEADER SECTION */}
                <div className="p-4 border-bottom border-secondary border-opacity-50">
                    <h5 className="text-gradient d-flex align-items-center mb-3 fw-bolder">
                        <i className="bi bi-broadcast me-2"></i> Room: {roomId}
                    </h5>
                    
                    {/* Connection Status */}
                    <div className="d-flex align-items-center mb-4">
                        {isReconnecting && <span className="badge bg-warning text-dark"><i className="spinner-border spinner-border-sm me-1" style={{width: '0.8rem', height: '0.8rem'}}></i> Reconnecting</span>}
                        {socketError && !isReconnecting && <span className="badge bg-danger"><i className="bi bi-x-circle me-1"></i> {socketError}</span>}
                        {isConnected && !isReconnecting && !socketError && <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50"><i className="bi bi-check-circle-fill me-1"></i> Connected</span>}
                        
                        <span className="ms-auto small text-secondary fw-bold">
                            <i className="bi bi-people-fill me-1"></i> {participants.length} Active
                        </span>
                    </div>

                    {/* TAB NAVIGATION */}
                    <ul className="nav nav-pills nav-fill bg-dark bg-opacity-50 p-1 rounded-pill border border-secondary border-opacity-50 shadow-sm" style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                        <li className="nav-item">
                            <button className={`nav-link rounded-pill py-2 px-2 ${activeTab === 'chat' ? 'active text-white' : 'text-secondary'}`} onClick={() => setActiveTab('chat')} style={activeTab === 'chat' ? {background: 'var(--premium-gradient)', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'} : {}}>
                                <i className="bi bi-chat-dots-fill me-1"></i> Chat
                            </button>
                        </li>
                        <li className="nav-item">
                            <button className={`nav-link rounded-pill py-2 px-2 ${activeTab === 'people' ? 'active text-white' : 'text-secondary'}`} onClick={() => setActiveTab('people')} style={activeTab === 'people' ? {background: 'var(--premium-gradient)', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'} : {}}>
                                <i className="bi bi-people-fill me-1"></i> People
                            </button>
                        </li>
                        <li className="nav-item">
                            <button className={`nav-link rounded-pill py-2 px-2 ${activeTab === 'tools' ? 'active text-white' : 'text-secondary'}`} onClick={() => setActiveTab('tools')} style={activeTab === 'tools' ? {background: 'var(--premium-gradient)', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'} : {}}>
                                <i className="bi bi-tools me-1"></i> Tools
                            </button>
                        </li>
                        <li className="nav-item">
                            <button className={`nav-link rounded-pill py-2 px-2 ${activeTab === 'qna' ? 'active text-white' : 'text-secondary'}`} onClick={() => setActiveTab('qna')} style={activeTab === 'qna' ? {background: 'var(--premium-gradient)', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'} : {}}>
                                <i className="bi bi-patch-question-fill me-1"></i> Q&A
                            </button>
                        </li>
                    </ul>
                </div>

                {/* CONTENT SECTION */}
                <div className="flex-grow-1 overflow-auto p-4 custom-scrollbar">
                    
                    {/* --- CHAT TAB --- */}
                    {activeTab === 'chat' && (
                        <div className="d-flex flex-column h-100">
                            <div className="flex-grow-1 overflow-auto mb-3 pe-2 d-flex flex-column custom-scrollbar">
                                {chatMessages.length === 0 ? (
                                    <div className="text-center text-secondary m-auto small">
                                        <i className="bi bi-chat-square-text fs-1 d-block mb-3 opacity-50"></i>
                                        No messages yet. Start the conversation!
                                    </div>
                                ) : (
                                    chatMessages.map((msg, idx) => {
                                        const isMe = msg.sender === displayName;
                                        return (
                                            <div key={idx} className={`d-flex flex-column mb-3 ${isMe ? 'align-items-end' : 'align-items-start'}`}>
                                                <small className="text-secondary mb-1 px-2 d-flex align-items-center gap-2" style={{ fontSize: '0.70rem', fontWeight: '600', textTransform: 'uppercase' }}>
                                                    {isMe ? 'You' : msg.sender}
                                                    {!isMe && (
                                                        <i 
                                                            className={`bi ${isReadingMessageId === idx ? 'bi-volume-up-fill text-primary' : 'bi-volume-up'} cursor-pointer`}
                                                            onClick={(e) => { e.stopPropagation(); readMessageAloud(msg.text, idx); }}
                                                            title="Read Message"
                                                            style={{ fontSize: '0.9rem', transition: 'color 0.2s' }}
                                                        ></i>
                                                    )}
                                                </small>
                                                <div className={`py-2 px-3 rounded-4 shadow-sm ${isMe ? 'text-white rounded-bottom-end-0' : 'bg-dark bg-opacity-75 text-white border border-secondary border-opacity-50 rounded-bottom-start-0'}`} style={{ maxWidth: '85%', fontSize: '0.90rem', background: isMe ? 'var(--premium-gradient)' : undefined }}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            
                            <div className="mt-auto">
                                <div className="input-group shadow-sm rounded-pill overflow-hidden bg-dark border border-secondary border-opacity-50 p-1">
                                    <input
                                        type="text"
                                        className="form-control border-0 px-3 py-2 bg-transparent text-white"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder={isDictating ? "Listening..." : "Message room..."}
                                        onKeyDown={(e) => e.key === "Enter" && sendChat()}
                                        style={{ boxShadow: 'none', fontSize: '0.9rem' }}
                                    />
                                    <button 
                                        className="btn px-2 border-0" 
                                        onClick={toggleChatDictation} 
                                        style={{ color: isDictating ? '#ef4444' : '#64748b' }}
                                        title="Dictate Message"
                                    >
                                        <i className={`bi ${isDictating ? 'bi-mic-fill pulse-animation' : 'bi-mic'} fs-5`}></i>
                                    </button>
                                    <button className="btn px-3 border-0 rounded-pill" onClick={sendChat} style={{ color: '#c084fc' }}>
                                        <i className="bi bi-send-fill fs-5 text-gradient"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- PEOPLE TAB --- */}
                    {activeTab === 'people' && (
                        <div className="fade-in">
                            <div className="glass-panel border-0 rounded-4 mb-4">
                                <div className="card-body p-3">
                                    <h6 className="text-secondary small fw-bold mb-3 ms-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>CURRENT SESSION</h6>
                                    <div className="d-flex align-items-center">
                                        <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: '45px', height: '45px', background: 'var(--premium-gradient)' }}>
                                            <i className="bi bi-person-video2 fs-5"></i>
                                        </div>
                                        <div>
                                            <h6 className="mb-0 fw-bold text-white">{participants.find(p => p.isHost)?.name || 'N/A'}</h6>
                                            <span className="badge bg-warning text-dark mt-1 px-2 rounded-pill shadow-sm" style={{fontSize: '0.7rem'}}>Host</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h6 className="text-secondary small fw-bold mb-2 ms-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>PARTICIPANTS ({participants.length})</h6>
                            <div className="list-group list-group-flush rounded-4 shadow-sm border border-secondary border-opacity-50 overflow-hidden">
                                {participants.map((p, idx) => (
                                    <div key={idx} className="list-group-item d-flex align-items-center py-3 border-0 border-bottom border-secondary border-opacity-50 bg-dark bg-opacity-50 text-white">
                                        {p.avatar ? (
                                            <img
                                                src={p.avatar.startsWith('http') ? p.avatar : `http://localhost:3001${p.avatar}`}
                                                alt="Avatar"
                                                className="rounded-circle me-3 object-fit-cover shadow-sm bg-secondary bg-opacity-25"
                                                style={{ width: '38px', height: '38px' }}
                                                onError={(e) => {
                                                    // Fallback to icon if image fails to load
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div 
                                            className="bg-secondary bg-opacity-25 rounded-circle align-items-center justify-content-center me-3" 
                                            style={{ width: '38px', height: '38px', display: p.avatar ? 'none' : 'flex' }}
                                        >
                                            <i className="bi bi-person-fill text-secondary fs-5"></i>
                                        </div>
                                        <span className="fw-medium" style={{ fontSize: '0.9rem' }}>{p.name} {p.name === displayName && <span className="text-secondary fw-normal fst-italic ms-1">(You)</span>}</span>
                                        {p.isHost && <i className="bi bi-star-fill text-warning ms-auto"></i>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- TOOLS TAB --- */}
                    {activeTab === 'tools' && (
                        <div className="fade-in">
                            <h6 className="text-secondary small fw-bold mb-3 ms-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>COLLABORATION</h6>
                            
                            <div className="d-flex flex-wrap gap-2 mb-4">
                                <button 
                                    className={`btn btn-sm flex-grow-1 shadow-sm rounded-4 py-2 ${activeTool === 'notes' ? 'text-white border-0' : 'btn-outline-light'}`}
                                    style={activeTool === 'notes' ? {background: 'var(--premium-gradient)', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'} : {}}
                                    onClick={() => setActiveTool(activeTool === 'notes' ? null : 'notes')}
                                >
                                    <i className={`bi ${activeTool === 'notes' ? 'bi-journal-text' : 'bi-journal-plus'} d-block mb-1 fs-5`}></i>
                                    <span style={{fontSize: '0.8rem', fontWeight: 'bold'}}>Notes</span>
                                </button>
                                
                                <button 
                                    className={`btn btn-sm flex-grow-1 shadow-sm rounded-4 py-2 ${activeTool === 'board' ? 'text-white border-0' : 'btn-outline-light'}`}
                                    style={activeTool === 'board' ? {background: 'var(--premium-gradient)', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'} : {}}
                                    onClick={() => setActiveTool(activeTool === 'board' ? null : 'board')}
                                >
                                    <i className="bi bi-easel2-fill d-block mb-1 fs-5"></i>
                                    <span style={{fontSize: '0.8rem', fontWeight: 'bold'}}>Board</span>
                                </button>
                                
                                <button 
                                    className={`btn btn-sm flex-grow-1 shadow-sm rounded-4 py-2 ${activeTool === 'tasks' ? 'text-white border-0' : 'btn-outline-light'}`}
                                    style={activeTool === 'tasks' ? {background: 'var(--premium-gradient)', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'} : {}}
                                    onClick={() => setActiveTool(activeTool === 'tasks' ? null : 'tasks')}
                                >
                                    <i className={`bi bi-ui-checks d-block mb-1 fs-5`}></i>
                                    <span style={{fontSize: '0.8rem', fontWeight: 'bold'}}>Tasks</span>
                                </button>

                                <button 
                                    className={`btn btn-sm flex-grow-1 shadow-sm rounded-4 py-2 ${activeTool === 'polls' ? 'text-white border-0' : 'btn-outline-light'}`}
                                    style={activeTool === 'polls' ? {background: 'var(--premium-gradient)', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'} : {}}
                                    onClick={() => setActiveTool(activeTool === 'polls' ? null : 'polls')}
                                >
                                    <i className={`bi bi-bar-chart-fill d-block mb-1 fs-5`}></i>
                                    <span style={{fontSize: '0.8rem', fontWeight: 'bold'}}>Polls</span>
                                </button>
                            </div>

                            {activeTool === 'notes' && <div className="mb-4 fade-in glass-panel p-2"><SharedNotes socket={socket} roomId={roomId} /></div>}
                            {activeTool === 'tasks' && <div className="mb-4 fade-in glass-panel p-2"><RoomTodoList socket={socket} roomId={roomId} displayName={displayName} /></div>}

                            {activeTool === 'polls' && (
                                <div className="fade-in">
                                    <div className="glass-panel border-0 rounded-4 mb-3">
                                        <div className="card-body p-3">
                                            {!showPollForm ? (
                                                <button className="btn-premium btn-sm w-100 py-2" onClick={() => setShowPollForm(true)} disabled={!socket}>
                                                    <i className="bi bi-patch-question-fill me-2"></i> Start New Poll
                                                </button>
                                            ) : (
                                                <form onSubmit={handleCreatePollSubmit} className="fade-in">
                                                    <input type="text" className="form-control form-control-sm premium-input mb-2" placeholder="Poll question (e.g. Next topic?)" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} required />
                                                    <textarea className="form-control form-control-sm premium-input mb-3" placeholder="Options (one per line)" rows="3" value={pollOptions} onChange={(e) => setPollOptions(e.target.value)} required />
                                                    <div className="d-flex gap-2">
                                                        <button type="submit" className="btn-premium btn-sm flex-grow-1">Send Poll</button>
                                                        <button type="button" className="btn btn-sm btn-outline-light rounded-pill px-3" onClick={() => setShowPollForm(false)}>Cancel</button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    </div>

                                    {polls.length > 0 ? (
                                        <div className="d-flex flex-column gap-3 mb-2">
                                            {polls.map((p) => (
                                                <div key={p.pollId} className="glass-panel border-secondary border-opacity-50 overflow-hidden">
                                                    <div className="card-header border-bottom-0 pt-3 pb-1 bg-transparent">
                                                        <h6 className="fw-bold mb-0 text-white" style={{fontSize: '0.9rem'}}><i className="bi bi-pie-chart-fill me-2 text-gradient"></i>{p.question}</h6>
                                                    </div>
                                                    <div className="card-body p-3">
                                                        <div className="d-flex flex-column gap-2">
                                                            {p.options.map((o) => (
                                                                <button 
                                                                    key={o.optId}
                                                                    className="btn btn-sm btn-outline-light border-secondary border-opacity-50 d-flex justify-content-between align-items-center rounded-pill px-3 py-2 text-start"
                                                                    onClick={() => votePoll(p.pollId, o.optId)}
                                                                    disabled={p.closed}
                                                                >
                                                                    <span className="fw-medium text-white" style={{fontSize: '0.85rem'}}>{o.text}</span>
                                                                    <span className="badge rounded-pill bg-dark text-white border border-secondary border-opacity-50">{o.votes}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-secondary m-auto py-4 small">
                                            <i className="bi bi-bar-chart-fill fs-3 d-block mb-3 opacity-25"></i>
                                            No active polls in this room.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- Q&A TAB --- */}
                    {activeTab === 'qna' && (
                        <div className="d-flex flex-column h-100 fade-in">
                            <div className="flex-grow-1 overflow-auto mb-3 pe-2 d-flex flex-column custom-scrollbar">
                                {qnaList.length === 0 ? (
                                    <div className="text-center text-secondary m-auto small">
                                        <i className="bi bi-patch-question fs-1 d-block mb-3 opacity-50"></i>
                                        No questions asked yet. Be the first!
                                    </div>
                                ) : (
                                    [...qnaList].sort((a, b) => b.upvotes - a.upvotes).map((q) => (
                                        <div key={q.id} className="d-flex flex-column mb-3 align-items-start">
                                            <div className="d-flex align-items-center mb-1 px-2 gap-2 text-secondary" style={{ fontSize: '0.70rem', fontWeight: '600', textTransform: 'uppercase' }}>
                                                <span><i className="bi bi-incognito fw-bold me-1"></i> Anonymous</span>
                                                <span>•</span>
                                                <span>{new Date(q.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            <div className="d-flex align-items-center w-100 p-2 px-3 rounded-4 shadow-sm bg-dark bg-opacity-75 text-white border border-secondary border-opacity-50">
                                                <div className="flex-grow-1 pe-3" style={{ fontSize: '0.90rem' }}>
                                                    {q.text}
                                                </div>
                                                <button 
                                                    className="btn btn-sm rounded-circle d-flex flex-column align-items-center justify-content-center p-0 transition-all" 
                                                    style={{ width: '40px', height: '40px', background: q.upvotedBy.includes(displayName) ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)', color: q.upvotedBy.includes(displayName) ? '#818cf8' : '#94a3b8', border: q.upvotedBy.includes(displayName) ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255,255,255,0.1)' }}
                                                    onClick={() => upvoteQna(q.id)}
                                                    disabled={q.upvotedBy.includes(displayName)}
                                                    title={q.upvotedBy.includes(displayName) ? "You upvoted this" : "Upvote Question"}
                                                >
                                                    <i className={`bi ${q.upvotedBy.includes(displayName) ? 'bi-caret-up-fill' : 'bi-caret-up'} fs-5 lh-1`}></i>
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>{q.upvotes}</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            <div className="mt-auto">
                                <div className="input-group shadow-sm rounded-pill overflow-hidden bg-dark border border-secondary border-opacity-50 p-1">
                                    <span className="input-group-text bg-transparent border-0 text-secondary pe-0">
                                        <i className="bi bi-incognito"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control border-0 px-3 py-2 bg-transparent text-white"
                                        value={qnaInput}
                                        onChange={(e) => setQnaInput(e.target.value)}
                                        placeholder="Ask anonymously..."
                                        onKeyDown={(e) => e.key === "Enter" && sendQna()}
                                        style={{ boxShadow: 'none', fontSize: '0.9rem' }}
                                    />
                                    <button className="btn px-3 border-0 rounded-pill" onClick={sendQna} style={{ color: '#c084fc' }}>
                                        <i className="bi bi-send-fill fs-5 text-gradient"></i>
                                    </button>
                                </div>
                                <div className="text-center mt-2">
                                    <small className="text-secondary" style={{fontSize: '0.65rem'}}>Your identity is completely hidden from everyone, including the host.</small>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* BOTTOM ACTIONS SECTION */}
                <div className="p-4 border-top border-secondary border-opacity-50 z-3">
                    <div className="d-flex gap-2">
                        <button className="btn btn-outline-light flex-grow-1 rounded-pill fw-bold shadow-sm" onClick={exitRoom}>
                            <i className="bi bi-door-closed me-1"></i> Leave
                        </button>
                        {isHost && (
                            <button className="btn btn-danger flex-grow-1 rounded-pill fw-bold shadow-sm" onClick={closeRoom}>
                                <i className="bi bi-x-octagon-fill me-1"></i> End Session
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Whiteboard */}
            <Whiteboard
                visible={activeTool === 'board'}
                onClose={() => setActiveTool(null)}
                roomId={roomId}
                socket={socket} 
            />
        </div>
    );
};

export default Room;