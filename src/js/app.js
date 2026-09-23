import { initDB } from './db/db.js';
import { renderCurrentView } from './router.js';

/**
 * App initialization
 */
async function initApp() {
  try {
    await initDB();
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

