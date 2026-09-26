const User = require('../models/userModel');

async function list(req, res) {
  const users = await User.findAll({ role: req.query.role });
  res.json({ count: users.length, users });
}

module.exports = { list };
