'use strict';

require('dotenv/config');

const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const MessageService = require('./services/Message.service.js');
const UserService = require('./services/User.service.js');
const RoomService = require('./services/Room.service.js');
const UserController = require('./controllers/User.controller.js');
const RoomController = require('./controllers/Room.controller.js');
const MessageController = require('./controllers/Message.controller.js');
const vars = require('./vars.js');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/users', UserController.getAll);
app.get('/rooms', RoomController.getAll);
app.get('/messages/:id', MessageController.getAllByRoomId);

const server = app.listen(vars.PORT);
const io = new Server(server, {
  connectionStateRecovery: {
    // the backup duration of the sessions and the packets
    maxDisconnectionDuration: 2 * 60 * 1000,
  },
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? false
        : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  },
});

io.on('connection', (socket) => {
  if (socket.recovered) {
    // eslint-disable-next-line no-console
    console.log(`User ${socket.id} reconnected`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`User ${socket.id} connected`);
  }

  socket.on('disconnect', () => {
    const user = UserService.findUserById(socket.id);

    if (user && user.currentRoom) {
      const exitMsg = MessageService.buildMsg(`${user.username} left room`, {
        id: 0,
        username: 'Admin',
        currentRoom: user.currentRoom,
      });

      socket.leave(user.currentRoom.name);
      socket.broadcast.to(user.currentRoom.name).emit('message', exitMsg);
    }

    UserService.removeOne(socket.id);
    io.emit('users', UserService.users);

    // eslint-disable-next-line no-console
    console.log(`User ${socket.id} disconnected`);
  });

  socket.on('createUser', (data) => {
    const user = UserService.buildUser(data);

    UserService.addOne(user);
    io.emit('users', UserService.users);
    socket.emit('user', user);
  });

  socket.on('deleteUser', (data) => {
    UserService.removeOne(data);
    io.emit('users', UserService.users);
  });

  socket.on('joinRoom', (data) => {
    const user = UserService.updateUserRoom(data.user.id, data.room);

    socket.emit('user', user);
    io.emit('users', UserService.users);

    const joinMsg = MessageService.buildMsg(`${user.username} joined room`, {
      id: 0,
      username: 'Admin',
      currentRoom: data.room,
    });

    socket.join(user.currentRoom.name);
    MessageService.addOne(joinMsg);
    socket.broadcast.to(user.currentRoom.name).emit('message', joinMsg);
  });

  socket.on('leaveRoom', (data) => {
    const exitMsg = MessageService.buildMsg(`${data.username} left room`, {
      id: 0,
      username: 'Admin',
      currentRoom: data.room,
    });

    socket.leave(data.currentRoom.name);
    MessageService.addOne(exitMsg);
    socket.broadcast.to(data.currentRoom.name).emit('message', exitMsg);

    const user = UserService.updateUserRoom(data.id, null);

    socket.emit('user', user);
    io.emit('users', UserService.users);
  });

  socket.on('room', async (data) => {
    const room = RoomService.buildRoom(data);

    RoomService.addOne(room);
    io.emit('rooms', RoomService.rooms);
  });

  socket.on('sendMessage', (data) => {
    const message = MessageService.buildMsg(data.text, data.user);

    MessageService.addOne(message);
    io.to(message.user.currentRoom.name).emit('message', message);
  });
});
