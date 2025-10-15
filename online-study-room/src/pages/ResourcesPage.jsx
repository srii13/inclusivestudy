// src/pages/ResourcesPage.jsx - FINAL REPLACEMENT (Knowledge Repository)
import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const API_URL = "http://localhost:3001";

const ResourcesPage = ({ user, setUser }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [error, setError] = useState(null);
    const token = localStorage.getItem("token");

    // --- 1. Fetch Existing Files ---
    const fetchFiles = async () => {
        if (!token) {
            setLoading(false);
            setError("Please log in to manage your resources.");
            return;
        }
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/resources`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setFiles(response.data);
            setError(null);
        } catch (err) {
            setError("Failed to fetch resources. Ensure backend is running.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [token]);

    // --- 2. Handle File Upload ---
    const handleUpload = async (selectedFile) => {
        if (!selectedFile) return;

        setUploading(true);
        setUploadStatus(null);
        setError(null);

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const response = await axios.post(`${API_URL}/upload/resource`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.data.success) {
                setUploadStatus(`Uploaded: ${selectedFile.name}`);
                setFiles(prev => [...prev, response.data.file]); // Add new file to list
                fetchFiles(); // Re-fetch to ensure consistency
            }
        } catch (err) {
            setError("Upload failed. File may be too large or server rejected.");
            console.error("Upload error:", err);
        } finally {
            setUploading(false);
            setTimeout(() => setUploadStatus(null), 3000);
        }
    };

    // --- Drag and Drop Handlers ---
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleUpload(droppedFile);
        }
    };

    const dragPrevent = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const getFileIcon = (mimeType) => {
        if (mimeType.includes('pdf')) return 'bi-file-earmark-pdf-fill text-danger';
        if (mimeType.includes('image')) return 'bi-file-earmark-image-fill text-success';
        if (mimeType.includes('word')) return 'bi-file-earmark-word-fill text-primary';
        if (mimeType.includes('text')) return 'bi-file-earmark-text-fill text-secondary';
        return 'bi-file-earmark-fill text-dark';
    };
    
    if (!token) return <div className="text-center mt-5 alert alert-warning mx-auto" style={{maxWidth: '500px'}}>Please log in to access your personal Knowledge Repository.</div>;


    return (
        <div>
            <Navbar user={user} setUser={setUser} />
            <div className="container mt-5">
                <h1 className="mb-4 text-center">
                    <i className="bi bi-cloud-arrow-up me-3 text-primary"></i> Personal Knowledge Repository
                </h1>

                {/* File Upload Zone (Drag and Drop) */}
                <div 
                    className="card p-5 text-center mb-5 shadow-lg"
                    onDragOver={dragPrevent}
                    onDrop={handleDrop}
                    style={{ border: '3px dashed #ced4da', cursor: 'pointer' }}
                    onClick={() => document.getElementById('file-input').click()}
                >
                    {uploading ? (
                        <div className="text-primary"><i className="bi bi-arrow-clockwise spin me-2"></i> Uploading...</div>
                    ) : (
                        <>
                            <i className="bi bi-folder-fill fs-1 text-primary"></i>
                            <p className="lead mt-3">Drag & Drop File Here or Click to Browse</p>
                            <small className="text-muted">Supports PDFs, Docs, Images, etc. Max 5MB.</small>
                            <input 
                                type="file" 
                                id="file-input" 
                                hidden 
                                onChange={(e) => handleUpload(e.target.files[0])} 
                                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                            />
                        </>
                    )}
                    {uploadStatus && <div className="mt-3 alert alert-success p-2">{uploadStatus}</div>}
                    {error && <div className="mt-3 alert alert-danger p-2">{error}</div>}
                </div>
                
                {/* File List */}
                <h2 className="mb-4 border-bottom pb-2">Your Uploaded Documents ({files.length})</h2>
                
                {loading && <div className="text-center"><div className="spinner-border text-primary"></div></div>}

                <div className="list-group">
                    {files.length === 0 && !loading && (
                        <div className="alert alert-info text-center">No files found. Start uploading!</div>
                    )}
                    {files.map(file => (
                        <a 
                            key={file._id} 
                            href={`${API_URL}/uploads/${file.filename}`} // Direct link to the file on the server
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center mb-2 shadow-sm"
                        >
                            <div className="d-flex align-items-center">
                                <i className={`bi ${getFileIcon(file.mimeType)} fs-4 me-3`}></i>
                                <div>
                                    <h6 className="mb-0">{file.originalName}</h6>
                                    <small className="text-muted">{file.mimeType.split('/')[1]}</small>
                                </div>
                            </div>
                            <small className="text-end text-primary">
                                <i className="bi bi-box-arrow-up-right"></i> Open
                            </small>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ResourcesPage;