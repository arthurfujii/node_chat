'use strict';

require('dotenv/config');

const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');

const PORT = process.env.PORT;
const ADMIN = 'Admin';

const messages = [];
let users = [];
let rooms = [];

const app = express();

app.use(cors());
app.use(express.json());

app.get('/users', (req, res) => {
  res.status(200).send(users);
});

app.get('/rooms', (req, res) => {
  res.status(200).send(rooms);
});

app.get('/messages', (req, res) => {
  res.status(200).send(messages);
});

const server = app.listen(PORT);
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? false
        : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  },
});

io.on('connection', (client) => {
  // eslint-disable-next-line no-console
  console.log(`User ${client.id} connected`); // TODO remove console.log

  client.on('disconnect', () => {
    const user = users.find((usr) => usr.id === client.id);

    client.leave(user.currentRoom?.name);

    // eslint-disable-next-line no-console
    console.log(`User ${client.id} disconnected`); // TODO remove console.log
  });

  client.on('user', (data) => {
    const user = {
      id: client.id,
      username: data,
    };

    users.push(user);
    client.emit('user', user);
  });

  client.on('deleteUser', (data) => {
    users = users.filter((usr) => usr.id !== data);
    io.emit('users', users);
  });

  client.on('joinRoom', async (data) => {
    const user = updateUser(data.user.id, data.room);

    client.join(data.room.name);
    client.emit('user', user);
    io.emit('users', users);
  });

  client.on('room', async (data) => {
    const room = {
      id: generateId(rooms),
      name: data,
    };

    rooms = [...rooms, room];
    io.emit('rooms', rooms);
  });

  client.on('message', (data) => {
    const message = buildMsg(data.text, data.user);

    messages.push(message);
    messages.sort((a, b) => a.time - b.time);

    io.to(message.user.currentRoom.name).emit('message', message);
    console.log(messages);
  });
});

function buildMsg(text, user) {
  return {
    text,
    user,

    time: new Intl.DateTimeFormat('pt-BR', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }).format(new Date()),
  };
}

function updateUser(id, room) {
  try {
    const user = users.find((usr) => usr.id === id);

    user.currentRoom = room;

    return user;
  } catch (e) {
    console.error(e); // TODO: handle error
  }
}

function generateId(array) {
  if (array.length) {
    return array[array.length - 1].id + 1;
  }

  return 1;
}
