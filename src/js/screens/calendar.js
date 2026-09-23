import { getOccurrencesForMonth, setPaid } from '../db/billsRepo.js';
import { formatCurrency, formatDateReadable, getCategoryConfig, getCategoryIconSvg } from '../constants.js';
import { navigate } from '../router.js';

let currentDate = new Date();
let selectedDateStr = null; // YYYY-MM-DD

/**
 * Render Calendar tab screen
 */
export async function renderCalendarScreen(container, params = {}) {
  if (params.year && params.month) {
    currentDate = new Date(params.year, params.month - 1, 1);
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-12
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Get occurrences for the entire month
  const monthOccurrences = getOccurrencesForMonth(year, month);

  // Compute stats
  const totalDue = monthOccurrences.reduce((acc, o) => acc + o.amount, 0);
  const totalPaid = monthOccurrences.filter(o => o.is_paid).reduce((acc, o) => acc + o.amount, 0);
  const totalRemaining = totalDue - totalPaid;

  // Selected date defaults to today or first day with occurrence or today if in current month
  const todayStr = new Date().toISOString().split('T')[0];
  if (!selectedDateStr || !selectedDateStr.startsWith(`${year}-${String(month).padStart(2, '0')}`)) {
    const hasToday = monthOccurrences.some(o => o.due_date === todayStr);
    if (hasToday) {
      selectedDateStr = todayStr;
    } else if (monthOccurrences.length > 0) {
      selectedDateStr = monthOccurrences[0].due_date;
    } else {
      selectedDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    }
  }

  const selectedDayOccurrences = monthOccurrences.filter(o => o.due_date === selectedDateStr);

  container.innerHTML = `
    <div class="space-y-5 animate-fade-in pb-6">
      <!-- Top Title Bar -->
      <div class="flex items-center justify-between pt-2">
        <h1 class="text-screen-title font-bold text-text-primary">Calendar</h1>
        <div class="flex items-center space-x-1 bg-surface rounded-xl p-1 border border-surface-alt/40">
          <button id="cal-prev-month" class="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <span class="text-section-header font-semibold text-text-primary px-2">${monthName} ${year}</span>
          <button id="cal-next-month" class="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Hero Cards Row (SAMPLE_UI Style) -->
      <div class="grid grid-cols-2 gap-3">
        <!-- Card 1: Total Due (Purple Accent) -->
        <div class="rounded-3xl p-4 bg-accent-purple text-text-primary shadow-lg shadow-accent-purple/20 space-y-1">
          <div class="text-caption text-white/80 font-medium uppercase tracking-wider">Total Due</div>
          <div class="text-card-amount font-bold text-white">${formatCurrency(totalDue)}</div>
          <div class="text-caption text-white/70">${monthOccurrences.length} total bills</div>
        </div>

        <!-- Card 2: Remaining / Overdue (Red/Dark Accent) -->
        <div class="rounded-3xl p-4 ${totalRemaining > 0 ? 'bg-accent-red' : 'bg-surface border border-surface-alt'} text-text-primary shadow-lg space-y-1">
          <div class="text-caption ${totalRemaining > 0 ? 'text-white/80' : 'text-text-secondary'} font-medium uppercase tracking-wider">Remaining</div>
          <div class="text-card-amount font-bold ${totalRemaining > 0 ? 'text-white' : 'text-text-primary'}">${formatCurrency(totalRemaining)}</div>
          <div class="text-caption ${totalRemaining > 0 ? 'text-white/70' : 'text-text-secondary'}">${formatCurrency(totalPaid)} Paid</div>
        </div>
      </div>

      <!-- Calendar Month Grid -->
      <div class="rounded-3xl bg-surface p-4 border border-surface-alt/30 space-y-3">
        <!-- Day-of-week header -->
        <div class="grid grid-cols-7 gap-1 text-center">
          ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => `
            <span class="text-caption font-semibold text-text-secondary uppercase tracking-wider">${day}</span>
          `).join('')}
        </div>

        <!-- Month Days Grid -->
        <div class="grid grid-cols-7 gap-1">
          ${renderCalendarDaysGrid(year, month, monthOccurrences, selectedDateStr)}
        </div>
      </div>

      <!-- Selected Day Bills Section -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-section-header text-text-primary font-semibold">
            Bills for ${formatDateReadable(selectedDateStr)}
          </h3>
          <span class="text-caption text-text-secondary">${selectedDayOccurrences.length} bills</span>
        </div>

        <div class="space-y-2.5">
          ${selectedDayOccurrences.length === 0 ? `
            <div class="rounded-2xl bg-surface p-6 text-center text-caption text-text-secondary border border-surface-alt/20">
              No bills due on this day.
            </div>
          ` : selectedDayOccurrences.map(occ => renderCalendarBillRow(occ)).join('')}
        </div>
      </div>
    </div>
  `;

  // Attach Month Navigation
  document.getElementById('cal-prev-month')?.addEventListener('click', () => {
    currentDate = new Date(year, month - 2, 1);
    selectedDateStr = null;
    renderCalendarScreen(container);
  });

  document.getElementById('cal-next-month')?.addEventListener('click', () => {
    currentDate = new Date(year, month, 1);
    selectedDateStr = null;
    renderCalendarScreen(container);
  });

  // Attach Day Cell Click Handler
  container.querySelectorAll('[data-cal-date]').forEach(cell => {
    cell.addEventListener('click', (e) => {
      selectedDateStr = cell.getAttribute('data-cal-date');
      renderCalendarScreen(container);
    });
  });

  // Attach Bill Row Click Handlers
  container.querySelectorAll('[data-occurrence-id]').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.toggle-paid-btn')) return;
      const occurrenceId = row.getAttribute('data-occurrence-id');
      navigate('bill-detail', { occurrenceId });
    });
  });

  // Attach Paid Toggle Buttons
  container.querySelectorAll('.toggle-paid-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const occurrenceId = btn.getAttribute('data-id');
      const isPaid = btn.getAttribute('data-paid') === 'true';
      setPaid(occurrenceId, !isPaid);
      renderCalendarScreen(container);
    });
  });
}

