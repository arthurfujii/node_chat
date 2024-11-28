const messages = [];

const buildMsg = (text, user) => {
  const time = new Intl.DateTimeFormat('pt-BR', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).format(new Date());

  return { text, user, time };
};

const addOne = (msg) => {
  messages.push(msg);
  messages.sort((a, b) => a.time - b.time);
};

const filterMessagesByRoomId = (roomId) => {
  return messages.filter((msg) => msg.user.currentRoom.id === +roomId);
};

module.exports = {
  messages,
  buildMsg,
  addOne,
  filterMessagesByRoomId,
};
