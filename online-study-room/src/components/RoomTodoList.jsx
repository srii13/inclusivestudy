// src/components/RoomTodoList.jsx - FINAL STABLE COMPONENT
import React, { useState, useEffect } from "react";

const RoomTodoList = ({ socket, roomId, displayName }) => {
    const [todos, setTodos] = useState([]);
    const [newTodoText, setNewTodoText] = useState("");

    // --- Socket Listeners ---
    useEffect(() => {
        if (!socket) return;
        
        // Listener for receiving the updated list from the server
        const handleUpdate = (updatedList) => {
            setTodos(updatedList);
        };

        socket.on("room-todos-update", handleUpdate);
        
        // Cleanup function
        return () => {
            socket.off("room-todos-update", handleUpdate);
        };
    }, [socket]);

    // --- Handlers ---
    const handleAddTodo = () => {
        if (newTodoText.trim() && socket) {
            // Emitting the event to the server for processing
            socket.emit("add-room-todo", { 
                roomId, 
                text: newTodoText,
                creator: displayName 
            });
            setNewTodoText("");
        }
    };

    const handleToggle = (todoId) => {
        if (socket) {
            // Emitting the toggle event to the server
            socket.emit("toggle-room-todo", { roomId, todoId });
        }
    };

    return (
        <div className="card p-3 shadow-sm" style={{ border: 'none' }}>
            <h5 className="text-center mb-3">
                <i className="bi bi-list-check me-2"></i> Shared To-Dos
            </h5>
            
            {/* Input Field */}
            <div className="d-flex mb-3" onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}>
                <input
                    type="text"
                    className="form-control me-2 form-control-sm"
                    placeholder="Add collaborative task..."
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                />
                <button className="btn btn-primary btn-sm" onClick={handleAddTodo}
                    style={{ backgroundColor: '#4903fc', borderColor: '#4903fc' }}>
                    Add
                </button>
            </div>

            {/* List */}
            <div className="list-group list-group-flush" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {todos.map((todo) => (
                    <div 
                        key={todo.id} 
                        className="list-group-item d-flex justify-content-between align-items-center"
                        style={{ padding: '0.5rem 0.25rem' }}
                    >
                        <div className="d-flex align-items-center">
                            <input 
                                type="checkbox" 
                                className="form-check-input me-2" 
                                checked={todo.done} 
                                onChange={() => handleToggle(todo.id)} 
                            />
                            <span className={todo.done ? "text-decoration-line-through text-muted small" : "text-dark small"}>
                                {todo.text}
                            </span>
                        </div>
                        <small className="badge bg-secondary-subtle text-secondary">{todo.creator}</small>
                    </div>
                ))}
            </div>
            {!todos.length && <p className="text-center text-muted small mt-2">No shared tasks yet.</p>}
        </div>
    );
};

export default RoomTodoList;