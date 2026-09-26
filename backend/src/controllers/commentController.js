const Comment = require('../models/commentModel');
const { getAccessibleTicket } = require('./ticketController');

async function list(req, res) {
  const ticket = await getAccessibleTicket(Number(req.params.id), req.user);
  const comments = await Comment.findByTicket(ticket.id);
  res.json({ count: comments.length, comments });
}

async function create(req, res) {
  const ticket = await getAccessibleTicket(Number(req.params.id), req.user);
  const comment = await Comment.create({
    ticketId: ticket.id,
    userId: req.user.id,
    comment: req.body.comment,
  });
  res.status(201).json({ comment });
}

module.exports = { list, create };
