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
const ADMIN_EMAIL = 'energoferon41@gmail.com';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// ===== DB Init =====
async function initDB() {
  const c = await pool.connect();
  try {
    await c.query(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, avatar_color TEXT NOT NULL DEFAULT '#3B82F6', subscription TEXT NOT NULL DEFAULT 'none', subscription_end TIMESTAMPTZ, monthly_downloads INT NOT NULL DEFAULT 0, is_admin BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    // Ensure is_admin column exists for older DBs
    await c.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false`).catch(() => {});
    await c.query(`CREATE TABLE IF NOT EXISTS sounds (id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'Drums', tags TEXT[] NOT NULL DEFAULT '{}', downloads INT NOT NULL DEFAULT 0, play_count INT NOT NULL DEFAULT 0, is_free BOOLEAN NOT NULL DEFAULT true, duration TEXT NOT NULL DEFAULT '0:00', duration_seconds INT NOT NULL DEFAULT 0, waveform REAL[] NOT NULL DEFAULT '{}', date_added TIMESTAMPTZ NOT NULL DEFAULT NOW(), author_id TEXT NOT NULL, author_name TEXT NOT NULL, file_data TEXT, file_name TEXT)`);
    await c.query(`ALTER TABLE sounds ADD COLUMN IF NOT EXISTS play_count INT NOT NULL DEFAULT 0`).catch(() => {});
    await c.query(`CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), expires_at TIMESTAMPTZ NOT NULL)`);
    await c.query(`CREATE TABLE IF NOT EXISTS pending_sounds (id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'Drums', tags TEXT[] NOT NULL DEFAULT '{}', is_free BOOLEAN NOT NULL DEFAULT true, duration TEXT NOT NULL DEFAULT '0:00', duration_seconds INT NOT NULL DEFAULT 0, waveform REAL[] NOT NULL DEFAULT '{}', date_added TIMESTAMPTZ NOT NULL DEFAULT NOW(), author_id TEXT NOT NULL, author_name TEXT NOT NULL, file_data TEXT, file_name TEXT)`);
    await c.query(`CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, user_id TEXT, user_name TEXT, user_email TEXT, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', admin_response TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    await c.query(`CREATE TABLE IF NOT EXISTS broadcasts (id TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, created_by TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    await c.query(`CREATE TABLE IF NOT EXISTS user_read_broadcasts (user_id TEXT NOT NULL, broadcast_id TEXT NOT NULL, PRIMARY KEY (user_id, broadcast_id))`);
    console.log('DB tables ready');
  } catch (e) { console.error('DB init:', e.message); } finally { c.release(); }
}

