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
            <div className="container mt-5">
                <h2>📝 Personal To-Do List</h2>
                
                <div className="d-flex mb-4" onKeyDown={(e) => e.key === 'Enter' && addTodo()}>
                    <input 
                        className="form-control me-2" 
                        value={text} 
                        onChange={(e) => setText(e.target.value)} 
                        placeholder="What do you need to study?"
                    />
                    <button className="btn btn-primary" onClick={addTodo}>Add</button>
                </div>

                <ul className="list-group shadow-sm">
                    {todos.map((t) => (
                        <li key={t._id} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <input 
                                    type="checkbox" 
                                    className="form-check-input me-3" 
                                    checked={t.done} 
                                    onChange={() => toggle(t._id)} 
                                />
                                <span className={t.done ? "text-decoration-line-through text-muted" : ""}>
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