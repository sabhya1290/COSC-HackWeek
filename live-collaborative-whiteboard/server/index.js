const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Health route
app.get('/', (req, res) => {
  res.send('SyncSketch server is running');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// In-memory room data
// Structure:
// [roomId] -> {
//   users: Map(socketId -> { username, color, isDrawing }),
//   strokes: Array(StrokeObjects)
// }
const rooms = new Map();

// Helper to generate distinct random colors for users
const USER_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#F97316'  // Orange
];

function getRandomColor() {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 1. Join Room Flow
  socket.on('join-room', ({ roomId, username }) => {
    if (!roomId || !username) return;

    socket.join(roomId);

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        users: new Map(),
        strokes: []
      });
    }

    const room = rooms.get(roomId);
    const userColor = getRandomColor();
    const newUser = {
      id: socket.id,
      username,
      color: userColor,
      isDrawing: false
    };

    room.users.set(socket.id, newUser);

    console.log(`User ${username} (${socket.id}) joined room ${roomId}`);

    // Broadcast user joined to other users in the room
    socket.to(roomId).emit('user-joined', {
      user: newUser,
      users: Array.from(room.users.values())
    });

    // Send current room info and stroke history directly to the joining user
    socket.emit('room-joined', {
      roomId,
      self: newUser,
      users: Array.from(room.users.values()),
      strokes: room.strokes
    });

    // If there are other users, request the latest state from one of them to ensure consistency
    const otherUsers = Array.from(room.users.keys()).filter(id => id !== socket.id);
    if (otherUsers.length > 0) {
      const helperSocketId = otherUsers[0];
      io.to(helperSocketId).emit('request-canvas-state', { requesterId: socket.id });
    }
  });

  // Relay canvas state from helper to requester
  socket.on('canvas-state', ({ requesterId, strokes }) => {
    // If the helper has a more complete state, update server cache
    // Locate the room the socket belongs to
    for (const [roomId, room] of rooms.entries()) {
      if (room.users.has(socket.id)) {
        if (strokes && strokes.length > room.strokes.length) {
          room.strokes = strokes;
        }
        io.to(requesterId).emit('canvas-state', { strokes: room.strokes });
        break;
      }
    }
  });

  // 2. Real-time Drawing Events
  socket.on('drawing-start', ({ roomId, stroke }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Set drawing status
    const user = room.users.get(socket.id);
    if (user) {
      user.isDrawing = true;
      socket.to(roomId).emit('user-drawing-status', {
        userId: socket.id,
        isDrawing: true,
        users: Array.from(room.users.values())
      });
    }

    // Add stroke to server list
    room.strokes.push(stroke);

    // Broadcast stroke start to others
    socket.to(roomId).emit('drawing-start', { stroke });
  });

  socket.on('drawing', ({ roomId, strokeId, point }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Append point to the corresponding stroke
    const stroke = room.strokes.find(s => s.id === strokeId);
    if (stroke) {
      stroke.points.push(point);
    }

    // Broadcast drawing coordinates
    socket.to(roomId).emit('drawing', { strokeId, point });
  });

  socket.on('drawing-end', ({ roomId, strokeId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(socket.id);
    if (user) {
      user.isDrawing = false;
      socket.to(roomId).emit('user-drawing-status', {
        userId: socket.id,
        isDrawing: false,
        users: Array.from(room.users.values())
      });
    }

    socket.to(roomId).emit('drawing-end', { strokeId });
  });

  // 3. Clear Canvas
  socket.on('clear-canvas', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.strokes = [];
    io.in(roomId).emit('clear-canvas');
  });

  // 4. Undo Stroke
  socket.on('undo-stroke', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Find the last stroke created by this user
    let lastIndex = -1;
    for (let i = room.strokes.length - 1; i >= 0; i--) {
      if (room.strokes[i].userId === socket.id) {
        lastIndex = i;
        break;
      }
    }

    if (lastIndex !== -1) {
      const removedStroke = room.strokes.splice(lastIndex, 1)[0];
      io.in(roomId).emit('undo-stroke', {
        strokeId: removedStroke.id,
        strokes: room.strokes
      });
    }
  });

  // 5. Leave Room / Disconnect
  socket.on('leave-room', ({ roomId }) => {
    socket.leave(roomId);
    handleUserLeaving(socket, roomId);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const roomId of rooms.keys()) {
      const room = rooms.get(roomId);
      if (room.users.has(socket.id)) {
        handleUserLeaving(socket, roomId);
      }
    }
  });
});

function handleUserLeaving(socket, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const user = room.users.get(socket.id);
  if (user) {
    room.users.delete(socket.id);
    console.log(`User ${user.username} left room ${roomId}`);

    socket.to(roomId).emit('user-left', {
      userId: socket.id,
      username: user.username,
      users: Array.from(room.users.values())
    });

    // Clean up room memory if it becomes empty
    if (room.users.size === 0) {
      rooms.delete(roomId);
      console.log(`Room ${roomId} is empty. Deleted room from memory.`);
    }
  }
}

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
