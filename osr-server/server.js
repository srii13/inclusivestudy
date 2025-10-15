// osr-server/server.js — FINAL COMPLETE AND STABLE BACKEND
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { nanoid } = require("nanoid");
const fs = require("fs");

const app = express();
app.use(cors()); 
app.use(express.json());

const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// ---- MongoDB connection ----
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ---- Schemas ----
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  displayName: { type: String },
  password: { type: String, required: true },
  avatar: { type: String, default: "" },
  interests: [String],
});

const roomSchema = new mongoose.Schema({
  roomId: { type: String, unique: true },
  subject: String,
  name: String,
  host: String,
  participants: [String],
  files: [{ filename: String, original: String, uploadedAt: Date }],
    isPublic: { type: Boolean, default: true }, 
});

const pollSchema = new mongoose.Schema({
  pollId: { type: String, unique: true },
  roomId: String,
  question: String,
  options: [{ optId: String, text: String, votes: Number }],
  createdBy: String,
  createdAt: Date,
  closed: { type: Boolean, default: false },
});

const todoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  text: { type: String, required: true },
  done: { type: Boolean, default: false },
});

// NEW RESOURCE SCHEMA
const resourceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: String,
    uploadedAt: { type: Date, default: Date.now },
});


const User = mongoose.model("User", userSchema);
const Room = mongoose.model("Room", roomSchema);
const Poll = mongoose.model("Poll", pollSchema);
const Todo = mongoose.model("Todo", todoSchema); 
const Resource = mongoose.model("Resource", resourceSchema); // NEW MODEL

// ---- Auth middleware ----
const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }
};

// ---- Auth routes ----
app.post("/signup", async (req, res) => {
  try {
    const { username, password, displayName, interests = [] } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Missing fields" });

    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ error: "Username taken" });

    const hashed = await bcrypt.hash(password, 10);
    const u = new User({ username, password: hashed, displayName: displayName || username, interests });
    await u.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const u = await User.findOne({ username });
    if (!u) return res.status(400).json({ error: "User not found" });

    const ok = await bcrypt.compare(password, u.password);
    if (!ok) return res.status(400).json({ error: "Invalid creds" });

    const token = jwt.sign({ id: u._id, username: u.username, displayName: u.displayName }, process.env.JWT_SECRET);
    res.json({ token, username: u.username, displayName: u.displayName, interests: u.interests, avatar: u.avatar });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/update-profile", authMiddleware, async (req, res) => {
  try {
    const { displayName, avatar } = req.body;
    const u = await User.findById(req.user.id);
    if (!u) return res.status(404).json({ error: "User not found" });

    if (displayName) u.displayName = displayName;
    if (avatar) u.avatar = avatar;

    await u.save();
    res.json({ success: true, displayName: u.displayName, avatar: u.avatar });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Profile update failed" });
  }
});

// ---- Todo Routes (Personal) ----
app.get("/todos", authMiddleware, async (req, res) => {
    try {
        const todos = await Todo.find({ userId: req.user.id });
        res.json(todos);
    } catch (err) {
        console.error("Error fetching todos:", err);
        res.status(500).json({ error: "Failed to fetch todos" });
    }
});

app.post("/todos", authMiddleware, async (req, res) => {
    try {
        const { text } = req.body;
        const newTodo = new Todo({ userId: req.user.id, text, done: false });
        await newTodo.save();
        res.status(201).json(newTodo);
    } catch (err) {
        console.error("Error creating todo:", err);
        res.status(500).json({ error: "Failed to create todo" });
    }
});

app.put("/todos/:id", authMiddleware, async (req, res) => {
    try {
        const todo = await Todo.findOne({ _id: req.params.id, userId: req.user.id });
        if (!todo) return res.status(404).json({ error: "Todo not found" });

        todo.done = !todo.done;
        await todo.save();
        res.json(todo);
    } catch (err) {
        console.error("Error updating todo:", err);
        res.status(500).json({ error: "Failed to update todo" });
    }
});

