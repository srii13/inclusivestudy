import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Login = ({ setUser }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3001/login", {
        username,
        password,
      });

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("username", res.data.username);
        localStorage.setItem("displayName", res.data.displayName);

        setUser({
          username: res.data.username,
          displayName: res.data.displayName,
        });

        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="d-flex vh-100 justify-content-center align-items-center" style={{ marginTop: '-60px' }}>
      <div className="glass-panel p-5" style={{ width: "400px" }}>
        <h3 className="mb-4 text-center fw-bold text-white">Login to <span className="text-gradient">StudyRoom</span></h3>
        {error && <div className="alert alert-danger bg-danger bg-opacity-25 text-danger border-danger border-opacity-50">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="form-label text-secondary fw-semibold">Username</label>
            <input
              type="text"
              className="form-control premium-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label text-secondary fw-semibold">Password</label>
            <input
              type="password"
              className="form-control premium-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn-premium w-100 mt-2" type="submit">
            Login <i className="bi bi-box-arrow-in-right ms-1"></i>
          </button>
        </form>
        <p className="mt-4 text-center text-secondary">
          Don’t have an account? <Link to="/signup" className="text-decoration-none fw-bold text-gradient">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
