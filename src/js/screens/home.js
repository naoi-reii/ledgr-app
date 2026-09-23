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
    <!-- Confirmation Modal -->
    <div id="confirm-modal" class="fixed inset-0 z-50 flex items-end justify-center hidden" style="background: rgba(0,0,0,0.65);">
      <div id="confirm-modal-sheet" class="w-full max-w-md bg-surface rounded-t-3xl p-6 space-y-4 shadow-2xl border-t border-surface-alt/40"
           style="transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.32,0.72,0,1);">
        <div class="w-10 h-1 rounded-full bg-surface-alt mx-auto mb-2"></div>
        <div class="flex items-center space-x-3">
          <div id="confirm-modal-icon" class="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"></div>
          <div>
            <h3 id="confirm-modal-title" class="text-section-header text-text-primary font-semibold"></h3>
            <p id="confirm-modal-subtitle" class="text-caption text-text-secondary mt-0.5"></p>
          </div>
        </div>
        <p id="confirm-modal-message" class="text-body text-text-secondary rounded-xl bg-surface-alt/40 px-4 py-3"></p>
        <div class="flex space-x-3 pt-1">
          <button id="confirm-modal-cancel" class="flex-1 py-3 rounded-2xl bg-surface-alt text-text-secondary text-button font-semibold hover:bg-surface-alt/80 active:scale-95 transition-all">Cancel</button>
          <button id="confirm-modal-confirm" class="flex-1 py-3 rounded-2xl text-text-primary text-button font-semibold active:scale-95 transition-all"></button>
        </div>
      </div>
    </div>

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
      <div class="rounded-3xl p-5 bg-surface ${totalOverdue > 0 ? 'border border-accent-red/40' : 'border border-accent-purple/30'} relative overflow-hidden">
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
      <div class="space-y-6">
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
        ` : renderGroupedBills(occurrences)}
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

  // Toggle Paid Checkbox Handlers — show confirmation modal first
  container.querySelectorAll('.toggle-paid-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const occurrenceId = btn.getAttribute('data-id');
      const isPaid = btn.getAttribute('data-paid') === 'true';
      const billName = btn.getAttribute('data-name');
      showConfirmModal({
        billName,
        isPaid,
        onConfirm: () => {
          setPaid(occurrenceId, !isPaid);
          renderHomeScreen(container);
        },
      });
    });
  });
}

function renderFilterChip(id, label, activeId) {
  const isActive = id === activeId;
  return `
    <button data-status-filter="${id}" class="px-3.5 py-1.5 rounded-full text-label font-medium transition-all shrink-0 ${isActive ? 'bg-accent-purple text-text-primary font-semibold' : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-alt'}">
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
        <button data-id="${occ.occurrence_id}" data-paid="${isPaid}" data-name="${occ.name}" class="toggle-paid-btn w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isPaid ? 'bg-accent-purple text-text-primary' : 'bg-surface-alt text-text-secondary hover:text-text-primary hover:bg-surface-alt/80'}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
        </button>
      </div>
    </div>
  `;
}

function renderGroupedBills(occurrences) {
  const groups = [];
  const map = new Map();

  occurrences.forEach(occ => {
    if (!occ.due_date) return;
    const [y, m] = occ.due_date.split('-').map(Number);
    const key = `${y}-${m}`;
    if (!map.has(key)) {
      const dateObj = new Date(y, m - 1, 1);
      const monthName = dateObj.toLocaleDateString('en-US', { month: 'long' });
      const currentYear = new Date().getFullYear();
      const label = y === currentYear ? monthName : `${monthName} ${y}`;
      const group = { label, items: [] };
      map.set(key, group);
      groups.push(group);
    }
    map.get(key).items.push(occ);
  });

  return `
    <div class="space-y-6">
      ${groups.map(group => `
        <div class="space-y-3">
          <div class="flex items-center justify-between px-1 border-b border-surface-alt/40 pb-2">
            <h3 class="text-label uppercase tracking-wider font-bold text-accent-purple flex items-center space-x-2">
              <svg class="w-4 h-4 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span>${group.label}</span>
            </h3>
            <span class="text-caption text-text-secondary font-medium">${group.items.length} ${group.items.length === 1 ? 'bill' : 'bills'}</span>
          </div>
          <div class="space-y-3">
            ${group.items.map(occ => renderBillRow(occ)).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Show a bottom-sheet confirmation modal before toggling paid status.
 */
function showConfirmModal({ billName, isPaid, onConfirm }) {
  const modal      = document.getElementById('confirm-modal');
  const sheet      = document.getElementById('confirm-modal-sheet');
  const icon       = document.getElementById('confirm-modal-icon');
  const title      = document.getElementById('confirm-modal-title');
  const subtitle   = document.getElementById('confirm-modal-subtitle');
  const message    = document.getElementById('confirm-modal-message');
  const btnConfirm = document.getElementById('confirm-modal-confirm');
  const btnCancel  = document.getElementById('confirm-modal-cancel');

  if (isPaid) {
    icon.style.background = 'rgba(255,76,76,0.15)';
    icon.style.color = '#ff4c4c';
    icon.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>`;
    title.textContent = 'Mark as Unpaid?';
    subtitle.textContent = billName;
    message.textContent = `This will mark "${billName}" as unpaid and restore it to your pending balance.`;
    btnConfirm.textContent = 'Mark Unpaid';
    btnConfirm.style.background = '#ff4c4c';
  } else {
    icon.style.background = 'rgba(167,139,250,0.15)';
    icon.style.color = '#a78bfa';
    icon.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`;
    title.textContent = 'Mark as Paid?';
    subtitle.textContent = billName;
    message.textContent = `This will mark "${billName}" as paid and remove it from your unpaid balance.`;
    btnConfirm.textContent = 'Mark Paid';
    btnConfirm.style.background = '#a78bfa';
  }

  // Show with slide-up animation — double rAF ensures the browser
  // has painted translateY(100%) before the transition starts.
  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      sheet.style.transform = 'translateY(0)';
    });
  });

  function closeModal() {
    sheet.style.transform = 'translateY(100%)';
    setTimeout(() => modal.classList.add('hidden'), 300);
  }

  const handleConfirm  = () => { closeModal(); onConfirm(); cleanup(); };
  const handleCancel   = () => { closeModal(); cleanup(); };
  const handleBackdrop = (e) => { if (e.target === modal) { closeModal(); cleanup(); } };

  function cleanup() {
    btnConfirm.removeEventListener('click', handleConfirm);
    btnCancel.removeEventListener('click', handleCancel);
    modal.removeEventListener('click', handleBackdrop);
  }

  btnConfirm.addEventListener('click', handleConfirm);
  btnCancel.addEventListener('click', handleCancel);
  modal.addEventListener('click', handleBackdrop);
}
