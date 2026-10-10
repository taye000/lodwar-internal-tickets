import { describe, test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/db.js';

const createTicket = (data) => request(app).post('/tickets').send(data);

beforeEach(async () => {
  await pool.query('TRUNCATE tickets RESTART IDENTITY');
});

after(async () => {
  await pool.end();
});

describe('POST /tickets', () => {
  test('creates a ticket with default status and priority', async () => {
    const res = await createTicket({ title: '  Printer not working  ' });

    assert.equal(res.status, 201);
    assert.equal(res.body.title, 'Printer not working');
    assert.equal(res.body.status, 'open');
    assert.equal(res.body.priority, 'medium');
    assert.equal(res.body.description, null);
    assert.ok(res.body.id);
    assert.ok(res.body.created_at);
  });

  test('rejects a missing title with 400 and saves nothing', async () => {
    const res = await createTicket({ priority: 'high' });

    assert.equal(res.status, 400);
    assert.ok(res.body.details.some((d) => d.field === 'title'));

    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM tickets');
    assert.equal(rows[0].n, 0);
  });

  test('rejects an invalid priority', async () => {
    const res = await createTicket({ title: 'Test', priority: 'urgent' });
    assert.equal(res.status, 400);
  });
});

describe('GET /tickets/stats', () => {
  test('returns all statuses as zero when there are no tickets', async () => {
    const res = await request(app).get('/tickets/stats');

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { open: 0, in_progress: 0, closed: 0 });
  });

  test('counts tickets grouped by status', async () => {
    await createTicket({ title: 'A' });
    await createTicket({ title: 'B' });
    await createTicket({ title: 'C', status: 'closed' });

    const res = await request(app).get('/tickets/stats');

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { open: 2, in_progress: 0, closed: 1 });
  });
});

describe('GET /tickets', () => {
  test('filters by status and paginates', async () => {
    for (const title of ['A', 'B', 'C']) await createTicket({ title });
    await createTicket({ title: 'D', status: 'closed' });

    const res = await request(app).get('/tickets?status=open&page=2&limit=2');

    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 1);
    assert.ok(res.body.data.every((t) => t.status === 'open'));
    assert.deepEqual(res.body.pagination, {
      page: 2,
      limit: 2,
      total: 3,
      totalPages: 2,
    });
  });

  test('rejects an invalid status filter', async () => {
    const res = await request(app).get('/tickets?status=done');
    assert.equal(res.status, 400);
  });
});

describe('PATCH /tickets/:id', () => {
  test('updates status and leaves priority unchanged', async () => {
    const created = await createTicket({ title: 'A', priority: 'high' });

    const res = await request(app)
      .patch(`/tickets/${created.body.id}`)
      .send({ status: 'in_progress' });

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'in_progress');
    assert.equal(res.body.priority, 'high');
  });

  test('returns 404 for a ticket that does not exist', async () => {
    const res = await request(app).patch('/tickets/9999').send({ status: 'closed' });
    assert.equal(res.status, 404);
  });

  test('returns 400 when neither status nor priority is provided', async () => {
    const created = await createTicket({ title: 'A' });
    const res = await request(app).patch(`/tickets/${created.body.id}`).send({});
    assert.equal(res.status, 400);
  });
});