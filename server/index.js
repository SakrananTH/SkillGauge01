import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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

const { JWT_SECRET = 'dev_secret_change_me', JWT_EXPIRES_IN = '12h' } = process.env;

const pool = new Pool({
  host: PGHOST,
  port: Number(PGPORT),
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
});

const app = express();
app.use(cors({ origin: CORS_ORIGIN, credentials: true, allowedHeaders: ['Content-Type', 'Authorization'] }));
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

      // 1) insert user
      const insertUser = `INSERT INTO users (full_name, phone, email, password_hash)
                          VALUES ($1,$2,$3,$4)
                          RETURNING id, full_name, phone, email, status, created_at`;
      const { rows: userRows } = await client.query(insertUser, [
        data.full_name,
        data.phone,
        data.email || null,
        hash,
      ]);

      const user = userRows[0];

      // 2) attach role via user_roles
      // Always assign 'worker' role on signup; admin can elevate later
      const roleRes = await client.query('SELECT id FROM roles WHERE key = $1', ['worker']);
      if (roleRes.rowCount > 0) {
        await client.query('INSERT INTO user_roles(user_id, role_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [
          user.id,
          roleRes.rows[0].id,
        ]);
      }

      await client.query('COMMIT');
      res.status(201).json({ ...user, role: 'worker' });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
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

// ===== Admin: Manage user roles (grant/revoke) =====
const roleKeySchema = z.object({ role: z.enum(['worker', 'foreman', 'project_manager']) });