app.delete("/todos/:id", authMiddleware, async (req, res) => {
    try {
        const result = await Todo.deleteOne({ _id: req.params.id, userId: req.user.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Todo not found or unauthorized" });
        }
        res.json({ success: true, message: "Task deleted successfully" });
    } catch (err) {
        console.error("Error deleting todo:", err);
        res.status(500).json({ error: "Failed to delete todo" });
    }
});


// ---- Room endpoints ----
app.post("/create-room", authMiddleware, async (req, res) => {
  try {
    const { subject, roomName, isPublic } = req.body; 
    const roomId = nanoid(8);

    const room = new Room({
      roomId, subject, name: roomName, 
      host: req.user.displayName || req.user.username,
      participants: [], files: [], isPublic: isPublic, 
    });

    await room.save();
    res.json({ roomId });
  } catch (err) {
    console.error("Create room error:", err);
    res.status(500).json({ error: "Failed to create room" });
  }
});

app.get("/rooms", async (req, res) => {
  try {
    const { subject } = req.query;
    const query = { isPublic: true, ...(subject ? { subject } : {}) };
    
    const rooms = await Room.find(query).lean(); 
    
    res.json(rooms.map(r => ({
      roomId: r.roomId, subject: r.subject, name: r.name, host: r.host,
      isPublic: r.isPublic, 
      participantCount: Array.isArray(r.participants) ? r.participants.length : 0,
    })));

  } catch (err) {
    console.error("Error fetching rooms list:", err);
    res.status(500).json({ error: "Failed to list rooms due to server error." });
  }
});

app.get("/users/list", authMiddleware, async (req, res) => {
    try {
        const users = await User.find({}, 'username displayName avatar').lean();
        res.json(users.map(u => ({
            username: u.username,
            displayName: u.displayName,
            avatar: u.avatar || '',
        })));
    } catch (err) {
        console.error("Error fetching all users:", err);
        res.status(500).json({ error: "Failed to load user list." });
    }
});

app.delete("/rooms/:roomId", authMiddleware, async (req, res) => {
  try {
    const r = await Room.findOne({ roomId: req.params.roomId });
    if (!r) return res.status(404).json({ error: "Not found" });
    if (r.host !== req.user.displayName) return res.status(403).json({ error: "Only host" });

    await Room.deleteOne({ roomId: req.params.roomId });
    io.to(req.params.roomId).emit("room-closed", { message: "Host closed the room" });
    res.json({ success: true });
  } catch (err) {
    console.error("Close room error:", err);
    res.status(500).json({ error: "Close failed" });
  }
});

// ---- File upload setup ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${nanoid(6)}-${file.originalname}`),
});
const upload = multer({ storage });

// NEW: RESOURCE UPLOAD ROUTE (Knowledge Repository)
app.post("/upload/resource", upload.single("file"), authMiddleware, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });
    
    // Save the resource to the database linked to the user
    const newResource = new Resource({
        userId: req.user.id,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
    });
    await newResource.save();

    res.json({ 
        success: true, 
        message: "File uploaded and recorded.",
        file: newResource, // Return the saved metadata
        url: `/uploads/${req.file.filename}`
    });
  } catch (err) {
    console.error("Resource Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// NEW: FETCH USER RESOURCES ROUTE
app.get("/resources", authMiddleware, async (req, res) => {
    try {
        const resources = await Resource.find({ userId: req.user.id }).lean();
        res.json(resources.map(r => ({
            ...r,
            url: `/uploads/${r.filename}`
        })));
    } catch (err) {
        console.error("Error fetching resources:", err);
        res.status(500).json({ error: "Failed to fetch resources" });
    }
});


app.post("/upload/:roomId", upload.single("file"), authMiddleware, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room && req.params.roomId !== 'profile') return res.status(404).json({ error: "Room not found" });

    const fileMeta = { filename: req.file.filename, original: req.file.originalname, uploadedAt: new Date() };

    if (room) {
        room.files.push(fileMeta);
        await room.save();
        io.to(req.params.roomId).emit("file-uploaded", fileMeta);
    }
    
    res.json({ success: true, file: fileMeta });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});
app.use("/uploads", express.static(UPLOAD_DIR));

// ---- Polls HTTP endpoint (optional) ----
app.get("/polls/:roomId", async (req, res) => {
  const polls = await Poll.find({ roomId: req.params.roomId }).lean();
  res.json(polls || []);
});

// ---- Server + Socket.io ----
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// In-memory storage for real-time data
const roomTodos = {}; 
const roomNotes = {}; 
const leaderboard = {};
const addPoints = (displayName, pts) => {
  if (!displayName) return;
  leaderboard[displayName] = (leaderboard[displayName] || 0) + pts;
  io.emit("leaderboard-update", leaderboard);
};

