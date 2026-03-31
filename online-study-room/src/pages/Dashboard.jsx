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
        <div className="text-center mb-5 p-5 glass-panel border-0">
            <h1 className="display-4 mb-3 fw-bolder text-white">
                Welcome, <span className="text-gradient">{user?.displayName || "Study Hero"}</span>! 
            </h1>
            <p className="lead text-secondary mb-4"> 
                Find your focus. Join a session, or start a new collaborative room.
            </p>

            {/* MOTIVATIONAL QUOTE BOX */}
            <div 
                className={`mx-auto p-4 text-center glass-panel border-0 shadow-none quote-box ${isFading ? 'fade-out' : 'fade-in'}`}
                style={{ maxWidth: '700px', minHeight: '100px', transition: 'opacity 0.5s ease-in-out', background: 'rgba(0,0,0,0.2)' }}
            >
                <p className="mb-2 fs-5 fw-medium text-white fst-italic" style={{ letterSpacing: '0.3px' }}>
                    "{currentQuote.text}"
                </p>
                <footer className="mt-2 text-secondary fw-semibold">
                    — {currentQuote.author}
                </footer>
            </div>
            {/* END QUOTE BOX */}

        </div>

        <div className="d-flex align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-25">
            <i className="bi bi-broadcast fs-3 me-3 text-gradient"></i>
            <h2 className="mb-0 text-white fw-bold">Active Study Sessions</h2>
        </div>
        
        {loading && <div className="text-center p-5"><i className="bi bi-arrow-clockwise spin me-2"></i> Loading rooms...</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        
        <div className="row g-4">
          {rooms.map((room) => (
            <div key={room.roomId} className="col-md-6 col-lg-4">
              <div 
                className="glass-panel glass-panel-hover h-100 d-flex flex-column text-start" 
                style={{ cursor: 'pointer', padding: '1.5rem' }}
                onClick={() => handleJoin(room.roomId)}
              >
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="room-badge">
                        {room.subject}
                    </span>
                    <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50 rounded-pill px-3 py-1">
                        <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.4rem', verticalAlign: 'middle' }}></i> LIVE
                    </span>
                  </div>

                  <h4 className="text-white mb-2 fw-bold">{room.name}</h4>
                  
                  <p className="text-secondary small flex-grow-1 mb-4">
                    <i className="bi bi-person-fill me-2"></i>Host: <span className="text-white">{room.host}</span>
                  </p>
                  
                  <div className="d-flex justify-content-between align-items-center pt-3 border-top border-secondary border-opacity-25">
                    <span className="text-white fw-semibold">
                        <i className="bi bi-people-fill me-2 text-gradient"></i>
                        {room.participantCount} Active
                    </span>
                    <button 
                      className="btn-premium py-1 px-3"
                      onClick={(e) => { e.stopPropagation(); handleJoin(room.roomId); }}
                    >
                      Join <i className="bi bi-arrow-right ms-1"></i>
                    </button>
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