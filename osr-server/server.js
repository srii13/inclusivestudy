require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

// ✅ Models
const User = require("./models/User");
const Todo = require("./models/Todo");
const Room = require("./models/Room");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// 🔐 Middleware for JWT auth
const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }
};

//
// 🔹 AUTH ROUTES
//

// 👤 Signup
app.post("/signup", async (req, res) => {
  console.log("🟢 Signup request body:", req.body);
  try {
    const { username, password, displayName } = req.body;
    if (!username || !password || !displayName) {
      return res.status(400).json({ error: "All fields required" });
    }
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: "Username already taken" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, displayName });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token, username: user.username, displayName: user.displayName });
  } catch (err) {
    console.error("❌ Signup error:", err.message);
    res.status(500).json({ error: "Signup failed" });
  }
});

// 👤 Login
app.post("/login", async (req, res) => {
  console.log("🟢 Login request body:", req.body);
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Incorrect password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token, username: user.username, displayName: user.displayName });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ error: "Login failed" });
  }
});

//
// 🔹 TODO ROUTES
//

app.get("/todos", authMiddleware, async (req, res) => {
  const todos = await Todo.find({ userId: req.userId });
  res.json(todos);
});

app.post("/todos", authMiddleware, async (req, res) => {
  const todo = new Todo({ userId: req.userId, text: req.body.text });
  await todo.save();
  res.json(todo);
});

app.put("/todos/:id", authMiddleware, async (req, res) => {
  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { done: req.body.done },
    { new: true }
  );
  res.json(todo);
});

app.delete("/todos/:id", authMiddleware, async (req, res) => {
  await Todo.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.json({ success: true });
});

//
// 🔹 ROOM ROUTES
//

// Create room
app.post("/create-room", authMiddleware, async (req, res) => {
  try {
    const { subject, roomName } = req.body;
    const user = await User.findById(req.userId);
    const roomId = uuidv4();
    const room = new Room({
      subject,
      name: roomName,
      host: user.displayName || user.username,
      roomId,
    });
    await room.save();
    io.emit("rooms-updated", await Room.find());
    res.json({ roomId });
  } catch (err) {
    res.status(500).json({ error: "Failed to create room" });
  }
});

// Get all rooms
app.get("/rooms", async (req, res) => {
  const filter = req.query.subject ? { subject: req.query.subject } : {};
  const rooms = await Room.find(filter);
  res.json(rooms);
});

//
// 🔹 SOCKET.IO (participants + whiteboard)
//

const roomsMemory = {}; // in-memory participants list
const getActiveUsers = () => io.engine.clientsCount;

io.on("connection", (socket) => {
  console.log("🔗 User connected:", socket.id);

  io.emit("active-users", { count: getActiveUsers() });

  // Join room
  socket.on("join-room", ({ roomId, displayName, token }) => {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      socket.join(roomId);

      if (!roomsMemory[roomId]) roomsMemory[roomId] = [];
      roomsMemory[roomId].push({
        id: socket.id,
        name: displayName || "Guest",
        isHost: roomsMemory[roomId].length === 0,
      });

      io.to(roomId).emit("participants", roomsMemory[roomId]);
    } catch (err) {
      console.error("❌ Invalid token on join-room");
    }
  });

  // Leave room
  socket.on("leave-room", ({ roomId }) => {
    socket.leave(roomId);
    if (roomsMemory[roomId]) {
      roomsMemory[roomId] = roomsMemory[roomId].filter((p) => p.id !== socket.id);
      io.to(roomId).emit("participants", roomsMemory[roomId]);
    }
  });

  // Whiteboard sync
  socket.on("whiteboard-update", ({ roomId, data }) => {
    socket.to(roomId).emit("whiteboard-update", { roomId, data });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    io.emit("active-users", { count: getActiveUsers() });

    for (let roomId in roomsMemory) {
      roomsMemory[roomId] = roomsMemory[roomId].filter((p) => p.id !== socket.id);
      io.to(roomId).emit("participants", roomsMemory[roomId]);
    }
  });
});

//
// 🔹 START SERVER
//

server.listen(process.env.PORT || 3001, () =>
  console.log(`✅ Server running on http://localhost:${process.env.PORT || 3001}`)
);
