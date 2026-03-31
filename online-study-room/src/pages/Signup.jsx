// src/pages/Signup.jsx - FINAL CORRECTED CODE
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
const API_URL = "http://localhost:3001";

const Signup = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        try {
            const res = await axios.post(`${API_URL}/signup`, {
                username,
                password,
                displayName: displayName || username, // Use username if display name is empty
            });

            if (res.data.success) {
                setSuccess("Signup successful! Redirecting to login...");
                // Automatically redirect to login after a delay
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            }
        } catch (err) {
            // Error handling for existing user or other backend issues
            setError(err.response?.data?.error || "Signup failed. Please try a different username.");
            console.error("Signup error:", err);
        }
    };

    return (
        <div className="d-flex min-vh-100 justify-content-center align-items-center py-4">
            <div className="glass-panel p-5" style={{ width: "450px" }}>
                    <h3 className="mb-4 text-center fw-bold text-white">Join <span className="text-gradient">StudyRoom</span></h3>
                    
                    {error && <div className="alert alert-danger bg-danger bg-opacity-25 text-danger border-danger border-opacity-50">{error}</div>}
                    {success && <div className="alert alert-success bg-success bg-opacity-25 text-success border-success border-opacity-50">{success}</div>}
                    
                    <form onSubmit={handleSignup}>
                        <div className="mb-4">
                            <label className="form-label text-secondary fw-semibold">Username</label>
                            <input
                                type="text"
                                className="form-control premium-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        
                        <div className="mb-4">
                            <label className="form-label text-secondary fw-semibold">Display Name (Optional)</label>
                            <input
                                type="text"
                                className="form-control premium-input"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your name for the rooms"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="form-label text-secondary fw-semibold">Password</label>
                            <input
                                type="password"
                                className="form-control premium-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button className="btn-premium w-100 mt-2" type="submit" disabled={!!success}>
                            Create Account <i className="bi bi-person-plus ms-1"></i>
                        </button>
                    </form>
                    <p className="mt-4 text-center text-secondary">
                        Already have an account? <Link to="/login" className="text-decoration-none fw-bold text-gradient">Login</Link>
                    </p>
            </div>
        </div>
    );
};

export default Signup;