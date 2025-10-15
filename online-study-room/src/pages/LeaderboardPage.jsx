// src/pages/Leaderboard.jsx - FINAL REPLACEMENT WITH ALL USERS FETCH
import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import Navbar from "../components/Navbar";

const API_URL = "http://localhost:3001";
const MAX_LEADERS = 10;
const RANK_COLORS = {
    1: '#FFD700', // Gold
    2: '#C0C0C0', // Silver
    3: '#CD7F32', // Bronze
};

const Leaderboard = ({ user, setUser }) => {
    // State to hold user profiles (username, displayName)
    const [userProfiles, setUserProfiles] = useState([]);
    // State to hold current points (merged with profiles)
    const [leaderboard, setLeaderboard] = useState(() => {
        try {
            const saved = localStorage.getItem("leaderboard_data");
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token");

    // Helper to fetch all user data from the backend
    const fetchAllUsers = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const response = await axios.get(`${API_URL}/users/list`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUserProfiles(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching user list:", err);
            setLoading(false);
        }
    }, [token]);

    // Function to merge point data into the user list and sort
    const generateLeaderboard = useCallback((pointData, profiles) => {
        const mergedList = profiles.map(profile => ({
            ...profile,
            points: pointData[profile.displayName] || 0, // Get points or default to 0
        }));

        const sorted = mergedList
            .sort((a, b) => b.points - a.points) // Sort Descending by points
            .slice(0, MAX_LEADERS); // Limit to top 10

        setLeaderboard(sorted);
        localStorage.setItem("leaderboard_data", JSON.stringify(sorted));
    }, []);

    // 1. Fetch initial list of all users
    useEffect(() => {
        fetchAllUsers();
    }, [fetchAllUsers]);

    // 2. Set up Socket.IO listener for real-time points
    useEffect(() => {
        if (!userProfiles.length) return; // Wait until profiles are loaded

        const socket = io("http://localhost:3001");

        const handleUpdate = (pointData) => {
            // Re-merge the new point data with the permanent profile list
            generateLeaderboard(pointData, userProfiles);
        };

        socket.on("leaderboard-update", handleUpdate);
        
        // Cleanup
        return () => {
            socket.off("leaderboard-update", handleUpdate);
            socket.disconnect();
        };
    }, [userProfiles, generateLeaderboard]); // Depend on profiles list

    // Get the current user's name for highlighting
    const currentUserName = user?.displayName || localStorage.getItem("displayName");

    return (
        <div>
            <Navbar user={user} setUser={setUser} />
            <div className="container mt-5">
                <h1 className="mb-4 text-center display-5 fw-bold">
                    <i className="bi bi-trophy me-3 text-warning"></i> Study Hero Leaderboard
                </h1>
                <p className="text-center lead text-muted">
                    Displaying top users based on real-time activity points.
                </p>

                {loading && (
                    <div className="text-center p-5"><div className="spinner-border text-primary me-2" role="status"></div> Loading all heroes...</div>
                )}
                
                {!loading && leaderboard.length === 0 && (
                    <div className="alert alert-info text-center p-4 mx-auto" style={{ maxWidth: '700px' }}>
                        No users or points recorded yet! Ensure you are logged in and start a session.
                    </div>
                )}

                <ul className="list-group shadow-lg mt-4" style={{ maxWidth: '700px', margin: '0 auto' }}>
                    {leaderboard.map((entry, index) => {
                        const rank = index + 1;
                        const rankStyle = {
                            backgroundColor: RANK_COLORS[rank] || '#f8f9fa',
                            color: RANK_COLORS[rank] ? 'black' : '#333',
                            fontWeight: 'bold',
                            border: RANK_COLORS[rank] ? `2px solid ${RANK_COLORS[rank]}` : '1px solid #eee',
                            borderRadius: '6px'
                        };
                        const isCurrentUser = entry.displayName === currentUserName;
                        
                        return (
                            <li 
                                key={entry.username} // Use unique username as key
                                className={`list-group-item d-flex justify-content-between align-items-center p-3 mb-2 rounded ${isCurrentUser ? 'bg-primary-subtle border-primary border-3' : 'bg-white'}`}
                                style={isCurrentUser ? {border: '2px solid var(--bs-primary)'} : {}} 
                            >
                                {/* 1. RANK TIER */}
                                <span className="me-3 fs-5 p-2" style={{ width: '45px', textAlign: 'center', ...rankStyle }}>
                                    {rank}
                                </span>
                                
                                {/* 2. DISPLAY NAME */}
                                <strong className={`flex-grow-1 fs-6 ${isCurrentUser ? 'text-primary' : 'text-dark'}`}>
                                    {entry.displayName}
                                    {isCurrentUser && ' (You)'}
                                </strong>
                                
                                {/* 3. POINTS BADGE */}
                                <span className="badge bg-dark rounded-pill fs-6 p-2 shadow-sm">
                                    {entry.points} Pts
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default Leaderboard;