// ===== Auth helpers =====
function genToken() { return Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
async function createSession(uid) { const t = genToken(); const exp = new Date(Date.now() + 30*24*3600*1000); await pool.query('INSERT INTO sessions (token,user_id,expires_at) VALUES ($1,$2,$3)', [t, uid, exp]); return t; }
async function getUser(req) { const auth = req.headers.authorization; if (!auth?.startsWith('Bearer ')) return null; try { const s = await pool.query('SELECT user_id FROM sessions WHERE token=$1 AND expires_at>NOW()', [auth.slice(7)]); if (!s.rows.length) return null; const u = await pool.query('SELECT * FROM users WHERE id=$1', [s.rows[0].user_id]); return u.rows[0] || null; } catch { return null; } }
function isAdmin(u) { return u && (u.email === ADMIN_EMAIL || u.is_admin === true); }
const COLORS = ['#EF4444','#F97316','#EAB308','#22C55E','#14B8A6','#3B82F6','#6366F1','#8B5CF6','#EC4899','#F43F5E'];
function fmtUser(u) { return { id:u.id, name:u.name, email:u.email, avatarColor:u.avatar_color, subscription:u.subscription, subscriptionEnd:u.subscription_end, monthlyDownloads:u.monthly_downloads, createdAt:u.created_at }; }
function fmtSound(s) { return { id:s.id, title:s.title, category:s.category, bpm:0, key:'-', tags:s.tags||[], downloads:s.downloads, playCount:s.play_count || 0, isFree:s.is_free, isNew:true, waveform:s.waveform||[], duration:s.duration, durationSeconds:s.duration_seconds, dateAdded:s.date_added, authorId:s.author_id, authorName:s.author_name, fileData:s.file_data, fileName:s.file_name }; }
function fmtPack(p) { return { id:p.id, title:p.title, soundCount:p.sound_count, category:p.category, isFree:p.is_free, downloads:p.downloads, authorId:p.author_id, authorName:p.author_name, dateAdded:p.date_added }; }
function genWave(seed) { const w=[]; for(let i=0;i<60;i++){const v=Math.abs(Math.sin(i*0.3+seed)*0.4+Math.sin(i*0.7+seed*2)*0.3+Math.sin(i*1.1+seed*0.5)*0.2+Math.sin(i*0.15+seed*3)*0.1);w.push(Math.min(1,Math.max(0.06,v)));} return w; }

// ===== Audio compression: downsample to 22050Hz mono 16bit =====
function compressAudio(base64Data) {
  if (!base64Data || !base64Data.startsWith('data:audio')) return base64Data;
  // For server-side we just pass through - real compression happens client-side
  // Limit to 5MB max stored
  if (base64Data.length > 7 * 1024 * 1024) {
    return base64Data.substring(0, 7 * 1024 * 1024);
  }
  return base64Data;
}

// ===== Auth Routes =====
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim()||!email?.trim()||!password?.trim()) return res.json({ok:false,error:'Заполните все поля'});
    if (password.length<4) return res.json({ok:false,error:'Пароль минимум 4 символа'});
    const ex = await pool.query('SELECT id FROM users WHERE LOWER(email)=LOWER($1)',[email]);
    if (ex.rows.length) return res.json({ok:false,error:'Этот email уже зарегистрирован'});
    const id=genId(); const hash=await bcrypt.hash(password,10); const color=COLORS[Math.floor(Math.random()*COLORS.length)];
    await pool.query('INSERT INTO users (id,name,email,password,avatar_color) VALUES ($1,$2,$3,$4,$5)',[id,name.trim(),email.trim().toLowerCase(),hash,color]);
    const u=(await pool.query('SELECT * FROM users WHERE id=$1',[id])).rows[0];
    const token=await createSession(id);
    res.json({ok:true,user:{...fmtUser(u),isAdmin:isAdmin(u)},token});
  } catch(e){console.error(e);res.json({ok:false,error:'Ошибка сервера'});}
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim()||!password?.trim()) return res.json({ok:false,error:'Заполните все поля'});
    const r=await pool.query('SELECT * FROM users WHERE LOWER(email)=LOWER($1)',[email]);
    if (!r.rows.length) return res.json({ok:false,error:'Неверный email или пароль'});
    const u=r.rows[0]; if (!await bcrypt.compare(password,u.password)) return res.json({ok:false,error:'Неверный email или пароль'});
    const token=await createSession(u.id);
    res.json({ok:true,user:{...fmtUser(u),isAdmin:isAdmin(u)},token});
  } catch(e){console.error(e);res.json({ok:false,error:'Ошибка сервера'});}
});

app.get('/api/me', async (req,res) => { try { const u=await getUser(req); if(!u) return res.json({ok:false}); res.json({ok:true,user:{...fmtUser(u),isAdmin:isAdmin(u)}}); } catch{res.json({ok:false});} });
app.post('/api/logout', async (req,res) => { try { const a=req.headers.authorization; if(a?.startsWith('Bearer ')) await pool.query('DELETE FROM sessions WHERE token=$1',[a.slice(7)]); } catch{} res.json({ok:true}); });

app.post('/api/user/update-name', async (req,res) => {
  try {
    const u = await getUser(req); if (!u) return res.json({ok:false});
    await pool.query('UPDATE users SET name=$1 WHERE id=$2', [req.body.name.trim(), u.id]);
    const up = (await pool.query('SELECT * FROM users WHERE id=$1', [u.id])).rows[0];
    res.json({ ok: true, user: { ...fmtUser(up), isAdmin: isAdmin(up) } });
  } catch(e) { console.error(e); res.json({ok:false}); }
});

