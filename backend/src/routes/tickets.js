import { Router } from 'express';
import { matchedData } from 'express-validator';
import { pool } from '../db.js';
import {
  STATUSES,
  validate,
  createTicketRules,
  listTicketsRules,
  updateTicketRules,
} from '../validation.js';

const router = Router();

// GET /tickets/stats
router.get('/stats', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT status, COUNT(*)::int AS count FROM tickets GROUP BY status'
  );

  const stats = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const row of rows) stats[row.status] = row.count;

  res.json(stats);
});

// POST /tickets
router.post('/', createTicketRules, validate, async (req, res) => {
  const {
    title,
    description = null,
    status = 'open',
    priority = 'medium',
  } = matchedData(req);

  const { rows } = await pool.query(
    `INSERT INTO tickets (title, description, status, priority)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, description, status, priority]
  );

  res.status(201).json(rows[0]);
});

// GET /tickets?status=&page=&limit=
router.get('/', listTicketsRules, validate, async (req, res) => {
  const { status = null, page = 1, limit = 10 } = matchedData(req);
  const offset = (page - 1) * limit;
  const filter = '($1::ticket_status IS NULL OR status = $1)';

  const [dataResult, countResult] = await Promise.all([
    pool.query(
      `SELECT * FROM tickets
       WHERE ${filter}
       ORDER BY created_at DESC, id DESC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total FROM tickets WHERE ${filter}`,
      [status]
    ),
  ]);

  const total = countResult.rows[0].total;

  res.json({
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// PATCH /tickets/:id
router.patch('/:id', updateTicketRules, validate, async (req, res) => {
  const { id, status = null, priority = null } = matchedData(req);

  const { rows } = await pool.query(
    `UPDATE tickets
     SET status   = COALESCE($1::ticket_status, status),
         priority = COALESCE($2::ticket_priority, priority)
     WHERE id = $3
     RETURNING *`,
    [status, priority, id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  res.json(rows[0]);
});

export default router;