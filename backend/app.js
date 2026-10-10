import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import ticketsRouter from './routes/tickets.js';

export const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok' });
});

app.use('/tickets', ticketsRouter);

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler (must have 4 arguments)
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});