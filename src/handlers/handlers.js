const UserService = require('../services/User.service.js');
const MessageService = require('../services/Message.service.js');
const RoomService = require('../services/Room.service.js');

module.exports = (io, socket) => {
  const sendMessage = (data) => {
    const message = MessageService.buildMsg(data.text, data.user);

    MessageService.addOne(message);
    io.to(message.user.currentRoom.name).emit('message', message);
  };

  const createRoom = (data) => {
    const room = RoomService.buildRoom(data);

    RoomService.addOne(room);
    io.emit('rooms', RoomService.rooms);
  };

  const createUser = (data) => {
    const user = UserService.buildUser(data);

    UserService.addOne(user);
    io.emit('users', UserService.users);
    socket.emit('user', user);
  };

  const deleteUser = (data) => {
    UserService.removeOne(data);
    io.emit('users', UserService.users);
  };

  const joinRoom = (data) => {
    const user = UserService.updateUserRoom(data.user.id, data.room);

    socket.emit('user', user);
    io.emit('users', UserService.users);

    const joinMsg = MessageService.buildMsg(`${user.username} joined room`, {
      id: 0,
      username: 'Admin',
      currentRoom: data.room,
    });

    socket.join(user.currentRoom.name);
    MessageService.addOne(joinMsg);
    socket.broadcast.to(user.currentRoom.name).emit('message', joinMsg);
  };

  const disconnect = () => {
    const user = UserService.findUserById(socket.id);

    if (user && user.currentRoom) {
      const exitMsg = MessageService.buildMsg(`${user.username} left room`, {
        id: 0,
        username: 'Admin',
        currentRoom: user.currentRoom,
      });

      socket.leave(user.currentRoom.name);
      socket.broadcast.to(user.currentRoom.name).emit('message', exitMsg);
    }

    UserService.removeOne(socket.id);
    io.emit('users', UserService.users);

    // eslint-disable-next-line no-console
    console.log(`User ${socket.id} disconnected`);
  };

  const leaveRoom = (data) => {
    const exitMsg = MessageService.buildMsg(`${data.username} left room`, {
      id: 0,
      username: 'Admin',
      currentRoom: data.room,
    });

    socket.leave(data.currentRoom.name);
    MessageService.addOne(exitMsg);
    socket.broadcast.to(data.currentRoom.name).emit('message', exitMsg);

    const user = UserService.updateUserRoom(data.id, null);

    socket.emit('user', user);
    io.emit('users', UserService.users);
  };

  socket.on('sendMessage', sendMessage);
  socket.on('createRoom', createRoom);
  socket.on('createUser', createUser);
  socket.on('deleteUser', deleteUser);
  socket.on('joinRoom', joinRoom);
  socket.on('leaveRoom', leaveRoom);
  socket.on('disconnect', disconnect);
};
