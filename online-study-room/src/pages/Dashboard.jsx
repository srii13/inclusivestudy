import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import TodoList from "../components/TodoList";  // ⬅️ add at the top

const Dashboard = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [quote, setQuote] = useState("");
  const [timer, setTimer] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [activeUsers, setActiveUsers] = useState(0);
  const [pomodoroCount, setPomodoroCount] = useState(
    parseInt(localStorage.getItem("pomodoroCount") || "0", 10)
  );
  const [showBadge, setShowBadge] = useState(pomodoroCount >= 3);
  const [announcements, setAnnouncements] = useState(["🚀 New Feature: Collaborative Whiteboard!"]);
  const [socket, setSocket] = useState(null);

  const motivationalQuotes = [
    "Stay focused and never give up!",
    "Small progress is still progress.",
    "Your only limit is your mind.",
    "Push yourself, because no one else is going to do it for you.",
    "Don’t watch the clock; do what it does. Keep going."
  ];

  useEffect(() => {
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  }, []);

  // initialize socket and listeners
  useEffect(() => {
    const s = io("http://localhost:3001");
    setSocket(s);

    s.on("active-users", (payload) => {
      setActiveUsers(payload.count || 0);
    });

    s.on("rooms-updated", (list) => {
      setRooms(list || []);
    });

    // request immediate rooms fetch from REST as fallback
    fetchRooms();

    return () => {
      s.disconnect();
    };
  }, []);

  // Pomodoro timer
  useEffect(() => {
    let interval;
    if (isRunning && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0) {
      setIsRunning(false);
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      localStorage.setItem("pomodoroCount", String(newCount));
      if (newCount >= 3) setShowBadge(true);
      alert("⏰ Time's up! Take a break.");
    }
    return () => clearInterval(interval);
  }, [isRunning, timer, pomodoroCount]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Fetch rooms from REST
  const fetchRooms = async (subject = "") => {
    try {
      const res = await fetch(`http://localhost:3001/rooms${subject ? `?subject=${subject}` : ""}`);
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      console.error("Failed to fetch rooms", err);
    }
  };

  const createRoom = async (subject, roomName) => {
    try {
      const res = await fetch("http://localhost:3001/create-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ subject, roomName })
      });
      const data = await res.json();
      if (res.ok) {
        navigate(`/room/${data.roomId}`);
      } else {
        alert(data.error || "Failed to create room");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUser(null);
    navigate("/login");
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark mb-4">
        <div className="container-fluid">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="navbar-brand">✨ Online Study Room</span>
            <span className="badge bg-info text-dark">{activeUsers} online</span>
            {showBadge && <span className="badge bg-warning text-dark ms-2">🏆 Focus Master</span>}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="dropdown">
              <button className="btn btn-secondary dropdown-toggle" type="button" id="profileMenu" data-bs-toggle="dropdown" aria-expanded="false">
                {user.username}
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="profileMenu">
                <li><span className="dropdown-item-text">{user.username}</span></li>
                <li><hr className="dropdown-divider"/></li>
                <li><button className="dropdown-item" onClick={() => alert("Profile / settings coming soon")}>Profile</button></li>
                <li><button className="dropdown-item" onClick={() => alert("Settings coming soon")}>Settings</button></li>
                <li><hr className="dropdown-divider"/></li>
                <li><button className="dropdown-item text-danger" onClick={handleLogout}>Logout</button></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <div className="container">
        {/* Announcements */}
        {announcements.length > 0 && (
          <div className="alert alert-primary d-flex justify-content-between align-items-center">
            <div>{announcements[0]}</div>
            <div>
              <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => setAnnouncements(announcements.slice(1))}>Dismiss</button>
              <button className="btn btn-sm btn-outline-dark" onClick={() => alert("Open announcements panel")}>More</button>
            </div>
          </div>
        )}

        <div className="row mb-3">
          {/* Create Room */}
          <div className="col-md-6 mb-3">
            <div className="card p-3 shadow">
              <h5>Create a Room</h5>
              <div className="d-flex gap-2 mb-2">
                <select className="form-select" id="subject">
                  <option value="Communication">Communication</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="General">General</option>
                </select>
                <input type="text" id="roomName" className="form-control" placeholder="Optional room name" />
                <button className="btn btn-primary" onClick={() => createRoom(document.getElementById("subject").value, document.getElementById("roomName").value)}>Create</button>
              </div>
              <small className="text-muted">Rooms are public by default and discoverable.</small>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="col-md-6 mb-3">
            <div className="card p-3 shadow">
              <h5>Search & Filter</h5>
              <div className="d-flex gap-2 mb-3">
                <select className="form-select" value={filter} onChange={(e) => { setFilter(e.target.value); fetchRooms(e.target.value); }}>
                  <option value="">All Subjects</option>
                  <option value="Communication">Communication</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Mathematics">Mathematics</option>
                </select>
                <input type="text" className="form-control" placeholder="Search by host..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <button className="btn btn-secondary" onClick={() => fetchRooms(filter)}>Refresh</button>
              </div>

              <div className="text-muted">Found {rooms.length} public rooms</div>
            </div>
          </div>
        </div>

        {/* Rooms Grid */}
        <h4 className="mb-3">Available Rooms</h4>
        <div className="row">
          {rooms.filter(r => r.host?.toLowerCase().includes(search.toLowerCase())).map(room => (
            <div className="col-md-4 mb-3" key={room.id}>
              <div className="card shadow h-100">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{room.subject}{room.name ? ` — ${room.name}` : ""}</h5>
                  <p className="card-text">Host: {room.host}</p>
                  <p className="card-text"><small className="text-muted">{room.participantCount || 0} participant(s)</small></p>
                  <div className="mt-auto d-flex gap-2">
                    <button className="btn btn-success" onClick={() => navigate(`/room/${room.id}`)}>Join</button>
                    <button className="btn btn-outline-secondary" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/room/${room.id}`)}>Copy Link</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {rooms.length === 0 && <div className="col-12"><p className="text-muted">No rooms available.</p></div>}
        </div>

        {/* Extras row */}
        <div className="row mt-4">
          <div className="col-md-6 mb-3">
  <TodoList />
</div>

          <div className="col-md-6 mb-3">
            <div className="card p-3 shadow">
              <h5>💡 Motivational Quote</h5>
              <p className="fst-italic">"{quote}"</p>
            </div>
          </div>

          <div className="col-md-6 mb-3">
            <div className="card p-3 shadow">
              <h5>⏳ Pomodoro Timer</h5>
              <h2 className="text-center">{formatTime(timer)}</h2>
              <div className="d-flex justify-content-center gap-2">
                <button className="btn btn-success" onClick={() => setIsRunning(true)} disabled={isRunning}>Start</button>
                <button className="btn btn-danger" onClick={() => { setIsRunning(false); setTimer(25 * 60); }}>Reset</button>
              </div>
              <div className="mt-2 text-muted">Pomodoros completed: {pomodoroCount}</div>
              {showBadge && <div className="mt-2"><span className="badge bg-warning text-dark">🏆 Focus Master (3+ Pomodoros)</span></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
