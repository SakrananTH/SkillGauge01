import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { z } from 'zod';

const {
  PORT = 4000,
  CORS_ORIGIN = 'http://localhost:3002',
  PGHOST = 'localhost',
  PGPORT = '5432',
  PGDATABASE = 'skillgauge',
  PGUSER = 'skillgauge',
  PGPASSWORD = 'skillgauge'
} = process.env;

const pool = new Pool({
  host: PGHOST,
  port: Number(PGPORT),
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
});

const app = express();
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() as now');
    res.json({ ok: true, dbTime: rows[0].now });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'db_unreachable' });
  }
});

const signupSchema = z.object({
  full_name: z.string().min(1).max(120),
  phone: z.string().regex(/^[+0-9]{8,15}$/),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(8),
  role: z.enum(['worker', 'foreman', 'project_manager']).optional().default('worker'),
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const data = signupSchema.parse(req.body);
    const client = await pool.connect();
    try {
      const hash = await bcrypt.hash(data.password, 10);
      await client.query('BEGIN');

      // duplicate check by phone or email(lower)
      const dup = await client.query(
        `SELECT 1 FROM users WHERE phone = $1 OR (email IS NOT NULL AND lower(email) = lower($2))`,
        [data.phone, data.email || null]
      );
      if (dup.rowCount > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: 'Phone or email already exists' });
      }

      const insert = `INSERT INTO users (full_name, phone, email, password_hash, role)
                      VALUES ($1,$2,$3,$4,$5)
                      RETURNING id, full_name, phone, email, role, status, created_at`;
      const { rows } = await client.query(insert, [
        data.full_name,
        data.phone,
        data.email || null,
        hash,
        data.role,
      ]);
      await client.query('COMMIT');
      const user = rows[0];
      res.status(201).json(user);
    } catch (err) {
      await pool.query('ROLLBACK').catch(() => {});
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    } finally {
      client.release();
    }
  } catch (err) {
    if (err?.issues) return res.status(400).json({ message: 'Invalid input', errors: err.issues });
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(Number(PORT), () => {
  console.log(`Auth API listening on http://localhost:${PORT}`);
});
