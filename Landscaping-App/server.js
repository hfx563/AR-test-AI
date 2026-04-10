const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const path = require('path');
const { getDb, all, get, run } = require('./db');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'artest';
const PORT = process.env.PORT || 3000;
const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 hours
const sessions = new Set();
const sessionExpiry = new Map();
const nfcDebounce = new Map();

// ── Middleware ────────────────────────────────────────────
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// ── Rate limiters ─────────────────────────────────────────
const nfcLimiter = rateLimit({ windowMs: 60_000, max: 20 });
const writeLimiter = rateLimit({ windowMs: 60_000, max: 60 });
const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 10 }); // 10 login attempts per 15 min

// ── Helpers ───────────────────────────────────────────────
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim().slice(0, 500);
}

function requireAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Unauthorized' });
  const exp = sessionExpiry.get(token);
  if (exp && Date.now() > exp) {
    sessions.delete(token); sessionExpiry.delete(token);
    return res.status(401).json({ error: 'Session expired' });
  }
  next();
}

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(c => c.readyState === 1 && c.send(msg));
}

function getTrucksInYard() {
  return all(`
    SELECT t.id, t.name, t.driver, l.timestamp as since FROM trucks t
    JOIN logs l ON l.id = (SELECT id FROM logs WHERE truck_id = t.id ORDER BY timestamp DESC LIMIT 1)
    WHERE l.action = 'entry'
  `);
}

// Clean expired sessions every hour
setInterval(() => {
  const now = Date.now();
  sessionExpiry.forEach((exp, token) => {
    if (now > exp) { sessions.delete(token); sessionExpiry.delete(token); }
  });
}, 60 * 60 * 1000);

// ── Health check ──────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }));

// ── Auth ──────────────────────────────────────────────────
app.post('/api/auth/login', authLimiter, (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid password' });
  const token = uuidv4();
  sessions.add(token);
  sessionExpiry.set(token, Date.now() + SESSION_TTL);
  res.json({ token });
});
app.post('/api/auth/logout', (req, res) => {
  const t = req.headers['x-admin-token'];
  sessions.delete(t); sessionExpiry.delete(t);
  res.json({ ok: true });
});

