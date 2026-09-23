export const CATEGORIES = [
  { id: 'Electricity', name: 'Electricity', icon: 'zap', color: '#FACC15', bgColor: '#292208' },
  { id: 'Water', name: 'Water', icon: 'droplet', color: '#38BDF8', bgColor: '#082030' },
  { id: 'Internet', name: 'Internet', icon: 'wifi', color: '#A78BFA', bgColor: '#1E1730' },
  { id: 'Rent', name: 'Rent', icon: 'home', color: '#22C55E', bgColor: '#0E2018' },
  { id: 'Subscription', name: 'Subscription', icon: 'tv', color: '#FB923C', bgColor: '#271608' },
  { id: 'Credit Card', name: 'Credit Card', icon: 'credit-card', color: '#F87171', bgColor: '#270C0C' },
  { id: 'Other', name: 'Other', icon: 'box', color: '#9A9A9E', bgColor: '#1E1E20' },
];

/**
 * Format currency in Philippine Peso ₱ (default)
 */
export function formatCurrency(amount, currencySymbol = '₱') {
  const num = parseFloat(amount || 0);
  return `${currencySymbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format date string YYYY-MM-DD to readable "DD MMM, YYYY" (e.g. 23 Sep, 2026)
 */
export function formatDateReadable(isoString) {
  if (!isoString) return '';
  const [y, m, d] = isoString.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Format date to short "DD MMM"
 */
export function formatDateShort(isoString) {
  if (!isoString) return '';
  const [y, m, d] = isoString.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

/**
 * Get category configuration by ID
 */
export function getCategoryConfig(catId) {
  return CATEGORIES.find(c => c.id === catId) || CATEGORIES[CATEGORIES.length - 1];
}

/**
 * SVG icons helper for UI rendering
 */
export function getCategoryIconSvg(iconName, className = "w-5 h-5") {
  switch (iconName) {
    case 'zap': // Electricity — bold filled lightning bolt
      return `<svg class="${className}" viewBox="0 0 24 24" fill="currentColor"><path d="M14.5 2.1a.5.5 0 0 0-.9-.1l-7 13a.5.5 0 0 0 .4.8h5.5L11 21.9a.5.5 0 0 0 .9.1l7-13a.5.5 0 0 0-.4-.8H13l1.5-6z"/></svg>`;
    case 'droplet': // Water — filled teardrop with inner shine
      return `<svg class="${className}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.5 7 5 11.5 5 15a7 7 0 0 0 14 0c0-3.5-3.5-8-7-13z"/><path fill="white" fill-opacity="0.2" d="M9 16a3.5 3.5 0 0 0 3 3.5 3.5 3.5 0 0 1-3-3.5z"/></svg>`;
    case 'wifi': // Internet — bold filled signal arcs with dot
      return `<svg class="${className}" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="19" r="2"/><path d="M4.93 11.93a10 10 0 0 1 14.14 0l1.41-1.41a12 12 0 0 0-16.97 0l1.42 1.41z"/><path d="M7.76 14.76a6 6 0 0 1 8.49 0l1.41-1.41a8 8 0 0 0-11.31 0l1.41 1.41z"/></svg>`;
    case 'home': // Rent — solid house with door cut-out
      return `<svg class="${className}" viewBox="0 0 24 24" fill="currentColor"><path d="M3 12.5 12 4l9 8.5V21a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8.5z"/><rect x="9" y="14" width="3" height="5" rx="0.5" fill="currentColor" fill-opacity="0.35"/><rect x="13" y="15" width="2" height="3" rx="0.5" fill="currentColor" fill-opacity="0.35"/></svg>`;
    case 'tv': // Subscription — bold play-screen icon
      return `<svg class="${className}" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 21h8M12 18v3" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M10 9.5l5 3-5 3V9.5z" fill="white" fill-opacity="0.5"/></svg>`;
    case 'credit-card': // Credit Card — solid card with chip detail
      return `<svg class="${className}" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="5" width="20" height="14" rx="2"/><rect x="2" y="9" width="20" height="3" fill="black" fill-opacity="0.35"/><rect x="14" y="14" width="5" height="2" rx="0.75" fill="white" fill-opacity="0.45"/><rect x="5" y="13.5" width="4" height="3" rx="0.75" fill="white" fill-opacity="0.25"/></svg>`;
    default: // Other — solid tag/label icon
      return `<svg class="${className}" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5a2 2 0 0 1 2-2h6.586a2 2 0 0 1 1.414.586l7.707 7.707a2 2 0 0 1 0 2.828l-5.172 5.172a2 2 0 0 1-2.828 0L4.586 11.586A2 2 0 0 1 4 10.172V5z"/><circle cx="8" cy="9" r="1.5" fill="white" fill-opacity="0.45"/></svg>`;
  }
}
