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
        <div className="glass-panel border-0 p-3">
            <h5 className="text-center text-white fw-bold mb-3">
                <i className="bi bi-list-check me-2 text-gradient"></i> Shared To-Dos
            </h5>
            
            {/* Input Field */}
            <div className="d-flex mb-3 gap-2" onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}>
                <input
                    type="text"
                    className="form-control form-control-sm premium-input"
                    placeholder="Add collaborative task..."
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                />
                <button className="btn-premium btn-sm px-3 flex-shrink-0" onClick={handleAddTodo}>
                    Add
                </button>
            </div>

            {/* List */}
            <div className="list-group list-group-flush rounded-3 border border-secondary border-opacity-50" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {todos.map((todo) => (
                    <div 
                        key={todo.id} 
                        className="list-group-item d-flex justify-content-between align-items-center bg-dark bg-opacity-50 border-secondary border-opacity-50"
                        style={{ padding: '0.6rem 0.5rem' }}
                    >
                        <div className="d-flex align-items-center">
                            <input 
                                type="checkbox" 
                                className="form-check-input me-2 border-secondary border-opacity-50 shadow-sm cursor-pointer" 
                                checked={todo.done} 
                                onChange={() => handleToggle(todo.id)} 
                            />
                            <span className={todo.done ? "text-decoration-line-through text-secondary small" : "text-white small"}>
                                {todo.text}
                            </span>
                        </div>
                        <small className="badge bg-secondary bg-opacity-25 text-white">{todo.creator}</small>
                    </div>
                ))}
            </div>
            {!todos.length && <p className="text-center text-secondary small mt-3">No shared tasks yet.</p>}
        </div>
    );
};

export default RoomTodoList;