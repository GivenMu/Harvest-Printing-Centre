// Mock Firebase so no real project is needed. Token "good-token" = user u1, "other-token" = user u2,
// "mobile-token" = user u3 from the Android app's Firebase project.
jest.mock('../firebase', () => {
  const makeFakeDb = require('./fakeDb');
  const db = makeFakeDb({
    services: {
      'business-cards': { name: 'Business Cards', price: 300, sortOrder: 1 },
      'banners': { name: 'Banners', price: null, sortOrder: 2 },
    },
  });
  const tokens = { 'good-token': 'u1', 'other-token': 'u2' };
  const admin = {
    auth: () => ({
      verifyIdToken: async (t) => {
        if (!tokens[t]) throw new Error('bad token');
        return { uid: tokens[t], email: `${tokens[t]}@test.com` };
      },
    }),
    firestore: { FieldValue: { serverTimestamp: () => 'TS' } },
  };
  const mobileAuth = {
    verifyIdToken: async (t) => {
      if (t !== 'mobile-token') throw new Error('bad token');
      return { uid: 'u3', email: 'u3@test.com' };
    },
  };
  return { admin, db, extraAuths: [mobileAuth] };
});

const request = require('supertest');
const app = require('../app');
const v = require('../validators');

const auth = (t = 'good-token') => ({ Authorization: `Bearer ${t}` });
const validBooking = {
  name: 'Thabo', phone: '0821234567', email: 't@test.com',
  service: 'Business Cards', quantity: 100, date: '2026-12-01',
};

describe('public routes', () => {
  test('GET / health check returns 200', async () => {
    expect((await request(app).get('/')).statusCode).toBe(200);
  });
  test('GET /services returns 200 and a sorted list', async () => {
    const res = await request(app).get('/services');
    expect(res.statusCode).toBe(200);
    expect(res.body.map((s) => s.id)).toEqual(['business-cards', 'banners']);
  });
  test('GET /services/:id returns one service', async () => {
    const res = await request(app).get('/services/business-cards');
    expect(res.statusCode).toBe(200);
    expect(res.body.price).toBe(300);
  });
  test('GET /services/:id unknown returns 404', async () => {
    expect((await request(app).get('/services/nope')).statusCode).toBe(404);
  });
  test('Unknown route returns 404', async () => {
    expect((await request(app).get('/does-not-exist')).statusCode).toBe(404);
  });
});

describe('authentication', () => {
  test('POST /bookings without a token returns 401', async () => {
    expect((await request(app).post('/bookings').send({})).statusCode).toBe(401);
  });
  test('GET /orders with a bad token returns 401', async () => {
    expect((await request(app).get('/orders').set(auth('wrong'))).statusCode).toBe(401);
  });
  test('a token from the Android app\'s project can place an order', async () => {
    const res = await request(app).post('/orders').set(auth('mobile-token'))
      .send({ items: [{ serviceId: 'business-cards', quantity: 1 }] });
    expect(res.statusCode).toBe(201);
    expect(res.body.userId).toBe('u3');
  });
});

describe('bookings', () => {
  test('rejects invalid input with 400', async () => {
    const res = await request(app).post('/bookings').set(auth()).send({ ...validBooking, email: 'nope' });
    expect(res.statusCode).toBe(400);
  });
  test('creates, lists, updates and deletes a booking', async () => {
    const created = await request(app).post('/bookings').set(auth()).send(validBooking);
    expect(created.statusCode).toBe(201);
    const id = created.body.id;

    const list = await request(app).get('/bookings').set(auth());
    expect(list.statusCode).toBe(200);
    expect(list.body.some((b) => b.id === id)).toBe(true);

    const upd = await request(app).put(`/bookings/${id}`).set(auth()).send({ quantity: 250 });
    expect(upd.statusCode).toBe(200);

    const del = await request(app).delete(`/bookings/${id}`).set(auth());
    expect(del.statusCode).toBe(200);
    expect((await request(app).delete(`/bookings/${id}`).set(auth())).statusCode).toBe(404);
  });
  test("a user cannot change another user's booking", async () => {
    const created = await request(app).post('/bookings').set(auth()).send(validBooking);
    const res = await request(app).put(`/bookings/${created.body.id}`).set(auth('other-token')).send({ quantity: 5 });
    expect(res.statusCode).toBe(404);
  });
});

describe('orders', () => {
  test('rejects an empty order with 400', async () => {
    expect((await request(app).post('/orders').set(auth()).send({ items: [] })).statusCode).toBe(400);
  });
  test('rejects a negative quantity with 400', async () => {
    const res = await request(app).post('/orders').set(auth())
      .send({ items: [{ serviceId: 'business-cards', quantity: -1 }] });
    expect(res.statusCode).toBe(400);
  });
  test('creates an order using the server-side price', async () => {
    const res = await request(app).post('/orders').set(auth())
      .send({ items: [{ serviceId: 'business-cards', quantity: 2 }, { serviceId: 'banners', quantity: 1 }] });
    expect(res.statusCode).toBe(201);
    expect(res.body.total).toBe(600);
    expect(res.body.requiresQuote).toBe(true);
    const list = await request(app).get('/orders').set(auth());
    expect(list.body.length).toBe(1);
  });
});

describe('validators', () => {
  test('email', () => { expect(v.isValidEmail('a@b.com')).toBe(true); expect(v.isValidEmail('')).toBe(false); });
  test('phone is digits only', () => { expect(v.isValidPhone('0821234567')).toBe(true); expect(v.isValidPhone('07a1')).toBe(false); });
  test('quantity and date rules', () => {
    expect(v.isValidDate('2026-02-30')).toBe(false);
    expect(v.isPositiveInt(0)).toBe(false);
    expect(v.isPositiveInt(3)).toBe(true);
  });
});
