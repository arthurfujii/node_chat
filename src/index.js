'use strict';

require('dotenv/config');

const express = require('express');
const cors = require('cors');
const EventEmitter = require('events');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT;
let messages = [];
let users = [];
let rooms = [];

const app = express();

app.use(cors());
app.use(express.json());

const emitter = new EventEmitter();

app.post('/users', (req, res) => {
  const { username } = req.body;

  if (!users.some((u) => u.username === username)) {
    const user = {
      id: users.length ? users[users.length - 1].id + 1 : 1,
      username,
      room: null,
    };

    users.push(user);
    res.status(201).send(user);
  } else {
    res.status(400).send('Username already exists');
  }
});

app.get('/allusers', (req, res) => {
  res.status(200).send(users);
});

app.get('/users', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Cache-Control', 'no-store');

  const callback = () => {
    res.write(`data: ${JSON.stringify(users)}\n\n`);
  };

  emitter.on('users', callback);

  res.on('close', () => {
    emitter.off('users', callback);
  });
});

app.patch('/users/:id', (req, res) => {
  const { id } = req.params;
  const { roomId } = req.body;

  const user = users.find((usr) => usr.id === +id);

  if (!user) {
    res.status(404).send('User not found');

    return;
  }

  user.room = roomId;
  res.status(201).send(user);
});

app.delete('/users/:id', (req, res) => {
  const { id } = req.params;

  if (!users.some((usr) => +usr.id === +id)) {
    res.status(404).send('User not found');

    return;
  }

  const newUsers = users.filter((usr) => usr.id !== +id);

  users = newUsers;
  res.sendStatus(204);
});

app.post('/rooms', (req, res) => {
  const { roomName } = req.body;

  if (rooms.some((r) => r.roomName === roomName)) {
    res.status(400).send('Room already exists');

    return;
  }

  const room = {
    id: rooms.length ? rooms[rooms.length - 1].id + 1 : 1,
    roomName,
    users: [],
  };

  rooms.push(room);
  emitter.emit('rooms', rooms);
  console.log(rooms);
  res.status(201).send(room);
});

app.get('/allrooms', (req, res) => {
  res.status(200).send(rooms);
});

app.get('/rooms', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Cache-Control', 'no-store');

  const callback = () => {
    res.write(`data: ${JSON.stringify(rooms)}\n\n`);
  };

  emitter.on('rooms', callback);

  res.on('close', () => {
    emitter.off('rooms', callback);
  });
});

app.delete('/rooms/:id', (req, res) => {
  const { id } = req.params;

  if (!rooms.some((r) => +r.id === +id)) {
    res.status(404).send('Room not found');

    return;
  }

  const newRooms = rooms.filter((r) => r.id !== +id);

  rooms = newRooms;
  res.sendStatus(204);
});

app.patch('/rooms/:id', (req, res) => {
  const { id } = req.params;
  const { updatedUser } = req.body;
  const room = rooms.find((r) => r.id === +id);

  if (!room) {
    res.status(404).send('Room not found');

    return;
  }

  room.users.push(updatedUser.data);

  console.log(updatedUser.data);
  res.status(201).send(room);
});

app.get('/messages', (req, res) => {
  res.status(200).send(messages);
});

const server = app.listen(PORT);
const wss = new WebSocketServer({ server });

wss.on('connection', (client, req) => {
  client.on('message', (data) => {
    const message = JSON.parse(data);

    message.time = new Intl.DateTimeFormat('pt-BR', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }).format(new Date());

    messages = [message, ...messages];

    emitter.emit('message', JSON.stringify(messages));
  });
});

emitter.on('message', (data) => {
  for (const client of wss.clients) {
    client.send(data);
  }
});