io.on("connection", (socket) => {
  console.log("🔗 User connected:", socket.id);

  socket.on("join-room", async ({ roomId, displayName }) => {
    socket.join(roomId);

    try {
      const room = await Room.findOne({ roomId });
      if (room) {
        if (!room.participants.includes(displayName)) {
          room.participants.push(displayName);
          await room.save();
        }
        const list = room.participants.map(name => ({ id: name, name, isHost: name === room.host }));
        io.to(roomId).emit("participants", list);
      }
    } catch (err) {
      console.error("join-room err:", err);
    }
    // Send the current list of shared todos when a user joins
    if (roomTodos[roomId]) {
        socket.emit("room-todos-update", roomTodos[roomId]);
    }
    // Send the current notes content when a user joins
    if (roomNotes[roomId]) {
        socket.emit("notes-update", roomNotes[roomId]);
    }
});
 
// ---- SHARED NOTES SOCKET HANDLERS ----
socket.on("send-notes-update", ({ roomId, content }) => {
    roomNotes[roomId] = content;
    socket.to(roomId).emit("notes-update", content);
});
// ------------------------------------------


// ---- SHARED TODO LIST SOCKET HANDLERS ----
socket.on("add-room-todo", ({ roomId, text, creator }) => {
    roomTodos[roomId] = roomTodos[roomId] || [];
    
    const newTodo = { id: nanoid(10), text, done: false, creator };
    roomTodos[roomId].push(newTodo);
    io.to(roomId).emit("room-todos-update", roomTodos[roomId]);
});

socket.on("toggle-room-todo", ({ roomId, todoId }) => {
    if (roomTodos[roomId]) {
        roomTodos[roomId] = roomTodos[roomId].map(todo => 
            todo.id === todoId ? { ...todo, done: !todo.done } : todo
        );
        
        io.to(roomId).emit("room-todos-update", roomTodos[roomId]);
    }
});
// ------------------------------------------

// ---- POMODORO MULTIPLIER (NEW) ----
socket.on("pomodoro-completed", (displayName) => {
    addPoints(displayName, 50); 
    console.log(`[LEADERBOARD] 50 bonus points awarded to ${displayName} for Pomodoro completion.`);
});
// -----------------------------------

  socket.on("leave-room", async ({ roomId, displayName }) => {
    socket.leave(roomId);
    try {
      const room = await Room.findOne({ roomId });
      if (room) {
        room.participants = room.participants.filter(p => p !== displayName);
        await room.save();
        const list = room.participants.map(name => ({ id: name, name, isHost: name === room.host }));
        io.to(roomId).emit("participants", list);
      }
    } catch (err) {
      console.error("leave-room err:", err);
    }
  });

  socket.on("chat-message", ({ roomId, sender, text }) => {
    const msg = { sender, text, ts: Date.now() };
    io.to(roomId).emit("chat-message", msg); 
  });

  socket.on("announcement", ({ roomId, text, from }) => {
    io.to(roomId).emit("announcement", { text, from, ts: Date.now() });
  });

  socket.on("poll-create", async ({ roomId, question, options, createdBy }) => {
    try {
      const poll = new Poll({
        pollId: nanoid(8),
        question,
        options: options.map((t) => ({ optId: nanoid(6), text: t, votes: 0 })),
        createdBy,
        createdAt: new Date(),
      });
      await poll.save();
      io.to(roomId).emit("poll-created", poll);
    } catch (err) {
      console.error("poll-create err:", err);
    }
  });

  socket.on("poll-vote", async ({ pollId, optId, voter }) => {
    try {
      const poll = await Poll.findOne({ pollId });
      if (!poll || poll.closed) return;
      const opt = poll.options.find(o => o.optId === optId);
      if (opt) {
        opt.votes = (opt.votes || 0) + 1;
        await poll.save();
        io.to(poll.roomId).emit("poll-updated", poll);
        addPoints(voter, 1);
      }
    } catch (err) {
      console.error("poll-vote err:", err);
    }
  });

  socket.on("whiteboard-update", ({ roomId, data }) => {
    socket.to(roomId).emit("whiteboard-update", data); 
  });

  socket.on("spoke-in-jitsi", ({ roomId, who }) => {
    addPoints(who, 10);
  });

  socket.on("disconnect", () => {
    console.log("❌ disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`✅ Server running http://localhost:${PORT}`));