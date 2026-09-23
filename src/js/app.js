import { initDB } from './db/db.js';
import { createBill, getUpcomingOccurrences } from './db/billsRepo.js';
import { renderCurrentView } from './router.js';

/**
 * Seed initial sample bills if database is empty
 */
function seedInitialDataIfEmpty() {
  const existing = getUpcomingOccurrences();
  if (existing.length === 0) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');

    // Create realistic sample bills
    createBill({
      name: 'Meralco Electric',
      category: 'Electricity',
      default_amount: 3450.00,
      start_date: `${currentYear}-${currentMonth}-15`,
      recurrence_months: 0
    });

    createBill({
      name: 'Maynilad Water',
      category: 'Water',
      default_amount: 820.00,
      start_date: `${currentYear}-${currentMonth}-20`,
      recurrence_months: 0
    });

    createBill({
      name: 'PLDT Fiber Internet',
      category: 'Internet',
      default_amount: 1899.00,
      start_date: `${currentYear}-${currentMonth}-05`,
      recurrence_months: 0
    });

    createBill({
      name: 'Apartment Rent',
      category: 'Rent',
      default_amount: 15000.00,
      start_date: `${currentYear}-${currentMonth}-01`,
      recurrence_months: 0
    });

    createBill({
      name: 'Netflix Premium',
      category: 'Subscription',
      default_amount: 549.00,
      start_date: `${currentYear}-${currentMonth}-28`,
      recurrence_months: 0
    });

    createBill({
      name: 'BDO Credit Card',
      category: 'Credit Card',
      default_amount: 12450.00,
      start_date: `${currentYear}-${currentMonth}-10`,
      recurrence_months: 0
    });
    console.log("Sample data seeded successfully.");
  }
}

/**
 * App initialization
 */
async function initApp() {
  try {
    await initDB();
    seedInitialDataIfEmpty();
    renderCurrentView();
  } catch (err) {
    console.error("Failed to start application:", err);
  }
}

// Boot application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
