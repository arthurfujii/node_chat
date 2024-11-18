'use strict';

require('dotenv/config');

const express = require('express');
const cors = require('cors');
const EventEmitter = require('events');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT;
let messages = [];
const users = [];

const app = express();

app.use(cors());
app.use(express.json());

const emitter = new EventEmitter();

app.post('/users', (req, res) => {
  const { username, room } = req.body;
  const user = {
    id: users.length ? users.length + 1 : 1,
    username,
    room,
  };

  users.push(user);
  emitter.emit('user', JSON.stringify(user));
  console.log(user);

  res.status(201).send(user);
});

app.get('/users', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Cache-Control', 'no-store');

  const callback = () => {
    res.write(`data: ${JSON.stringify(users)}\n\n`);
  };

  emitter.on('user', callback);

  res.on('close', () => {
    emitter.off('user', callback);
  });
});

app.get('/messages', (req, res) => {
  console.log(messages);
  res.status(200).send(messages);
});

const server = app.listen(PORT);
const wss = new WebSocketServer({ server });

wss.on('connection', (client, req) => {
  client.on('message', (data) => {
    // client.id = req.headers['sec-websocket-key'].slice(0, -2);
    // console.log(client.id);

    const message = JSON.parse(data);

    messages = [message, ...messages];

    emitter.emit('message', JSON.stringify(message));
  });
});

emitter.on('message', (data) => {
  for (const client of wss.clients) {
    client.send(data);
  }
});
