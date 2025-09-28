import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOW_ORIGIN,
  },
});

app.use(express.json());
app.use(cors());

// WebSocket接続
io.on('connection', (socket) => {
  console.log('WebSocket client connected');
});

app.post('/api/change-screen', (req, res) => {
  const { screen } = req.body;
  // WebSocketクライアントに画面変更を通知
  io.emit('change-screen', screen);
  res.json({ status: 'screen changed', screen });
});

server.listen(3001, () => {
  console.log('Server running on port 3001');
});