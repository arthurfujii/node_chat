const UserService = require('../services/User.service.js');
const getAll = (req, res) => {
  res.status(200).send(UserService.users);
};

module.exports = { getAll };
