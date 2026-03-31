import React, { useState, useEffect } from "react";

const FileViewerModal = ({ fileUrl, mimeType, fileName, onClose }) => {
    const [textContent, setTextContent] = useState("");
    const [loadingText, setLoadingText] = useState(false);

    useEffect(() => {
        if (mimeType.includes('text')) {
            setLoadingText(true);
            fetch(fileUrl)
                .then(res => res.text())
                .then(text => {
                    setTextContent(text);
                    setLoadingText(false);
                })
                .catch(err => {
                    console.error("Failed to load text", err);
                    setTextContent("Failed to load text content.");
                    setLoadingText(false);
                });
        }
    }, [fileUrl, mimeType]);

    // Prevent scrolling of background when modal is open
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    const renderContent = () => {
        if (mimeType.includes("image")) {
            return <img src={fileUrl} alt={fileName} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />;
        }
        if (mimeType.includes("pdf")) {
            return <iframe src={fileUrl} title={fileName} style={{ width: "100%", height: "100%", border: "none" }} />;
        }
        if (mimeType.includes("text")) {
            if (loadingText) return <div className="text-white fast-spinner"><i className="bi bi-arrow-clockwise d-inline-block" style={{ animation: 'spin 1s linear infinite' }}></i> Loading text...</div>;
            return (
                <pre className="text-white p-4" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowY: 'auto', maxHeight: '100%', width: '100%', textAlign: 'left', backgroundColor: '#1e1e1e' }}>
                    <code>{textContent}</code>
                </pre>
            );
        }
        
        return (
            <div className="text-white text-center glass-panel p-5 rounded">
                <i className="bi bi-file-earmark-x d-block mb-3" style={{ fontSize: '4rem', opacity: 0.5 }}></i>
                <h3>Preview not available</h3>
                <p className="text-secondary">This file type cannot be previewed natively in the browser.</p>
                <a href={fileUrl} download={fileName} className="btn btn-premium mt-3 rounded-pill px-4" target="_blank" rel="noopener noreferrer">
                    <i className="bi bi-download me-2"></i> Download File
                </a>
            </div>
        );
    }

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(10, 10, 15, 0.95)",
            backdropFilter: "blur(10px)",
            zIndex: 10000,
            display: "flex",
            flexDirection: "column"
        }}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-50 glass-header shadow-sm">
                <div className="d-flex align-items-center text-white">
                    <i className="bi bi-file-earmark fs-4 me-2 text-gradient"></i>
                    <h5 className="mb-0 text-truncate fw-bold" style={{ maxWidth: "80vw" }}>{fileName}</h5>
                </div>
                <button onClick={onClose} className="btn btn-outline-light btn-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                    <i className="bi bi-x-lg"></i>
                </button>
            </div>
            
            {/* Content Area */}
            <div className="flex-grow-1 d-flex justify-content-center align-items-center p-3" style={{ overflow: "hidden", position: "relative" }}>
                {renderContent()}
            </div>
        </div>
    );
};

export default FileViewerModal;
