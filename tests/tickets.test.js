const request = require('supertest');

jest.mock('../backend/src/models/ticketModel', () => ({
  ...jest.requireActual('../backend/src/models/ticketModel'),
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getStats: jest.fn(),
}));
jest.mock('../backend/src/models/userModel');
jest.mock('../backend/src/models/commentModel');

const Ticket = require('../backend/src/models/ticketModel');
const User = require('../backend/src/models/userModel');
const Comment = require('../backend/src/models/commentModel');
const app = require('../backend/src/app');
const { customer, otherCustomer, agent, bearer, makeTicket } = require('./helpers');

beforeEach(() => jest.clearAllMocks());

describe('Authentication on protected routes', () => {
  it('returns 401 when no token is sent', async () => {
    const res = await request(app).get('/api/tickets');
    expect(res.status).toBe(401);
    expect(Ticket.findAll).not.toHaveBeenCalled();
  });

  it('returns 401 for a tampered/invalid token', async () => {
    const res = await request(app).get('/api/tickets').set('Authorization', 'Bearer abc.def.ghi');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/tickets', () => {
  it("scopes a customer's list to their own tickets, even if they try to filter otherwise", async () => {
    Ticket.findAll.mockResolvedValue([makeTicket()]);

    const res = await request(app)
      .get('/api/tickets?status=open&search=login&user_id=4')
      .set('Authorization', bearer(customer));

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(Ticket.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ userId: customer.id, status: 'open', search: 'login' }),
    );
  });

  it('lets an agent see all tickets with sorting', async () => {
    Ticket.findAll.mockResolvedValue([makeTicket(), makeTicket({ id: 11, user_id: otherCustomer.id })]);

    const res = await request(app)
      .get('/api/tickets?sort=priority&order=desc&assigned_to=me')
      .set('Authorization', bearer(agent));

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(Ticket.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ userId: undefined, sort: 'priority', order: 'desc', assignedTo: agent.id }),
    );
  });

  it('rejects an unknown filter value with 400', async () => {
    const res = await request(app).get('/api/tickets?status=deleted').set('Authorization', bearer(agent));
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('status');
  });
});

describe('POST /api/tickets', () => {
  it('creates a ticket for the logged-in customer', async () => {
    Ticket.create.mockImplementation(async (data) => makeTicket({ id: 99, ...data, user_id: data.userId }));

    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', bearer(customer))
      .send({ subject: 'Printer not working', description: 'It shows a paper jam error.', priority: 'high' });

    expect(res.status).toBe(201);
    expect(res.body.ticket).toMatchObject({ id: 99, subject: 'Printer not working', priority: 'high' });
    expect(Ticket.create).toHaveBeenCalledWith(expect.objectContaining({ userId: customer.id }));
  });

  it('returns 400 for invalid input', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', bearer(customer))
      .send({ subject: 'Hi', priority: 'critical' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['subject', 'description', 'priority']));
    expect(Ticket.create).not.toHaveBeenCalled();
  });

  it('returns 403 when an agent tries to create a ticket (wrong role)', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', bearer(agent))
      .send({ subject: 'Printer not working', description: 'It shows a paper jam error.' });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/tickets/:id', () => {
  it('returns the ticket to its owner', async () => {
    Ticket.findById.mockResolvedValue(makeTicket());
    const res = await request(app).get('/api/tickets/10').set('Authorization', bearer(customer));
    expect(res.status).toBe(200);
    expect(res.body.ticket.id).toBe(10);
  });

  it("prevents a customer from reading another customer's ticket (403)", async () => {
    Ticket.findById.mockResolvedValue(makeTicket({ user_id: customer.id }));
    const res = await request(app).get('/api/tickets/10').set('Authorization', bearer(otherCustomer));
    expect(res.status).toBe(403);
    expect(res.body.ticket).toBeUndefined();
  });

  it('returns 404 for a ticket that does not exist', async () => {
    Ticket.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/tickets/12345').set('Authorization', bearer(agent));
    expect(res.status).toBe(404);
  });

  it('returns 400 for a non-numeric ticket id', async () => {
    const res = await request(app).get('/api/tickets/abc').set('Authorization', bearer(agent));
    expect(res.status).toBe(400);
    expect(Ticket.findById).not.toHaveBeenCalled();
  });
});

