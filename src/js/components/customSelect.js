/**
 * Creates a fully custom-styled dropdown to replace native <select> elements.
 *
 * @param {Object} config
 * @param {string}   config.id          - Unique ID for the hidden input that stores the value
 * @param {Array}    config.options      - Array of { value, label } objects
 * @param {string}   config.value       - Initially selected value
 * @param {string}   [config.extraClass] - Extra classes for the trigger button wrapper
 * @param {Function} [config.onChange]  - Callback called with the new value string when selection changes
 * @returns {{ html: string, init: Function }}
 *   html  – HTML string to inject into the DOM
 *   init  – Function to call after the HTML is in the DOM (attaches event listeners)
 */
export function createCustomSelect({ id, options, value, extraClass = '', onChange }) {
  const selectedOption = options.find(o => o.value === value) || options[0];

  const chevronSvg = `<svg class="w-4 h-4 transition-transform duration-200" id="${id}-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>`;

  const checkSvg = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`;

  const optionsHtml = options.map(opt => `
    <button
      type="button"
      data-select-option="${id}"
      data-value="${opt.value}"
      class="custom-select-option w-full flex items-center justify-between px-4 py-2.5 text-body text-left transition-colors duration-100 hover:bg-surface-alt/80 rounded-xl ${opt.value === selectedOption.value ? 'text-accent-purple font-semibold' : 'text-text-primary font-normal'}"
    >
      <span>${opt.label}</span>
      <span class="text-accent-purple ${opt.value === selectedOption.value ? '' : 'invisible'}">${checkSvg}</span>
    </button>
  `).join('');

  const html = `
    <div class="relative ${extraClass}" id="${id}-wrapper">
      <!-- Hidden value store -->
      <input type="hidden" id="${id}" name="${id}" value="${selectedOption.value}" />

      <!-- Trigger Button -->
      <button
        type="button"
        id="${id}-trigger"
        class="w-full flex items-center justify-between px-4 py-3.5 bg-surface border border-surface-alt/40 rounded-2xl text-body text-text-primary cursor-pointer transition-all hover:border-accent-purple/40 focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple"
        aria-haspopup="listbox"
        aria-expanded="false"
      >
        <span id="${id}-label">${selectedOption.label}</span>
        <span class="text-text-secondary ml-2 shrink-0">${chevronSvg}</span>
      </button>

      <!-- Dropdown Panel -->
      <div
        id="${id}-panel"
        class="absolute z-40 left-0 right-0 mt-2 bg-surface border border-surface-alt/60 rounded-2xl shadow-2xl overflow-hidden origin-top"
        style="display:none; opacity:0; transform:scaleY(0.95); transition: opacity 0.15s ease, transform 0.15s ease;"
        role="listbox"
      >
        <div class="p-1.5 space-y-0.5 max-h-56 overflow-y-auto">
          ${optionsHtml}
        </div>
      </div>
    </div>
  `;

  function init(onChangeOverride) {
    const cb = onChangeOverride || onChange;
    const wrapper  = document.getElementById(`${id}-wrapper`);
    const trigger  = document.getElementById(`${id}-trigger`);
    const panel    = document.getElementById(`${id}-panel`);
    const label    = document.getElementById(`${id}-label`);
    const input    = document.getElementById(id);
    const chevron  = document.getElementById(`${id}-chevron`);

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
      trigger.classList.add('border-accent-purple', 'ring-1', 'ring-accent-purple');
    }

    function close() {
      isOpen = false;
      panel.style.opacity = '0';
      panel.style.transform = 'scaleY(0.95)';
      chevron.style.transform = 'rotate(0deg)';
      trigger.setAttribute('aria-expanded', 'false');
      trigger.classList.remove('border-accent-purple', 'ring-1', 'ring-accent-purple');
      setTimeout(() => { if (!isOpen) panel.style.display = 'none'; }, 150);
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      isOpen ? close() : open();
    });

    // Option selection
    panel.querySelectorAll('[data-select-option]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = btn.getAttribute('data-value');
        const lbl = btn.querySelector('span:first-child').textContent;

        // Update hidden input + label
        input.value = val;
        label.textContent = lbl;

        // Update option highlight states
        panel.querySelectorAll('[data-select-option]').forEach(b => {
          const isSelected = b.getAttribute('data-value') === val;
          b.classList.toggle('text-accent-purple', isSelected);
          b.classList.toggle('font-semibold', isSelected);
          b.classList.toggle('font-normal', !isSelected);
          b.querySelector('span:last-child').classList.toggle('invisible', !isSelected);
        });

        close();
        if (cb) cb(val);
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (isOpen && !wrapper.contains(e.target)) close();
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) close();
    });
  }

  return { html, init };
}
