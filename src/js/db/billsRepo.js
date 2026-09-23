import { run, select, selectOne } from './db.js';

/**
 * Format a Date object to ISO YYYY-MM-DD string
 */
export function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Clamp a due day to the last valid day of a given month
 * e.g., Feb (month 2) with day 31 -> 28 or 29
 * @param {number} year 
 * @param {number} month 1-12
 * @param {number} dueDay 1-31
 * @returns {string} YYYY-MM-DD
 */
export function buildClampedDueDate(year, month, dueDay) {
  // get total days in target month
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const actualDay = Math.min(dueDay, totalDaysInMonth);
  const mStr = String(month).padStart(2, '0');
  const dStr = String(actualDay).padStart(2, '0');
  return `${year}-${mStr}-${dStr}`;
}

/**
 * Create a new bill template and generate its occurrences
 * @param {Object} bill 
 *   name, category, default_amount, start_date (YYYY-MM-DD), recurrence_months (null/0/1/N)
 */
export function createBill(bill) {
  const startDateObj = new Date(bill.start_date);
  const dueDay = startDateObj.getDate();
  const createdAt = new Date().toISOString();
  const recurrenceMonths = bill.recurrence_months ? parseInt(bill.recurrence_months, 10) : 0;

  const res = run(
    `INSERT INTO bills (name, category, default_amount, due_day, start_date, recurrence_months, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      bill.name,
      bill.category,
      parseFloat(bill.default_amount),
      dueDay,
      bill.start_date,
      recurrenceMonths,
      createdAt
    ]
  );

  let newBillId = res ? res.lastInsertRowid : null;
  if (!newBillId) {
    const maxRow = selectOne(`SELECT MAX(id) as id FROM bills`);
    newBillId = maxRow ? maxRow.id : 1;
  }

  const createdBill = selectOne(`SELECT * FROM bills WHERE id = ?`, [newBillId]) || {
    id: newBillId,
    name: bill.name,
    category: bill.category,
    default_amount: parseFloat(bill.default_amount),
    due_day: dueDay,
    start_date: bill.start_date,
    recurrence_months: recurrenceMonths,
    created_at: createdAt
  };

  generateOccurrences(createdBill);
  return createdBill;
}

/**
 * Generate occurrences for a bill based on recurrence rule
 */
export function generateOccurrences(bill) {
  if (!bill || !bill.start_date) return;
  const startObj = new Date(bill.start_date);
  const startYear = startObj.getFullYear();
  const startMonth = startObj.getMonth() + 1; // 1-12
  const dueDay = bill.due_day;
  const count = bill.recurrence_months;

  let occurrencesToCreate = [];

  if (count === 1) {
    // One-time bill
    occurrencesToCreate.push({
      due_date: bill.start_date,
      amount: bill.default_amount
    });
  } else if (count > 1) {
    // Fixed N months
    for (let i = 0; i < count; i++) {
      let targetMonth = startMonth + i;
      let targetYear = startYear + Math.floor((targetMonth - 1) / 12);
      let monthInYear = ((targetMonth - 1) % 12) + 1;

      let dueDateStr = buildClampedDueDate(targetYear, monthInYear, dueDay);
      occurrencesToCreate.push({
        due_date: dueDateStr,
        amount: bill.default_amount
      });
    }
  } else {
    // Indefinite (0 or null) -> generate 12 months ahead
    for (let i = 0; i < 12; i++) {
      let targetMonth = startMonth + i;
      let targetYear = startYear + Math.floor((targetMonth - 1) / 12);
      let monthInYear = ((targetMonth - 1) % 12) + 1;

      let dueDateStr = buildClampedDueDate(targetYear, monthInYear, dueDay);
      occurrencesToCreate.push({
        due_date: dueDateStr,
        amount: bill.default_amount
      });
    }
  }

  for (const occ of occurrencesToCreate) {
    // Check if occurrence for this bill and due_date already exists
    const existing = selectOne(
      `SELECT id FROM bill_occurrences WHERE bill_id = ? AND due_date = ?`,
      [bill.id, occ.due_date]
    );

    if (!existing) {
      run(
        `INSERT INTO bill_occurrences (bill_id, due_date, amount, is_amount_overridden, is_paid)
         VALUES (?, ?, ?, 0, 0)`,
        [bill.id, occ.due_date, occ.amount]
      );
    }
  }
}

/**
 * Ensure rolling 12-month window for ongoing/indefinite bills
 */
export function ensureIndefiniteOccurrences() {
  const indefiniteBills = select(`SELECT * FROM bills WHERE recurrence_months IS NULL OR recurrence_months = 0`);
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  for (const bill of indefiniteBills) {
    for (let i = 0; i < 12; i++) {
      let targetMonth = todayMonth + i;
      let targetYear = todayYear + Math.floor((targetMonth - 1) / 12);
      let monthInYear = ((targetMonth - 1) % 12) + 1;

      let dueDateStr = buildClampedDueDate(targetYear, monthInYear, bill.due_day);
      const existing = selectOne(
        `SELECT id FROM bill_occurrences WHERE bill_id = ? AND due_date = ?`,
        [bill.id, dueDateStr]
      );

      if (!existing) {
        run(
          `INSERT INTO bill_occurrences (bill_id, due_date, amount, is_amount_overridden, is_paid)
           VALUES (?, ?, ?, 0, 0)`,
          [bill.id, dueDateStr, bill.default_amount]
        );
      }
    }
  }
}

/**
 * Override amount for a single occurrence
 */
export function updateOccurrenceAmount(occurrenceId, newAmount) {
  return run(
    `UPDATE bill_occurrences 
     SET amount = ?, is_amount_overridden = 1 
     WHERE id = ?`,
    [parseFloat(newAmount), occurrenceId]
  );
}

/**
 * Toggle paid status for an occurrence
 */
export function setPaid(occurrenceId, isPaid) {
  const paidVal = isPaid ? 1 : 0;
  const paidAt = isPaid ? new Date().toISOString() : null;
  return run(
    `UPDATE bill_occurrences 
     SET is_paid = ?, paid_at = ? 
     WHERE id = ?`,
    [paidVal, paidAt, occurrenceId]
  );
}

/**
 * Update a bill template
 * Updates template fields. If default_amount changed, updates future unpaid, non-overridden occurrences.
 */
export function updateBill(bill) {
  const oldBill = selectOne(`SELECT * FROM bills WHERE id = ?`, [bill.id]);
  const defaultAmount = parseFloat(bill.default_amount);

  run(
    `UPDATE bills 
     SET name = ?, category = ?, default_amount = ?, due_day = ?, recurrence_months = ?
     WHERE id = ?`,
    [bill.name, bill.category, defaultAmount, parseInt(bill.due_day, 10), bill.recurrence_months ? parseInt(bill.recurrence_months, 10) : 0, bill.id]
  );

  // Default behavior rule: update default amount on future unpaid, non-overridden occurrences
  if (oldBill && oldBill.default_amount !== defaultAmount) {
    const todayStr = formatDateISO(new Date());
    run(
      `UPDATE bill_occurrences 
       SET amount = ? 
       WHERE bill_id = ? AND is_paid = 0 AND is_amount_overridden = 0 AND due_date >= ?`,
      [defaultAmount, bill.id, todayStr]
    );
  }
}

/**
 * Delete a bill or single occurrence
 * @param {number} id bill_id (if series) or occurrence_id (if single)
 * @param {string} mode "series" or "single"
 */
export function deleteBill(id, mode) {
  if (mode === 'series') {
    // Delete all occurrences and the template
    run(`DELETE FROM bill_occurrences WHERE bill_id = ?`, [id]);
    run(`DELETE FROM bills WHERE id = ?`, [id]);
  } else if (mode === 'single') {
    // Delete just one specific occurrence
    run(`DELETE FROM bill_occurrences WHERE id = ?`, [id]);
  }
}

/**
 * Get upcoming occurrences for Home tab with filtering
 * @param {string} statusFilter 'all' | 'paid' | 'unpaid' | 'overdue'
 * @param {string} categoryFilter 'all' | category name
 */
export function getUpcomingOccurrences(statusFilter = 'all', categoryFilter = 'all') {
  ensureIndefiniteOccurrences();
  const todayStr = formatDateISO(new Date());

  let sql = `
    SELECT 
      o.id as occurrence_id,
      o.bill_id,
      o.due_date,
      o.amount,
      o.is_amount_overridden,
      o.is_paid,
      o.paid_at,
      b.name,
      b.category,
      b.default_amount,
      b.due_day,
      b.recurrence_months
    FROM bill_occurrences o
    JOIN bills b ON o.bill_id = b.id
    WHERE 1=1
  `;
  const params = [];

  if (categoryFilter && categoryFilter !== 'all') {
    sql += ` AND b.category = ?`;
    params.push(categoryFilter);
  }

  if (statusFilter === 'paid') {
    sql += ` AND o.is_paid = 1`;
  } else if (statusFilter === 'unpaid') {
    sql += ` AND o.is_paid = 0 AND o.due_date >= ?`;
    params.push(todayStr);
  } else if (statusFilter === 'overdue') {
    sql += ` AND o.is_paid = 0 AND o.due_date < ?`;
    params.push(todayStr);
  }

  sql += ` ORDER BY o.due_date ASC, b.name ASC`;
  const rows = select(sql, params);

  // Compute computed 'is_overdue' flag for UI formatting
  return rows.map(r => ({
    ...r,
    is_overdue: r.is_paid === 0 && r.due_date < todayStr
  }));
}

/**
 * Get occurrences for a specific month (Calendar tab)
 * @param {number} year e.g. 2026
 * @param {number} month 1-12
 */
export function getOccurrencesForMonth(year, month) {
  ensureIndefiniteOccurrences();
  const todayStr = formatDateISO(new Date());

  const mStr = String(month).padStart(2, '0');
  const startDate = `${year}-${mStr}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${mStr}-${String(lastDay).padStart(2, '0')}`;

  const sql = `
    SELECT 
      o.id as occurrence_id,
      o.bill_id,
      o.due_date,
      o.amount,
      o.is_amount_overridden,
      o.is_paid,
      o.paid_at,
      b.name,
      b.category,
      b.default_amount,
      b.due_day,
      b.recurrence_months
    FROM bill_occurrences o
    JOIN bills b ON o.bill_id = b.id
    WHERE o.due_date >= ? AND o.due_date <= ?
    ORDER BY o.due_date ASC, b.name ASC
  `;

  const rows = select(sql, [startDate, endDate]);
  return rows.map(r => ({
    ...r,
    is_overdue: r.is_paid === 0 && r.due_date < todayStr
  }));
}

/**
 * Get single occurrence detail
 */
export function getOccurrenceById(occurrenceId) {
  const todayStr = formatDateISO(new Date());
  const sql = `
    SELECT 
      o.id as occurrence_id,
      o.bill_id,
      o.due_date,
      o.amount,
      o.is_amount_overridden,
      o.is_paid,
      o.paid_at,
      b.name,
      b.category,
      b.default_amount,
      b.due_day,
      b.start_date,
      b.recurrence_months
    FROM bill_occurrences o
    JOIN bills b ON o.bill_id = b.id
    WHERE o.id = ?
  `;
  const row = selectOne(sql, [occurrenceId]);
  if (!row) return null;
  return {
    ...row,
    is_overdue: row.is_paid === 0 && row.due_date < todayStr
  };
}

/**
 * Get bill template by ID
 */
export function getBillById(billId) {
  return selectOne(`SELECT * FROM bills WHERE id = ?`, [billId]);
}
