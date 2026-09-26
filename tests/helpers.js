const { signToken } = require('../backend/src/middleware/auth');

const customer = { id: 3, name: 'Carol Customer', email: 'carol@example.com', role: 'customer' };
const otherCustomer = { id: 4, name: 'Dave Customer', email: 'dave@example.com', role: 'customer' };
const agent = { id: 1, name: 'Alice Agent', email: 'agent@example.com', role: 'agent' };

const bearer = (user) => `Bearer ${signToken(user)}`;

function makeTicket(overrides = {}) {
  return {
    id: 10,
    user_id: customer.id,
    subject: 'Cannot log in',
    description: 'The login page keeps rejecting my password.',
    priority: 'medium',
    status: 'open',
    assigned_to: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    customer_name: customer.name,
    customer_email: customer.email,
    assigned_to_name: null,
    ...overrides,
  };
}

module.exports = { customer, otherCustomer, agent, bearer, makeTicket };