// ── Trucks ────────────────────────────────────────────────
app.get('/api/trucks', (req, res) => res.json(all('SELECT * FROM trucks ORDER BY name')));
app.post('/api/trucks', requireAuth, writeLimiter, (req, res) => {
  const { name, nfc_tag, driver, plate, capacity } = req.body;
  if (!name || !nfc_tag) return res.status(400).json({ error: 'name and nfc_tag required' });
  if (get('SELECT id FROM trucks WHERE nfc_tag=?', [nfc_tag])) return res.status(409).json({ error: 'NFC tag already in use' });
  const id = uuidv4();
  run('INSERT INTO trucks (id, name, nfc_tag, driver, plate, capacity) VALUES (?,?,?,?,?,?)',
    [id, sanitize(name), sanitize(nfc_tag), sanitize(driver||''), sanitize(plate||''), sanitize(capacity||'')]);
  res.json({ id, name, nfc_tag });
});
app.put('/api/trucks/:id', requireAuth, (req, res) => {
  const { name, nfc_tag, driver, plate, capacity, status } = req.body;
  if (get('SELECT id FROM trucks WHERE nfc_tag=? AND id!=?', [nfc_tag, req.params.id])) return res.status(409).json({ error: 'NFC tag already in use' });
  run('UPDATE trucks SET name=?, nfc_tag=?, driver=?, plate=?, capacity=?, status=? WHERE id=?',
    [sanitize(name), sanitize(nfc_tag), sanitize(driver||''), sanitize(plate||''), sanitize(capacity||''), status||'available', req.params.id]);
  res.json({ ok: true });
});
app.delete('/api/trucks/:id', requireAuth, (req, res) => {
  run('DELETE FROM logs WHERE truck_id=?', [req.params.id]);
  run('DELETE FROM trucks WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

// ── Drivers ───────────────────────────────────────────────
app.get('/api/drivers', (req, res) => res.json(all('SELECT * FROM drivers ORDER BY name')));
app.post('/api/drivers', requireAuth, writeLimiter, (req, res) => {
  const { name, phone, license } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const id = uuidv4();
  run('INSERT INTO drivers (id, name, phone, license) VALUES (?,?,?,?)',
    [id, sanitize(name), sanitize(phone||''), sanitize(license||'')]);
  res.json({ id, name });
});
app.put('/api/drivers/:id', requireAuth, (req, res) => {
  const { name, phone, license, status } = req.body;
  run('UPDATE drivers SET name=?, phone=?, license=?, status=? WHERE id=?',
    [sanitize(name), sanitize(phone||''), sanitize(license||''), status||'active', req.params.id]);
  res.json({ ok: true });
});
app.delete('/api/drivers/:id', requireAuth, (req, res) => {
  run('DELETE FROM drivers WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

// ── Jobs ──────────────────────────────────────────────────
app.get('/api/jobs', (req, res) => res.json(all('SELECT * FROM jobs ORDER BY scheduled_at DESC')));
app.post('/api/jobs', requireAuth, writeLimiter, (req, res) => {
  const { title, customer, site_address, site_lat, site_lng, job_type, material, quantity, unit, truck_id, driver_id, scheduled_at, notes } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const id = uuidv4();
  run('INSERT INTO jobs (id,title,customer,site_address,site_lat,site_lng,job_type,material,quantity,unit,truck_id,driver_id,scheduled_at,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [id, sanitize(title), sanitize(customer||''), sanitize(site_address||''), parseFloat(site_lat)||0, parseFloat(site_lng)||0,
     job_type||'delivery', sanitize(material||''), parseFloat(quantity)||0, unit||'yards',
     truck_id||'', driver_id||'', scheduled_at||'', sanitize(notes||'')]);
  broadcast({ type: 'job_update' });
  res.json({ id, title });
});
app.put('/api/jobs/:id', requireAuth, (req, res) => {
  const { title, customer, site_address, site_lat, site_lng, job_type, material, quantity, unit, truck_id, driver_id, scheduled_at, status, notes } = req.body;
  run('UPDATE jobs SET title=?,customer=?,site_address=?,site_lat=?,site_lng=?,job_type=?,material=?,quantity=?,unit=?,truck_id=?,driver_id=?,scheduled_at=?,status=?,notes=? WHERE id=?',
    [sanitize(title), sanitize(customer||''), sanitize(site_address||''), parseFloat(site_lat)||0, parseFloat(site_lng)||0,
     job_type||'delivery', sanitize(material||''), parseFloat(quantity)||0, unit||'yards',
     truck_id||'', driver_id||'', scheduled_at||'', status||'pending', sanitize(notes||''), req.params.id]);
  broadcast({ type: 'job_update' });
  res.json({ ok: true });
});
app.delete('/api/jobs/:id', requireAuth, (req, res) => {
  run('DELETE FROM jobs WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

// ── Trips ─────────────────────────────────────────────────
app.get('/api/trips', (req, res) => {
  const { truck_id, driver_id, status, from, to } = req.query;
  let sql = `SELECT t.*, tr.name as truck_name, d.name as driver_name, j.title as job_title
    FROM trips t LEFT JOIN trucks tr ON tr.id=t.truck_id
    LEFT JOIN drivers d ON d.id=t.driver_id LEFT JOIN jobs j ON j.id=t.job_id WHERE 1=1`;
  const params = [];
  if (truck_id) { sql += ' AND t.truck_id=?'; params.push(truck_id); }
  if (driver_id) { sql += ' AND t.driver_id=?'; params.push(driver_id); }
  if (status) { sql += ' AND t.status=?'; params.push(status); }
  if (from) { sql += ' AND t.start_time>=?'; params.push(from); }
  if (to) { sql += ' AND t.start_time<=?'; params.push(to); }
  sql += ' ORDER BY t.start_time DESC LIMIT 500';
  res.json(all(sql, params));
});
app.post('/api/trips', requireAuth, writeLimiter, (req, res) => {
  const { truck_id, driver_id, job_id, material, quantity, unit, notes } = req.body;
  if (!truck_id) return res.status(400).json({ error: 'truck_id required' });
  const id = uuidv4();
  run('INSERT INTO trips (id,truck_id,driver_id,job_id,material,quantity,unit,notes) VALUES (?,?,?,?,?,?,?,?)',
    [id, truck_id, driver_id||'', job_id||'', sanitize(material||''), parseFloat(quantity)||0, unit||'yards', sanitize(notes||'')]);
  run('UPDATE trucks SET status=? WHERE id=?', ['on_trip', truck_id]);
  broadcast({ type: 'trip_update' });
  res.json({ id });
});
app.put('/api/trips/:id', requireAuth, (req, res) => {
  const { status, end_time, site_arrive, site_depart, notes, photo_url } = req.body;
  const trip = get('SELECT * FROM trips WHERE id=?', [req.params.id]);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  run('UPDATE trips SET status=?,end_time=?,site_arrive=?,site_depart=?,notes=?,photo_url=? WHERE id=?',
    [status||trip.status, end_time||trip.end_time||'', site_arrive||trip.site_arrive||'',
     site_depart||trip.site_depart||'', sanitize(notes||trip.notes), photo_url||trip.photo_url||'', req.params.id]);
  if (status === 'completed') run('UPDATE trucks SET status=? WHERE id=?', ['available', trip.truck_id]);
  broadcast({ type: 'trip_update' });
  res.json({ ok: true });
});
app.delete('/api/trips/:id', requireAuth, (req, res) => {
  const trip = get('SELECT * FROM trips WHERE id=?', [req.params.id]);
  if (trip && trip.status === 'in_progress') run('UPDATE trucks SET status=? WHERE id=?', ['available', trip.truck_id]);
  run('DELETE FROM trips WHERE id=?', [req.params.id]);
  broadcast({ type: 'trip_update' });
  res.json({ ok: true });
});

// ── Check-ins ─────────────────────────────────────────────
app.post('/api/checkins', (req, res) => {
  const { trip_id, truck_id, driver_id, type, lat, lng, note } = req.body;
  run('INSERT INTO checkins (trip_id,truck_id,driver_id,type,lat,lng,note) VALUES (?,?,?,?,?,?,?)',
    [trip_id||'', truck_id||'', driver_id||'', type||'arrive', parseFloat(lat)||0, parseFloat(lng)||0, sanitize(note||'')]);
  broadcast({ type: 'checkin', truck_id, checkin_type: type });
  res.json({ ok: true });
});
app.get('/api/checkins', (req, res) => res.json(all('SELECT * FROM checkins ORDER BY timestamp DESC LIMIT 200')));

// ── NFC ───────────────────────────────────────────────────
app.post('/api/nfc', nfcLimiter, (req, res) => {
  const { nfc_tag } = req.body;
  if (!nfc_tag) return res.status(400).json({ error: 'nfc_tag required' });
  const lastTap = nfcDebounce.get(nfc_tag);
  if (lastTap && Date.now() - lastTap < 5000) return res.status(429).json({ error: 'Duplicate tap ignored' });
  nfcDebounce.set(nfc_tag, Date.now());
  const truck = get('SELECT * FROM trucks WHERE nfc_tag=?', [nfc_tag]);
  if (!truck) return res.status(404).json({ error: 'Unknown NFC tag' });
  const last = get('SELECT action FROM logs WHERE truck_id=? ORDER BY timestamp DESC LIMIT 1', [truck.id]);
  const action = (!last || last.action === 'exit') ? 'entry' : 'exit';
  run('INSERT INTO logs (truck_id, action, source) VALUES (?,?,?)', [truck.id, action, 'nfc']);
  const yard = getTrucksInYard();
  broadcast({ type: 'update', yard, count: yard.length, truck, action });
  res.json({ truck, action, count: yard.length });
});

// ── Logs ──────────────────────────────────────────────────
app.get('/api/logs', (req, res) => res.json(all(`
  SELECT l.*, t.name as truck_name, t.driver FROM logs l
  JOIN trucks t ON t.id=l.truck_id ORDER BY l.timestamp DESC LIMIT 200`)));
app.post('/api/logs', requireAuth, writeLimiter, (req, res) => {
  const { truck_id, action, note } = req.body;
  if (!truck_id || !['entry','exit'].includes(action)) return res.status(400).json({ error: 'Invalid' });
  run('INSERT INTO logs (truck_id,action,note,source) VALUES (?,?,?,?)', [truck_id, action, sanitize(note||''), 'manual']);
  const yard = getTrucksInYard();
  broadcast({ type: 'update', yard, count: yard.length });
  res.json({ ok: true, count: yard.length });
});
app.put('/api/logs/:id', requireAuth, (req, res) => {
  const { action, note } = req.body;
  if (!['entry','exit'].includes(action)) return res.status(400).json({ error: 'Invalid action' });
  run('UPDATE logs SET action=?,note=? WHERE id=?', [action, sanitize(note||''), req.params.id]);
  broadcast({ type: 'update', yard: getTrucksInYard() });
  res.json({ ok: true });
});
app.delete('/api/logs/:id', requireAuth, (req, res) => {
  run('DELETE FROM logs WHERE id=?', [req.params.id]);
  broadcast({ type: 'update', yard: getTrucksInYard() });
  res.json({ ok: true });
});

// ── Maintenance ───────────────────────────────────────────
app.get('/api/maintenance', (req, res) => {
  // Auto-flag overdue records
  run(`UPDATE maintenance SET status='overdue' WHERE due_date < date('now') AND status='upcoming'`);
  res.json(all(`SELECT m.*, t.name as truck_name FROM maintenance m LEFT JOIN trucks t ON t.id=m.truck_id ORDER BY m.due_date ASC`));
});
app.post('/api/maintenance', requireAuth, writeLimiter, (req, res) => {
  const { truck_id, type, due_date, due_miles, last_done, notes } = req.body;
  if (!truck_id || !type) return res.status(400).json({ error: 'truck_id and type required' });
  const id = uuidv4();
  run('INSERT INTO maintenance (id,truck_id,type,due_date,due_miles,last_done,notes) VALUES (?,?,?,?,?,?,?)',
    [id, truck_id, sanitize(type), due_date||'', parseInt(due_miles)||0, last_done||'', sanitize(notes||'')]);
  res.json({ id });
});
app.put('/api/maintenance/:id', requireAuth, (req, res) => {
  const { type, due_date, due_miles, last_done, notes, status } = req.body;
  run('UPDATE maintenance SET type=?,due_date=?,due_miles=?,last_done=?,notes=?,status=? WHERE id=?',
    [sanitize(type), due_date||'', parseInt(due_miles)||0, last_done||'', sanitize(notes||''), status||'upcoming', req.params.id]);
  res.json({ ok: true });
});
app.delete('/api/maintenance/:id', requireAuth, (req, res) => {
  run('DELETE FROM maintenance WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

// ── Invoices ──────────────────────────────────────────────
app.get('/api/invoices', (req, res) => res.json(all('SELECT * FROM invoices ORDER BY created_at DESC')));
app.post('/api/invoices', requireAuth, writeLimiter, (req, res) => {
  const { job_id, customer, amount, due_date, notes } = req.body;
  if (!customer) return res.status(400).json({ error: 'customer required' });
  const id = uuidv4();
  run('INSERT INTO invoices (id,job_id,customer,amount,due_date,notes) VALUES (?,?,?,?,?,?)',
    [id, job_id||'', sanitize(customer), parseFloat(amount)||0, due_date||'', sanitize(notes||'')]);
  res.json({ id });
});
app.put('/api/invoices/:id', requireAuth, (req, res) => {
  const { customer, amount, status, due_date, notes } = req.body;
  run('UPDATE invoices SET customer=?,amount=?,status=?,due_date=?,notes=? WHERE id=?',
    [sanitize(customer), parseFloat(amount)||0, status||'unpaid', due_date||'', sanitize(notes||''), req.params.id]);
  res.json({ ok: true });
});
app.delete('/api/invoices/:id', requireAuth, (req, res) => {
  run('DELETE FROM invoices WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

// ── Geofences ─────────────────────────────────────────────
app.get('/api/geofences', (req, res) => res.json(all('SELECT * FROM geofences')));
app.post('/api/geofences', requireAuth, writeLimiter, (req, res) => {
  const { name, lat, lng, radius, type } = req.body;
  if (!name || !lat || !lng) return res.status(400).json({ error: 'name, lat, lng required' });
  const id = uuidv4();
  run('INSERT INTO geofences (id,name,lat,lng,radius,type) VALUES (?,?,?,?,?,?)',
    [id, sanitize(name), parseFloat(lat), parseFloat(lng), parseInt(radius)||200, type||'jobsite']);
  res.json({ id });
});
app.delete('/api/geofences/:id', requireAuth, (req, res) => {
  run('DELETE FROM geofences WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

// ── Status & Analytics ────────────────────────────────────
app.get('/api/status', (req, res) => {
  const yard = getTrucksInYard();
  const activeTrips = all("SELECT COUNT(*) as c FROM trips WHERE status='in_progress'")[0]?.c || 0;
  const pendingJobs = all("SELECT COUNT(*) as c FROM jobs WHERE status='pending'")[0]?.c || 0;
  const overdueMaintenace = all("SELECT COUNT(*) as c FROM maintenance WHERE due_date < date('now') AND status!='completed'")[0]?.c || 0;
  const unpaidInvoices = all("SELECT COUNT(*) as c FROM invoices WHERE status='unpaid'")[0]?.c || 0;
  res.json({ count: yard.length, yard, activeTrips, pendingJobs, overdueMaintenace, unpaidInvoices });
});

app.get('/api/analytics', (req, res) => {
  const tripsByTruck = all(`SELECT tr.name as truck_name, COUNT(*) as trips, SUM(t.quantity) as total_qty
    FROM trips t JOIN trucks tr ON tr.id=t.truck_id GROUP BY t.truck_id`);
  const tripsByDriver = all(`SELECT d.name as driver_name, COUNT(*) as trips
    FROM trips t JOIN drivers d ON d.id=t.driver_id GROUP BY t.driver_id`);
  const materialSummary = all(`SELECT material, SUM(quantity) as total, unit FROM trips WHERE material!='' GROUP BY material, unit`);
  const recentTrips = all(`SELECT COUNT(*) as c FROM trips WHERE start_time >= date('now','-7 days')`)[0]?.c || 0;
  res.json({ tripsByTruck, tripsByDriver, materialSummary, recentTrips });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

getDb().then(() => {
  server.listen(PORT, () => {
    console.log(`✅ GreenEdge server running at http://localhost:${PORT}`);
    console.log(`🔑 Admin password: ${ADMIN_PASSWORD}`);
  });
}).catch(err => { console.error('❌ DB init failed:', err.message); process.exit(1); });
