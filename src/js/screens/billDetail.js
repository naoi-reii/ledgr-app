import { deleteBill, getOccurrenceById, setPaid, updateOccurrence } from '../db/billsRepo.js';
import { formatCurrency, formatDateReadable, getCategoryConfig, getCategoryIconSvg } from '../constants.js';
import { navigate } from '../router.js';

/**
 * Render Bill Occurrence Detail screen
 * @param {HTMLElement} container 
 * @param {Object} params { occurrenceId }
 */
export async function renderBillDetailScreen(container, params = {}) {
  const occurrence = getOccurrenceById(params.occurrenceId);

  if (!occurrence) {
    container.innerHTML = `
      <div class="space-y-4 text-center py-12">
        <h2 class="text-screen-title font-bold text-text-primary">Occurrence not found</h2>
        <button id="detail-back-home" class="px-4 py-2 rounded-xl bg-accent-purple text-text-primary text-button">Back to Home</button>
      </div>
    `;
    document.getElementById('detail-back-home')?.addEventListener('click', () => navigate('home'));
    return;
  }

  const cat = getCategoryConfig(occurrence.category);
  const isPaid = occurrence.is_paid === 1;
  const isOverdue = occurrence.is_overdue;

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in pb-8">
      <!-- Top Navigation Header -->
      <div class="flex items-center justify-between pt-2">
        <button id="detail-back-btn" class="p-2 rounded-xl bg-surface text-text-secondary hover:text-text-primary transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 class="text-screen-title font-bold text-text-primary">${occurrence.name}</h1>
        <!-- Edit This Month pencil -->
        <button id="detail-edit-occurrence-btn" class="p-2 rounded-xl bg-surface text-text-secondary hover:text-accent-purple transition-colors" title="Edit this month only">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
          </svg>
        </button>
      </div>

      <!-- Main Feature Card -->
      <div class="rounded-3xl bg-surface p-6 border border-surface-alt/40 space-y-6 relative overflow-hidden">
        <div class="flex items-center justify-between">
          <!-- Category Chip -->
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center" style="background-color: ${cat.bgColor}; color: ${cat.color};">
              ${getCategoryIconSvg(cat.icon, "w-6 h-6")}
            </div>
            <div>
              <span class="text-caption text-text-secondary uppercase tracking-wider font-semibold">${cat.name}</span>
              <h2 class="text-section-header font-bold text-text-primary">${occurrence.name}</h2>
            </div>
          </div>

          <!-- Status Tag -->
          ${isPaid ? `
            <span class="px-3 py-1 rounded-full bg-accent-purple/20 text-accent-purple border border-accent-purple/40 text-tag uppercase font-bold">Paid</span>
          ` : isOverdue ? `
            <span class="px-3 py-1 rounded-full bg-accent-red/20 text-accent-red border border-accent-red/40 text-tag uppercase font-bold">Overdue</span>
          ` : `
            <span class="px-3 py-1 rounded-full bg-surface-alt text-text-secondary text-tag uppercase font-semibold">Unpaid</span>
          `}
        </div>

        <!-- Amount Display -->
        <div class="space-y-1 bg-base/60 rounded-2xl p-4 border border-surface-alt/30">
          <div class="flex items-center justify-between">
            <span class="text-caption text-text-secondary">Amount</span>
            ${occurrence.is_amount_overridden ? `<span class="px-1.5 py-0.5 rounded bg-surface-alt text-text-secondary text-tag">Edited</span>` : ''}
          </div>
          <div class="flex items-center space-x-1 pt-1">
            <span class="text-hero-amount text-accent-purple font-extrabold">₱</span>
            <span class="text-hero-amount font-extrabold text-text-primary">${occurrence.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
          </div>
          <p class="text-caption text-text-secondary/70">Tap ✏️ above to edit this month only.</p>
        </div>

        <!-- Metadata Breakdown List -->
        <div class="space-y-3 pt-2">
          <div class="flex justify-between items-center text-body py-1 border-b border-surface-alt/30">
            <span class="text-text-secondary text-caption">Due Date</span>
            <span class="font-semibold text-text-primary">${formatDateReadable(occurrence.due_date)}</span>
          </div>

          <div class="flex justify-between items-center text-body py-1 border-b border-surface-alt/30">
            <span class="text-text-secondary text-caption">Recurrence Rule</span>
            <span class="font-semibold text-text-primary">
              ${occurrence.recurrence_months === 1 ? 'One-time' : occurrence.recurrence_months > 1 ? `Fixed (${occurrence.recurrence_months} months)` : 'Ongoing Monthly'}
            </span>
          </div>

          <div class="flex justify-between items-center text-body py-1 border-b border-surface-alt/30">
            <span class="text-text-secondary text-caption">Default Template Amount</span>
            <span class="font-semibold text-text-primary">${formatCurrency(occurrence.default_amount)}</span>
          </div>

          ${occurrence.paid_at ? `
            <div class="flex justify-between items-center text-body py-1">
              <span class="text-text-secondary text-caption">Paid On</span>
              <span class="font-semibold text-accent-purple">${formatDateReadable(occurrence.paid_at.split('T')[0])}</span>
            </div>
          ` : ''}
        </div>

        <!-- Mark Paid Action Button -->
        <button 
          id="detail-toggle-paid-btn" 
          class="w-full py-4 rounded-2xl ${isPaid ? 'bg-surface-alt text-text-secondary hover:text-text-primary' : 'bg-accent-purple text-text-primary'} font-semibold text-button transition-all flex items-center justify-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
          <span>${isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}</span>
        </button>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-2.5 pt-2">
        <!-- Edit Series (template) — clearly labeled so user knows it affects all future months -->
        <button id="detail-edit-series-btn" class="w-full py-3.5 rounded-2xl bg-surface border border-surface-alt/50 text-text-secondary hover:text-text-primary hover:border-surface-alt text-button font-semibold transition-all flex items-center justify-center space-x-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <span>Edit Bill Series (affects future months)</span>
        </button>

        <!-- Delete -->
        <button id="detail-delete-btn" class="w-full py-3.5 rounded-2xl bg-surface border border-accent-red/30 text-accent-red hover:bg-accent-red/10 text-button font-semibold transition-all flex items-center justify-center space-x-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          <span>Delete Bill</span>
        </button>
      </div>
    </div>
  `;

  // Back
  document.getElementById('detail-back-btn')?.addEventListener('click', () => navigate('home'));

  // Edit THIS MONTH only — opens a modal with amount + due date for just this occurrence
  document.getElementById('detail-edit-occurrence-btn')?.addEventListener('click', () => {
    showEditOccurrenceModal(occurrence, container, params);
  });

  // Edit Series → go to template editor
  document.getElementById('detail-edit-series-btn')?.addEventListener('click', () => {
    navigate('edit-bill', { billId: occurrence.bill_id });
  });

  // Toggle Paid
  document.getElementById('detail-toggle-paid-btn')?.addEventListener('click', () => {
    setPaid(occurrence.occurrence_id, !isPaid);
    renderBillDetailScreen(container, params);
  });

  // Delete
  document.getElementById('detail-delete-btn')?.addEventListener('click', () => {
    showDeleteConfirmationModal(occurrence, container);
  });
}

/**
 * Modal: Edit THIS occurrence only (amount + due date).
 * Calls updateOccurrence() which touches ONLY this single row.
 */
function showEditOccurrenceModal(occurrence, container, params) {
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-4 z-50">
      <div class="w-full max-w-sm bg-surface rounded-3xl p-6 space-y-5 border border-surface-alt shadow-2xl animate-modal-in">
        <div>
          <h3 class="text-screen-title font-bold text-text-primary">Edit This Month</h3>
          <p class="text-caption text-text-secondary mt-1">Changes apply only to <strong class="text-text-primary">${formatDateReadable(occurrence.due_date)}</strong>. Future months are untouched.</p>
        </div>

        <!-- Amount -->
        <div class="space-y-1.5">
          <label class="block text-label text-text-secondary font-medium">Amount (₱)</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-semibold">₱</span>
            <input
              type="number"
              step="0.01"
              min="0"
              id="occ-edit-amount"
              value="${occurrence.amount}"
              class="w-full bg-base text-text-primary text-body rounded-2xl pl-9 pr-4 py-3.5 border border-surface-alt/40 focus:border-accent-purple focus:ring-1 focus:ring-accent-purple outline-none transition-all font-semibold"
            />
          </div>
        </div>

        <!-- Due Date -->
        <div class="space-y-1.5">
          <label class="block text-label text-text-secondary font-medium">Due Date</label>
          <input
            type="date"
            id="occ-edit-due-date"
            value="${occurrence.due_date}"
            class="w-full bg-base text-text-primary text-body rounded-2xl px-4 py-3.5 border border-surface-alt/40 focus:border-accent-purple focus:ring-1 focus:ring-accent-purple outline-none transition-all cursor-pointer"
          />
        </div>

        <div class="space-y-2.5 pt-1">
          <button id="occ-edit-save-btn" class="w-full py-3.5 rounded-2xl bg-accent-purple text-text-primary text-button font-semibold hover:bg-accent-purple/90 transition-all">
            Save This Month Only
          </button>
          <button id="occ-edit-cancel-btn" class="w-full py-3 rounded-2xl bg-transparent text-text-secondary text-button hover:text-text-primary transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('occ-edit-cancel-btn')?.addEventListener('click', () => {
    modalContainer.innerHTML = '';
  });

  document.getElementById('occ-edit-save-btn')?.addEventListener('click', () => {
    const newAmount = document.getElementById('occ-edit-amount').value;
    const newDueDate = document.getElementById('occ-edit-due-date').value;

    if (!newAmount || isNaN(newAmount) || !newDueDate) return;

    updateOccurrence(occurrence.occurrence_id, newAmount, newDueDate);
    modalContainer.innerHTML = '';
    renderBillDetailScreen(container, params);
  });
}

/**
 * Modal: Delete — "This occurrence" vs "Entire series"
 */
function showDeleteConfirmationModal(occurrence, container) {
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-4 z-50">
      <div class="w-full max-w-sm bg-surface rounded-3xl p-6 space-y-4 border border-surface-alt shadow-2xl animate-modal-in">
        <h3 class="text-screen-title font-bold text-text-primary">Delete Bill</h3>
        <p class="text-body text-text-secondary">
          Choose whether to delete only this specific occurrence or the entire recurring bill series.
        </p>

        <div class="space-y-2.5 pt-2">
          <button id="modal-delete-single" class="w-full py-3 rounded-2xl bg-surface-alt text-text-primary text-button font-semibold hover:bg-surface-alt/80 transition-all">
            Delete Only This Month
          </button>
          <button id="modal-delete-series" class="w-full py-3 rounded-2xl bg-accent-red text-text-primary text-button font-semibold hover:bg-accent-red/90 transition-all">
            Delete Entire Series
          </button>
          <button id="modal-cancel" class="w-full py-3 rounded-2xl bg-transparent text-text-secondary text-button hover:text-text-primary transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-cancel')?.addEventListener('click', () => {
    modalContainer.innerHTML = '';
  });

  document.getElementById('modal-delete-single')?.addEventListener('click', () => {
    deleteBill(occurrence.occurrence_id, 'single');
    modalContainer.innerHTML = '';
    navigate('home');
  });

  document.getElementById('modal-delete-series')?.addEventListener('click', () => {
    deleteBill(occurrence.bill_id, 'series');
    modalContainer.innerHTML = '';
    navigate('home');
  });
}
