import { createBill, getBillById, updateBill } from '../db/billsRepo.js';
import { CATEGORIES } from '../constants.js';
import { navigate } from '../router.js';
import { createCustomSelect } from '../components/customSelect.js';

/**
 * Render Add or Edit Bill screen
 * @param {HTMLElement} container 
 * @param {Object} options { mode: 'add'|'edit', billId?: number }
 */
export async function renderAddEditBillScreen(container, options = { mode: 'add' }) {
  const isEdit = options.mode === 'edit';
  let bill = null;

  if (isEdit && options.billId) {
    bill = getBillById(options.billId);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Build custom select configs
  const categorySelect = createCustomSelect({
    id: 'field-category',
    options: CATEGORIES.map(c => ({ value: c.id, label: c.name })),
    value: bill?.category || CATEGORIES[0]?.id,
  });

  const recurrenceOptions = [
    { value: '0',      label: 'Ongoing / Indefinite (Every Month)' },
    { value: '1',      label: 'One-time Bill' },
    { value: 'custom', label: 'Fixed Number of Months' },
  ];
  let initialRecurrence = '0';
  if (bill) {
    if (bill.recurrence_months === 1) initialRecurrence = '1';
    else if (bill.recurrence_months > 1) initialRecurrence = 'custom';
  }
  const recurrenceSelect = createCustomSelect({
    id: 'field-recurrence-type',
    options: recurrenceOptions,
    value: initialRecurrence,
  });

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in pb-8">
      <!-- Header -->
      <div class="flex items-center justify-between pt-2">
        <button id="bill-form-cancel" class="p-2 rounded-xl bg-surface text-text-secondary hover:text-text-primary transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        <h1 class="text-screen-title font-bold text-text-primary">${isEdit ? 'Edit Bill Template' : 'Add New Bill'}</h1>
        <div class="w-9"></div>
      </div>

      <!-- Form Container -->
      <form id="bill-form" class="space-y-4">
        <!-- Bill Name -->
        <div class="space-y-1.5">
          <label class="block text-label text-text-secondary font-medium">Bill Name</label>
          <input 
            type="text" 
            id="field-name" 
            required 
            placeholder="e.g. Meralco, Netflix, Rent" 
            value="${bill ? bill.name : ''}" 
            class="w-full bg-surface text-text-primary text-body rounded-2xl px-4 py-3.5 border border-surface-alt/40 focus:border-accent-purple focus:ring-1 focus:ring-accent-purple outline-none transition-all placeholder:text-text-secondary/50"
          />
        </div>

        <!-- Category Dropdown (custom) -->
        <div class="space-y-1.5">
          <label class="block text-label text-text-secondary font-medium">Category</label>
          ${categorySelect.html}
        </div>

        <!-- Amount -->
        <div class="space-y-1.5">
          <label class="block text-label text-text-secondary font-medium">Default Amount (₱)</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-body font-semibold">₱</span>
            <input 
              type="number" 
              step="0.01" 
              min="0" 
              id="field-amount" 
              required 
              placeholder="0.00" 
              value="${bill ? bill.default_amount : ''}" 
              class="w-full bg-surface text-text-primary text-body rounded-2xl pl-9 pr-4 py-3.5 border border-surface-alt/40 focus:border-accent-purple focus:ring-1 focus:ring-accent-purple outline-none transition-all placeholder:text-text-secondary/50 font-semibold"
            />
          </div>
          <p class="text-caption text-text-secondary">You can override specific monthly amounts later in detail view.</p>
        </div>

        <!-- Start Date / Due Date -->
        <div class="space-y-1.5">
          <label class="block text-label text-text-secondary font-medium">${isEdit ? 'Due Day of Month (1-31)' : 'Start / First Due Date'}</label>
          ${isEdit ? `
            <input 
              type="number" 
              min="1" 
              max="31" 
              id="field-due-day" 
              required 
              value="${bill ? bill.due_day : 1}" 
              class="w-full bg-surface text-text-primary text-body rounded-2xl px-4 py-3.5 border border-surface-alt/40 focus:border-accent-purple focus:ring-1 focus:ring-accent-purple outline-none transition-all"
            />
          ` : `
            <input 
              type="date" 
              id="field-start-date" 
              required 
              value="${todayStr}" 
              class="w-full bg-surface text-text-primary text-body rounded-2xl px-4 py-3.5 border border-surface-alt/40 focus:border-accent-purple focus:ring-1 focus:ring-accent-purple outline-none transition-all cursor-pointer"
            />
          `}
        </div>

        <!-- Recurrence Selection (custom) -->
        <div class="space-y-1.5">
          <label class="block text-label text-text-secondary font-medium">Recurrence</label>
          ${recurrenceSelect.html}
        </div>

        <!-- Custom Months Input (conditional) -->
        <div id="custom-months-container" class="space-y-1.5 ${bill && bill.recurrence_months > 1 ? '' : 'hidden'}">
          <label class="block text-label text-text-secondary font-medium">Number of Months</label>
          <input 
            type="number" 
            min="2" 
            max="120" 
            id="field-recurrence-months" 
            placeholder="e.g. 6 or 12" 
            value="${bill && bill.recurrence_months > 1 ? bill.recurrence_months : 12}" 
            class="w-full bg-surface text-text-primary text-body rounded-2xl px-4 py-3.5 border border-surface-alt/40 focus:border-accent-purple focus:ring-1 focus:ring-accent-purple outline-none transition-all"
          />
        </div>

        <!-- Submit Button -->
        <div class="pt-4">
          <button 
            type="submit" 
            class="w-full py-4 rounded-2xl bg-accent-purple hover:bg-accent-purple/90 text-text-primary font-semibold text-button active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
            <span>${isEdit ? 'Save Changes' : 'Save Bill'}</span>
          </button>
        </div>
      </form>
    </div>
  `;

  // Init custom selects
  categorySelect.init();

  const customMonthsContainer = document.getElementById('custom-months-container');
  recurrenceSelect.init((val) => {
    if (val === 'custom') {
      customMonthsContainer?.classList.remove('hidden');
    } else {
      customMonthsContainer?.classList.add('hidden');
    }
  });

  // Cancel Handler
  document.getElementById('bill-form-cancel')?.addEventListener('click', () => {
    navigate('home');
  });

  // Form Submit Handler
  document.getElementById('bill-form')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('field-name').value.trim();
    const category = document.getElementById('field-category').value;
    const defaultAmount = parseFloat(document.getElementById('field-amount').value);

    const recType = document.getElementById('field-recurrence-type').value;
    let recurrenceMonths = 0;
    if (recType === '1') recurrenceMonths = 1;
    else if (recType === 'custom') {
      recurrenceMonths = parseInt(document.getElementById('field-recurrence-months').value, 10) || 12;
    }

    if (isEdit) {
      const dueDay = parseInt(document.getElementById('field-due-day').value, 10);
      updateBill({
        id: bill.id,
        name,
        category,
        default_amount: defaultAmount,
        due_day: dueDay,
        recurrence_months: recurrenceMonths
      });
    } else {
      const startDate = document.getElementById('field-start-date').value;
      createBill({
        name,
        category,
        default_amount: defaultAmount,
        start_date: startDate,
        recurrence_months: recurrenceMonths
      });
    }

    navigate('home');
  });
}