app.post('/api/user/update-avatar', async (req,res) => {
  try {
    const u = await getUser(req); if (!u) return res.json({ok:false});
    const { avatarUrl } = req.body;
    if (!avatarUrl || typeof avatarUrl !== 'string') return res.json({ok:false, error:'Invalid avatar'});
    // avatarUrl can be a data:image/... base64 or http URL — store as-is
    await pool.query('UPDATE users SET avatar_color=$1 WHERE id=$2', [avatarUrl.slice(0, 500000), u.id]);
    const up = (await pool.query('SELECT * FROM users WHERE id=$1', [u.id])).rows[0];
    res.json({ ok: true, user: { ...fmtUser(up), isAdmin: isAdmin(up) } });
  } catch(e) { console.error(e); res.json({ok:false}); }
});

app.post('/api/user/subscribe', async (req,res) => {
  try {
    const u=await getUser(req); if(!u) return res.json({ok:false});
    const {plan}=req.body; const end=new Date(); end.setMonth(end.getMonth()+1);
    await pool.query('UPDATE users SET subscription=$1,subscription_end=$2,monthly_downloads=0 WHERE id=$3',[plan,plan!=='none'?end.toISOString():null,u.id]);
    const up=(await pool.query('SELECT * FROM users WHERE id=$1',[u.id])).rows[0];
    res.json({ok:true,user:{...fmtUser(up),isAdmin:isAdmin(up)}});
  } catch(e){console.error(e);res.json({ok:false});}
});

// ===== User Profile Route =====
app.get('/api/user/:id/profile', async (req, res) => {
  try {
    const u = await pool.query('SELECT id,name,email,avatar_color,subscription,subscription_end,monthly_downloads,created_at FROM users WHERE id=$1', [req.params.id]);
    if (!u.rows.length) return res.json({ ok: false });
    const sounds = await pool.query('SELECT * FROM sounds WHERE author_id=$1 ORDER BY date_added DESC', [req.params.id]);
    res.json({ ok: true, user: fmtUser({ ...u.rows[0], password: '' }), sounds: sounds.rows.map(fmtSound) });
  } catch (e) { console.error(e); res.json({ ok: false }); }
});

// ===== Sound Routes =====
app.get('/api/sounds', async (_,res) => { try { const r=await pool.query('SELECT * FROM sounds ORDER BY date_added DESC'); res.json(r.rows.map(fmtSound)); } catch(e){console.error(e);res.json([]);} });

app.post('/api/sounds', async (req,res) => {
  try {
    const u=await getUser(req); if(!u) return res.json({ok:false,error:'Не авторизован'});
    const {title,category,tags,isFree,duration,durationSeconds,fileData,fileName}=req.body;
    const id=genId(); const wf=genWave(Math.random()*100);
    const compressed=compressAudio(fileData);
    const authorName=isAdmin(u)?'KITSTUDIO':u.name;

    if (isAdmin(u)) {
      // Admin: directly publish
      await pool.query('INSERT INTO sounds (id,title,category,tags,is_free,duration,duration_seconds,waveform,author_id,author_name,file_data,file_name) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
        [id,title,category,tags||[],isFree,duration,durationSeconds,wf,u.id,authorName,compressed||null,fileName||null]);
    } else {
      // Regular user: goes to pending
      await pool.query('INSERT INTO pending_sounds (id,title,category,tags,is_free,duration,duration_seconds,waveform,author_id,author_name,file_data,file_name) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
        [id,title,category,tags||[],isFree,duration,durationSeconds,wf,u.id,u.name,compressed||null,fileName||null]);
    }
    res.json({ok:true,pending:!isAdmin(u)});
  } catch(e){console.error(e);res.json({ok:false});}
});

app.post('/api/sounds/:id/download', async (req,res) => {
  try {
    await pool.query('UPDATE sounds SET downloads=downloads+1 WHERE id=$1',[req.params.id]);
    const u=await getUser(req);
    if(u && !isAdmin(u)) await pool.query('UPDATE users SET monthly_downloads=monthly_downloads+1 WHERE id=$1',[u.id]);
    res.json({ok:true});
  } catch(e){console.error(e);res.json({ok:false});}
});

// Only counts play if listened for >= 80% of duration (client sends {ratio: 0..1})
app.post('/api/sounds/:id/play', async (req,res) => {
  try {
    const ratio = Number(req.body?.ratio || 0);
    if (ratio < 0.8) return res.json({ok:false, reason:'Not enough'});
    await pool.query('UPDATE sounds SET play_count=play_count+1 WHERE id=$1',[req.params.id]);
    res.json({ok:true});
  } catch(e){console.error(e);res.json({ok:false});}
});

