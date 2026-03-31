import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import Navbar from "../components/Navbar";

const API_URL = "http://localhost:3001";
const RANK_COLORS = {
    1: '#FFD700', // Gold
    2: '#C0C0C0', // Silver
    3: '#CD7F32', // Bronze
};

const Leaderboard = ({ user, setUser }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token");

    const fetchLeaderboard = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const response = await axios.get(`${API_URL}/leaderboard`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setLeaderboard(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching leaderboard:", err);
            setLoading(false);
        }
    }, [token]);

    // 1. Fetch initial leaderboard
    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    // 2. Set up Socket.IO listener for real-time DB syncs
    useEffect(() => {
        const socket = io("http://localhost:3001");

        socket.on("db-leaderboard-update", () => {
             // Rerun the fetch when a pomodoro finishes and updates DB
             fetchLeaderboard();
        });
        
        // Cleanup
        return () => {
            socket.off("db-leaderboard-update");
            socket.disconnect();
        };
    }, [fetchLeaderboard]);

    // Get the current user's name for highlighting
    const currentUserName = user?.displayName || localStorage.getItem("displayName");

    return (
        <div>
            <Navbar user={user} setUser={setUser} />
            <div className="container mt-5">
                <h1 className="mb-4 text-center display-5 fw-bolder text-white">
                    <i className="bi bi-trophy me-3 text-warning"></i> Study Leaderboard
                </h1>
                <p className="text-center lead text-secondary mb-5">
                    Displaying top users based on verified persistent XP and their specialized study fields.
                </p>

                {loading && (
                    <div className="text-center p-5"><div className="spinner-border text-primary me-2" role="status"></div> Loading leaders...</div>
                )}
                
                {!loading && leaderboard.length === 0 && (
                    <div className="alert alert-info text-center p-4 mx-auto" style={{ maxWidth: '700px' }}>
                        No users or XP recorded yet! Ensure you are logged in and complete a Focus session.
                    </div>
                )}

                <ul className="list-group mt-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {leaderboard.map((entry, index) => {
                        const rank = index + 1;
                        const rankStyle = {
                            backgroundColor: RANK_COLORS[rank] || 'rgba(255,255,255,0.05)',
                            color: RANK_COLORS[rank] ? 'black' : 'white',
                            fontWeight: 'bold',
                            border: RANK_COLORS[rank] ? `2px solid ${RANK_COLORS[rank]}` : '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            width: '45px',
                            height: '45px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: '5px'
                        };
                        const isCurrentUser = entry.displayName === currentUserName;
                        
                        return (
                            <li 
                                key={entry.username}
                                className={`list-group-item d-flex justify-content-between align-items-center p-3 mb-4 border-0 rounded-4 glass-panel glass-panel-hover shadow`}
                                style={isCurrentUser ? {background: 'rgba(99, 102, 241, 0.4)', borderColor: 'rgba(99, 102, 241, 0.8)'} : {}} 
                            >
                                {/* 1. RANK TIER */}
                                <span className="me-4 fs-4" style={rankStyle}>
                                    {rank}
                                </span>
                                
                                {/* 2. USER INFO */}
                                <div className="flex-grow-1">
                                    <strong className={`fs-4 ${isCurrentUser ? 'text-white' : 'text-light'} me-2`}>
                                        {entry.displayName}
                                    </strong>
                                    {isCurrentUser && <span className="badge bg-primary fs-6 bottom-50 align-text-bottom">You</span>}
                                    
                                    {/* Subtext: Level and Top Field */}
                                    <div className="mt-1 d-flex gap-2 align-items-center">
                                        <span className="badge bg-dark border border-secondary text-info px-3 py-1 bg-opacity-50">
                                           Lv {entry.level}
                                        </span>
                                        <small className="text-secondary fw-semibold">
                                           <i className="bi bi-fire text-danger mx-1"></i>
                                           Top Field: <span className="text-white">{entry.topField}</span>
                                        </small>
                                    </div>
                                </div>
                                
                                {/* 3. POINTS BADGE */}
                                <div className="text-end ms-3">
                                    <span className="badge btn-premium border border-secondary border-opacity-50 rounded-pill fs-5 px-4 py-2 shadow-lg text-white d-flex align-items-center">
                                        <i className="bi bi-star-fill text-warning me-2"></i>
                                        {entry.xp.toLocaleString()} XP
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default Leaderboard;