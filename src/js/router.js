import { renderHomeScreen } from './screens/home.js';
import { renderCalendarScreen } from './screens/calendar.js';
import { renderAddEditBillScreen } from './screens/addEditBill.js';
import { renderBillDetailScreen } from './screens/billDetail.js';
import { renderNav } from './components/nav.js';

let currentRoute = { view: 'home', params: {} };

/**
 * Navigate to a view with optional parameters
 * @param {string} view 'home' | 'calendar' | 'add-bill' | 'edit-bill' | 'bill-detail'
 * @param {Object} params 
 */
export function navigate(view, params = {}) {
  currentRoute = { view, params };
  renderCurrentView();
}

/**
 * Get current active route name
 */
export function getCurrentRoute() {
  return currentRoute;
}

/**
 * Render the current active view and update bottom navigation bar
 */
export async function renderCurrentView() {
  const container = document.getElementById('app-view');
  if (!container) return;

  // Clear previous content
  container.innerHTML = '';
  window.scrollTo(0, 0);

  // Update navigation bar
  renderNav(currentRoute.view);

  // Render specific view screen
  switch (currentRoute.view) {
    case 'calendar':
      await renderCalendarScreen(container, currentRoute.params);
      break;
    case 'add-bill':
      await renderAddEditBillScreen(container, { mode: 'add' });
      break;
    case 'edit-bill':
      await renderAddEditBillScreen(container, { mode: 'edit', billId: currentRoute.params.billId });
      break;
    case 'bill-detail':
      await renderBillDetailScreen(container, { occurrenceId: currentRoute.params.occurrenceId });
      break;
    case 'home':
    default:
      await renderHomeScreen(container, currentRoute.params);
      break;
  }
}