// ===== Stats =====
app.get('/api/stats', async (_,res) => {
  try { const s=await pool.query('SELECT COUNT(*) as c,COALESCE(SUM(downloads),0) as d FROM sounds');
  res.json({totalSounds:parseInt(s.rows[0].c),totalDownloads:parseInt(s.rows[0].d)}); } catch(e){console.error(e);res.json({totalSounds:0,totalDownloads:0});}
});

// ===== Admin Routes =====
app.get('/api/admin/sounds', async (req,res) => {
  try { const u=await getUser(req); if(!isAdmin(u)) return res.json([]);
  const r=await pool.query('SELECT id,title,category,author_name,downloads,date_added,file_data FROM sounds ORDER BY date_added DESC');
  res.json(r.rows.map(s=>({id:s.id,title:s.title,category:s.category,authorName:s.author_name,downloads:s.downloads,dateAdded:s.date_added,fileData:s.file_data}))); } catch{res.json([]);}
});

app.get('/api/admin/pending', async (req,res) => {
  try { const u=await getUser(req); if(!isAdmin(u)) return res.json([]);
  const r=await pool.query('SELECT * FROM pending_sounds ORDER BY date_added DESC');
  res.json(r.rows.map(fmtSound)); } catch{res.json([]);}
});

app.get('/api/admin/users', async (req,res) => {
  try { const u=await getUser(req); if(!isAdmin(u)) return res.json([]);
  const r=await pool.query('SELECT id,name,email,avatar_color,subscription,is_admin,created_at FROM users ORDER BY created_at DESC');
  res.json(r.rows.map(u=>({id:u.id,name:u.name,email:u.email,avatarColor:u.avatar_color,subscription:u.subscription,isAdmin:u.is_admin||u.email===ADMIN_EMAIL,createdAt:u.created_at}))); } catch{res.json([]);}
});

app.post('/api/admin/users/set-admin', async (req,res) => {
  try { const u=await getUser(req); if(!isAdmin(u)) return res.json({ok:false});
  const {userId,isAdmin:val}=req.body;
  await pool.query('UPDATE users SET is_admin=$1 WHERE id=$2',[!!val,userId]);
  res.json({ok:true}); } catch(e){console.error(e);res.json({ok:false});}
});

app.post('/api/admin/sounds/delete', async (req,res) => {
  try { const u=await getUser(req); if(!isAdmin(u)) return res.json({ok:false});
  await pool.query('DELETE FROM sounds WHERE id=$1',[req.body.soundId]);
  res.json({ok:true}); } catch{res.json({ok:false});}
});

app.post('/api/admin/pending/approve', async (req,res) => {
  try { const u=await getUser(req); if(!isAdmin(u)) return res.json({ok:false});
  const {soundId}=req.body;
  const r=await pool.query('SELECT * FROM pending_sounds WHERE id=$1',[soundId]);
  if(!r.rows.length) return res.json({ok:false});
  const s=r.rows[0];
  await pool.query('INSERT INTO sounds (id,title,category,tags,is_free,duration,duration_seconds,waveform,author_id,author_name,file_data,file_name) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
    [s.id,s.title,s.category,s.tags,s.is_free,s.duration,s.duration_seconds,s.waveform,s.author_id,s.author_name,s.file_data,s.file_name]);
  await pool.query('DELETE FROM pending_sounds WHERE id=$1',[soundId]);
  res.json({ok:true}); } catch(e){console.error(e);res.json({ok:false});}
});

app.post('/api/admin/pending/reject', async (req,res) => {
  try { const u=await getUser(req); if(!isAdmin(u)) return res.json({ok:false});
  await pool.query('DELETE FROM pending_sounds WHERE id=$1',[req.body.soundId]);
  res.json({ok:true}); } catch{res.json({ok:false});}
});

