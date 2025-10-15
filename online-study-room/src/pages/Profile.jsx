// src/pages/Profile.jsx - FINAL CORRECTED CODE
import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const API_URL = "http://localhost:3001";

const Profile = ({ user, setUser }) => {
    // Get initial values from local storage, falling back to empty/default
    const initialDisplayName = localStorage.getItem("displayName") || user?.username || "";
    const initialAvatar = localStorage.getItem("avatar") || "";
    
    const [displayName, setDisplayName] = useState(initialDisplayName);
    const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
    const [status, setStatus] = useState("");
    const [file, setFile] = useState(null);
    const token = localStorage.getItem("token");

    // Axios instance with auth header
    const axiosInstance = axios.create({
        baseURL: API_URL,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    
    // Function to update the display name and interests
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setStatus("Updating...");
        try {
            const res = await axiosInstance.post("/update-profile", {
                displayName: displayName,
                // Add logic for updating interests if you implement an input for them
            });

            if (res.data.success) {
                // Update local storage and global state
                localStorage.setItem("displayName", res.data.displayName);
                setUser((prevUser) => ({ ...prevUser, displayName: res.data.displayName }));
                setStatus("Profile updated successfully! ✅");
            } else {
                setStatus(res.data.error || "Update failed.");
            }
        } catch (err) {
            setStatus("Update failed. Check server connection.");
            console.error(err);
        }
        setTimeout(() => setStatus(""), 3000);
    };

    // Function to handle avatar upload
    const handleAvatarUpload = async () => {
        if (!file) return;

        setStatus("Uploading avatar...");
        const formData = new FormData();
        formData.append("file", file);
        
        // NOTE: We're temporarily using the /upload/:roomId endpoint, 
        // but passing a placeholder 'profile' as the roomId. 
        // The backend should ideally have a dedicated /upload-avatar route.
        try {
            // Your existing backend route handles 'upload', so we adapt:
            const res = await axiosInstance.post("/upload/profile", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data.success) {
                // Assuming the backend returns the public URL or file path
                const newAvatarPath = `${API_URL}/uploads/${res.data.file.filename}`;
                setAvatarUrl(newAvatarPath);
                localStorage.setItem("avatar", newAvatarPath);
                // Also update the backend's user model with the new avatar path
                await axiosInstance.post("/update-profile", { avatar: newAvatarPath }); 
                setStatus("Avatar updated! 🎉");
            } else {
                setStatus(res.data.error || "Avatar upload failed.");
            }
        } catch (err) {
            setStatus("Avatar upload failed. Server error.");
            console.error(err);
        }
        setFile(null); // Clear file input
        setTimeout(() => setStatus(""), 3000);
    };

    return (
        <div>
            <Navbar user={user} setUser={setUser} />
            <div className="container mt-5" style={{ maxWidth: '600px' }}>
                <h2 className="mb-4 text-center">👤 Your Profile</h2>
                
                {status && <div className={`alert ${status.includes('success') || status.includes('🎉') ? 'alert-success' : 'alert-danger'}`}>{status}</div>}

                {/* Avatar Section */}
                <div className="card p-4 mb-4 text-center shadow-sm">
                    <img 
                        src={avatarUrl || 'https://via.placeholder.com/100?text=A'} 
                        alt="User Avatar" 
                        className="rounded-circle mx-auto mb-3" 
                        style={{ width: '100px', height: '100px', objectFit: 'cover' }} 
                    />
                    <h5 className="mb-3">{displayName}</h5>

                    <input 
                        type="file" 
                        className="form-control mb-2" 
                        onChange={(e) => setFile(e.target.files[0])} 
                    />
                    <button 
                        className="btn btn-sm btn-outline-primary" 
                        onClick={handleAvatarUpload} 
                        disabled={!file}
                    >
                        {file ? `Upload ${file.name}` : 'Select Image'}
                    </button>
                </div>

                {/* Details Update Form */}
                <div className="card p-4 shadow-sm">
                    <h4 className="mb-3">Update Details</h4>
                    <form onSubmit={handleProfileUpdate}>
                        <div className="mb-3">
                            <label className="form-label">Username (Immutable)</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                value={user?.username || localStorage.getItem("username")} 
                                disabled 
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="displayName" className="form-label">Display Name</label>
                            <input
                                type="text"
                                className="form-control"
                                id="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                            />
                        </div>

                        <button className="btn btn-success w-100" type="submit">
                            Save Changes
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;