import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    console.log("Sending login data:", { username, password });


    try {
      const res = await axios.post("http://localhost:3001/login", {
        username,
        password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username);
      localStorage.setItem("displayName", res.data.displayName);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <h2 className="mb-4 text-center">Login</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleLogin}>
        <input className="form-control mb-2" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input className="form-control mb-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="btn btn-primary w-100">Login</button>
      </form>
      <p className="mt-3 text-center">Don’t have an account? <Link to="/signup">Signup</Link></p>
    </div>
  );
};

export default Login;