describe('PUT /api/tickets/:id', () => {
  it('lets an agent update status and assign the ticket to an agent', async () => {
    Ticket.findById.mockResolvedValue(makeTicket());
    User.findById.mockResolvedValue({ ...agent });
    Ticket.update.mockImplementation(async (id, fields) => makeTicket({ id, ...fields }));

    const res = await request(app)
      .put('/api/tickets/10')
      .set('Authorization', bearer(agent))
      .send({ status: 'in_progress', assigned_to: agent.id });

    expect(res.status).toBe(200);
    expect(res.body.ticket).toMatchObject({ status: 'in_progress', assigned_to: agent.id });
    expect(Ticket.update).toHaveBeenCalledWith(10, { status: 'in_progress', assigned_to: agent.id });
  });

  it('rejects assigning a ticket to a non-agent user', async () => {
    Ticket.findById.mockResolvedValue(makeTicket());
    User.findById.mockResolvedValue({ ...customer });

    const res = await request(app)
      .put('/api/tickets/10')
      .set('Authorization', bearer(agent))
      .send({ assigned_to: customer.id });

    expect(res.status).toBe(400);
    expect(Ticket.update).not.toHaveBeenCalled();
  });

  it('forbids a customer from changing the status of their own ticket', async () => {
    Ticket.findById.mockResolvedValue(makeTicket());

    const res = await request(app)
      .put('/api/tickets/10')
      .set('Authorization', bearer(customer))
      .send({ status: 'closed' });

    expect(res.status).toBe(403);
    expect(Ticket.update).not.toHaveBeenCalled();
  });

  it("forbids a customer from editing another customer's ticket", async () => {
    Ticket.findById.mockResolvedValue(makeTicket({ user_id: customer.id }));

    const res = await request(app)
      .put('/api/tickets/10')
      .set('Authorization', bearer(otherCustomer))
      .send({ subject: 'Hijacked subject' });

    expect(res.status).toBe(403);
    expect(Ticket.update).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/tickets/:id', () => {
  it('lets a customer withdraw their own open ticket', async () => {
    Ticket.findById.mockResolvedValue(makeTicket({ status: 'open' }));
    Ticket.remove.mockResolvedValue(true);

    const res = await request(app).delete('/api/tickets/10').set('Authorization', bearer(customer));
    expect(res.status).toBe(204);
  });

  it('prevents a customer deleting a ticket that is already being worked on', async () => {
    Ticket.findById.mockResolvedValue(makeTicket({ status: 'in_progress' }));

    const res = await request(app).delete('/api/tickets/10').set('Authorization', bearer(customer));
    expect(res.status).toBe(403);
    expect(Ticket.remove).not.toHaveBeenCalled();
  });
});

describe('Ticket comments', () => {
  it('adds a comment to an accessible ticket', async () => {
    Ticket.findById.mockResolvedValue(makeTicket());
    Comment.create.mockImplementation(async ({ ticketId, userId, comment }) => ({
      id: 1, ticket_id: ticketId, user_id: userId, comment, author_name: customer.name, author_role: 'customer',
    }));

    const res = await request(app)
      .post('/api/tickets/10/comments')
      .set('Authorization', bearer(customer))
      .send({ comment: 'Any update on this?' });

    expect(res.status).toBe(201);
    expect(res.body.comment).toMatchObject({ ticket_id: 10, user_id: customer.id, comment: 'Any update on this?' });
  });

  it("blocks reading comments on another customer's ticket", async () => {
    Ticket.findById.mockResolvedValue(makeTicket({ user_id: customer.id }));

    const res = await request(app).get('/api/tickets/10/comments').set('Authorization', bearer(otherCustomer));
    expect(res.status).toBe(403);
    expect(Comment.findByTicket).not.toHaveBeenCalled();
  });

  it('rejects an empty comment', async () => {
    const res = await request(app)
      .post('/api/tickets/10/comments')
      .set('Authorization', bearer(customer))
      .send({ comment: '   ' });
    expect(res.status).toBe(400);
  });
});

describe('Agent-only endpoints', () => {
  it('GET /api/users is forbidden for customers', async () => {
    const res = await request(app).get('/api/users').set('Authorization', bearer(customer));
    expect(res.status).toBe(403);
    expect(User.findAll).not.toHaveBeenCalled();
  });

  it('GET /api/users returns agents for an agent', async () => {
    User.findAll.mockResolvedValue([{ ...agent }]);
    const res = await request(app).get('/api/users?role=agent').set('Authorization', bearer(agent));
    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(User.findAll).toHaveBeenCalledWith({ role: 'agent' });
  });

  it('GET /api/tickets/stats is forbidden for customers', async () => {
    const res = await request(app).get('/api/tickets/stats').set('Authorization', bearer(customer));
    expect(res.status).toBe(403);
  });
});
