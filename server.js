import express from 'express';
import pg from 'pg';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : undefined,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'dist')));

// ========== Initialize DB ==========
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar_color TEXT NOT NULL DEFAULT '#3B82F6',
        subscription TEXT NOT NULL DEFAULT 'none',
        subscription_end TIMESTAMPTZ,
        monthly_downloads INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sounds (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Drums',
        tags TEXT[] NOT NULL DEFAULT '{}',
        downloads INT NOT NULL DEFAULT 0,
        is_free BOOLEAN NOT NULL DEFAULT true,
        duration TEXT NOT NULL DEFAULT '0:00',
        duration_seconds INT NOT NULL DEFAULT 0,
        waveform REAL[] NOT NULL DEFAULT '{}',
        date_added TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        author_id TEXT NOT NULL REFERENCES users(id),
        author_name TEXT NOT NULL,
        file_data TEXT,
        file_name TEXT
      );

      CREATE TABLE IF NOT EXISTS packs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        sound_count INT NOT NULL DEFAULT 0,
        category TEXT NOT NULL DEFAULT 'Pack',
        is_free BOOLEAN NOT NULL DEFAULT true,
        downloads INT NOT NULL DEFAULT 0,
        author_id TEXT NOT NULL REFERENCES users(id),
        author_name TEXT NOT NULL,
        date_added TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Database tables initialized');
  } finally {
    client.release();
  }
}

// ========== Auth Routes ==========
const AVATAR_COLORS = ['#EF4444','#F97316','#EAB308','#22C55E','#14B8A6','#3B82F6','#6366F1','#8B5CF6','#EC4899','#F43F5E'];

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password?.trim()) return res.json({ ok: false, error: 'Заполните все поля' });
    if (password.length < 4) return res.json({ ok: false, error: 'Пароль минимум 4 символа' });

    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (existing.rows.length > 0) return res.json({ ok: false, error: 'Этот email уже зарегистрирован' });

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const hash = await bcrypt.hash(password, 10);
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    await pool.query(
      'INSERT INTO users (id, name, email, password, avatar_color) VALUES ($1, $2, $3, $4, $5)',
      [id, name.trim(), email.trim().toLowerCase(), hash, color]
    );

    const user = (await pool.query('SELECT * FROM users WHERE id = $1', [id])).rows[0];
    res.json({ ok: true, user: formatUser(user) });
  } catch (e) { console.error(e); res.json({ ok: false, error: 'Ошибка сервера' }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password?.trim()) return res.json({ ok: false, error: 'Заполните все поля' });

    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (result.rows.length === 0) return res.json({ ok: false, error: 'Неверный email или пароль' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.json({ ok: false, error: 'Неверный email или пароль' });

    res.json({ ok: true, user: formatUser(user) });
  } catch (e) { console.error(e); res.json({ ok: false, error: 'Ошибка сервера' }); }
});

app.post('/api/user/update-name', async (req, res) => {
  try {
    const { userId, name } = req.body;
    await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name.trim(), userId]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.json({ ok: false }); }
});

app.post('/api/user/subscribe', async (req, res) => {
  try {
    const { userId, plan } = req.body;
    const end = new Date(); end.setMonth(end.getMonth() + 1);
    await pool.query('UPDATE users SET subscription = $1, subscription_end = $2, monthly_downloads = 0 WHERE id = $3',
      [plan, plan !== 'none' ? end.toISOString() : null, userId]);
    const user = (await pool.query('SELECT * FROM users WHERE id = $1', [userId])).rows[0];
    res.json({ ok: true, user: formatUser(user) });
  } catch (e) { console.error(e); res.json({ ok: false }); }
});

// ========== Sound Routes ==========
function generateWaveform(seed) {
  const wave = [];
  for (let i = 0; i < 60; i++) {
    const val = Math.abs(Math.sin(i * 0.3 + seed) * 0.4 + Math.sin(i * 0.7 + seed * 2) * 0.3 + Math.sin(i * 1.1 + seed * 0.5) * 0.2 + Math.sin(i * 0.15 + seed * 3) * 0.1);
    wave.push(Math.min(1, Math.max(0.06, val)));
  }
  return wave;
}

