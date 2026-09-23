import { navigate } from '../router.js';

/**
 * Render the bottom navigation bar
 * @param {string} activeView 'home' | 'calendar' | 'add-bill' | 'bill-detail'
 */
export function renderNav(activeView) {
  const navEl = document.getElementById('app-nav');
  if (!navEl) return;

  const isHomeActive = activeView === 'home';
  const isCalendarActive = activeView === 'calendar';

  navEl.innerHTML = `
    <!-- Home Tab -->
    <button id="nav-btn-home" class="flex flex-col items-center justify-center space-y-1 transition-colors ${isHomeActive ? 'text-accent-purple' : 'text-text-secondary hover:text-text-primary'}">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
      </svg>
      <span class="text-label ${isHomeActive ? 'font-semibold text-accent-purple' : 'font-normal text-text-secondary'}">Home</span>
    </button>

    <!-- Add Bill Floating Accent Button -->
    <button id="nav-btn-add" class="w-12 h-12 rounded-full bg-accent-purple text-text-primary flex items-center justify-center transform active:scale-95 transition-all -mt-5 border-4 border-base">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
      </svg>
    </button>

    <!-- Calendar Tab -->
    <button id="nav-btn-calendar" class="flex flex-col items-center justify-center space-y-1 transition-colors ${isCalendarActive ? 'text-accent-purple' : 'text-text-secondary hover:text-text-primary'}">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
      <span class="text-label ${isCalendarActive ? 'font-semibold text-accent-purple' : 'font-normal text-text-secondary'}">Calendar</span>
    </button>
  `;

  // Attach navigation listeners
  document.getElementById('nav-btn-home')?.addEventListener('click', () => navigate('home'));
  document.getElementById('nav-btn-calendar')?.addEventListener('click', () => navigate('calendar'));
  document.getElementById('nav-btn-add')?.addEventListener('click', () => navigate('add-bill'));
}
