// src/pages/Signup.jsx - FINAL CORRECTED CODE
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";

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
        <div>
            {/* Navbar is optional on signup, but keeping it for consistency */}
            <Navbar user={null} setUser={() => {}} /> 
            
            <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
                <div className="card p-4 shadow" style={{ width: "400px" }}>
                    <h3 className="mb-3 text-center">Create Account</h3>
                    
                    {error && <div className="alert alert-danger">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}
                    
                    <form onSubmit={handleSignup}>
                        <div className="mb-3">
                            <label className="form-label">Username</label>
                            <input
                                type="text"
                                className="form-control"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        
                        <div className="mb-3">
                            <label className="form-label">Display Name (Optional)</label>
                            <input
                                type="text"
                                className="form-control"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your name for the rooms"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-control"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button className="btn btn-primary w-100" type="submit" disabled={!!success}>
                            Sign Up
                        </button>
                    </form>
                    <p className="mt-3 text-center text-muted">
                        Already have an account? <Link to="/login">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;