app.get('/api/sounds', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sounds ORDER BY date_added DESC');
    res.json(result.rows.map(formatSound));
  } catch (e) { console.error(e); res.json([]); }
});

app.post('/api/sounds', async (req, res) => {
  try {
    const { title, category, tags, isFree, duration, durationSeconds, fileData, fileName, userId, authorName } = req.body;
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const waveform = generateWaveform(Math.random() * 100);

    await pool.query(
      'INSERT INTO sounds (id, title, category, tags, is_free, duration, duration_seconds, waveform, author_id, author_name, file_data, file_name) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
      [id, title, category, tags, isFree, duration, durationSeconds, waveform, userId, authorName, fileData || null, fileName || null]
    );
    res.json({ ok: true });
  } catch (e) { console.error(e); res.json({ ok: false }); }
});

app.post('/api/sounds/:id/download', async (req, res) => {
  try {
    await pool.query('UPDATE sounds SET downloads = downloads + 1 WHERE id = $1', [req.params.id]);
    if (req.body.userId) {
      await pool.query('UPDATE users SET monthly_downloads = monthly_downloads + 1 WHERE id = $1', [req.body.userId]);
    }
    res.json({ ok: true });
  } catch (e) { console.error(e); res.json({ ok: false }); }
});

// ========== Pack Routes ==========
app.get('/api/packs', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM packs ORDER BY date_added DESC');
    res.json(result.rows.map(formatPack));
  } catch (e) { console.error(e); res.json([]); }
});

app.post('/api/packs', async (req, res) => {
  try {
    const { title, soundCount, category, isFree, userId, authorName } = req.body;
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await pool.query(
      'INSERT INTO packs (id, title, sound_count, category, is_free, author_id, author_name) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [id, title, soundCount, category, isFree, userId, authorName]
    );
    res.json({ ok: true });
  } catch (e) { console.error(e); res.json({ ok: false }); }
});

// ========== Stats ==========
app.get('/api/stats', async (_req, res) => {
  try {
    const sounds = await pool.query('SELECT COUNT(*) as count, COALESCE(SUM(downloads),0) as dl FROM sounds');
    const packs = await pool.query('SELECT COALESCE(SUM(downloads),0) as dl FROM packs');
    res.json({ totalSounds: parseInt(sounds.rows[0].count), totalDownloads: parseInt(sounds.rows[0].dl) + parseInt(packs.rows[0].dl) });
  } catch (e) { console.error(e); res.json({ totalSounds: 0, totalDownloads: 0 }); }
});

// ========== Formatters ==========
function formatUser(u) {
  return { id: u.id, name: u.name, email: u.email, avatarColor: u.avatar_color, subscription: u.subscription, subscriptionEnd: u.subscription_end, monthlyDownloads: u.monthly_downloads, createdAt: u.created_at };
}
function formatSound(s) {
  return { id: s.id, title: s.title, category: s.category, bpm: 0, key: '-', tags: s.tags || [], downloads: s.downloads, isFree: s.is_free, isNew: true, waveform: s.waveform || [], duration: s.duration, durationSeconds: s.duration_seconds, dateAdded: s.date_added, authorId: s.author_id, authorName: s.author_name, fileData: s.file_data, fileName: s.file_name };
}
function formatPack(p) {
  return { id: p.id, title: p.title, soundCount: p.sound_count, category: p.category, isFree: p.is_free, downloads: p.downloads, authorId: p.author_id, authorName: p.author_name, dateAdded: p.date_added };
}

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start
initDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('DB init failed:', err);
  // Still start server, frontend will work with localStorage fallback
  app.listen(PORT, () => console.log(`Server running on port ${PORT} (no DB)`));
});
