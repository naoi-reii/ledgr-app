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
