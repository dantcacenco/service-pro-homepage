/**
 * Date formatting utilities with Eastern Time zone support
 * All dates are displayed in Eastern Time (America/New_York)
 */

const TIMEZONE = 'America/New_York';

/**
 * Format date with time in Eastern Time
 */
export function formatDateTime(date: string | Date | null): string {
  if (!date) return 'Never';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('en-US', {
      timeZone: TIMEZONE,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format date only (no time) in Eastern Time
 */
export function formatDate(date: string | Date | null): string {
  if (!date) return 'Never';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      timeZone: TIMEZONE,
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format time only in Eastern Time
 */
export function formatTime(date: string | Date | null): string {
  if (!date) return 'Never';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('en-US', {
      timeZone: TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return 'Invalid time';
  }
}

/**
 * Get relative time (e.g., "2 hours ago", "in 5 minutes")
 */
export function getRelativeTime(date: string | Date | null): string {
  if (!date) return 'Never';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const absDiff = Math.abs(diff);
    
    const minutes = Math.floor(absDiff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return diff > 0 ? `${days} day${days > 1 ? 's' : ''} ago` : `in ${days} day${days > 1 ? 's' : ''}`;
    }
    if (hours > 0) {
      return diff > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ago` : `in ${hours} hour${hours > 1 ? 's' : ''}`;
    }
    if (minutes > 0) {
      return diff > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''} ago` : `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    
    return diff > 0 ? 'just now' : 'soon';
  } catch {
    return 'Unknown';
  }
}

/**
 * Check if a date is in the past
 */
export function isPastDue(date: string | Date | null): boolean {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.getTime() < Date.now();
  } catch {
    return false;
  }
}

/**
 * Add time to current date (for calculating next due dates)
 * Returns ISO string in UTC (for database storage)
 */
export function addTimeToNow(amount: number, unit: 'minutes' | 'months' | 'years'): string {
  const now = new Date();
  
  switch (unit) {
    case 'minutes':
      return new Date(now.getTime() + amount * 60 * 1000).toISOString();
    case 'months':
      const months = new Date(now);
      months.setMonth(months.getMonth() + amount);
      return months.toISOString();
    case 'years':
      const years = new Date(now);
      years.setFullYear(years.getFullYear() + amount);
      return years.toISOString();
    default:
      return now.toISOString();
  }
}
