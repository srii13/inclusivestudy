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

// ---- INPUT VALIDATION UTILITIES ----
const validateInput = {
  username: (val) => {
    if (!val || typeof val !== 'string') return 'Username is required';
    if (val.length < 3) return 'Username must be at least 3 characters';
    if (val.length > 30) return 'Username must be less than 30 characters';
    if (!/^[a-zA-Z0-9_-]+$/.test(val)) return 'Username can only contain letters, numbers, hyphens, and underscores';
    return null;
  },
  password: (val) => {
    if (!val || typeof val !== 'string') return 'Password is required';
    if (val.length < 6) return 'Password must be at least 6 characters';
    if (val.length > 128) return 'Password is too long';
    return null;
  },
  displayName: (val) => {
    if (!val || typeof val !== 'string') return 'Display name is required';
    if (val.length < 2) return 'Display name must be at least 2 characters';
    if (val.length > 50) return 'Display name must be less than 50 characters';
    return null;
  },
  text: (val) => {
    if (!val || typeof val !== 'string') return 'Text is required';
    if (val.trim().length === 0) return 'Text cannot be empty';
    if (val.length > 5000) return 'Text is too long';
    return null;
  },
  roomName: (val) => {
    if (!val || typeof val !== 'string') return 'Room name is required';
    if (val.length < 3) return 'Room name must be at least 3 characters';
    if (val.length > 100) return 'Room name must be less than 100 characters';
    return null;
  }
};

const CUSTOM_BLUE = '#4903fc';

const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// ---- MongoDB connection ----
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    // Drop problematic email index if it exists
    try {
      const db = mongoose.connection.db;
      await db.collection("users").dropIndex("email_1").catch(() => {});
    } catch (err) {
      console.log("Index cleanup note:", err.message);
    }
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ---- Schemas ----
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  displayName: { type: String },
  password: { type: String, required: true },
  avatar: { type: String, default: "" },
  interests: [String],
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  xpByField: { type: Map, of: Number, default: {} },
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
    
    // Input validation
    const usernameErr = validateInput.username(username);
    if (usernameErr) return res.status(400).json({ error: usernameErr });
    
    const passwordErr = validateInput.password(password);
    if (passwordErr) return res.status(400).json({ error: passwordErr });
    
    const displayNameErr = validateInput.displayName(displayName || username);
    if (displayNameErr) return res.status(400).json({ error: displayNameErr });

    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ error: "Username already taken" });

    const hashed = await bcrypt.hash(password, 10);
    const u = new User({ username, password: hashed, displayName: displayName || username, interests });
    await u.save();

    res.json({ success: true, message: "Signup successful" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed. Please try again." });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Input validation
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const u = await User.findOne({ username });
    if (!u) return res.status(401).json({ error: "Invalid username or password" });

    const ok = await bcrypt.compare(password, u.password);
    if (!ok) return res.status(401).json({ error: "Invalid username or password" });

    const token = jwt.sign({ id: u._id, username: u.username, displayName: u.displayName }, process.env.JWT_SECRET);
    res.json({ success: true, token, username: u.username, displayName: u.displayName, interests: u.interests, avatar: u.avatar });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Server error." });
  }
});

