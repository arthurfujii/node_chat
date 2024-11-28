const { generateId } = require('../utils');

let rooms = [];

const buildRoom = (name) => {
  return { id: generateId(rooms), name };
};
const addOne = (room) => {
  rooms.push(room);
};

const removeOne = (id) => {
  rooms = rooms.filter((item) => item.id === id);
};

module.exports = {
  rooms,
  buildRoom,
  addOne,
  removeOne,
};
