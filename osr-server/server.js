require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { nanoid } = require("nanoid");

const User = require("./models/User");
const Room = require("./models/Room");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

// ✅ Signup
app.post("/signup", async (req, res) => {
  try {
    console.log("🟢 Signup request body:", req.body);
    const { username, password, displayName } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed, displayName });
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(400).json({ error: "Signup failed" });
  }
});

// ✅ Login
app.post("/login", async (req, res) => {
  try {
    console.log("🟢 Login request body:", req.body);
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, displayName: user.displayName },
      process.env.JWT_SECRET
    );

    res.json({
      token,
      username: user.username,
      displayName: user.displayName,
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Create room
app.post("/create-room", authMiddleware, async (req, res) => {
  try {
    const { subject, roomName } = req.body;
    const roomId = nanoid(8);

    const room = new Room({
      roomId,
      subject,
      name: roomName,
      host: req.user.displayName,
      participants: [],
    });

    await room.save();
    res.json({ roomId });
  } catch (err) {
    console.error("❌ Create room error:", err);
    res.status(500).json({ error: "Failed to create room" });
  }
});

// ✅ Get rooms
app.get("/rooms", async (req, res) => {
  const rooms = await Room.find();
  res.json(
    rooms.map((r) => ({
      roomId: r.roomId,
      subject: r.subject,
      name: r.name,
      host: r.host,
      participantCount: r.participants?.length || 0,
    }))
  );
});

// ✅ Delete/Close room
app.delete("/rooms/:roomId", authMiddleware, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ error: "Room not found" });
    if (room.host !== req.user.displayName) {
      return res.status(403).json({ error: "Only the host can close the room" });
    }
    await Room.deleteOne({ roomId: req.params.roomId });
    io.to(req.params.roomId).emit("room-closed", { message: "Host closed the room" });
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Close room error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Start server + socket
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Socket.IO handlers
io.on("connection", (socket) => {
  console.log("🔗 User connected:", socket.id);

  socket.on("whiteboard-update", ({ roomId, data }) => {
    socket.to(roomId).emit("whiteboard-update", data);
  });

  // Join room
  socket.on("join-room", async ({ roomId, displayName }) => {
    socket.join(roomId);
    console.log(`➡️ ${displayName} joined room ${roomId}`);

    const room = await Room.findOne({ roomId });
    if (!room) return;

    // Add participant if not already
    if (!room.participants.includes(displayName)) {
      room.participants.push(displayName);
      await room.save();
    }

    // Send updated participants
    const list = room.participants.map((name) => ({
      id: name,
      name,
      isHost: name === room.host,
    }));
    io.to(roomId).emit("participants", list);
  });

  // Leave room
  socket.on("leave-room", async ({ roomId }) => {
    socket.leave(roomId);
    console.log(`⬅️ User left room ${roomId}`);
  });

  // Chat
  socket.on("chat-message", ({ roomId, sender, text }) => {
    console.log(`💬 ${sender} in ${roomId}: ${text}`);
    io.to(roomId).emit("chat-message", { sender, text });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