app.post("/update-profile", authMiddleware, async (req, res) => {
  try {
    const { displayName, avatar } = req.body;
    const u = await User.findById(req.user.id);
    if (!u) return res.status(404).json({ error: "User not found" });

    if (displayName) {
      const err = validateInput.displayName(displayName);
      if (err) return res.status(400).json({ error: err });
      u.displayName = displayName;
    }

    if (avatar) {
      if (typeof avatar !== 'string' || avatar.length > 500) {
        return res.status(400).json({ error: "Invalid avatar URL" });
      }
      u.avatar = avatar;
    }

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
        
        const err = validateInput.text(text);
        if (err) return res.status(400).json({ error: err });

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
        console.error("Error toggling todo:", err);
        res.status(500).json({ error: "Failed to toggle todo" });
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
app.get("/rooms", authMiddleware, async (req, res) => {
  try {
    // Fetch all public rooms and rooms where user is already a participant
    const displayName = req.user.displayName || req.user.username;
    const rooms = await Room.find({
      $or: [
        { isPublic: true },
        { participants: displayName }
      ]
    }).lean();
    
    res.json(rooms || []);
  } catch (err) {
    console.error("Error fetching rooms:", err);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

app.post("/create-room", authMiddleware, async (req, res) => {
  try {
    const { subject, roomName, isPublic } = req.body; 
    
    // Validation
    const roomNameErr = validateInput.roomName(roomName);
    if (roomNameErr) return res.status(400).json({ error: roomNameErr });
    
    if (subject && (typeof subject !== 'string' || subject.length > 100)) {
      return res.status(400).json({ error: "Invalid subject" });
    }

    const roomId = nanoid(8);

    const room = new Room({
      roomId, subject, name: roomName, 
      host: req.user.displayName || req.user.username,
      participants: [], files: [], isPublic: isPublic, 
    });

    await room.save();
    res.json({ success: true, roomId });
  } catch (err) {
    console.error("Create room error:", err);
    res.status(500).json({ error: "Failed to create room" });
  }
});

app.get("/users/list", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, 'username displayName avatar xp level').lean();
    res.json(users.map(u => ({
      username: u.username,
      displayName: u.displayName,
      avatar: u.avatar || '',
      xp: u.xp || 0,
      level: u.level || 1
    })));
  } catch (err) {
    console.error("Error fetching all users:", err);
    res.status(500).json({ error: "Failed to load user list." });
  }
});

// GET /leaderboard - fetches directly from MongoDB
app.get("/leaderboard", authMiddleware, async (req, res) => {
    try {
        const users = await User.find({}, 'username displayName avatar xp level xpByField')
            .sort({ xp: -1 })
            .limit(10)
            .lean();
            
        // Process top field
        const formattedUsers = users.map(u => {
            let topField = "General Studies";
            let topFieldXp = 0;
            
            if (u.xpByField && Object.keys(u.xpByField).length > 0) {
                for (const [field, xp] of Object.entries(u.xpByField)) {
                    if (xp > topFieldXp) {
                        topFieldXp = xp;
                        topField = field;
                    }
                }
            }
            
            return {
                username: u.username,
                displayName: u.displayName,
                avatar: u.avatar || '',
                xp: u.xp || 0,
                level: u.level || 1,
                topField,
                topFieldXp
            };
        });
        
        res.json(formattedUsers);
    } catch (err) {
        console.error("Error fetching leaderboard:", err);
        res.status(500).json({ error: "Failed to load leaderboard." });
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

// ---- File upload setup with validation ----
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_FILE_TYPES = ['application/pdf', 'application/msword', 'text/plain', ...ALLOWED_IMAGE_TYPES];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${nanoid(6)}-${file.originalname}`),
});

const fileFilter = (req, file, cb) => {
  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    return cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

const avatarUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Avatar must be an image (JPG, PNG, GIF, WebP)`), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB for avatars
});

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

// NEW: DEDICATED AVATAR UPLOAD ENDPOINT
app.post("/upload-avatar", avatarUpload.single("file"), authMiddleware, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const avatarPath = `/uploads/${req.file.filename}`;
    user.avatar = avatarPath;
    await user.save();

    res.json({ 
      success: true, 
      avatar: avatarPath,
      message: "Avatar updated successfully" 
    });
  } catch (err) {
    console.error("Avatar upload error:", err);
    const message = err.message || "Avatar upload failed";
    res.status(500).json({ error: message });
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
const roomWhiteboard = {}; // NEW
const roomQna = {}; // NEW: Anonymous Q&A mapping
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
        const users = await User.find({ displayName: { $in: room.participants } }, 'displayName avatar').lean();
        const avatarMap = {};
        users.forEach(u => avatarMap[u.displayName] = u.avatar || '');

        const list = room.participants.map(name => ({ id: name, name, isHost: name === room.host, avatar: avatarMap[name] }));
        io.to(roomId).emit("participants", list);
      }
    } catch (err) {
      console.error("join-room err:", err);
    }
    // Send the current list of shared todos when a user joins
    if (roomTodos[roomId]) {
        socket.emit("room-todos-update", roomTodos[roomId]);
    }
    // Send anonymous questions
    if (roomQna[roomId]) {
        socket.emit("qna-sync", roomQna[roomId]);
    }
    // Send the current notes content when a user joins
    if (roomNotes[roomId]) {
        socket.emit("notes-update", roomNotes[roomId]);
    }
    // Send the current whiteboard state when a user joins
    if (roomWhiteboard[roomId]) {
        socket.emit("whiteboard-update", roomWhiteboard[roomId]);
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

  // ---- ANONYMOUS Q&A ----
  socket.on("ask-qna", ({ roomId, text }) => {
      roomQna[roomId] = roomQna[roomId] || [];
      const newQuestion = { id: nanoid(10), text, upvotes: 0, timestamp: Date.now(), upvotedBy: [] };
      roomQna[roomId].push(newQuestion);
      io.to(roomId).emit("qna-update", roomQna[roomId]);
  });

  socket.on("upvote-qna", ({ roomId, questionId, voterId }) => {
      if (!roomQna[roomId]) return;
      const q = roomQna[roomId].find(q => q.id === questionId);
      if (q && !q.upvotedBy.includes(voterId)) {
          q.upvotes++;
          q.upvotedBy.push(voterId);
          io.to(roomId).emit("qna-update", roomQna[roomId]);
      }
  });
  // -----------------------

  // ---- POMODORO MULTIPLIER (NEW) ----
  socket.on("pomodoro-completed", async ({ displayName, durationMinutes, studyField, cheated }) => {
      if (!displayName) return;
      
      const baseXp = durationMinutes * 10;
      const finalXp = cheated ? 0 : Math.floor(baseXp * 1.5); // Bonus 1.5x for flawless Pomodoro!
      
      if (finalXp > 0) {
          try {
              const u = await User.findOne({ displayName });
              if (u) {
                  u.xp = (u.xp || 0) + finalXp;
                  u.level = Math.floor(u.xp / 1000) + 1; // 1 level per 1000 XP
                  
                  // Add specific field XP
                  const currentFieldXp = u.xpByField.get(studyField) || 0;
                  u.xpByField.set(studyField, currentFieldXp + finalXp);
                  
                  await u.save();
                  
                   // Broadcast explicit db-driven event sync for active leaderboards
                  io.emit("db-leaderboard-update");
                  
                  console.log(`[LEADERBOARD] ${finalXp} DB XP awarded to ${displayName} in ${studyField}. Level: ${u.level}`);
              }
          } catch (err) {
              console.error("Pomodoro XP update error:", err);
          }
      }
  });
  // -----------------------------------

  socket.on("leave-room", async ({ roomId, displayName }) => {
    socket.leave(roomId);
    try {
      const room = await Room.findOne({ roomId });
      if (room) {
        // Remove the user from participants
        room.participants = room.participants.filter(name => name !== displayName);
        await room.save();
        
        // Emit updated participants list
        const users = await User.find({ displayName: { $in: room.participants } }, 'displayName avatar').lean();
        const avatarMap = {};
        users.forEach(u => avatarMap[u.displayName] = u.avatar || '');
        
        const list = room.participants.map(name => ({ id: name, name, isHost: name === room.host, avatar: avatarMap[name] }));
        io.to(roomId).emit("participants", list);
      }
    } catch (err) {
      console.error("leave-room err:", err);
    }  });

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
    roomWhiteboard[roomId] = data; // store centrally
    socket.to(roomId).emit("whiteboard-update", data); 
  });

  socket.on("spoke-in-jitsi", ({ roomId, who }) => {
    addPoints(who, 10);
  });

  socket.on("disconnect", () => {
    console.log("❌ disconnected", socket.id);
  });
});
// ---- Global 404 Handler ----
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// ---- Global Error Handler ----
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  
  // Multer file upload errors
  if (err.name === "MulterError") {
    if (err.code === "FILE_TOO_LARGE") {
      return res.status(413).json({ error: "File is too large" });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ error: "Unexpected file upload" });
    }
    return res.status(400).json({ error: err.message });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(403).json({ error: "Invalid token" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired" });
  }

  // Mongoose/DB errors
  if (err.name === "MongoError" || err.name === "MongoServerError") {
    return res.status(500).json({ error: "Database error" });
  }

  // Generic error
  res.status(err.status || 500).json({ 
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`✅ Server running http://localhost:${PORT}`));