app.post('/api/admin/users/delete', async (req,res) => {
  try {
    const u=await getUser(req); if(!isAdmin(u)) return res.json({ok:false});
    const {userId}=req.body;
    // Block admin from deleting the main admin account
    const target = (await pool.query('SELECT email FROM users WHERE id=$1',[userId])).rows[0];
    if (target && target.email === ADMIN_EMAIL) return res.json({ok:false,error:'Нельзя удалить главного админа'});
    await pool.query('DELETE FROM sessions WHERE user_id=$1',[userId]);
    await pool.query('DELETE FROM pending_sounds WHERE author_id=$1',[userId]);
    await pool.query('DELETE FROM users WHERE id=$1',[userId]);
    // Sounds are kept — authorName field preserves the historical info
    res.json({ok:true});
  } catch(e){console.error(e);res.json({ok:false});}
});

// ===== Reports (require login) =====
app.post('/api/reports', async (req,res) => {
  try {
    const u = await getUser(req);
    if (!u) return res.json({ok:false, error:'Требуется войти в аккаунт'});
    const {message} = req.body || {};
    if (!message?.trim()) return res.json({ok:false, error:'Сообщение пустое'});
    const id = genId();
    await pool.query('INSERT INTO reports (id,user_id,user_name,user_email,message) VALUES ($1,$2,$3,$4,$5)',
      [id, u.id, u.name, u.email, message.trim()]);
    res.json({ok:true});
  } catch(e){console.error(e);res.json({ok:false});}
});

app.get('/api/admin/reports', async (req,res) => {
  try {
    const u=await getUser(req); if(!isAdmin(u)) return res.json([]);
    const r = await pool.query('SELECT * FROM reports ORDER BY created_at DESC');
    res.json(r.rows);
  } catch{res.json([]);}
});

app.post('/api/admin/reports/mark-read', async (req,res) => {
  try {
    const u=await getUser(req); if(!isAdmin(u)) return res.json({ok:false});
    // Get report before deleting to know which user to notify
    const rep = (await pool.query('SELECT user_id,user_email FROM reports WHERE id=$1',[req.body.reportId])).rows[0];
    await pool.query('DELETE FROM reports WHERE id=$1',[req.body.reportId]);
    // Send notification to the user
    if (rep && rep.user_id) {
      const bcid = genId();
      await pool.query('INSERT INTO broadcasts (id,title,body,created_by) VALUES ($1,$2,$3,$4)',
        [bcid, 'Ваш репорт рассмотрен', 'Администраторы посмотрели ваш репорт. Спасибо за обратную связь!', u.id]);
    }
    res.json({ok:true});
  } catch(e){console.error(e);res.json({ok:false});}
});

// ===== Broadcasts (admin announcements) =====
app.post('/api/admin/broadcasts', async (req,res) => {
  try {
    const u=await getUser(req); if(!isAdmin(u)) return res.json({ok:false});
    const id = genId();
    const {title, body} = req.body;
    await pool.query('INSERT INTO broadcasts (id,title,body,created_by) VALUES ($1,$2,$3,$4)',[id,title,body,u.id]);
    res.json({ok:true});
  } catch(e){console.error(e);res.json({ok:false});}
});

app.get('/api/broadcasts', async (req,res) => {
  try {
    const u=await getUser(req);
    if (!u) return res.json({unread:0, broadcasts:[]});
    const all = await pool.query('SELECT * FROM broadcasts ORDER BY created_at DESC LIMIT 20');
    const read = await pool.query('SELECT broadcast_id FROM user_read_broadcasts WHERE user_id=$1',[u.id]);
    const readIds = new Set(read.rows.map(r => r.broadcast_id));
    const broadcasts = all.rows.map(b => ({...b, read: readIds.has(b.id)}));
    res.json({ unread: broadcasts.filter(b => !b.read).length, broadcasts });
  } catch{res.json({unread:0,broadcasts:[]});}
});

app.post('/api/broadcasts/mark-read', async (req,res) => {
  try {
    const u=await getUser(req); if(!u) return res.json({ok:false});
    await pool.query('INSERT INTO user_read_broadcasts (user_id,broadcast_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',[u.id,req.body.broadcastId]);
    res.json({ok:true});
  } catch(e){console.error(e);res.json({ok:false});}
});

// SPA fallback
app.get('/{*path}', (_req, res) => { res.sendFile(path.join(__dirname, 'dist', 'index.html')); });

initDB().then(() => { app.listen(PORT, () => console.log(`Server on port ${PORT}`)); })
  .catch(e => { console.error('DB fail:', e.message); app.listen(PORT, () => console.log(`Server on port ${PORT} (no DB)`)); });
