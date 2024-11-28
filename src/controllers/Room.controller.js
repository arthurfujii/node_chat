const RoomService = require('../services/Room.service.js');

const getAll = (req, res) => {
  res.status(200).send(RoomService.rooms);
};

module.exports = { getAll };
