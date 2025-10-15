// src/pages/Dashboard.jsx - FINAL REPLACEMENT WITH MOTIVATIONAL QUOTE BOX
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const API_URL = "http://localhost:3001";

// Array of motivational quotes
const motivationalQuotes = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
    { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
];

const Dashboard = ({ user, setUser }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quoteIndex, setQuoteIndex] = useState(0); // State for current quote index
  const [isFading, setIsFading] = useState(false); // State for animation transition
  const navigate = useNavigate();

  // 1. QUOTE CYCLING LOGIC
  useEffect(() => {
      // Start fade out just before changing the quote (e.g., 9.5s)
      const fadeOutTimer = setTimeout(() => {
          setIsFading(true);
      }, 9500);

      // Change quote index every 10 seconds (10000ms)
      const quoteTimer = setInterval(() => {
          setQuoteIndex(prevIndex => (prevIndex + 1) % motivationalQuotes.length);
          setIsFading(false); // New quote appears solid immediately
      }, 10000);

      // Cleanup timers
      return () => {
          clearTimeout(fadeOutTimer);
          clearInterval(quoteTimer);
      };
  }, [quoteIndex]); // Dependency on quoteIndex to restart fade out timer correctly

  // 2. ROOM FETCHING LOGIC (Unchanged)
  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      try {
        const response = await axios.get(`${API_URL}/rooms`, {
          headers: { Authorization: `Bearer ${token}` }, 
        });
        setRooms(response.data);
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
        setError("Failed to load study rooms. Check server status.");
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const handleJoin = (roomId) => {
    navigate(`/room/${roomId}`);
  };

  const currentQuote = motivationalQuotes[quoteIndex];

  return (
    <div>
      <Navbar user={user} setUser={setUser} />
      <div className="container mt-5">
        
        {/* POLISHED WELCOME BANNER */}
        <div className="text-center mb-5 p-4 bg-light rounded-4 shadow-lg border-bottom border-warning border-3">
            <h1 className="display-5 mb-3 fw-bold text-dark">
                Welcome, {user?.displayName || "Study Hero"}! 
            </h1>
            <p className="lead text-muted mb-4"> 
                Find your focus. Join a session, or start a new collaborative room.
            </p>

            {/* 3. MOTIVATIONAL QUOTE BOX */}
            <div 
                className={`mx-auto p-3 text-center border-start border-primary border-4 bg-white shadow-sm quote-box ${isFading ? 'fade-out' : 'fade-in'}`}
                style={{ maxWidth: '600px', minHeight: '80px', transition: 'opacity 0.5s ease-in-out' }}
            >
                <p className="mb-1 fw-medium text-dark fst-italic">
                    "{currentQuote.text}"
                </p>
                <footer className="blockquote-footer mt-1">
                    {currentQuote.author}
                </footer>
            </div>
            {/* END QUOTE BOX */}

        </div>

        <h2 className="mb-4 border-bottom pb-2">Active Study Sessions</h2>
        
        {loading && <div className="text-center p-5"><i className="bi bi-arrow-clockwise spin me-2"></i> Loading rooms...</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        
        {/* ROOM LISTING GRID (unchanged) */}
        <div className="row">
          {rooms.map((room) => (
            <div key={room.roomId} className="col-md-6 col-lg-4 mb-4">
              <div 
                className="card shadow-hover h-100" 
                style={{ cursor: 'pointer', border: '1px solid #dee2e6', transition: 'box-shadow 0.2s' }}
                onClick={() => handleJoin(room.roomId)}
              >
                <div className="card-body d-flex flex-column">
                  
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className={`badge bg-primary-subtle text-primary fw-bold`}>
                        {room.subject}
                    </span>
                    <span className="text-success small fw-bold">LIVE</span>
                  </div>

                  <h5 className="card-title mb-1">{room.name}</h5>
                  
                  <p className="card-text text-muted small flex-grow-1 mb-3">
                    <i className="bi bi-person-fill me-1"></i> Host: {room.host}
                  </p>
                  
                  <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                    <span className="text-dark fw-bold">
                        <i className="bi bi-people-fill me-1"></i> {room.participantCount} Active
                    </span>
                    <button 
                      className="btn btn-sm btn-success"
                      onClick={(e) => { e.stopPropagation(); handleJoin(room.roomId); }}
                    >
                      <i className="bi bi-box-arrow-in-right"></i> Join
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;