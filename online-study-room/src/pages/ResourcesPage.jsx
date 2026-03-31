// src/pages/ResourcesPage.jsx - FINAL REPLACEMENT (Knowledge Repository)
import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import FileViewerModal from "../components/FileViewerModal";

const API_URL = "http://localhost:3001";

const ResourcesPage = ({ user, setUser }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [error, setError] = useState(null);
    const [activeFile, setActiveFile] = useState(null);
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
            <div className="container mt-5" style={{ maxWidth: '900px' }}>
                <h1 className="mb-5 text-center text-white fw-bolder" style={{ fontSize: '2.5rem' }}>
                    <i className="bi bi-cloud-arrow-up me-3 text-gradient"></i>Personal <span className="text-gradient">Knowledge Repository</span>
                </h1>

                {/* File Upload Zone (Drag and Drop) */}
                <div 
                    className="glass-panel p-5 text-center mb-5 glass-panel-hover"
                    onDragOver={dragPrevent}
                    onDrop={handleDrop}
                    style={{ border: '2px dashed rgba(129, 140, 248, 0.4)', borderRadius: '24px', cursor: 'pointer', transition: 'all 0.3s ease' }}
                    onClick={() => document.getElementById('file-input').click()}
                >
                    {uploading ? (
                        <div className="text-white py-4">
                            <i className="bi bi-arrow-clockwise d-inline-block text-gradient display-4 mb-3" style={{ animation: 'spin 1s linear infinite' }}></i>
                            <h4 className="fw-bold">Uploading your file...</h4>
                        </div>
                    ) : (
                        <div className="py-4">
                            <i className="bi bi-cloud-arrow-up text-gradient mb-3 d-inline-block" style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 10px rgba(129,140,248,0.5))' }}></i>
                            <h3 className="fw-bolder text-white mb-2">Drag & Drop File Here</h3>
                            <p className="text-secondary fs-5 mb-4">or click anywhere in this box to browse</p>
                            <button className="btn btn-premium rounded-pill px-5 shadow-lg mb-3">Browse Files</button>
                            <div className="text-secondary small mt-2 d-block">Supports PDFs, Docs, Images, etc. <span className="text-white">Max 5MB.</span></div>
                            <input 
                                type="file" 
                                id="file-input" 
                                hidden 
                                onChange={(e) => handleUpload(e.target.files[0])} 
                                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                            />
                        </div>
                    )}
                    {uploadStatus && <div className="mt-4 alert bg-success bg-opacity-10 border border-success border-opacity-25 text-success rounded-3 fw-bold p-3 shadow-sm">{uploadStatus}</div>}
                    {error && <div className="mt-4 alert bg-danger bg-opacity-10 border border-danger border-opacity-25 text-danger rounded-3 fw-bold p-3 shadow-sm">{error}</div>}
                </div>
                
                {/* File List */}
                <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-secondary border-opacity-50 pb-3">
                    <h3 className="text-white m-0 fw-bold">Your Uploaded Documents</h3>
                    <span className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-50 rounded-pill px-3 py-2 fs-6">{files.length} Files</span>
                </div>
                
                {loading && <div className="text-center my-5"><div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div></div>}

                <div className="list-group list-group-flush">
                    {files.length === 0 && !loading && (
                        <div className="glass-panel p-5 text-center mt-3">
                            <i className="bi bi-folder-x text-secondary mb-3 d-inline-block" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
                            <h5 className="text-secondary fw-semibold">No documents found</h5>
                            <p className="text-muted small">Upload your first study resource above!</p>
                        </div>
                    )}
                    {files.map(file => (
                        <div 
                            key={file._id} 
                            onClick={(e) => {
                                e.preventDefault();
                                setActiveFile({
                                    url: `${API_URL}/uploads/${file.filename}`,
                                    mimeType: file.mimeType,
                                    name: file.originalName
                                });
                            }}
                            className="list-group-item bg-dark border-secondary bg-opacity-50 text-white d-flex justify-content-between align-items-center mb-2 rounded glass-panel-hover"
                            style={{ textDecoration: 'none', cursor: 'pointer' }}
                        >
                            <div className="d-flex align-items-center">
                                <i className={`bi ${getFileIcon(file.mimeType)} fs-4 me-3`}></i>
                                <div>
                                    <h6 className="mb-0 fw-bold">{file.originalName}</h6>
                                    <small className="text-secondary">{file.mimeType.split('/')[1]}</small>
                                </div>
                            </div>
                            <span className="btn btn-sm btn-outline-light rounded-pill px-3">
                                <i className="bi bi-eye me-1"></i> View
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* IN-APP NATIVE FILE FULLSCREEN VIEWER */}
            {activeFile && (
                <FileViewerModal 
                    fileUrl={activeFile.url} 
                    mimeType={activeFile.mimeType} 
                    fileName={activeFile.name} 
                    onClose={() => setActiveFile(null)} 
                />
            )}
        </div>
    );
};

export default ResourcesPage;