const Ticket = require('../models/ticketModel');
const User = require('../models/userModel');
const HttpError = require('../utils/httpError');

// Which fields each role may change through PUT /api/tickets/:id
const EDITABLE_BY_ROLE = {
  agent: ['status', 'priority', 'assigned_to'],
  customer: ['subject', 'description', 'priority'],
};

/**
 * Load a ticket and check the current user may see it.
 * 404 if it does not exist; 403 if a customer asks for someone else's ticket.
 * Exported so the comment controller applies exactly the same rule.
 */
async function getAccessibleTicket(ticketId, user) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw HttpError.notFound(`Ticket ${ticketId} not found`);
  if (user.role === 'customer' && ticket.user_id !== user.id) {
    throw HttpError.forbidden('You can only access your own tickets');
  }
  return ticket;
}

async function list(req, res) {
  const { status, priority, sort, order } = req.query;
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
  let { assigned_to: assignedTo } = req.query;
  if (assignedTo === 'me') assignedTo = req.user.id;

  const tickets = await Ticket.findAll({
    // Customers are always scoped to their own tickets, whatever they send.
    userId: req.user.role === 'customer' ? req.user.id : undefined,
    search,
    status,
    priority,
    assignedTo,
    sort,
    order,
  });

  res.json({ count: tickets.length, tickets });
}

async function stats(req, res) {
  res.json({ stats: await Ticket.getStats(req.user.id) });
}

async function getOne(req, res) {
  const ticket = await getAccessibleTicket(Number(req.params.id), req.user);
  res.json({ ticket });
}

async function create(req, res) {
  const { subject, description, priority } = req.body;
  const ticket = await Ticket.create({ userId: req.user.id, subject, description, priority });
  res.status(201).json({ ticket });
}

async function update(req, res) {
  const ticket = await getAccessibleTicket(Number(req.params.id), req.user);
  const allowed = EDITABLE_BY_ROLE[req.user.role] || [];

  const requested = Object.keys(req.body).filter((key) =>
    ['subject', 'description', 'priority', 'status', 'assigned_to'].includes(key),
  );
  if (requested.length === 0) {
    throw HttpError.badRequest('Provide at least one field to update', [
      { field: 'body', message: `Updatable fields: ${allowed.join(', ')}` },
    ]);
  }

  const forbidden = requested.filter((key) => !allowed.includes(key));
  if (forbidden.length) {
    throw HttpError.forbidden(`Your role (${req.user.role}) cannot change: ${forbidden.join(', ')}`);
  }

  if (req.user.role === 'customer' && ['resolved', 'closed'].includes(ticket.status)) {
    throw HttpError.forbidden('Resolved or closed tickets can no longer be edited');
  }

  if (req.body.assigned_to !== undefined && req.body.assigned_to !== null) {
    const assignee = await User.findById(req.body.assigned_to);
    if (!assignee || assignee.role !== 'agent') {
      throw HttpError.badRequest('Validation failed', [
        { field: 'assigned_to', message: 'Tickets can only be assigned to an existing agent' },
      ]);
    }
  }

  const fields = {};
  for (const key of requested) fields[key] = req.body[key];

  const updated = await Ticket.update(ticket.id, fields);
  res.json({ ticket: updated });
}

/**
 * Delete policy:
 *  - agents may delete any ticket (e.g. spam / duplicates)
 *  - customers may delete (withdraw) their own ticket only while it is still "open"
 */
async function remove(req, res) {
  const ticket = await getAccessibleTicket(Number(req.params.id), req.user);

  if (req.user.role === 'customer' && ticket.status !== 'open') {
    throw HttpError.forbidden('You can only delete your ticket while it is still open');
  }

  await Ticket.remove(ticket.id);
  res.status(204).send();
}

module.exports = { list, stats, getOne, create, update, remove, getAccessibleTicket };
