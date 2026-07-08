# SyncSketch 🎨

> **“Draw together, think together.”**

**👉 [Live Demo](https://syncsketch-live-collabrative-white-board.vercel.app/)**

SyncSketch is a premium, real-time live collaborative whiteboard application. Multiple users can join a room using a unique code to draw, erase, brainstorm, and synchronize canvas state instantly across devices.

---

## Key Features

- **Live Collaboration**: Draw together simultaneously on the same canvas. Changes reflect instantly with zero lag.
- **Collaborator Tracking**: See who is currently active in your room. Status dots glow when they are active, and a live "User is drawing..." notification displays when they start sketching.
- **Drawing Toolbelt**: Equipped with a Pencil brush, Eraser, color selector palette, and brush thickness slider.
- **Dynamic Resize Support**: Canvas drawings adjust and scale internally (high-res 1600x900 coordinate mapping), ensuring drawings are never lost or stretched on browser window resize.
- **Undo Actions**: Instantly undo your last drawn stroke. Changes synchronize across all users.
- **Clear Whiteboard**: Wipe the whiteboard canvas clean for all users after a quick confirmation warning.
- **Download Workspace**: Save your creative brainstorms directly to your machine as high-resolution PNG images.
- **Responsive Layout**: Adapts seamlessly to tablets and phones. Mobile view collapses the sidebar into a bottom toolbar and groups connected users into a drawer.

---

## Tech Stack

- **Frontend**: React (Vite), JavaScript, Vanilla CSS, Lucide icons
- **Backend**: Node.js, Express.js, HTTP
- **Real-Time Layer**: Socket.IO (WebSockets)
- **Canvas Rendering**: HTML5 Canvas API (fixed 1600x900 resolution scale)

---

## Folder Structure

```text
live-collaborative-whiteboard/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Toolbar.jsx
│   │   │   ├── Whiteboard.jsx
│   │   │   ├── UsersPanel.jsx
│   │   │   ├── RoomModal.jsx
│   │   │   └── Toast.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── index.js
│   ├── package.json
│   └── .env.example
├── README.md
└── .gitignore
```

---

## Local Setup Instructions

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v16+ recommended).

### 1. Set Up and Run Backend Server
Navigate to the server directory:
```bash
cd server
```

Install dependencies:
```bash
npm install
```

Create a `.env` file (you can copy `.env.example`):
```bash
cp .env.example .env
```

Start the backend server:
```bash
npm start
```
The server will boot up by default on port `5000` (http://localhost:5000).

---

### 2. Set Up and Run Frontend Client
Open a new terminal window and navigate to the client directory:
```bash
cd client
```

Install dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The application will launch on http://localhost:5173.

---

## How to Test Collaboration

1. Open http://localhost:5173 in **two separate browser windows** (or one normal tab and one Incognito tab).
2. On Window A, enter a display name (e.g. "Alice") and click **Create New Board**.
3. Copy the 6-digit room code from the badge in the header of Window A.
4. On Window B, enter a display name (e.g. "Bob"), click **Join Existing Room**, paste the room code, and press **Join Room**.
5. Draw on the whiteboard in Window A. You will see Bob's window receive the drawings in real time.
6. Check that:
   - Alice sees the "Bob is drawing..." banner when Bob draws.
   - Pressing **Undo** in Window B deletes only Bob's last stroke across both screens.
   - Clicking **Clear Board** on either screen clears the whiteboard for everyone.


