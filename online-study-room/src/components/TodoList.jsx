// src/pages/TodoPage.jsx - FINAL PROFESSIONAL REPLACEMENT
import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const API_URL = "http://localhost:3001";

// Define possible categories/subjects for consistency
const CATEGORIES = ['Study', 'Project', 'Personal', 'Misc'];

const TodoPage = ({ user, setUser }) => {
    const [todos, setTodos] = useState([]);
    const [text, setText] = useState("");
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem("token");

    // Helper for API calls with Authorization header
    const axiosInstance = axios.create({
        baseURL: API_URL,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    // --- 1. Data Fetching ---
    const fetchTodos = async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await axiosInstance.get("/todos");
            setTodos(res.data);
            setError(null);
        } catch (err) {
            setError("Failed to fetch todos. Please log in.");
            console.error("Error fetching todos:", err);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchTodos();
    }, [token]);


    // --- 2. Add Todo (API Call) ---
    const addTodo = async () => {
        if (!text.trim()) return;

        try {
            const res = await axiosInstance.post("/todos", { text, category });
            setTodos((prev) => [...prev, res.data]);
            setText("");
        } catch (err) {
            setError("Failed to add task.");
            console.error("Error adding todo:", err);
        }
    };

    // --- 3. Toggle Todo Status (API Call) ---
    const toggleTodo = async (id) => {
        try {
            // Note: Your backend uses PUT /todos/:id and flips the 'done' state
            const res = await axiosInstance.put(`/todos/${id}`);
            const updatedTodo = res.data;
            
            setTodos((prev) => 
                prev.map((t) => (t._id === id ? updatedTodo : t))
            );
        } catch (err) {
            setError("Failed to update task status.");
            console.error("Error toggling todo:", err);
        }
    };

    // --- 4. Delete Todo (New Feature) ---
    const deleteTodo = async (id) => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        
        try {
            // NOTE: You need to implement a DELETE /todos/:id route in server.js for this to work fully.
            // For hackathon MVP, we'll implement frontend removal immediately.
            
            // Optimistic update (remove immediately)
            setTodos((prev) => prev.filter(t => t._id !== id));
            
            // Try actual delete API call (Backend implementation required)
            await axiosInstance.delete(`/todos/${id}`); 

        } catch (err) {
            setError("Failed to delete task.");
            console.error("Error deleting todo:", err);
        }
    };

    // Helper to get bootstrap color class based on category
    const getCategoryColor = (cat) => {
        switch (cat) {
            case 'Study': return 'bg-primary-subtle text-primary';
            case 'Project': return 'bg-info-subtle text-info';
            case 'Personal': return 'bg-success-subtle text-success';
            default: return 'bg-secondary-subtle text-secondary';
        }
    };

    if (loading) return <div className="text-center mt-5">Loading Tasks...</div>;
    if (!token) return <div className="text-center mt-5 alert alert-warning mx-auto" style={{maxWidth: '500px'}}>Please log in to view your Persistent To-Do List.</div>;


    return (
        <div>
            <Navbar user={user} setUser={setUser} />
            <div className="container mt-5" style={{ maxWidth: '800px' }}>
                <h1 className="mb-4 text-center">
                    <i className="bi bi-calendar-check me-2"></i> Your Personal Task List
                </h1>
                {error && <div className="alert alert-danger">{error}</div>}

                {/* Task Input Form */}
                <div className="card p-4 shadow-sm mb-5">
                    <h5 className="text-primary mb-3">Add New Task</h5>
                    <div className="d-flex flex-column gap-3">
                        <input 
                            type="text"
                            className="form-control form-control-lg" 
                            value={text} 
                            onChange={(e) => setText(e.target.value)} 
                            placeholder="What task do you need to accomplish?"
                            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                        />
                        <div className="d-flex align-items-center gap-3">
                            <select
                                className="form-select"
                                style={{ width: '150px' }}
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            
                            <button className="btn btn-primary flex-grow-1 btn-lg" onClick={addTodo}>
                                <i className="bi bi-plus-circle me-2"></i> Add Task
                            </button>
                        </div>
                    </div>
                </div>

                {/* To-Do List Display */}
                <h3 className="mb-3 border-bottom pb-2">Pending Tasks ({todos.filter(t => !t.done).length})</h3>
                
                <div className="list-group">
                    {todos.sort((a, b) => a.done - b.done).map((t) => ( // Sort incomplete first
                        <div 
                            key={t._id} 
                            className={`list-group-item d-flex justify-content-between align-items-center mb-2 p-3 ${t.done ? 'bg-light text-muted' : 'bg-white'}`}
                            style={{ borderLeft: t.done ? '5px solid #ccc' : `5px solid ${t.category === 'Study' ? '#0d6efd' : t.category === 'Project' ? '#0dcaf0' : '#28a745'}` }}
                        >
                            <div className="d-flex align-items-center flex-grow-1">
                                <input 
                                    type="checkbox" 
                                    className="form-check-input me-3 fs-5" 
                                    checked={t.done} 
                                    onChange={() => toggleTodo(t._id)} 
                                />
                                <div>
                                    <span className={`badge ${getCategoryColor(t.category)} me-2`}>
                                        {t.category}
                                    </span>
                                    <span className={t.done ? "text-decoration-line-through fw-normal" : "fw-medium"}>
                                        {t.text}
                                    </span>
                                </div>
                            </div>
                            
                            <button 
                                className="btn btn-sm btn-outline-danger ms-3"
                                onClick={() => deleteTodo(t._id)}
                            >
                                <i className="bi bi-trash"></i>
                            </button>
                        </div>
                    ))}
                    {!todos.length && <div className="p-4 text-center text-muted">You have no tasks!</div>}
                </div>
            </div>
        </div>
    );
};

export default TodoPage;