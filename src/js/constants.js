export const CATEGORIES = [
  { id: 'Electricity', name: 'Electricity', icon: 'zap', color: '#F4511E', bgColor: '#2A1F1C' },
  { id: 'Water', name: 'Water', icon: 'droplet', color: '#00BEC5', bgColor: '#182B2D' },
  { id: 'Internet', name: 'Internet', icon: 'wifi', color: '#6C5CE7', bgColor: '#24203D' },
  { id: 'Rent', name: 'Rent', icon: 'home', color: '#A060FF', bgColor: '#271F38' },
  { id: 'Subscription', name: 'Subscription', icon: 'tv', color: '#FF7675', bgColor: '#332021' },
  { id: 'Credit Card', name: 'Credit Card', icon: 'credit-card', color: '#E5484D', bgColor: '#321D1E' },
  { id: 'Other', name: 'Other', icon: 'box', color: '#9A9A9E', bgColor: '#2A2A2C' },
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
    case 'zap': // Electricity
      return `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`;
    case 'droplet': // Water
      return `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>`;
    case 'wifi': // Internet
      return `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.071-7.071c4.999-4.999 13.143-4.999 18.142 0M2.828 9.172c7.81-7.81 20.474-7.81 28.284 0"/></svg>`;
    case 'home': // Rent
      return `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`;
    case 'tv': // Subscription
      return `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h18M3 16h18"/></svg>`;
    case 'credit-card': // Credit Card
      return `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`;
    default: // Other
      return `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`;
  }
}
