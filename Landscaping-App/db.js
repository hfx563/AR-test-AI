const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'landscaping.db');
let db;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  db = fs.existsSync(DB_FILE)
    ? new SQL.Database(fs.readFileSync(DB_FILE))
    : new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS trucks (
      id TEXT PRIMARY KEY, nfc_tag TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL, driver TEXT DEFAULT '',
      plate TEXT DEFAULT '', capacity TEXT DEFAULT '',
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY, name TEXT NOT NULL,
      phone TEXT DEFAULT '', license TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY, title TEXT NOT NULL,
      customer TEXT DEFAULT '', site_address TEXT DEFAULT '',
      site_lat REAL DEFAULT 0, site_lng REAL DEFAULT 0,
      job_type TEXT DEFAULT 'delivery',
      material TEXT DEFAULT '', quantity REAL DEFAULT 0, unit TEXT DEFAULT 'yards',
      truck_id TEXT DEFAULT '', driver_id TEXT DEFAULT '',
      scheduled_at DATETIME, status TEXT DEFAULT 'pending',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY, truck_id TEXT NOT NULL, driver_id TEXT DEFAULT '',
      job_id TEXT DEFAULT '', material TEXT DEFAULT '',
      quantity REAL DEFAULT 0, unit TEXT DEFAULT 'yards',
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME, site_arrive DATETIME, site_depart DATETIME,
      status TEXT DEFAULT 'in_progress',
      notes TEXT DEFAULT '', photo_url TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, truck_id TEXT NOT NULL,
      action TEXT NOT NULL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      note TEXT DEFAULT '', source TEXT DEFAULT 'nfc'
    );
    CREATE TABLE IF NOT EXISTS maintenance (
      id TEXT PRIMARY KEY, truck_id TEXT NOT NULL,
      type TEXT NOT NULL, due_date DATE, due_miles INTEGER DEFAULT 0,
      last_done DATE, notes TEXT DEFAULT '',
      status TEXT DEFAULT 'upcoming',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY, job_id TEXT DEFAULT '', customer TEXT NOT NULL,
      amount REAL DEFAULT 0, status TEXT DEFAULT 'unpaid',
      due_date DATE, notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS geofences (
      id TEXT PRIMARY KEY, name TEXT NOT NULL,
      lat REAL NOT NULL, lng REAL NOT NULL, radius INTEGER DEFAULT 200,
      type TEXT DEFAULT 'jobsite',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id TEXT, truck_id TEXT,
      driver_id TEXT, type TEXT, lat REAL DEFAULT 0, lng REAL DEFAULT 0,
      note TEXT DEFAULT '', timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  save();
  return db;
}

function save() { if (db) fs.writeFileSync(DB_FILE, Buffer.from(db.export())); }
function all(sql, params = []) {
  const stmt = db.prepare(sql); stmt.bind(params);
  const rows = []; while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free(); return rows;
}
function get(sql, params = []) { return all(sql, params)[0] || null; }
function run(sql, params = []) { db.run(sql, params); save(); }

module.exports = { getDb, all, get, run };
