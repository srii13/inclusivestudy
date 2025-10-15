// src/App.jsx
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Room from "./pages/Room";
import Profile from "./pages/Profile";
import CreateRoom from "./pages/CreateRoom";
import LeaderboardPage from "./pages/LeaderboardPage";
import PomodoroPage from "./pages/PomodoroPage";
import TodoPage from "./pages/TodoPage";
import ResourcesPage from "./pages/ResourcesPage";

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard user={user} setUser={setUser} />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
        <Route path="/create-room" element={<CreateRoom user={user} />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/pomodoro" element={<PomodoroPage />} />
        <Route path="/todo" element={<TodoPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
      </Routes>
    </Router>
  );
}

export default App;
