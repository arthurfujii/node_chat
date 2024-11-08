'use strict';

require('dotenv/config');

const express = require('express');
const cors = require('cors');
const EventEmitter = require('events');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT;

const app = express();

app.use(cors());
app.use(express.json());

const emitter = new EventEmitter();

const messages = [];
const users = [];

app.post('/users', (req, res) => {
  const { username } = req.body;
  const user = {
    username,
  };

  users.push(user);
  res.status(201).send(user);
});

app.post('/messages', (req, res) => {
  const { text, author, room } = req.body;

  const message = {
    text,
    author,
    room,
    time: new Date(),
  };

  messages.push(message);

  emitter.emit('message', message);

  res.status(201).send(messages);
});

app.get('/messages', (req, res) => {
  res.status(200).send(messages);
});

const server = app.listen(PORT);

const wss = new WebSocketServer({ server });

wss.on('connection', (connection) => {
  // eslint-disable-next-line no-console
  console.log(messages); // TODO: remove this line

  connection.on('message', (text) => {
    const message = {
      text: text.toString(),
      // author,
      time: new Date(),
    };

    messages.push(message);

    emitter.emit('message', message);
  });
});

emitter.on('message', (message) => {
  for (const client of wss.clients) {
    client.send(JSON.stringify(message));
  }
});
