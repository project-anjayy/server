const request = require('supertest');
const app = require('../app');

describe('POST /api/auth/register', () => {
  it('should register a new user and return user data (201)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Test User',
        email: 'testuser@example.com',
        password: 'password123'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('name', 'Test User');
    expect(res.body.data).toHaveProperty('email', 'testuser@example.com');
  });

  it('should not register with missing fields (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: '', password: '' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('status', 'error');
  });

  it('should not register with duplicate email (400)', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Test User',
        email: 'dupe@example.com',
        password: 'password123'
      });
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Test User',
        email: 'dupe@example.com',
        password: 'password123'
      });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('status', 'error');
    expect(res.body).toHaveProperty('message', 'Email already registered');
  });
});