app.post('/api/admin/users/:id/roles/grant', requireAuth, authorizeRoles('admin'), async (req, res) => {
  try {
    const id = req.params.id;
    if (!z.string().uuid().safeParse(id).success) return res.status(400).json({ message: 'invalid id' });
    const { role } = roleKeySchema.parse(req.body);
    const { rows: r } = await pool.query('SELECT id FROM roles WHERE key = $1', [role]);
    if (!r.length) return res.status(400).json({ message: 'unknown_role' });
    await pool.query('INSERT INTO user_roles(user_id, role_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, r[0].id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/admin/users/:id/roles/revoke', requireAuth, authorizeRoles('admin'), async (req, res) => {
  try {
    const id = req.params.id;
    if (!z.string().uuid().safeParse(id).success) return res.status(400).json({ message: 'invalid id' });
    const { role } = roleKeySchema.parse(req.body);
    // Prevent removing 'worker' if you want to ensure baseline; allow removal for flexibility
    const { rows: r } = await pool.query('SELECT id FROM roles WHERE key = $1', [role]);
    if (!r.length) return res.status(400).json({ message: 'unknown_role' });
    await pool.query('DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2', [id, r[0].id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Real login with phone + password, returns JWT and user info
const loginSchema = z.object({
  phone: z.string().regex(/^[+0-9]{8,15}$/),
  password: z.string().min(1),
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = loginSchema.parse(req.body);

    // Find user by phone
    const { rows } = await pool.query(
      `SELECT id, full_name, phone, email, password_hash, status
       FROM users
       WHERE phone = $1
       LIMIT 1`,
      [phone]
    );
    if (rows.length === 0) return res.status(401).json({ message: 'invalid_credentials' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash || '');
    if (!ok) return res.status(401).json({ message: 'invalid_credentials' });

    // Fetch roles via function if available
    let roles = [];
    try {
      const r2 = await pool.query('SELECT get_user_roles($1) AS roles', [user.id]);
      roles = r2.rows?.[0]?.roles || [];
    } catch {}

    // Sign JWT
    const payload = { sub: user.id, roles };
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'skillgauge-api',
      audience: 'skillgauge-spa',
    });

    // Return user profile (omit password hash)
    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        phone: user.phone,
        email: user.email,
        status: user.status,
        roles,
      },
    });
  } catch (err) {
    if (err?.issues) return res.status(400).json({ message: 'Invalid input', errors: err.issues });
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== JWT Auth Middleware =====
function getTokenFromHeader(req) {
  const h = req.headers?.authorization || req.headers?.Authorization;
  if (!h || typeof h !== 'string') return null;
  const [type, token] = h.split(' ');
  if (type?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

function requireAuth(req, res, next) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return res.status(401).json({ message: 'missing_token' });
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'skillgauge-api',
      audience: 'skillgauge-spa',
    });
    req.user = { id: payload.sub, roles: payload.roles || [] };
    next();
  } catch (e) {
    return res.status(401).json({ message: 'invalid_token' });
  }
}

function authorizeRoles(...allowed) {
  return (req, res, next) => {
    const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];
    if (allowed.length === 0) return next();
    const ok = roles.some(r => allowed.includes(r));
    if (!ok) return res.status(403).json({ message: 'forbidden' });
    next();
  };
}

// Dashboard: Tasks overview view with filters/pagination
const tasksOverviewQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.enum(['todo', 'in-progress', 'done']).optional(),
  project_id: z.string().uuid().optional(),
  search: z.string().max(120).optional(),
  sort: z.enum(['due_date_asc', 'due_date_desc']).optional().default('due_date_asc'),
});

app.get('/api/dashboard/tasks-overview', requireAuth, authorizeRoles('project_manager'), async (req, res) => {
  try {
    const params = tasksOverviewQuerySchema.parse(req.query);
    const values = [];
    const where = [];

    if (params.status) { values.push(params.status); where.push(`t.status = $${values.length}`); }
    if (params.project_id) { values.push(params.project_id); where.push(`p.id = $${values.length}`); }
    if (params.search) { values.push(`%${params.search}%`); where.push(`t.title ILIKE $${values.length}`); }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderSql = params.sort === 'due_date_desc' ? 'ORDER BY t.due_date DESC NULLS LAST' : 'ORDER BY t.due_date ASC NULLS LAST';

    values.push(params.limit);
    values.push(params.offset);

    const sql = `
      SELECT
        t.id               AS task_id,
        t.title,
        t.status,
        t.priority,
        t.due_date,
        p.id               AS project_id,
        p.name             AS project_name,
        s.id               AS site_id,
        s.name             AS site_name,
        u.id               AS assignee_id,
        u.full_name        AS assignee_name
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      LEFT JOIN sites s ON s.id = t.site_id
      LEFT JOIN users u ON u.id = t.assignee_user_id
      ${whereSql}
      ${orderSql}
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `;

    const { rows } = await pool.query(sql, values);
    res.json({ items: rows, limit: params.limit, offset: params.offset });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Invalid query' });
  }
});

// Dashboard: Project task counts from materialized view (optionally refresh)
const countsQuerySchema = z.object({ refresh: z.coerce.boolean().optional().default(false) });
app.get('/api/dashboard/project-task-counts', requireAuth, authorizeRoles('project_manager'), async (req, res) => {
  try {
    const { refresh } = countsQuerySchema.parse(req.query);
    if (refresh) {
      // First refresh (non-concurrent) is safest for local dev
      await pool.query('REFRESH MATERIALIZED VIEW mv_project_task_counts');
    }
    const { rows } = await pool.query(
      'SELECT project_id, project_name, tasks_total, tasks_todo, tasks_in_progress, tasks_done FROM mv_project_task_counts ORDER BY project_name'
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Utility: expose user roles array from function (optional)
app.get('/api/users/:id/roles', async (req, res) => {
  try {
    const id = req.params.id;
    if (!z.string().uuid().safeParse(id).success) return res.status(400).json({ message: 'invalid id' });
    const { rows } = await pool.query('SELECT get_user_roles($1) AS roles', [id]);
    res.json({ user_id: id, roles: rows[0]?.roles || [] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Lookup user by phone (simple helper for demo login to fetch user_id)
const phoneQuerySchema = z.object({ phone: z.string().min(3) });
app.get('/api/users/by-phone', async (req, res) => {
  try {
    const { phone } = phoneQuerySchema.parse(req.query);
    const { rows } = await pool.query(
      `SELECT id, full_name, phone, email FROM users WHERE phone = $1 LIMIT 1`,
      [phone]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'not_found' });
    // also return roles via function if exists
    const { rows: r2 } = await pool.query('SELECT get_user_roles($1) AS roles', [rows[0].id]);
    res.json({ ...rows[0], roles: r2[0]?.roles || [] });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Invalid phone' });
  }
});

app.listen(Number(PORT), () => {
  console.log(`Auth API listening on http://localhost:${PORT}`);
});
