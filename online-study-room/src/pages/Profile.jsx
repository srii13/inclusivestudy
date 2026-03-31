// src/pages/Profile.jsx - IMPROVED WITH BETTER ERROR HANDLING
import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { handleError } from "../utils/errorHandler";

const API_URL = "http://localhost:3001";

const Profile = ({ user, setUser }) => {
    // Get initial values from local storage, falling back to empty/default
    const initialDisplayName = localStorage.getItem("displayName") || user?.username || "";
    const initialAvatar = localStorage.getItem("avatar") || "";
    
    const [displayName, setDisplayName] = useState(initialDisplayName);
    const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
    const [status, setStatus] = useState("");
    const [statusType, setStatusType] = useState(""); // "success", "error", "info"
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const token = localStorage.getItem("token");

    // Axios instance with auth header
    const axiosInstance = axios.create({
        baseURL: API_URL,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    
    // Function to update the display name
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus("");
        
        try {
            if (!displayName.trim()) {
                throw new Error("Display name cannot be empty");
            }
            
            const res = await axiosInstance.post("/update-profile", {
                displayName: displayName.trim(),
                avatar: avatarUrl
            });

            if (res.data.success) {
                // Update local storage and global state
                localStorage.setItem("displayName", res.data.displayName);
                localStorage.setItem("avatar", res.data.avatar || avatarUrl);
                setUser((prevUser) => ({ ...prevUser, displayName: res.data.displayName, avatar: res.data.avatar || avatarUrl }));
                setStatusType("success");
                setStatus("Profile updated successfully! ✅");
            } else {
                throw new Error(res.data.error || "Update failed");
            }
        } catch (err) {
            const errorMsg = handleError(err);
            setStatusType("error");
            setStatus(errorMsg);
            console.error("Profile update error:", err);
        } finally {
            setIsLoading(false);
            setTimeout(() => setStatus(""), 4000);
        }
    };

    // Function to handle avatar upload
    const handleAvatarUpload = async () => {
        if (!file) return;

        setIsLoading(true);
        setStatus("");
        const formData = new FormData();
        formData.append("file", file);
        
        try {
            // Validate file size
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                throw new Error("Avatar file must be less than 5MB");
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error("File must be an image (JPG, PNG, GIF, or WebP)");
            }

            setStatusType("info");
            setStatus("Uploading avatar...");

            const res = await axiosInstance.post("/upload-avatar", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data.success) {
                const newAvatarUrl = `${API_URL}${res.data.avatar}`;
                setAvatarUrl(newAvatarUrl);
                localStorage.setItem("avatar", newAvatarUrl);
                setStatusType("success");
                setStatus("Avatar updated! 🎉");
            } else {
                throw new Error(res.data.error || "Avatar upload failed");
            }
        } catch (err) {
            const errorMsg = handleError(err);
            setStatusType("error");
            setStatus(errorMsg);
            console.error("Avatar upload error:", err);
        } finally {
            setFile(null);
            setIsLoading(false);
            setTimeout(() => setStatus(""), 4000);
        }
    };

    const presetAvatars = [
        "https://api.dicebear.com/9.x/micah/svg?seed=Jasper&backgroundColor=b6e3f4",
        "https://api.dicebear.com/9.x/micah/svg?seed=Felix&backgroundColor=c0aede",
        "https://api.dicebear.com/9.x/micah/svg?seed=Aneka&backgroundColor=ffdfbf",
        "https://api.dicebear.com/9.x/micah/svg?seed=Leo&backgroundColor=d1d4f9",
        "https://api.dicebear.com/9.x/micah/svg?seed=Ryan&backgroundColor=ffd5dc"
    ];

    return (
        <div>
            <Navbar user={user} setUser={setUser} />
            <div className="container mt-5 mb-5" style={{ maxWidth: '650px' }}>
                <div className="d-flex align-items-center justify-content-center mb-4">
                    <i className="bi bi-person-badge fs-2 me-3 text-gradient"></i>
                    <h2 className="mb-0 text-white fw-bolder">Your Profile</h2>
                </div>
                
                {status && (
                    <div className={`alert alert-${statusType === 'success' ? 'success' : statusType === 'error' ? 'danger' : 'info'} bg-opacity-25 border-opacity-50 text-white alert-dismissible fade show`} role="alert">
                        {status}
                        <button type="button" className="btn-close btn-close-white" onClick={() => setStatus("")}></button>
                    </div>
                )}

                {/* Avatar Section */}
                <div className="glass-panel p-5 mb-4 text-center">
                    <div className="position-relative d-inline-block mb-4">
                        <img 
                            src={avatarUrl || 'https://via.placeholder.com/120?text=A'} 
                            alt="User Avatar" 
                            className="rounded-circle shadow-lg border border-3 border-secondary border-opacity-50" 
                            style={{ width: '120px', height: '120px', objectFit: 'cover' }} 
                        />
                    </div>
                    <h4 className="mb-4 text-white fw-bold"><span className="text-secondary fw-normal fs-5 me-2">Welcome back,</span>{displayName}</h4>

                    <div className="mt-2 text-center">
                        <p className="text-secondary small fw-bold mb-3">CHOOSE AN AVATAR</p>
                        <div className="d-flex justify-content-center gap-3 flex-wrap">
                            {presetAvatars.map((url, idx) => (
                                <img
                                    key={idx}
                                    src={url}
                                    alt="Preset Avatar"
                                    className={`rounded-circle cursor-pointer transition-all border ${avatarUrl === url ? 'border-primary border-3 shadow-lg' : 'border-secondary border-opacity-50 glass-panel-hover'}`}
                                    style={{ width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer', transform: avatarUrl === url ? 'scale(1.1)' : 'scale(1)' }}
                                    onClick={() => setAvatarUrl(url)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Details Update Form */}
                <div className="glass-panel p-5">
                    <h5 className="mb-4 text-white border-bottom border-secondary border-opacity-50 pb-2">Account Details</h5>
                    <form onSubmit={handleProfileUpdate}>
                        <div className="mb-4">
                            <label className="form-label text-secondary fw-semibold">Username (Immutable)</label>
                            <input 
                                type="text" 
                                className="form-control premium-input opacity-75" 
                                value={user?.username || localStorage.getItem("username")} 
                                disabled 
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="displayName" className="form-label text-secondary fw-semibold">Display Name</label>
                            <input
                                type="text"
                                className="form-control premium-input"
                                id="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                            />
                        </div>

                        <button className="btn-premium w-100 mt-3" type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...</>
                            ) : (
                                <>Save Changes <i className="bi bi-check-circle ms-1"></i></>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;