import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    console.log("Sending:", { username, password, displayName });

    try {
      const res = await axios.post("http://localhost:3001/signup", {
        username,
        password,
        displayName,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username);
      localStorage.setItem("displayName", res.data.displayName);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <h2 className="mb-4 text-center">Signup</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSignup}>
        <input className="form-control mb-2" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input className="form-control mb-2" placeholder="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        <input className="form-control mb-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="btn btn-success w-100">Signup</button>
      </form>
      <p className="mt-3 text-center">Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
};

export default Signup;
