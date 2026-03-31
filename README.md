# 🎓 Online Study Room (OSR)

An immersive, gamified, and real-time collaborative platform designed to maximize student productivity through strictly enforced focus sessions and live multiplayer utility rooms.

---

## 💡 Ideology: The Concept

Students today face endless digital distractions. The **Online Study Room** was built on the core philosophy that focus should be actively protected, rewarded, and that digital collaboration should be frictionless.

Here is how the platform achieves this:

- **Strict Focus & Accountability:** We don't just provide a Pomodoro timer. OSR features a relentless "Focus Violation Overlay" that tracks your browser window via Fullscreen and Visibility APIs. If you switch tabs or exit fullscreen, it intercepts you, automatically pausing your session and penalizing your momentum.
- **Tangible Rewards (Gamification):** Every focused minute is an investment. Users select an active "Study Field" (e.g., Math, Science, History) and earn 10 XP per minute. Uninterrupted focus sprints are rewarded with a precise 1.5x multiplier. As XP accumulates, your global RPG-style level increases.
- **Embedded Knowledge:** Why open another tab to read a PDF when doing so breaks your focus? Our in-app document viewer natively mounts PDFs, text files, and images so you never have to leave the study environment.
- **Multiplayer Utility:** Create unique, shareable study rooms. OSR integrates live collaborative whiteboards, centrally synchronized text playgrounds, real-time checklist tracking, and instant messaging. It bridges the gap between studying alone and sharing a physical library table.

---

## 🛠️ Implementation: The Tech Stack

OSR utilizes a robust, modern MERN-stack architecture empowered by WebSockets to ensure real-time synchronization between clients.

### Frontend (Client Application)
- **Core Framework:** React 19 (via Vite 7), Javascript (ES Modules)
- **Routing:** React Router DOM v6
- **Global State:** Context API (e.g., `PomodoroContext` hierarchy for global timer management)
- **Networking:** Axios, Socket.io-Client v4
- **UI & Styling:** Bootstrap 5 alongside Custom Vanilla CSS, heavily featuring modern aesthetics (glassmorphism, vibrant gradients, dynamic micro-animations)
- **External Modules:** `@excalidraw/excalidraw` for web-native collaborative whiteboarding

### Backend (Server / API Platform)
- **Core Environment:** Node.js, Express 5
- **Database Layer:** MongoDB Native, Mongoose v8 ORM 
- **Real-Time Engine:** Socket.io v4 (WebSockets)
- **Security:** JSON Web Tokens (JWT) Bearer tokens, `bcrypt` for secure hashing, CORS
- **Utilities:** `multer` 2.0 (Handling `multipart/form-data` file uploads locally), `nanoid` (Fast unique room/poll IDs)

---

## ✨ Core Flow & Feature Breakdown

### 1. Secure Authentication & Profiling
- Users register and log in via secure REST endpoints.
- Passwords are salted and hashed natively via `bcrypt` before validation in MongoDB. 
- The React client verifies local `localStorage` tokens upon initialization (`App.jsx`), dynamically unlocking protected DOM routes.

### 2. The Gamified Pomodoro Engine
- Initiating a solo session locks down the device context within the `PomodoroContext` provider logic.
- **Protection Engine:** Hooks into standard web Visibility and Fullscreen APIs. Violations immediately intercept the user visually.
- **Progression Logic:** Upon valid cycle completion, the client securely signals the backend to allocate base XP based on elapsed time. A perfect run grants a 1.5x multiplier. Global level calculation occurs at consistent 1000 XP thresholds.

### 3. Global Leaderboard Aggregation
- Pulls live point aggregations from MongoDB to resolve strict rankings based on accumulated focus time.
- Automatically processes historical XP to flag each user's dominant "Top Field".
- The DOM inherently subscribes to Socket-level `db-leaderboard-update` pings to rebuild the leaderboard automatically whenever ANY user globally completes a cycle.

### 4. Real-Time Room Connectivity
- A unified multi-user environment. Entering a space binds complex listeners (`socket.on`).
- The Node.js server acts as an active memory cache ensuring connecting users immediately download the latest whiteboard payloads, shared notes, and live to-dos.
- Socket interactions instantly reflect exact presence tracking, keeping everyone in sync with "user joined/left" events.

### 5. Sandboxed Resource Viewer
- A distinct backend module handles ingestion via `multer`, caching local storage assets in `/uploads`.
- Custom `<iframe/>` and `<pre/>` logic intercepts default browser links, natively projecting PDFs and file code inside a custom modal. This completely mitigates the risk of the 'Focus Mode' breaking by shifting the browser context entirely natively.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- A [MongoDB](https://www.mongodb.com/) instance (Local server or MongoDB Atlas cluster)

### Installation Guide

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd studyRoom
   ```

2. **Initialize Backend Environment**
   ```bash
   cd osr-server
   npm install
   ```
   *Create a `.env` inside `osr-server` to declare `MONGO_URI`, `JWT_SECRET`, and `PORT`.*

3. **Initialize Frontend Environment**
   ```bash
   cd ../online-study-room
   npm install
   ```
   *Create a `.env` inside `online-study-room` mirroring the backend target (e.g., `VITE_API_BASE_URL`).*

4. **Run the Application locally**
   In one terminal instance (Server):
   ```bash
   cd osr-server
   npm run dev
   ```
   In a second terminal instance (Client):
   ```bash
   cd online-study-room
   npm run dev
   ```

---
*Developed as a premier academic utility focused on rewarding determination over purely raw output.*
