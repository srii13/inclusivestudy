import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Room from "./pages/Room";

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/signup" element={<Signup setUser={setUser} />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
        <Route path="/room/:roomId" element={user ? <Room /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
