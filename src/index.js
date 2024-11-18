'use strict';

require('dotenv/config');

const express = require('express');
const cors = require('cors');
const EventEmitter = require('events');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT;
let messages = [];
const users = [];
const rooms = [];

const app = express();

app.use(cors());
app.use(express.json());

const emitter = new EventEmitter();

app.post('/users', (req, res) => {
  const { user } = req.body;

  users.push(user);
});

app.get('/rooms', (req, res) => {
  res.status(200).send(rooms);
});

app.get('/messages', (req, res) => {
  console.log(messages);
  res.status(200).send(messages);
});

const server = app.listen(PORT);

const wss = new WebSocketServer({ server });

wss.on('connection', (client) => {
  client.on('message', (data) => {
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
