const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let tasks = [];

io.on('connection', (socket) => {
  console.log('A user connected');
  
  // Send tasks to new clients
  socket.emit('taskUpdate', tasks);

  // Listen for task updates
  socket.on('updateTasks', (updatedTasks) => {
    tasks = updatedTasks;
    io.emit('taskUpdate', tasks); // Broadcast updates to all clients
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(4000, () => {
  console.log('WebSocket server running on http://localhost:4000');
});