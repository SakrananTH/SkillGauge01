import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';
import { z } from 'zod';

const {
  PORT = 4000,
  CORS_ORIGIN = 'http://localhost:3002',
  MYSQL_HOST = 'localhost',
  MYSQL_PORT = '3306',
  MYSQL_DATABASE = 'skillgauge',
  MYSQL_USER = 'skillgauge',
  MYSQL_PASSWORD = 'skillgauge',
  JWT_SECRET = 'dev_secret_change_me',
  JWT_EXPIRES_IN = '12h'
} = process.env;

const pool = mysql.createPool({
  host: MYSQL_HOST,
  port: Number(MYSQL_PORT),
  database: MYSQL_DATABASE,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: false
});

const app = express();
app.use(cors({ origin: CORS_ORIGIN, credentials: true, allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------
function normalizePhoneTH(input) {
  const raw = String(input || '').trim();
  if (!raw) return raw;
  if (raw.startsWith('+')) return raw;
  if (/^0\d{9}$/.test(raw)) return `+66${raw.slice(1)}`;
  if (/^66\d{9}$/.test(raw)) return `+${raw}`;
  return raw;
}

const uuidSchema = z.string().uuid();

async function execute(sql, params = [], connection) {
  const executor = connection ?? pool;
  const [result] = await executor.execute(sql, params);
  return result;
}

async function query(sql, params = [], connection) {
  const result = await execute(sql, params, connection);
  return Array.isArray(result) ? result : [];
}

async function queryOne(sql, params = [], connection) {
  const rows = await query(sql, params, connection);
  return rows[0] ?? null;
}

async function withTransaction(handler) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await handler(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function buildUpdateClause(data) {
  const entries = Object.entries(data).filter(([, value]) => value !== undefined);
  return {
    sets: entries.map(([column]) => `${column} = ?`),
    values: entries.map(([, value]) => value)
  };
}

async function fetchUserRoles(userId, connection) {
  const rows = await query(
    'SELECT r.key FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ? ORDER BY r.key',
    [userId],
    connection
  );
  return rows.map(row => row.key);
}

async function replaceUserRoles(userId, roles, connection) {
  await execute('DELETE FROM user_roles WHERE user_id = ?', [userId], connection);
  if (!roles || roles.length === 0) return;
  const roleRows = await query('SELECT id FROM roles WHERE key IN (?)', [roles], connection);
  for (const role of roleRows) {
    await execute('INSERT IGNORE INTO user_roles(user_id, role_id) VALUES (?, ?)', [userId, role.id], connection);
  }
}

function getTokenFromHeader(req) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (typeof header !== 'string') return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

function requireAuth(req, res, next) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return res.status(401).json({ message: 'missing_token' });
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'skillgauge-api',
      audience: 'skillgauge-spa'
    });
    req.user = { id: payload.sub, roles: payload.roles || [] };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'invalid_token' });
  }
}

function authorizeRoles(...allowed) {
  return (req, res, next) => {
    if (allowed.length === 0) return next();
    const currentRoles = Array.isArray(req.user?.roles) ? req.user.roles : [];
    const permitted = allowed.some(role => currentRoles.includes(role));
    if (!permitted) return res.status(403).json({ message: 'forbidden' });
    next();
  };
}

function hasRole(req, ...allowed) {
  const currentRoles = Array.isArray(req.user?.roles) ? req.user.roles : [];
  return allowed.some(role => currentRoles.includes(role));
}

