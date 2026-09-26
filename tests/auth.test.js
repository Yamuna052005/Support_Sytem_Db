const request = require('supertest');
const bcrypt = require('bcryptjs');

// The database layer is mocked so tests run without a MySQL server.
jest.mock('../backend/src/models/userModel');
const User = require('../backend/src/models/userModel');
const app = require('../backend/src/app');

const PASSWORD = 'Password123!';
let storedUser;

beforeAll(async () => {
  storedUser = {
    id: 3,
    name: 'Carol Customer',
    email: 'carol@example.com',
    role: 'customer',
    password_hash: await bcrypt.hash(PASSWORD, 4),
    created_at: '2026-01-01T00:00:00.000Z',
  };
});

beforeEach(() => jest.resetAllMocks());

describe('POST /api/auth/register', () => {
  it('registers a new customer, hashes the password and returns a JWT', async () => {
    User.findByEmail.mockResolvedValue(null);
    User.create.mockImplementation(async ({ name, email }) => ({
      id: 42, name, email, role: 'customer', created_at: '2026-01-01T00:00:00.000Z',
    }));

    const res = await request(app)
      .post('/api/auth/register')
      // attempting to self-assign the agent role must be ignored
      .send({ name: 'New User', email: 'NEW@Example.com', password: PASSWORD, role: 'agent' });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ id: 42, email: 'new@example.com', role: 'customer' });
    expect(res.body.user.password_hash).toBeUndefined();

    const saved = User.create.mock.calls[0][0];
    expect(saved.role).toBe('customer');
    expect(saved.passwordHash).not.toBe(PASSWORD);
    expect(await bcrypt.compare(PASSWORD, saved.passwordHash)).toBe(true);
  });

  it('rejects a duplicate email with 409', async () => {
    User.findByEmail.mockResolvedValue(storedUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Carol', email: 'carol@example.com', password: PASSWORD });

    expect(res.status).toBe(409);
    expect(User.create).not.toHaveBeenCalled();
  });

  it('rejects invalid input with 400 and field errors', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials', async () => {
    User.findByEmail.mockResolvedValue(storedUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'carol@example.com', password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ id: 3, role: 'customer' });
  });

  it('rejects an invalid password with 401', async () => {
    User.findByEmail.mockResolvedValue(storedUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'carol@example.com', password: 'WrongPassword1' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
    expect(res.body.token).toBeUndefined();
  });

  it('gives the same 401 for an unknown email (no account enumeration)', async () => {
    User.findByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });
});
