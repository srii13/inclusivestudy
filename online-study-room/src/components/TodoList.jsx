import React, { useEffect, useState } from "react";
import axios from "axios";

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");

  const token = localStorage.getItem("token");

  // ✅ Fetch todos for logged-in user
  useEffect(() => {
    axios
      .get("http://localhost:3001/todos", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setTodos(res.data))
      .catch((err) => console.error("Error fetching todos", err));
  }, [token]);

  // ✅ Add new todo
  const addTodo = () => {
    if (!newTodo.trim()) return;
    axios
      .post(
        "http://localhost:3001/todos",
        { text: newTodo },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        setTodos([...todos, res.data]);
        setNewTodo("");
      })
      .catch((err) => console.error("Error adding todo", err));
  };

  // ✅ Toggle todo
  const toggleTodo = (id, done) => {
    axios
      .put(
        `http://localhost:3001/todos/${id}`,
        { done: !done },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        setTodos(todos.map((t) => (t._id === id ? res.data : t)));
      });
  };

  // ✅ Delete todo
  const deleteTodo = (id) => {
    axios
      .delete(`http://localhost:3001/todos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setTodos(todos.filter((t) => t._id !== id));
      });
  };

  return (
    <div className="card shadow-sm mt-3">
      <div className="card-body">
        <h5 className="card-title">📌 My To-Do List</h5>
        <div className="d-flex mb-3">
          <input
            type="text"
            className="form-control"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new task..."
          />
          <button className="btn btn-primary ms-2" onClick={addTodo}>
            Add
          </button>
        </div>
        <ul className="list-group">
          {todos.map((todo) => (
            <li
              key={todo._id}
              className={`list-group-item d-flex justify-content-between align-items-center ${
                todo.done ? "list-group-item-success" : ""
              }`}
            >
              <span
                style={{
                  textDecoration: todo.done ? "line-through" : "none",
                  cursor: "pointer",
                }}
                onClick={() => toggleTodo(todo._id, todo.done)}
              >
                {todo.text}
              </span>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => deleteTodo(todo._id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TodoList;