function canAccessUser(req, userId) {
  if (!userId) return false;
  if (req.user?.id === userId) return true;
  return hasRole(req, 'admin', 'project_manager', 'foreman');
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
app.get('/api/health', async (_req, res) => {
  try {
    const rows = await query('SELECT NOW() AS now');
    res.json({ ok: true, dbTime: rows[0]?.now ?? null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: 'db_unreachable' });
  }
});

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------
const signupSchema = z.object({
  full_name: z.string().min(1).max(120),
  phone: z.string().regex(/^[+0-9]{8,15}$/),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(8)
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const payload = signupSchema.parse(req.body ?? {});
    const normalizedPhone = normalizePhoneTH(payload.phone);
    const normalizedEmail = payload.email ? payload.email.toLowerCase() : null;

    const created = await withTransaction(async connection => {
      const duplicate = normalizedEmail
        ? await queryOne(
            'SELECT id FROM users WHERE phone = ? OR LOWER(email) = ? LIMIT 1',
            [normalizedPhone, normalizedEmail],
            connection
          )
        : await queryOne('SELECT id FROM users WHERE phone = ? LIMIT 1', [normalizedPhone], connection);

      if (duplicate) {
        return { error: { status: 409, message: 'Phone or email already exists' } };
      }

      const userId = randomUUID();
      const passwordHash = await bcrypt.hash(payload.password, 10);

      await execute(
        'INSERT INTO users (id, full_name, phone, email, password_hash, status) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, payload.full_name, normalizedPhone, normalizedEmail, passwordHash, 'active'],
        connection
      );

      const workerRole = await queryOne('SELECT id FROM roles WHERE key = ? LIMIT 1', ['worker'], connection);
      if (workerRole) {
        await execute(
          'INSERT IGNORE INTO user_roles(user_id, role_id) VALUES (?, ?)',
          [userId, workerRole.id],
          connection
        );
      }

      const user = await queryOne(
        'SELECT id, full_name, phone, email, status, created_at FROM users WHERE id = ?',
        [userId],
        connection
      );

      return { user };
    });

    if (created.error) {
      return res.status(created.error.status).json({ message: created.error.message });
    }

    res.status(201).json({ ...created.user, role: 'worker' });
  } catch (error) {
    if (error?.issues) return res.status(400).json({ message: 'Invalid input', errors: error.issues });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

const loginSchema = z.object({
  phone: z.string().regex(/^[+0-9]{8,15}$/),
  password: z.string().min(1)
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = loginSchema.parse(req.body ?? {});
    const normalizedPhone = normalizePhoneTH(phone);

    const user = await queryOne(
      `SELECT id, full_name, phone, email, password_hash, status
       FROM users
       WHERE phone = ? OR phone = ?
       LIMIT 1`,
      [phone, normalizedPhone]
    );

    if (!user) return res.status(401).json({ message: 'invalid_credentials' });

    const isMatch = await bcrypt.compare(password, user.password_hash ?? '');
    if (!isMatch) return res.status(401).json({ message: 'invalid_credentials' });

    const roles = await fetchUserRoles(user.id);
    const token = jwt.sign({ sub: user.id, roles }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'skillgauge-api',
      audience: 'skillgauge-spa'
    });

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        phone: user.phone,
        email: user.email,
        status: user.status,
        roles
      }
    });
  } catch (error) {
    if (error?.issues) return res.status(400).json({ message: 'Invalid input', errors: error.issues });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// Admin role management
// ---------------------------------------------------------------------------
const roleKeySchema = z.object({ role: z.enum(['worker', 'foreman', 'project_manager']) });

app.post('/api/admin/users/:id/roles/grant', requireAuth, authorizeRoles('admin'), async (req, res) => {
  try {
    const userId = req.params.id;
    if (!uuidSchema.safeParse(userId).success) return res.status(400).json({ message: 'invalid id' });
    const { role } = roleKeySchema.parse(req.body ?? {});

    const roleRow = await queryOne('SELECT id FROM roles WHERE key = ? LIMIT 1', [role]);
    if (!roleRow) return res.status(400).json({ message: 'unknown_role' });

    await execute('INSERT IGNORE INTO user_roles(user_id, role_id) VALUES (?, ?)', [userId, roleRow.id]);
    res.json({ ok: true });
  } catch (error) {
    if (error?.issues) return res.status(400).json({ message: 'Invalid input', errors: error.issues });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/admin/users/:id/roles/revoke', requireAuth, authorizeRoles('admin'), async (req, res) => {
  try {
    const userId = req.params.id;
    if (!uuidSchema.safeParse(userId).success) return res.status(400).json({ message: 'invalid id' });
    const { role } = roleKeySchema.parse(req.body ?? {});

    const roleRow = await queryOne('SELECT id FROM roles WHERE key = ? LIMIT 1', [role]);
    if (!roleRow) return res.status(400).json({ message: 'unknown_role' });

    await execute('DELETE FROM user_roles WHERE user_id = ? AND role_id = ?', [userId, roleRow.id]);
    res.json({ ok: true });
  } catch (error) {
    if (error?.issues) return res.status(400).json({ message: 'Invalid input', errors: error.issues });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// Users CRUD
// ---------------------------------------------------------------------------
const roleEnum = z.enum(['admin', 'project_manager', 'foreman', 'worker']);
const roleArraySchema = z.array(roleEnum).max(10).default([]);

const userListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().max(120).trim().optional(),
  status: z.string().max(30).optional()
});

app.get('/api/admin/users', requireAuth, authorizeRoles('admin'), async (req, res) => {
  try {
    const params = userListQuerySchema.parse(req.query ?? {});
    const filters = [];
    const values = [];

    if (params.search) {
      const like = `%${params.search}%`;
      filters.push('(full_name LIKE ? OR phone LIKE ? OR email LIKE ?)');
      values.push(like, like, like);
    }

    if (params.status) {
      filters.push('status = ?');
      values.push(params.status);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const countRows = await query(`SELECT COUNT(*) AS total FROM users ${whereClause}`, values);
    const total = Number(countRows[0]?.total ?? 0);

    values.push(params.limit, params.offset);
    const dataSql = `
      SELECT id, full_name, phone, email, status, created_at, last_login
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const items = await query(dataSql, values);

    res.json({ total, limit: params.limit, offset: params.offset, items });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Invalid query' });
  }
});

const createUserSchema = z.object({
  full_name: z.string().min(1).max(120),
  phone: z.string().regex(/^[+0-9]{8,15}$/),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(8),
  status: z.string().max(30).optional().default('active'),
  roles: roleArraySchema
});

app.post('/api/admin/users', requireAuth, authorizeRoles('admin'), async (req, res) => {
  try {
    const payload = createUserSchema.parse(req.body ?? {});
    const normalizedPhone = normalizePhoneTH(payload.phone);
    const normalizedEmail = payload.email ? payload.email.toLowerCase() : null;

    const result = await withTransaction(async connection => {
      const duplicate = normalizedEmail
        ? await queryOne(
            'SELECT id FROM users WHERE phone = ? OR LOWER(email) = ? LIMIT 1',
            [normalizedPhone, normalizedEmail],
            connection
          )
        : await queryOne('SELECT id FROM users WHERE phone = ? LIMIT 1', [normalizedPhone], connection);

      if (duplicate) {
        return { error: { status: 409, message: 'duplicate_phone_or_email' } };
      }

      const userId = randomUUID();
      const passwordHash = await bcrypt.hash(payload.password, 10);

      await execute(
        'INSERT INTO users (id, full_name, phone, email, password_hash, status) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, payload.full_name, normalizedPhone, normalizedEmail, passwordHash, payload.status],
        connection
      );

      if (payload.roles.length) {
        await replaceUserRoles(userId, payload.roles, connection);
      }

      const user = await queryOne(
        'SELECT id, full_name, phone, email, status, created_at FROM users WHERE id = ?',
        [userId],
        connection
      );

      return { user };
    });

    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    res.status(201).json({ ...result.user, roles: payload.roles });
  } catch (error) {
    if (error?.issues) return res.status(400).json({ message: 'Invalid input', errors: error.issues });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/users/:id', requireAuth, authorizeRoles('admin'), async (req, res) => {
  try {
    const userId = req.params.id;
    if (!uuidSchema.safeParse(userId).success) return res.status(400).json({ message: 'invalid id' });
    const user = await queryOne(
      'SELECT id, full_name, phone, email, status, created_at, last_login FROM users WHERE id = ?',
      [userId]
    );
    if (!user) return res.status(404).json({ message: 'not_found' });
    const roles = await fetchUserRoles(userId);
    res.json({ ...user, roles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

const updateUserSchema = z.object({
  full_name: z.string().min(1).max(120).optional(),
  phone: z.string().regex(/^[+0-9]{8,15}$/).optional(),
  email: z.string().email().or(z.literal('')).optional(),
  password: z.string().min(8).optional(),
  status: z.string().max(30).optional(),
  roles: roleArraySchema.optional()
}).refine(data => Object.keys(data).length > 0, { message: 'No fields to update' });

app.put('/api/admin/users/:id', requireAuth, authorizeRoles('admin'), async (req, res) => {
  try {
    const userId = req.params.id;
    if (!uuidSchema.safeParse(userId).success) return res.status(400).json({ message: 'invalid id' });
    const payload = updateUserSchema.parse(req.body ?? {});

    const result = await withTransaction(async connection => {
      const updateData = {
        full_name: payload.full_name,
        phone: payload.phone ? normalizePhoneTH(payload.phone) : undefined,
        email: payload.email !== undefined ? (payload.email || null) : undefined,
        status: payload.status,
        password_hash: payload.password ? await bcrypt.hash(payload.password, 10) : undefined
      };

      const clause = buildUpdateClause(updateData);
      if (clause.sets.length) {
        const sql = `UPDATE users SET ${clause.sets.join(', ')}, updated_at = NOW(6) WHERE id = ?`;
        const outcome = await execute(sql, [...clause.values, userId], connection);
        if (!outcome.affectedRows) {
          return { error: { status: 404, message: 'not_found' } };
        }
      }

      if (payload.roles !== undefined) {
        await replaceUserRoles(userId, payload.roles, connection);
      }

      const user = await queryOne(
        'SELECT id, full_name, phone, email, status, created_at, last_login FROM users WHERE id = ?',
        [userId],
        connection
      );
      if (!user) {
        return { error: { status: 404, message: 'not_found' } };
      }

      const roles = await fetchUserRoles(userId, connection);
      return { user: { ...user, roles } };
    });

    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    res.json(result.user);
  } catch (error) {
    if (error?.issues) return res.status(400).json({ message: 'Invalid input', errors: error.issues });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/admin/users/:id', requireAuth, authorizeRoles('admin'), async (req, res) => {
  try {
    const userId = req.params.id;
    if (!uuidSchema.safeParse(userId).success) return res.status(400).json({ message: 'invalid id' });
    const result = await execute('DELETE FROM users WHERE id = ?', [userId]);
    if (!result.affectedRows) return res.status(404).json({ message: 'not_found' });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// Public lookup
// ---------------------------------------------------------------------------
const phoneQuerySchema = z.object({ phone: z.string().min(3) });
app.get('/api/users/by-phone', async (req, res) => {
  try {
    const { phone } = phoneQuerySchema.parse(req.query ?? {});
    const user = await queryOne(
      'SELECT id, full_name, phone, email FROM users WHERE phone = ? LIMIT 1',
      [phone]
    );
    if (!user) return res.status(404).json({ message: 'not_found' });
    const roles = await fetchUserRoles(user.id);
    res.json({ ...user, roles });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Invalid phone' });
  }
});

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
const taskStatusEnum = z.enum(['todo', 'in-progress', 'done']);
const taskPriorityEnum = z.enum(['low', 'medium', 'high']);

const taskListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  status: taskStatusEnum.optional(),
  project_id: uuidSchema.optional(),
  assignee_id: uuidSchema.optional(),
  search: z.string().max(120).trim().optional()
});

app.get('/api/tasks', requireAuth, authorizeRoles('admin', 'project_manager'), async (req, res) => {
  try {
    const params = taskListQuerySchema.parse(req.query ?? {});
    const filters = [];
    const values = [];

    if (params.status) { filters.push('t.status = ?'); values.push(params.status); }
    if (params.project_id) { filters.push('t.project_id = ?'); values.push(params.project_id); }
    if (params.assignee_id) { filters.push('t.assignee_user_id = ?'); values.push(params.assignee_id); }
    if (params.search) {
      const like = `%${params.search}%`;
      filters.push('(t.title LIKE ? OR p.name LIKE ?)');
      values.push(like, like);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM tasks t JOIN projects p ON p.id = t.project_id ${whereClause}`,
      values
    );
    const total = Number(countRows[0]?.total ?? 0);

    values.push(params.limit, params.offset);
    const items = await query(
      `SELECT
         t.id,
         t.title,
         t.status,
         t.priority,
         t.due_date,
         t.project_id,
         p.name AS project_name,
         t.site_id,
         s.name AS site_name,
         t.assignee_user_id,
         u.full_name AS assignee_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN sites s ON s.id = t.site_id
       LEFT JOIN users u ON u.id = t.assignee_user_id
       ${whereClause}
       ORDER BY t.due_date ASC, t.title ASC
       LIMIT ? OFFSET ?`,
      values
    );

    res.json({ total, limit: params.limit, offset: params.offset, items });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Invalid query' });
  }
});

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  project_id: uuidSchema,
  site_id: uuidSchema.optional(),
  priority: taskPriorityEnum.default('medium'),
  status: taskStatusEnum.default('todo'),
  assignee_user_id: uuidSchema.optional(),
  due_date: z.coerce.date().optional()
});

app.post('/api/tasks', requireAuth, authorizeRoles('admin', 'project_manager'), async (req, res) => {
  try {
    const payload = createTaskSchema.parse(req.body ?? {});
    const taskId = randomUUID();
    await execute(
      `INSERT INTO tasks(id, project_id, site_id, title, priority, status, assignee_user_id, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskId,
        payload.project_id,
        payload.site_id || null,
        payload.title,
        payload.priority,
        payload.status,
        payload.assignee_user_id || null,
        payload.due_date ? payload.due_date.toISOString().slice(0, 10) : null
      ]
    );

    const task = await queryOne(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date, t.project_id, p.name AS project_name,
              t.site_id, s.name AS site_name, t.assignee_user_id, u.full_name AS assignee_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN sites s ON s.id = t.site_id
       LEFT JOIN users u ON u.id = t.assignee_user_id
       WHERE t.id = ?`,
      [taskId]
    );

    res.status(201).json(task);
  } catch (error) {
    if (error?.issues) return res.status(400).json({ message: 'Invalid input', errors: error.issues });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/tasks/:id', requireAuth, authorizeRoles('admin', 'project_manager'), async (req, res) => {
  try {
    const taskId = req.params.id;
    if (!uuidSchema.safeParse(taskId).success) return res.status(400).json({ message: 'invalid id' });
    const task = await queryOne(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date, t.project_id, p.name AS project_name,
              t.site_id, s.name AS site_name, t.assignee_user_id, u.full_name AS assignee_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN sites s ON s.id = t.site_id
       LEFT JOIN users u ON u.id = t.assignee_user_id
       WHERE t.id = ?`,
      [taskId]
    );
    if (!task) return res.status(404).json({ message: 'not_found' });
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  project_id: uuidSchema.optional(),
  site_id: uuidSchema.optional().nullable(),
  priority: taskPriorityEnum.optional(),
  status: taskStatusEnum.optional(),
  assignee_user_id: uuidSchema.optional().nullable(),
  due_date: z.coerce.date().optional().nullable()
}).refine(data => Object.keys(data).length > 0, { message: 'No fields to update' });

app.put('/api/tasks/:id', requireAuth, authorizeRoles('admin', 'project_manager'), async (req, res) => {
  try {
    const taskId = req.params.id;
    if (!uuidSchema.safeParse(taskId).success) return res.status(400).json({ message: 'invalid id' });
    const payload = updateTaskSchema.parse(req.body ?? {});

    const updateData = {
      title: payload.title,
      project_id: payload.project_id,
      site_id: payload.site_id === undefined ? undefined : (payload.site_id || null),
      priority: payload.priority,
      status: payload.status,
      assignee_user_id: payload.assignee_user_id === undefined ? undefined : (payload.assignee_user_id || null),
      due_date: payload.due_date === undefined ? undefined : (payload.due_date ? payload.due_date.toISOString().slice(0, 10) : null)
    };

    const clause = buildUpdateClause(updateData);
    if (!clause.sets.length) return res.status(400).json({ message: 'nothing_to_update' });

    const sql = `UPDATE tasks SET ${clause.sets.join(', ')}, updated_at = NOW(6) WHERE id = ?`;
    const result = await execute(sql, [...clause.values, taskId]);
    if (!result.affectedRows) return res.status(404).json({ message: 'not_found' });

    const task = await queryOne(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date, t.project_id, p.name AS project_name,
              t.site_id, s.name AS site_name, t.assignee_user_id, u.full_name AS assignee_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN sites s ON s.id = t.site_id
       LEFT JOIN users u ON u.id = t.assignee_user_id
       WHERE t.id = ?`,
      [taskId]
    );

    res.json(task);
  } catch (error) {
    if (error?.issues) return res.status(400).json({ message: 'Invalid input', errors: error.issues });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/tasks/:id', requireAuth, authorizeRoles('admin', 'project_manager'), async (req, res) => {
  try {
    const taskId = req.params.id;
    if (!uuidSchema.safeParse(taskId).success) return res.status(400).json({ message: 'invalid id' });
    const result = await execute('DELETE FROM tasks WHERE id = ?', [taskId]);
    if (!result.affectedRows) return res.status(404).json({ message: 'not_found' });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// Signup forms
// ---------------------------------------------------------------------------
const signupFormStatusEnum = z.enum(['pending', 'in_review', 'approved', 'rejected']);

const signupFormCreateSchema = z.object({
  full_name: z.string().min(1).max(200),
  phone: z.string().min(6).max(20),
  email: z.string().email().optional().or(z.literal('')),
  status: signupFormStatusEnum.optional(),
  payload: z.record(z.string(), z.any()).optional()
}).passthrough();

app.post('/api/forms/signup', async (req, res) => {
  try {
    const payload = signupFormCreateSchema.parse(req.body ?? {});
    const normalizedPhone = normalizePhoneTH(payload.phone);
    const normalizedEmail = payload.email ? payload.email.toLowerCase() : null;
    const payloadData = payload.payload && typeof payload.payload === 'object' ? payload.payload : { ...payload };

    const formId = randomUUID();
    await execute(
      `INSERT INTO signup_forms (id, full_name, phone, email, status, payload)
       VALUES (?, ?, ?, ?, ?, CAST(? AS JSON))`,
      [
        formId,
        payload.full_name,
        normalizedPhone,
        normalizedEmail,
        payload.status || 'pending',
        JSON.stringify(payloadData)
      ]
    );

    const form = await queryOne(
      'SELECT id, full_name, phone, email, status, payload, created_at, updated_at FROM signup_forms WHERE id = ?',
      [formId]
    );

    res.status(201).json(form);
  } catch (error) {
    if (error?.issues) return res.status(400).json({ message: 'Invalid input', errors: error.issues });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

const signupFormListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  status: signupFormStatusEnum.optional(),
  search: z.string().max(120).trim().optional()
});

app.get('/api/forms/signup', requireAuth, authorizeRoles('admin'), async (req, res) => {
  try {
    const params = signupFormListSchema.parse(req.query ?? {});
    const filters = [];
    const values = [];

    if (params.status) { filters.push('status = ?'); values.push(params.status); }
    if (params.search) {
      const like = `%${params.search}%`;
      filters.push('(full_name LIKE ? OR phone LIKE ? OR email LIKE ?)');
      values.push(like, like, like);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const countRows = await query(`SELECT COUNT(*) AS total FROM signup_forms ${whereClause}`, values);
    const total = Number(countRows[0]?.total ?? 0);

    values.push(params.limit, params.offset);
    const items = await query(
      `SELECT id, full_name, phone, email, status, payload, created_at, updated_at
       FROM signup_forms
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      values
    );

    res.json({ total, limit: params.limit, offset: params.offset, items });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Invalid query' });
  }
});

app.get('/api/forms/signup/:id', requireAuth, authorizeRoles('admin'), async (req, res) => {
  try {
    const formId = req.params.id;
    if (!uuidSchema.safeParse(formId).success) return res.status(400).json({ message: 'invalid id' });
    const form = await queryOne(
      'SELECT id, full_name, phone, email, status, payload, created_at, updated_at FROM signup_forms WHERE id = ?',
      [formId]
    );
    if (!form) return res.status(404).json({ message: 'not_found' });
    res.json(form);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

const signupFormUpdateSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
  phone: z.string().min(6).max(20).optional(),
  email: z.string().email().or(z.literal('')).optional(),
  status: signupFormStatusEnum.optional(),
  payload: z.record(z.string(), z.any()).optional()
}).passthrough().refine(data => Object.keys(data).length > 0, { message: 'No fields to update' });

app.put('/api/forms/signup/:id', requireAuth, authorizeRoles('admin'), async (req, res) => {
  try {
    const formId = req.params.id;
    if (!uuidSchema.safeParse(formId).success) return res.status(400).json({ message: 'invalid id' });
    const payload = signupFormUpdateSchema.parse(req.body ?? {});

    const payloadData = payload.payload && typeof payload.payload === 'object'
      ? payload.payload
      : undefined;

    const updateData = {
      full_name: payload.full_name,
      phone: payload.phone ? normalizePhoneTH(payload.phone) : undefined,
      email: payload.email !== undefined ? (payload.email || null) : undefined,
      status: payload.status,
      payload: payloadData ? JSON.stringify(payloadData) : undefined,
      updated_at: new Date()
    };

    const clause = buildUpdateClause(updateData);
    if (!clause.sets.length) return res.status(400).json({ message: 'nothing_to_update' });

    const sql = `UPDATE signup_forms SET ${clause.sets.join(', ')} WHERE id = ?`;
    const result = await execute(sql, [...clause.values, formId]);
    if (!result.affectedRows) return res.status(404).json({ message: 'not_found' });

    const form = await queryOne(
      'SELECT id, full_name, phone, email, status, payload, created_at, updated_at FROM signup_forms WHERE id = ?',
      [formId]
    );

    res.json(form);
  } catch (error) {
    if (error?.issues) return res.status(400).json({ message: 'Invalid input', errors: error.issues });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/forms/signup/:id', requireAuth, authorizeRoles('admin'), async (req, res) => {
  try {
    const formId = req.params.id;
    if (!uuidSchema.safeParse(formId).success) return res.status(400).json({ message: 'invalid id' });
    const result = await execute('DELETE FROM signup_forms WHERE id = ?', [formId]);
    if (!result.affectedRows) return res.status(404).json({ message: 'not_found' });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// Question bank
// ---------------------------------------------------------------------------
const questionOptionSchema = z.object({
  text: z.string().min(1),
  is_correct: z.boolean().default(false)
});

const createQuestionSchema = z.object({
  text: z.string().min(1),
  category: z.string().max(80).optional(),
  difficulty: z.string().max(40).optional(),
  version: z.string().max(40).optional(),
  active: z.boolean().optional().default(true),
  options: z.array(questionOptionSchema).min(2)
}).refine(payload => payload.options.some(opt => opt.is_correct), {
  message: 'At least one option must be correct',
  path: ['options']
});

const questionListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  category: z.string().max(80).optional(),
  search: z.string().max(120).trim().optional(),
  active: z.coerce.boolean().optional()
});

function parseOptionsJson(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function mapQuestionRow(row) {
  return {
    id: row.id,
    text: row.text,
    category: row.category,
    difficulty: row.difficulty,
    version: row.version,
    active: !!row.active,
    options: parseOptionsJson(row.options)
  };
}

app.get('/api/admin/questions', requireAuth, authorizeRoles('admin'), async (req, res) => {
  try {
    const params = questionListQuerySchema.parse(req.query ?? {});
    const filters = [];
    const values = [];

    if (params.category) { filters.push('q.category = ?'); values.push(params.category); }
    if (params.active !== undefined) { filters.push('q.active = ?'); values.push(params.active ? 1 : 0); }
    if (params.search) { const like = `%${params.search}%`; filters.push('q.text LIKE ?'); values.push(like); }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const countRows = await query(`SELECT COUNT(*) AS total FROM questions q ${whereClause}`, values);
    const total = Number(countRows[0]?.total ?? 0);

    values.push(params.limit, params.offset);
    const rows = await query(
      `SELECT
         q.id,
         q.text,
         q.category,
         q.difficulty,
         q.version,
         q.active,
         JSON_ARRAYAGG(IF(qo.id IS NULL, NULL, JSON_OBJECT('id', qo.id, 'text', qo.text, 'is_correct', qo.is_correct))) AS options
       FROM questions q
       LEFT JOIN question_options qo ON qo.question_id = q.id
       ${whereClause}
       GROUP BY q.id
       ORDER BY q.text ASC
       LIMIT ? OFFSET ?`,
      values
    );

    const items = rows.map(mapQuestionRow);
    res.json({ total, limit: params.limit, offset: params.offset, items });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Invalid query' });
  }
});

app.get('/api/admin/questions/:id', requireAuth, authorizeRoles('admin'), async (req, res) => {
  try {
    const questionId = req.params.id;
    if (!uuidSchema.safeParse(questionId).success) return res.status(400).json({ message: 'invalid id' });
    const row = await queryOne(
      `SELECT q.id, q.text, q.category, q.difficulty, q.version, q.active,
              JSON_ARRAYAGG(IF(qo.id IS NULL, NULL, JSON_OBJECT('id', qo.id, 'text', qo.text, 'is_correct', qo.is_correct))) AS options
       FROM questions q
       LEFT JOIN question_options qo ON qo.question_id = q.id
       WHERE q.id = ?
       GROUP BY q.id`,
      [questionId]
    );
    if (!row) return res.status(404).json({ message: 'not_found' });
    res.json(mapQuestionRow(row));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/admin/questions', requireAuth, authorizeRoles('admin'), async (req, res) => {
  try {
    const payload = createQuestionSchema.parse(req.body ?? {});
    const questionId = randomUUID();

    await withTransaction(async connection => {
      await execute(
        'INSERT INTO questions (id, text, category, difficulty, version, active) VALUES (?, ?, ?, ?, ?, ?)',
        [
          questionId,
          payload.text,
          payload.category || null,
          payload.difficulty || null,
          payload.version || null,
          payload.active ? 1 : 0
        ],
        connection
      );

      for (const option of payload.options) {
        await execute(
          'INSERT INTO question_options (id, question_id, text, is_correct) VALUES (?, ?, ?, ?)',
          [randomUUID(), questionId, option.text, option.is_correct ? 1 : 0],
          connection
        );
      }
    });

    const created = await queryOne(
      `SELECT q.id, q.text, q.category, q.difficulty, q.version, q.active,
              JSON_ARRAYAGG(IF(qo.id IS NULL, NULL, JSON_OBJECT('id', qo.id, 'text', qo.text, 'is_correct', qo.is_correct))) AS options
       FROM questions q
       LEFT JOIN question_options qo ON qo.question_id = q.id
       WHERE q.id = ?
       GROUP BY q.id`,
      [questionId]
    );

    res.status(201).json(mapQuestionRow(created));
  } catch (error) {
    if (error?.issues) return res.status(400).json({ message: 'Invalid input', errors: error.issues });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

const updateQuestionSchema = z.object({
  text: z.string().min(1).optional(),
  category: z.string().max(80).optional(),
  difficulty: z.string().max(40).optional(),
  version: z.string().max(40).optional(),
  active: z.boolean().optional(),
  options: z.array(questionOptionSchema).min(2).optional()
}).refine(data => Object.keys(data).length > 0, { message: 'No fields to update' });

app.put('/api/admin/questions/:id', requireAuth, authorizeRoles('admin'), async (req, res) => {
  try {
    const questionId = req.params.id;
    if (!uuidSchema.safeParse(questionId).success) return res.status(400).json({ message: 'invalid id' });
    const payload = updateQuestionSchema.parse(req.body ?? {});

    if (payload.options && !payload.options.some(opt => opt.is_correct)) {
      return res.status(400).json({ message: 'At least one option must be correct' });
    }

    await withTransaction(async connection => {
      const updateData = {
        text: payload.text,
        category: payload.category,
        difficulty: payload.difficulty,
        version: payload.version,
        active: payload.active === undefined ? undefined : (payload.active ? 1 : 0)
      };

      const clause = buildUpdateClause(updateData);
      if (clause.sets.length) {
        await execute(`UPDATE questions SET ${clause.sets.join(', ')} WHERE id = ?`, [...clause.values, questionId], connection);
      }

      if (payload.options) {
        await execute('DELETE FROM question_options WHERE question_id = ?', [questionId], connection);
        for (const option of payload.options) {
          await execute(
            'INSERT INTO question_options (id, question_id, text, is_correct) VALUES (?, ?, ?, ?)',
            [randomUUID(), questionId, option.text, option.is_correct ? 1 : 0],
            connection
          );
        }
      }
    });

    const updated = await queryOne(
      `SELECT q.id, q.text, q.category, q.difficulty, q.version, q.active,
              JSON_ARRAYAGG(IF(qo.id IS NULL, NULL, JSON_OBJECT('id', qo.id, 'text', qo.text, 'is_correct', qo.is_correct))) AS options
       FROM questions q
       LEFT JOIN question_options qo ON qo.question_id = q.id
       WHERE q.id = ?
       GROUP BY q.id`,
      [questionId]
    );
    if (!updated) return res.status(404).json({ message: 'not_found' });
    res.json(mapQuestionRow(updated));
  } catch (error) {
    if (error?.issues) return res.status(400).json({ message: 'Invalid input', errors: error.issues });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/admin/questions/:id', requireAuth, authorizeRoles('admin'), async (req, res) => {
  try {
    const questionId = req.params.id;
    if (!uuidSchema.safeParse(questionId).success) return res.status(400).json({ message: 'invalid id' });
    const result = await execute('DELETE FROM questions WHERE id = ?', [questionId]);
    if (!result.affectedRows) return res.status(404).json({ message: 'not_found' });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// Assessments
// ---------------------------------------------------------------------------
const PASSING_SCORE = 70;

const createAssessmentSchema = z.object({
  user_id: uuidSchema,
  answers: z.array(z.object({
    question_id: uuidSchema,
    option_id: uuidSchema
  })).min(1)
});

app.post('/api/assessments', requireAuth, async (req, res) => {
  try {
    const payload = createAssessmentSchema.parse(req.body ?? {});
    if (!canAccessUser(req, payload.user_id)) return res.status(403).json({ message: 'forbidden' });

    const result = await withTransaction(async connection => {
      const optionIds = payload.answers.map(answer => answer.option_id);
      const optionRows = await query(
        'SELECT id, question_id, is_correct FROM question_options WHERE id IN (?)',
        [optionIds],
        connection
      );
      const optionMap = new Map(optionRows.map(row => [row.id, row]));

      const seenQuestions = new Set();
      let correctCount = 0;
      for (const answer of payload.answers) {
        const option = optionMap.get(answer.option_id);
        if (!option || option.question_id !== answer.question_id) {
          return { error: { status: 400, message: 'invalid_answer_mapping' } };
        }
        if (seenQuestions.has(answer.question_id)) {
          return { error: { status: 400, message: 'duplicate_question' } };
        }
        seenQuestions.add(answer.question_id);
        if (option.is_correct) correctCount += 1;
      }

      const total = payload.answers.length;
      const score = total === 0 ? 0 : Number(((correctCount / total) * 100).toFixed(2));
      const passed = score >= PASSING_SCORE;

      const assessmentId = randomUUID();
      await execute(
        'INSERT INTO assessments (id, user_id, finished_at, score, passed) VALUES (?, ?, NOW(6), ?, ?)',
        [assessmentId, payload.user_id, score, passed ? 1 : 0],
        connection
      );

      for (const answer of payload.answers) {
        await execute(
          'INSERT INTO assessment_answers (assessment_id, question_id, chosen_option_id) VALUES (?, ?, ?)',
          [assessmentId, answer.question_id, answer.option_id],
          connection
        );
      }

      const assessment = await queryOne(
        'SELECT id, user_id, started_at, finished_at, score, passed FROM assessments WHERE id = ?',
        [assessmentId],
        connection
      );

      return {
        assessment,
        summary: {
          total_questions: total,
          correct: correctCount,
          score,
          passed
        }
      };
    });

    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    res.status(201).json(result);
  } catch (error) {
    if (error?.issues) return res.status(400).json({ message: 'Invalid input', errors: error.issues });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/assessments/:id', requireAuth, async (req, res) => {
  try {
    const assessmentId = req.params.id;
    if (!uuidSchema.safeParse(assessmentId).success) return res.status(400).json({ message: 'invalid id' });
    const assessment = await queryOne(
      'SELECT id, user_id, started_at, finished_at, score, passed FROM assessments WHERE id = ?',
      [assessmentId]
    );
    if (!assessment) return res.status(404).json({ message: 'not_found' });
    if (!canAccessUser(req, assessment.user_id)) return res.status(403).json({ message: 'forbidden' });

    const answers = await query(
      `SELECT aa.question_id, aa.chosen_option_id, qo.is_correct
       FROM assessment_answers aa
       LEFT JOIN question_options qo ON qo.id = aa.chosen_option_id
       WHERE aa.assessment_id = ?`,
      [assessmentId]
    );

    res.json({ ...assessment, answers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/users/:id/assessments', requireAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    if (!uuidSchema.safeParse(userId).success) return res.status(400).json({ message: 'invalid id' });
    if (!canAccessUser(req, userId)) return res.status(403).json({ message: 'forbidden' });

    const rows = await query(
      'SELECT id, user_id, started_at, finished_at, score, passed FROM assessments WHERE user_id = ? ORDER BY finished_at DESC',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/assessments/:id', requireAuth, authorizeRoles('admin'), async (req, res) => {
  try {
    const assessmentId = req.params.id;
    if (!uuidSchema.safeParse(assessmentId).success) return res.status(400).json({ message: 'invalid id' });
    const result = await execute('DELETE FROM assessments WHERE id = ?', [assessmentId]);
    if (!result.affectedRows) return res.status(404).json({ message: 'not_found' });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// Dashboard metrics
// ---------------------------------------------------------------------------
app.get('/api/dashboard/project-task-counts', requireAuth, authorizeRoles('project_manager'), async (_req, res) => {
  try {
    const rows = await query(
      `SELECT
         p.id AS project_id,
         p.name AS project_name,
         COUNT(t.id) AS tasks_total,
         SUM(t.status = 'todo') AS tasks_todo,
         SUM(t.status = 'in-progress') AS tasks_in_progress,
         SUM(t.status = 'done') AS tasks_done
       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id
       GROUP BY p.id, p.name
       ORDER BY p.name`
    );
    res.json(rows.map(row => ({
      project_id: row.project_id,
      project_name: row.project_name,
      tasks_total: Number(row.tasks_total ?? 0),
      tasks_todo: Number(row.tasks_todo ?? 0),
      tasks_in_progress: Number(row.tasks_in_progress ?? 0),
      tasks_done: Number(row.tasks_done ?? 0)
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// Server bootstrap
// ---------------------------------------------------------------------------
app.listen(Number(PORT), () => {
  console.log(`SkillGauge API listening on http://localhost:${PORT}`);
});
