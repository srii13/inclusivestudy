// src/components/TodoList.jsx
import React, { useState, useEffect } from "react";

const TodoList = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const storageKey = `todos-${user?.username || "guest"}`;

  const [todos, setTodos] = useState(
    JSON.parse(localStorage.getItem(storageKey) || "[]")
  );
  const [newTodo, setNewTodo] = useState("");

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(todos));
  }, [todos, storageKey]);

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const todo = { id: Date.now(), text: newTodo, done: false };
    setTodos([...todos, todo]);
    setNewTodo("");
  };

  const toggleTodo = (id) => {
    setTodos(
      todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter((t) => t.id !== id));
  };

  return (
    <div className="card p-3 shadow">
      <h5>📝 My To-Do List</h5>
      <div className="d-flex mb-2">
        <input
          type="text"
          className="form-control"
          placeholder="Add a task..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
        />
        <button className="btn btn-primary ms-2" onClick={addTodo}>
          Add
        </button>
      </div>
      <ul className="list-group">
        {todos.map((t) => (
          <li
            key={t.id}
            className={`list-group-item d-flex justify-content-between align-items-center ${
              t.done ? "list-group-item-success" : ""
            }`}
          >
            <span
              onClick={() => toggleTodo(t.id)}
              style={{
                textDecoration: t.done ? "line-through" : "none",
                cursor: "pointer",
              }}
            >
              {t.text}
            </span>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => deleteTodo(t.id)}
            >
              ✖
            </button>
          </li>
        ))}
        {todos.length === 0 && (
          <li className="list-group-item text-muted">No tasks yet.</li>
        )}
      </ul>
    </div>
  );
};

export default TodoList;
