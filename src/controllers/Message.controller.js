const MessageService = require('../services/Message.service.js');
const getAllByRoomId = (req, res) => {
  const roomId = req.params.id;
  const filteredMessages = MessageService.filterMessagesByRoomId(roomId);

  res.status(200).send(filteredMessages);
};

module.exports = { getAllByRoomId };
