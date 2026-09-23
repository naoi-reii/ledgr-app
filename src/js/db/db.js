import initSqlJs from 'sql.js';

let db = null;
const STORAGE_KEY = 'ledgr_sqlite_db';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  default_amount REAL NOT NULL,
  due_day INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  recurrence_months INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bill_occurrences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  due_date TEXT NOT NULL,
  amount REAL NOT NULL,
  is_amount_overridden INTEGER DEFAULT 0,
  is_paid INTEGER DEFAULT 0,
  paid_at TEXT
);
`;

/**
 * Initialize SQLite Database (sql.js for web preview with local persistence)
 */
export async function initDB() {
  if (db) return db;

  try {
    const SQL = await initSqlJs({
      locateFile: file => `/assets/${file}`
    });

    // Try loading persisted DB array buffer from localStorage
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const uInt8Array = new Uint8Array(JSON.parse(savedData));
      db = new SQL.Database(uInt8Array);
    } else {
      db = new SQL.Database();
    }

    // Initialize Schema
    db.run(SCHEMA_SQL);
    saveDB();
    console.log("Database initialized successfully.");
    return db;
  } catch (err) {
    console.error("Failed to initialize database:", err);
    throw err;
  }
}

/**
 * Persist database binary to local storage
 */
export function saveDB() {
  if (!db) return;
  try {
    const binaryArray = Array.from(db.export());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(binaryArray));
  } catch (e) {
    console.error("Failed to save database to storage:", e);
  }
}

/**
 * Execute DML / DDL statement (INSERT, UPDATE, DELETE)
 */
export function run(sql, params = []) {
  if (!db) throw new Error("Database not initialized");
  db.run(sql, params);
  saveDB();
  return { lastInsertRowid: getLastInsertRowId() };
}

/**
 * Get last inserted row ID
 */
export function getLastInsertRowId() {
  const res = db.exec("SELECT last_insert_rowid() as id;");
  if (res.length > 0 && res[0].values.length > 0) {
    return res[0].values[0][0];
  }
  return null;
}

/**
 * Run SELECT query and return array of JS objects
 */
export function select(sql, params = []) {
  if (!db) throw new Error("Database not initialized");
  const stmt = db.prepare(sql);
  stmt.bind(params);
  
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

/**
 * Run SELECT query and return first row as JS object
 */
export function selectOne(sql, params = []) {
  const rows = select(sql, params);
  return rows.length > 0 ? rows[0] : null;
}
