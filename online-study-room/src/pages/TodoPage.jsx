// src/pages/TodoPage.jsx - FINAL CORRECTED CODE (API INTEGRATED)
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";

const API_URL = "http://localhost:3001";

const TodoPage = ({ user, setUser }) => {
    const [todos, setTodos] = useState([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token");

    // Helper for API calls with Authorization header
    const axiosInstance = axios.create({
        baseURL: API_URL,
        headers: { Authorization: `Bearer ${token}` },
    });

    // 1. Fetch Todos on Mount
    useEffect(() => {
        if (!token) {
            setLoading(false);
            return; 
        }

        const fetchTodos = async () => {
            try {
                const res = await axiosInstance.get("/todos");
                setTodos(res.data);
            } catch (err) {
                console.error("Error fetching todos:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTodos();
    }, [token]);

    // 2. Add Todo
    const addTodo = async () => {
        if (!text.trim()) return;

        try {
            const res = await axiosInstance.post("/todos", { text });
            setTodos((prev) => [...prev, res.data]); // Add the new todo from server
            setText("");
        } catch (err) {
            console.error("Error adding todo:", err);
        }
    };

    // 3. Toggle Todo status
    const toggle = async (id) => {
        try {
            const res = await axiosInstance.put(`/todos/${id}`);
            const updatedTodo = res.data;
            
            setTodos((prev) => 
                prev.map((t) => (t._id === id ? updatedTodo : t)) // Update local state
            );
        } catch (err) {
            console.error("Error toggling todo:", err);
        }
    };

    if (loading) return <div className="text-center mt-5">Loading Todos...</div>;
    if (!token) return <div className="text-center mt-5">Please log in to view your To-Do List.</div>;


    return (
        <div>
            <Navbar user={user} setUser={setUser} />
            <div className="container mt-5" style={{ maxWidth: '700px' }}>
                <h2 className="mb-4 text-white fw-bolder"><span className="text-gradient">📝 Personal To-Do</span> List</h2>
                
                <div className="d-flex mb-4 gap-2" onKeyDown={(e) => e.key === 'Enter' && addTodo()}>
                    <input 
                        className="form-control premium-input" 
                        value={text} 
                        onChange={(e) => setText(e.target.value)} 
                        placeholder="What do you need to study?"
                        style={{ padding: '12px 20px', borderRadius: '12px' }}
                    />
                    <button className="btn-premium flex-shrink-0" onClick={addTodo}>Add Task</button>
                </div>

                <ul className="list-group">
                    {todos.map((t) => (
                        <li key={t._id} className="list-group-item glass-panel mb-2 border-0 d-flex justify-content-between align-items-center" style={{ padding: '15px 20px' }}>
                            <div className="d-flex align-items-center w-100">
                                <input 
                                    type="checkbox" 
                                    className="form-check-input me-3 border-secondary border-opacity-50 shadow-sm flex-shrink-0" 
                                    style={{ width: '1.4rem', height: '1.4rem', cursor: 'pointer' }}
                                    checked={t.done} 
                                    onChange={() => toggle(t._id)} 
                                />
                                <span className={`flex-grow-1 fs-5 ${t.done ? "text-decoration-line-through text-secondary" : "text-white"}`}>
                                    {t.text}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default TodoPage;