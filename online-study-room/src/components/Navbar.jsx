// src/components/Navbar.jsx - FINAL PROFESSIONAL DESIGN REPLACEMENT (Color Fixed)
import React from "react";
import { Link } from "react-router-dom";

const Navbar = ({ user, setUser }) => {
    
    const handleLogout = () => {
        // Clear session and redirect
        localStorage.clear();
        setUser(null);
        window.location.href = "/login"; 
    };
    
    // Check if the user is logged in
    const isLoggedIn = user?.displayName || localStorage.getItem("displayName");

    return (
        // Use a slightly softer dark background and add a subtle bottom border/shadow
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-lg border-bottom border-secondary">
            <div className="container-fluid mx-4">
                {/* 1. BRANDING: Clearer, more impactful logo */}
                <Link to="/dashboard" className="navbar-brand d-flex align-items-center fw-bold fs-5">
                    <i className="bi bi-mortarboard-fill me-2 fs-3 text-warning"></i> 
                    <span className="text-white">Online</span><span className="text-warning">StudyRoom</span>
                </Link>

                <div className="d-flex align-items-center">
                    
                    {/* 2. MAIN NAVIGATION LINKS: ALL SET TO STANDARD OUTLINE-LIGHT */}
                    <div className="d-none d-lg-flex me-3"> 
                        <Link to="/dashboard" className="btn btn-sm btn-outline-light border-0 me-1"><i className="bi bi-house-door me-1"></i> Home</Link>
                        <Link to="/create-room" className="btn btn-sm btn-outline-light border-0 me-1"><i className="bi bi-collection me-1"></i> Rooms</Link>
                        <Link to="/todo" className="btn btn-sm btn-outline-light border-0 me-1"><i className="bi bi-list-task me-1"></i> To-Do</Link>
                        <Link to="/pomodoro" className="btn btn-sm btn-outline-light border-0 me-1"><i className="bi bi-clock me-1"></i> Focus</Link>
                        
                        {/* FIX APPLIED: Changed to btn-outline-light */}
                        <Link to="/leaderboard" className="btn btn-sm btn-outline-light border-0 me-1"><i className="bi bi-trophy me-1"></i> Leaderboard</Link>
                        
                        {/* FIX APPLIED: Changed to btn-outline-light */}
                        <Link to="/resources" className="btn btn-sm btn-outline-light border-0"><i className="bi bi-box me-1"></i> Resources</Link>
                    </div>

                    {/* 3. PROFILE DROPDOWN: Prominent and well-defined */}
                    <div className="dropdown d-inline-block">
                        <button
                            className={`btn btn-sm ${isLoggedIn ? 'btn-warning text-dark' : 'btn-secondary'} dropdown-toggle d-flex align-items-center shadow-sm`}
                            type="button"
                            id="profileMenu"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            <i className="bi bi-person-circle me-2 fs-5"></i>
                            <span className="d-none d-md-inline">{isLoggedIn || "Guest"}</span>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow-lg" aria-labelledby="profileMenu">
                            {isLoggedIn ? (
                                <>
                                    <li><span className="dropdown-item-text text-muted small border-bottom mb-2 pb-2">Logged in as: {isLoggedIn}</span></li>
                                    <li><Link className="dropdown-item" to="/profile"><i className="bi bi-gear me-2"></i> Profile Settings</Link></li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li>
                                        <button className="dropdown-item text-danger" onClick={handleLogout}>
                                            <i className="bi bi-box-arrow-right me-2"></i> Logout
                                        </button>
                                    </li>
                                </>
                            ) : (
                                <li><Link className="dropdown-item text-success fw-bold" to="/login"><i className="bi bi-box-arrow-in-right me-2"></i> Login / Sign Up</Link></li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;