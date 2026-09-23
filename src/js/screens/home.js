import { getUpcomingOccurrences, setPaid } from '../db/billsRepo.js';
import { CATEGORIES, formatCurrency, formatDateShort, getCategoryConfig, getCategoryIconSvg } from '../constants.js';
import { navigate } from '../router.js';

let activeStatusFilter = 'all';
let activeCategoryFilter = 'all';

/**
 * Render Home / List screen
 */
export async function renderHomeScreen(container, params = {}) {
  if (params.statusFilter) activeStatusFilter = params.statusFilter;
  if (params.categoryFilter) activeCategoryFilter = params.categoryFilter;

  const occurrences = getUpcomingOccurrences(activeStatusFilter, activeCategoryFilter);

  // Compute summary stats
  const totalUnpaid = occurrences.filter(o => !o.is_paid).reduce((sum, o) => sum + o.amount, 0);
  const totalOverdue = occurrences.filter(o => o.is_overdue).reduce((sum, o) => sum + o.amount, 0);
  const overdueCount = occurrences.filter(o => o.is_overdue).length;

  container.innerHTML = `
    <div class="space-y-5 animate-fade-in pb-6">
      <!-- App Top Bar Header -->
      <div class="flex items-center justify-between pt-2">
        <div>
          <h1 class="text-screen-title font-bold text-text-primary tracking-tight">Ledgr</h1>
          <p class="text-caption text-text-secondary">Track & manage upcoming bills</p>
        </div>
        <button id="home-add-btn" class="px-3.5 py-1.5 rounded-full bg-surface-alt text-text-primary text-button flex items-center space-x-1.5 hover:bg-surface-alt/80 active:scale-95 transition-all">
          <svg class="w-4 h-4 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
          </svg>
          <span class="text-label font-semibold">Add Bill</span>
        </button>
      </div>

      <!-- Hero Summary Card (SAMPLE_UI style) -->
      <div class="rounded-3xl p-5 bg-gradient-to-br ${totalOverdue > 0 ? 'from-[#321D1E] to-surface border border-accent-red/30' : 'from-[#24203D] to-surface border border-accent-purple/30'} relative overflow-hidden shadow-xl">
        <div class="absolute -right-6 -bottom-6 w-32 h-32 rounded-full ${totalOverdue > 0 ? 'bg-accent-red/10' : 'bg-accent-purple/10'} blur-2xl"></div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-label text-text-secondary uppercase tracking-wider font-semibold">Total Unpaid Balance</span>
          ${overdueCount > 0 ? `<span class="px-2 py-0.5 rounded-full bg-accent-red text-text-primary text-tag uppercase font-bold animate-pulse">${overdueCount} Overdue</span>` : ''}
        </div>
        <div class="text-hero-amount text-text-primary mb-3">${formatCurrency(totalUnpaid)}</div>
        <div class="flex items-center space-x-4 text-caption text-text-secondary border-t border-surface-alt/40 pt-3">
          <div class="flex items-center space-x-1.5">
            <div class="w-2 h-2 rounded-full ${totalOverdue > 0 ? 'bg-accent-red' : 'bg-accent-purple'}"></div>
            <span>${occurrences.filter(o => !o.is_paid).length} Bills Pending</span>
          </div>
          ${totalOverdue > 0 ? `
            <div class="flex items-center space-x-1.5 text-accent-red">
              <div class="w-2 h-2 rounded-full bg-accent-red"></div>
              <span>${formatCurrency(totalOverdue)} Overdue</span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Filter Controls Row -->
      <div class="space-y-2.5">
        <!-- Status Filter Chips -->
        <div class="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          ${renderFilterChip('all', 'All', activeStatusFilter)}
          ${renderFilterChip('unpaid', 'Unpaid', activeStatusFilter)}
          ${renderFilterChip('overdue', 'Overdue', activeStatusFilter)}
          ${renderFilterChip('paid', 'Paid', activeStatusFilter)}
        </div>

        <!-- Category Dropdown Filter -->
        <div class="flex items-center justify-between">
          <span class="text-section-header text-text-primary font-semibold">Upcoming Bills</span>
          <select id="home-category-filter" class="bg-surface-alt text-text-secondary text-label rounded-lg px-2.5 py-1 border-none focus:ring-1 focus:ring-accent-purple outline-none cursor-pointer">
            <option value="all" ${activeCategoryFilter === 'all' ? 'selected' : ''}>All Categories</option>
            ${CATEGORIES.map(c => `<option value="${c.id}" ${activeCategoryFilter === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Bills List -->
      <div class="space-y-3">
        ${occurrences.length === 0 ? `
          <div class="rounded-2xl bg-surface p-8 text-center space-y-2 border border-surface-alt/30">
            <div class="w-12 h-12 rounded-full bg-surface-alt flex items-center justify-center mx-auto text-text-secondary">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h3 class="text-section-header text-text-primary">No bills found</h3>
            <p class="text-caption text-text-secondary">Add a new bill or change your filter selection.</p>
          </div>
        ` : occurrences.map(occ => renderBillRow(occ)).join('')}
      </div>
    </div>
  `;

  // Attach Event Handlers
  document.getElementById('home-add-btn')?.addEventListener('click', () => navigate('add-bill'));

  // Category filter select handler
  document.getElementById('home-category-filter')?.addEventListener('change', (e) => {
    activeCategoryFilter = e.target.value;
    renderHomeScreen(container);
  });

  // Status filter click handlers
  container.querySelectorAll('[data-status-filter]').forEach(chip => {
    chip.addEventListener('click', (e) => {
      activeStatusFilter = e.currentTarget.getAttribute('data-status-filter');
      renderHomeScreen(container);
    });
  });

  // Bill Row Click Handlers (Navigate to detail)
  container.querySelectorAll('[data-occurrence-id]').forEach(row => {
    row.addEventListener('click', (e) => {
      // Ignore if clicking checkbox directly
      if (e.target.closest('.toggle-paid-btn')) return;
      const occurrenceId = row.getAttribute('data-occurrence-id');
      navigate('bill-detail', { occurrenceId });
    });
  });

  // Toggle Paid Checkbox Handlers
  container.querySelectorAll('.toggle-paid-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const occurrenceId = btn.getAttribute('data-id');
      const isPaid = btn.getAttribute('data-paid') === 'true';
      setPaid(occurrenceId, !isPaid);
      renderHomeScreen(container);
    });
  });
}

