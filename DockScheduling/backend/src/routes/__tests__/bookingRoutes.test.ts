import express from 'express';
import request from 'supertest';
import { bookingRoutes } from '../bookingRoutes';
import { Pool } from 'pg';

jest.mock('pg', () => {
  const mPool = { query: jest.fn() };
  return { Pool: jest.fn(() => mPool) };
});

describe('bookingRoutes', () => {
  let app: express.Application;
  let pool: any;

  beforeEach(() => {
    pool = new Pool();
    app = express();
    app.use(express.json());
    app.use('/api/bookings', bookingRoutes(pool));
  });

  it('GET /api/bookings returns bookings', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/bookings');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /api/bookings/auto-assign missing fields', async () => {
    const res = await request(app).post('/api/bookings/auto-assign').send({});
    expect(res.status).toBe(400);
  });
});
