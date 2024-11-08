require('dotenv/config');

const express = require('express');
const cors = require('cors');
const EventEmitter = require('events');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT;

function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const emitter = new EventEmitter();

  const messages = [];
  // const users = [];

  // app.post('/users', (req, res) => {
  //   const { username } = req.body;
  //   const user = {
  //     username,
  //   };

  //   users.push(user);
  //   res.status(201).send(user);
  // });

  app.post('/messages', (req, res) => {
    const { text, author } = req.body;

    const message = {
      text,
      author,
      time: new Date(),
    };

    messages.push(message);

    emitter.emit('message', message);

    res.status(201).send(messages);
  });

  app.get('/messages', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Cache-control', 'no-store');

    const callback = (message) => {
      res.write(`data: ${JSON.stringify(message)}\n\n`);
    };

    emitter.on('message', callback);

    res.on('close', () => {
      emitter.off('message', callback);
    });
  });

  const server = app.listen(PORT);

  const wss = new WebSocketServer({ server });

  emitter.on('message', (message) => {
    for (const client of wss.clients) {
      client.send(JSON.stringify(message));
    }
  });

  return wss;
}

module.exports = createServer;
