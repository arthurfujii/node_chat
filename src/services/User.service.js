const { generateId } = require('../utils.js');
let users = [];

const findUserById = (id) => {
  return users.find((usr) => usr.id === id);
};

const updateUserRoom = (id, room) => {
  const user = findUserById(id);

  user.currentRoom = room;

  return user;
};

const removeOne = (id) => {
  users = users.filter((usr) => usr.id !== id);
};

const addOne = (user) => {
  users.push(user);
};

const buildUser = (username) => {
  return { id: generateId(users), username };
};

module.exports = {
  updateUserRoom,
  findUserById,
  removeOne,
  addOne,
  buildUser,
  users,
};
