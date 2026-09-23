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

  // Build category filter options for the inline custom dropdown
  const catFilterOptions = [
    { value: 'all', label: 'All Categories' },
    ...CATEGORIES.map(c => ({ value: c.id, label: c.name }))
  ];

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

      <!-- Hero Summary Card -->
      <div class="rounded-3xl relative overflow-hidden" style="background-color: #15803d; border: 1px solid #16a34a ;">
        <!-- Large decorative background circle overlay (inspired by reference UI design) -->
        <div class="absolute -right-12 -top-6 w-56 h-56 rounded-full" style="background: rgba(74, 222, 128, 0.08); pointer-events: none;"></div>
        <div class="absolute -right-4 -top-2 w-40 h-40 rounded-full" style="background: rgba(74, 222, 128, 0.05); pointer-events: none;"></div>
        <!-- Content -->
        <div class="relative z-10 p-5">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-2">
              <svg class="w-3.5 h-3.5" style="color:white ;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              <span class="text-label uppercase tracking-wider font-semibold" style="color: white;">Total Unpaid Balance</span>
            </div>
            ${overdueCount > 0 ? `<span class="px-2.5 py-0.5 rounded-full text-tag uppercase font-bold" style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4);">${overdueCount} Overdue</span>` : ''}
          </div>
          <div class="text-hero-amount text-text-primary mb-4" style="font-size:32px; line-height:1.1;">${formatCurrency(totalUnpaid)}</div>
          <div class="flex items-center space-x-4 text-caption pt-3" style="border-top: 1px solid rgba(74,222,128,0.2);">
            <div class="flex items-center space-x-1.5" style="color: white;">
              <div class="w-2 h-2 rounded-full" style="background-color: white ;"></div>
              <span>${occurrences.filter(o => !o.is_paid).length} Bills Pending</span>
            </div>
            ${totalOverdue > 0 ? `
              <div class="flex items-center space-x-1.5" style="color: #fca5a5;">
                <div class="w-2 h-2 rounded-full" style="background-color: #ef4444;"></div>
                <span class="font-medium">${formatCurrency(totalOverdue)} Overdue</span>
              </div>
            ` : ''}
          </div>
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

        <!-- Category Dropdown Filter (custom) -->
        <div class="flex items-center justify-between gap-3">
          <span class="text-section-header text-text-primary font-semibold shrink-0">Upcoming Bills</span>
          <!-- compact variant: smaller trigger, right-aligned panel -->
          <div class="relative w-40" id="home-category-filter-wrapper">
            <input type="hidden" id="home-category-filter" value="${activeCategoryFilter}" />
            <button
              type="button"
              id="home-category-filter-trigger"
              class="w-full flex items-center justify-between pl-3 pr-2.5 py-1.5 bg-surface-alt border border-surface-alt/60 rounded-xl text-label text-text-primary font-medium cursor-pointer transition-all hover:border-accent-purple/40 focus:outline-none focus:border-accent-purple"
              aria-haspopup="listbox" aria-expanded="false"
            >
              <span id="home-category-filter-label">${catFilterOptions.find(o => o.value === activeCategoryFilter)?.label || 'All Categories'}</span>
              <svg id="home-category-filter-chevron" class="w-3.5 h-3.5 ml-1 text-text-secondary shrink-0 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
            </button>
            <div
              id="home-category-filter-panel"
              class="absolute z-40 right-0 left-auto mt-2 w-44 bg-surface border border-surface-alt/60 rounded-2xl shadow-2xl overflow-hidden origin-top-right"
              style="display:none; opacity:0; transform:scaleY(0.95); transition: opacity 0.15s ease, transform 0.15s ease;"
              role="listbox"
            >
              <div class="p-1.5 space-y-0.5 max-h-56 overflow-y-auto">
                ${catFilterOptions.map(opt => `
                  <button
                    type="button"
                    data-select-option="home-category-filter"
                    data-value="${opt.value}"
                    class="custom-select-option w-full flex items-center justify-between px-4 py-2.5 text-body text-left transition-colors duration-100 hover:bg-surface-alt/80 rounded-xl ${opt.value === activeCategoryFilter ? 'text-accent-purple font-semibold' : 'text-text-primary font-normal'}"
                  >
                    <span>${opt.label}</span>
                    <span class="text-accent-purple ${opt.value === activeCategoryFilter ? '' : 'invisible'}">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    </span>
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
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

  // Init the compact home category filter custom dropdown
  initHomeCategoryFilter(container);

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

function initHomeCategoryFilter(container) {
  const wrapper = document.getElementById('home-category-filter-wrapper');
  const trigger = document.getElementById('home-category-filter-trigger');
  const panel   = document.getElementById('home-category-filter-panel');
  const label   = document.getElementById('home-category-filter-label');
  const input   = document.getElementById('home-category-filter');
  const chevron = document.getElementById('home-category-filter-chevron');
  if (!trigger || !panel) return;

  let isOpen = false;

  function open() {
    isOpen = true;
    panel.style.display = 'block';
    requestAnimationFrame(() => {
      panel.style.opacity = '1';
      panel.style.transform = 'scaleY(1)';
    });
    chevron.style.transform = 'rotate(180deg)';
    trigger.setAttribute('aria-expanded', 'true');
  }

  function close() {
    isOpen = false;
    panel.style.opacity = '0';
    panel.style.transform = 'scaleY(0.95)';
    chevron.style.transform = 'rotate(0deg)';
    trigger.setAttribute('aria-expanded', 'false');
    setTimeout(() => { if (!isOpen) panel.style.display = 'none'; }, 150);
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    isOpen ? close() : open();
  });

  panel.querySelectorAll('[data-select-option]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = btn.getAttribute('data-value');
      const lbl = btn.querySelector('span:first-child').textContent;
      input.value = val;
      label.textContent = lbl;
      close();
      activeCategoryFilter = val;
      renderHomeScreen(container);
    });
  });

  document.addEventListener('click', (e) => {
    if (isOpen && wrapper && !wrapper.contains(e.target)) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) close();
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
            <h3 class="text-label uppercase tracking-wider font-bold flex items-center space-x-2" style="color: #16a34a ;">
              <svg class="w-4 h-4" style="color: #16a34a ;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    icon.style.background = 'rgba(22, 163, 74, 0.18)';
    icon.style.color = '#16a34a ';
    icon.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`;
    title.textContent = 'Mark as Paid?';
    subtitle.textContent = billName;
    message.textContent = `This will mark "${billName}" as paid and remove it from your unpaid balance.`;
    btnConfirm.textContent = 'Mark Paid';
    btnConfirm.style.background = '#16a34a ';
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
