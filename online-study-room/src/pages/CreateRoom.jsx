// src/pages/CreateRoom.jsx - FINAL REPLACEMENT WITH PUBLIC/INVITE SELECTOR
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const API_URL = "http://localhost:3001";

const CreateRoom = ({ user }) => {
    const navigate = useNavigate();
    
    // State for Creation Form
    const [subject, setSubject] = useState("General Study"); 
    const [roomName, setRoomName] = useState("");
    const [isPublic, setIsPublic] = useState(true); // NEW STATE: true (Public) or false (Invite Only)
    const [creationError, setCreationError] = useState(null);

    // State for Room Listing/Search
    const [allRooms, setAllRooms] = useState([]); 
    const [searchQuery, setSearchQuery] = useState(''); 
    const [filterSubject, setFilterSubject] = useState('All'); 
    
    const [loading, setLoading] = useState(true);
    const [listingError, setListingError] = useState(null);

    const token = localStorage.getItem("token");

    // --- 1. ROOM CREATION LOGIC ---
    const createRoom = async () => {
        if (!roomName.trim()) {
            setCreationError("Please enter a room name.");
            return;
        }

        setCreationError(null);
        try {
            const res = await fetch(`${API_URL}/create-room`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`, 
                },
                body: JSON.stringify({ 
                    subject, 
                    roomName,
                    isPublic // Send the access type
                }),
            });
            
            const data = await res.json();
            
            if (res.ok) {
                navigate(`/room/${data.roomId}`);
            } else {
                setCreationError(data.error || "Failed to create room.");
            }
        } catch (err) {
            console.error("Create room error:", err);
            setCreationError("Connection failed. Check server status.");
        }
    };

    // --- 2. ROOM FETCHING LOGIC ---
    const fetchRooms = async () => {
        setLoading(true);
        setListingError(null);

        try {
            const response = await axios.get(`${API_URL}/rooms`, {
                headers: { Authorization: `Bearer ${token}` }, 
            });
            // The backend is filtered to only return PUBLIC rooms.
            setAllRooms(response.data);
        } catch (err) {
            console.error("Failed to fetch rooms for listing:", err);
            setListingError("Failed to load existing rooms. Ensure the backend is running.");
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchRooms();
    }, []);
    
    // --- 3. FILTERING LOGIC ---
    const availableSubjects = ['All', ...new Set(allRooms.map(r => r.subject))];
    
    const filteredRooms = allRooms.filter(room => {
        const subjectMatch = filterSubject === 'All' || room.subject === filterSubject;
        
        const query = searchQuery.toLowerCase();
        const queryMatch = room.name.toLowerCase().includes(query) || 
                           room.host.toLowerCase().includes(query);
                           
        return subjectMatch && queryMatch;
    });

    const handleJoin = (roomId) => {
        navigate(`/room/${roomId}`);
    };

    return (
        <div>
            <Navbar user={user} setUser={() => {}} />
            <div className="container mt-5">
                <h1 className="display-5 text-center mb-5 fw-bold text-dark">
                    Join or Create a Study Session
                </h1>

                <div className="row justify-content-center mb-5">
                    
                    {/* LEFT COLUMN: CREATE ROOM FORM */}
                    <div className="col-md-5 mb-5 mb-md-0">
                        <div className="card p-4 shadow-lg border-primary border-3 h-100">
                            <h3 className="mb-4 text-primary">
                                <i className="bi bi-plus-circle me-2"></i> Start a New Room
                            </h3>
                            
                            {creationError && <div className="alert alert-danger">{creationError}</div>}

                            {/* Room Name Input */}
                            <div className="mb-3">
                                <label htmlFor="roomName" className="form-label fw-bold">Room Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="roomName"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    placeholder="e.g., Finals Prep Session"
                                    required
                                />
                            </div>
                            
                            {/* Subject/Topic Selector */}
                            <div className="mb-3">
                                <label htmlFor="subject" className="form-label fw-bold">Subject/Topic</label>
                                <select
                                    className="form-select"
                                    id="subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                >
                                    <option value="General Study">General Study</option>
                                    <option value="Math">Math / Physics</option>
                                    <option value="Code">Coding / Tech</option>
                                    <option value="History">History / Humanities</option>
                                </select>
                            </div>

                            {/* NEW: Public/Invite Selector */}
                            <div className="mb-4">
                                <label className="form-label fw-bold d-block">Access Type</label>
                                <div className="btn-group w-100" role="group">
                                    <input 
                                        type="radio" 
                                        className="btn-check" 
                                        name="access" 
                                        id="publicAccess" 
                                        autoComplete="off" 
                                        checked={isPublic} 
                                        onChange={() => setIsPublic(true)} 
                                    />
                                    <label className="btn btn-outline-success" htmlFor="publicAccess">
                                        <i className="bi bi-globe me-1"></i> Public
                                    </label>

                                    <input 
                                        type="radio" 
                                        className="btn-check" 
                                        name="access" 
                                        id="privateAccess" 
                                        autoComplete="off" 
                                        checked={!isPublic} 
                                        onChange={() => setIsPublic(false)} 
                                    />
                                    <label className="btn btn-outline-danger" htmlFor="privateAccess">
                                        <i className="bi bi-lock me-1"></i> Invite Only
                                    </label>
                                </div>
                                <small className="text-muted d-block mt-1">
                                    {isPublic ? 'Public rooms appear on the list.' : 'Invite-only rooms are hidden from the list.'}
                                </small>
                            </div>
                            {/* END NEW SELECTOR */}

                            <button className="btn btn-primary btn-lg w-100" onClick={createRoom}>
                                <i className="bi bi-rocket-takeoff me-2"></i> Create & Join Now
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: EXISTING ROOMS LIST WITH SEARCH/FILTER */}
                    <div className="col-md-7">
                        <div className="card p-4 shadow-lg border-secondary border-3 h-100">
                            <h3 className="mb-4 text-secondary">
                                <i className="bi bi-list-ul me-2"></i> Public Sessions
                            </h3>
                            
                            {/* SEARCH AND FILTER TAB */}
                            <div className="d-flex mb-4 gap-2">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by Room Name or Host..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <select
                                    className="form-select"
                                    style={{ width: '150px' }}
                                    value={filterSubject}
                                    onChange={(e) => setFilterSubject(e.target.value)}
                                >
                                    {availableSubjects.map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                </select>
                            </div>
                            {/* END SEARCH AND FILTER TAB */}

                            {loading && (
                                <div className="text-center p-5">
                                    <div className="spinner-border text-secondary me-2" role="status"></div>
                                    Fetching rooms...
                                </div>
                            )}
                            
                            {listingError && <div className="alert alert-danger">{listingError}</div>}

                            {!loading && filteredRooms.length === 0 && !listingError && (
                                <div className="alert alert-warning text-center p-3">
                                    No public sessions found matching your criteria.
                                </div>
                            )}

                            {/* ROOM LIST */}
                            <div className="list-group">
                                {filteredRooms.map((room) => (
                                    <div 
                                        key={room.roomId} 
                                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center mb-2 shadow-sm"
                                        style={{ borderLeft: room.isPublic ? '4px solid var(--bs-success)' : '4px solid var(--bs-danger)' }}
                                    >
                                        <div>
                                            <h6 className="mb-1 fw-bold">{room.name}</h6>
                                            <span className="badge bg-secondary me-2">{room.subject}</span>
                                            <small className="text-muted">Host: {room.host}</small>
                                        </div>
                                        <div className="text-end">
                                            <small className="d-block text-success fw-bold">
                                                {room.participantCount} Active
                                            </small>
                                            <button 
                                                className="btn btn-sm btn-success mt-1"
                                                onClick={() => handleJoin(room.roomId)}
                                            >
                                                Join <i className="bi bi-arrow-right-short"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateRoom;