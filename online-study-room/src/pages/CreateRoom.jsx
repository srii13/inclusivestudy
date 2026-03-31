// src/pages/CreateRoom.jsx - FINAL REPLACEMENT WITH PUBLIC/INVITE SELECTOR
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import PremiumSelect from "../components/PremiumSelect";

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
                <h1 className="display-4 text-center mb-5 fw-bolder text-white">
                    Join or <span className="text-gradient">Create</span> a Session
                </h1>

                <div className="row justify-content-center mb-5 g-4">
                    
                    {/* LEFT COLUMN: CREATE ROOM FORM */}
                    <div className="col-md-5">
                        <div className="glass-panel p-4 h-100">
                            <h3 className="mb-4 text-white">
                                <i className="bi bi-plus-circle me-2 text-gradient"></i> Start a New Room
                            </h3>
                            
                            {creationError && <div className="alert alert-danger">{creationError}</div>}

                            {/* Room Name Input */}
                            <div className="mb-4">
                                <label htmlFor="roomName" className="form-label text-secondary fw-semibold">Room Name</label>
                                <input
                                    type="text"
                                    className="form-control premium-input"
                                    id="roomName"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    placeholder="e.g., Finals Prep Session"
                                    required
                                />
                            </div>
                            
                            {/* Subject/Topic Selector */}
                            <div className="mb-4">
                                <label className="form-label text-secondary fw-semibold">Subject/Topic</label>
                                <PremiumSelect 
                                    options={[
                                        { value: "General Study", label: "General Study" },
                                        { value: "Math", label: "Math / Physics" },
                                        { value: "Code", label: "Coding / Tech" },
                                        { value: "History", label: "History / Humanities" }
                                    ]}
                                    value={subject}
                                    onChange={setSubject}
                                />
                            </div>

                            {/* NEW: Public/Invite Selector */}
                            <div className="mb-4">
                                <label className="form-label text-secondary fw-semibold d-block">Access Type</label>
                                <div className="glass-panel d-inline-flex p-1 rounded-pill w-100 shadow-sm" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <button 
                                        type="button"
                                        className={`btn btn-sm rounded-pill flex-grow-1 py-2 border-0 transition-all ${isPublic ? 'text-white shadow' : 'text-secondary'}`}
                                        style={{ 
                                            background: isPublic ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                                            fontWeight: isPublic ? 'bold' : 'normal'
                                        }}
                                        onClick={() => setIsPublic(true)}
                                    >
                                        <i className="bi bi-globe me-1"></i> Public
                                    </button>
                                    <button 
                                        type="button"
                                        className={`btn btn-sm rounded-pill flex-grow-1 py-2 border-0 transition-all ${!isPublic ? 'text-white shadow' : 'text-secondary'}`}
                                        style={{ 
                                            background: !isPublic ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'transparent',
                                            fontWeight: !isPublic ? 'bold' : 'normal'
                                        }}
                                        onClick={() => setIsPublic(false)}
                                    >
                                        <i className="bi bi-lock me-1"></i> Invite Only
                                    </button>
                                </div>
                                <small className="text-secondary d-block mt-2">
                                    {isPublic ? 'Public rooms appear on the list.' : 'Invite-only rooms are hidden from the list.'}
                                </small>
                            </div>
                            {/* END NEW SELECTOR */}

                            <button className="btn-premium w-100 mt-2" onClick={createRoom}>
                                Create & Join Now <i className="bi bi-rocket-takeoff ms-2"></i>
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: EXISTING ROOMS LIST WITH SEARCH/FILTER */}
                    <div className="col-md-7">
                        <div className="glass-panel p-4 h-100">
                            <h3 className="mb-4 text-white">
                                <i className="bi bi-list-ul me-2 text-gradient"></i> Public Sessions
                            </h3>
                            
                            {/* SEARCH AND FILTER TAB */}
                            <div className="d-flex mb-4 gap-2">
                                <input
                                    type="text"
                                    className="form-control premium-input"
                                    placeholder="Search by Room Name or Host..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <PremiumSelect
                                    style={{ width: '150px' }}
                                    options={[
                                        { value: "All", label: "All" },
                                        { value: "General Study", label: "General Study" },
                                        { value: "Math", label: "Math / Physics" },
                                        { value: "Code", label: "Coding / Tech" },
                                        { value: "History", label: "History / Humanities" }
                                    ]}
                                    value={filterSubject}
                                    onChange={setFilterSubject}
                                />
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
                            <div className="d-flex flex-column gap-3">
                                {filteredRooms.map((room) => (
                                    <div 
                                        key={room.roomId} 
                                        className="glass-panel glass-panel-hover p-3 text-white d-flex justify-content-between align-items-center"
                                        style={{ borderLeft: room.isPublic ? '4px solid #34d399' : '4px solid #f87171' }}
                                    >
                                        <div>
                                            <h6 className="mb-2 fw-bold text-white">{room.name}</h6>
                                            <span className="room-badge me-2">{room.subject}</span>
                                            <small className="text-secondary">Host: {room.host}</small>
                                        </div>
                                        <div className="text-end">
                                            <small className="d-block text-success fw-bold">
                                                {room.participantCount} Active
                                            </small>
                                            <button 
                                                className="btn btn-sm btn-outline-light mt-2"
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