/**
 * Generate 7x5 or 7x6 calendar days HTML
 */
function renderCalendarDaysGrid(year, month, monthOccurrences, selectedDateStr) {
  // ISO Day of week for 1st day of month (0=Sun, 1=Mon, ..., 6=Sat)
  const firstDay = new Date(year, month - 1, 1);
  let startDayOfWeek = firstDay.getDay(); // 0 is Sun
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Convert to Mon=0...Sun=6

  const daysInMonth = new Date(year, month, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  let html = '';

  // Blank offset cells for previous month
  for (let i = 0; i < startDayOfWeek; i++) {
    html += `<div class="h-11 rounded-xl bg-transparent"></div>`;
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOccurrences = monthOccurrences.filter(o => o.due_date === dayStr);
    const isSelected = dayStr === selectedDateStr;
    const isToday = dayStr === todayStr;

    let dotColorClass = '';
    if (dayOccurrences.length > 0) {
      if (dayOccurrences.some(o => o.is_overdue)) {
        dotColorClass = 'bg-accent-red';
      } else if (dayOccurrences.every(o => o.is_paid)) {
        dotColorClass = 'bg-accent-purple';
      } else {
        dotColorClass = 'bg-accent-orange';
      }
    }

    html += `
      <button data-cal-date="${dayStr}" class="h-11 rounded-xl flex flex-col items-center justify-center relative transition-all ${isSelected ? 'bg-accent-purple text-text-primary font-bold shadow-md shadow-accent-purple/30 ring-2 ring-accent-purple' : isToday ? 'bg-surface-alt text-accent-purple font-bold border border-accent-purple/40' : 'bg-surface hover:bg-surface-alt text-text-primary'}">
        <span class="text-body">${d}</span>
        ${dayOccurrences.length > 0 ? `
          <div class="flex items-center space-x-0.5 mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : dotColorClass}"></span>
          </div>
        ` : ''}
      </button>
    `;
  }

  return html;
}

function renderCalendarBillRow(occ) {
  const cat = getCategoryConfig(occ.category);
  const isPaid = occ.is_paid === 1;
  const isOverdue = occ.is_overdue;

  return `
    <div data-occurrence-id="${occ.occurrence_id}" class="rounded-2xl bg-surface p-3.5 flex items-center justify-between hover:bg-surface-alt/70 transition-all cursor-pointer border border-surface-alt/20">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style="background-color: ${cat.bgColor}; color: ${cat.color};">
          ${getCategoryIconSvg(cat.icon, "w-5 h-5")}
        </div>
        <div>
          <h4 class="text-row-title text-text-primary font-semibold">${occ.name}</h4>
          <span class="text-caption text-text-secondary">${cat.name}</span>
        </div>
      </div>

      <div class="flex items-center space-x-3">
        <div class="text-right">
          <div class="text-row-amount ${isOverdue ? 'text-accent-red font-bold' : isPaid ? 'text-text-secondary line-through' : 'text-text-primary'}">
            ${formatCurrency(occ.amount)}
          </div>
          ${isPaid ? `<span class="text-tag text-accent-purple">Paid</span>` : isOverdue ? `<span class="text-tag text-accent-red">Overdue</span>` : ''}
        </div>
        <button data-id="${occ.occurrence_id}" data-paid="${isPaid}" class="toggle-paid-btn w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isPaid ? 'bg-accent-purple text-text-primary' : 'bg-surface-alt text-text-secondary hover:text-text-primary'}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
        </button>
      </div>
    </div>
  `;
}