function renderFilterChip(id, label, activeId) {
  const isActive = id === activeId;
  return `
    <button data-status-filter="${id}" class="px-3.5 py-1.5 rounded-full text-label font-medium transition-all shrink-0 ${isActive ? 'bg-accent-purple text-text-primary font-semibold shadow-md shadow-accent-purple/20' : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-alt'}">
      ${label}
    </button>
  `;
}

function renderBillRow(occ) {
  const cat = getCategoryConfig(occ.category);
  const isPaid = occ.is_paid === 1;
  const isOverdue = occ.is_overdue;

  let amountColorClass = 'text-text-primary';
  if (isOverdue) amountColorClass = 'text-accent-red font-bold';
  else if (isPaid) amountColorClass = 'text-text-secondary line-through';

  return `
    <div data-occurrence-id="${occ.occurrence_id}" class="rounded-2xl bg-surface p-4 flex items-center justify-between hover:bg-surface-alt/70 transition-all cursor-pointer border border-surface-alt/20 shadow-sm active:scale-[0.99]">
      <div class="flex items-center space-x-3.5">
        <!-- Category Icon Chip (SAMPLE_UI style) -->
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style="background-color: ${cat.bgColor}; color: ${cat.color};">
          ${getCategoryIconSvg(cat.icon, "w-6 h-6")}
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <h4 class="text-row-title text-text-primary font-semibold">${occ.name}</h4>
            ${occ.is_amount_overridden ? `<span class="px-1.5 py-0.5 rounded bg-surface-alt text-text-secondary text-tag">Edited</span>` : ''}
          </div>
          <div class="flex items-center space-x-2 mt-0.5">
            <span class="text-caption text-text-secondary">${cat.name}</span>
            <span class="text-caption text-text-secondary">•</span>
            <span class="text-caption ${isOverdue ? 'text-accent-red font-medium' : 'text-text-secondary'}">
              ${isOverdue ? 'Overdue ' : 'Due '}${formatDateShort(occ.due_date)}
            </span>
          </div>
        </div>
      </div>

      <div class="flex items-center space-x-3">
        <div class="text-right">
          <div class="text-row-amount ${amountColorClass}">${formatCurrency(occ.amount)}</div>
          ${isPaid ? `<span class="text-tag text-accent-purple font-semibold">Paid</span>` : isOverdue ? `<span class="text-tag text-accent-red font-semibold">Overdue</span>` : ''}
        </div>

        <!-- Paid Toggle Button -->
        <button data-id="${occ.occurrence_id}" data-paid="${isPaid}" class="toggle-paid-btn w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isPaid ? 'bg-accent-purple text-text-primary' : 'bg-surface-alt text-text-secondary hover:text-text-primary hover:bg-surface-alt/80'}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
        </button>
      </div>
    </div>
  `;
}
