/**
 * Utility functions for the Talent-X app
 */

/**
 * Generate a unique ID (UUID v4 compatible)
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Parse a date string (YYYY-MM-DD) in local time to avoid timezone shift
 */
function parseLocalDate(dateString: string): Date {
  // Check if it's a date-only string (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  }
  // For full ISO strings or other formats, use regular parsing
  return new Date(dateString);
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a timestamp to include time
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format duration in seconds to MM:SS format
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
  // Parse date in local time to avoid timezone shift
  let birthDate: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    const [year, month, day] = dateOfBirth.split('-').map(Number);
    birthDate = new Date(year, month - 1, day);
  } else {
    birthDate = new Date(dateOfBirth);
  }
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Get initials from a name
 */
export function getInitials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0).toUpperCase();
  const last = lastName.trim().charAt(0).toUpperCase();
  return `${first}${last}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function isValidDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Get color for a grade
 */
export function getGradeColor(grade: 'A' | 'B' | 'C' | 'D' | 'F'): string {
  const colors = {
    A: '#22c55e', // Green
    B: '#84cc16', // Lime
    C: '#eab308', // Yellow
    D: '#f97316', // Orange
    F: '#ef4444', // Red
  };
  return colors[grade];
}

/**
 * Get color for a score (0-100)
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#84cc16';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#f97316';
  return '#ef4444';
}

/**
 * Clamp a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Get friendly test name
 */
export function getTestDisplayName(testType: string): string {
  const names: Record<string, string> = {
    squats: 'Squats',
    pushups: 'Push-Ups',
    jump: 'Vertical Jump',
    situps: 'Sit-Ups',
    pullups: 'Pull-Ups',
    running: 'Running Speed',
    plank: 'Plank Hold',
    wall_sit: 'Wall Sit',
    burpees: 'Burpees',
    lunges: 'Lunges',
    mountain_climbers: 'Mountain Climbers',
    broad_jump: 'Broad Jump',
    single_leg_balance: 'Single-Leg Balance',
    lateral_hops: 'Lateral Hops',
    hand_release_pushups: 'Hand-Release Push-Ups',
    shuttle_run: '20m Shuttle Run',
  };
  return names[testType] || testType;
}

/**
 * Get test icon name (for use with icon libraries)
 */
export function getTestIcon(testType: string): string {
  const icons: Record<string, string> = {
    squats: '🏋️',
    pushups: '💪',
    jump: '🦘',
    situps: '🧘',
    pullups: '🏋️',
    running: '🏃',
    plank: '🧘',
    wall_sit: '🪑',
    burpees: '🤸',
    lunges: '🦵',
    mountain_climbers: '⛰️',
    broad_jump: '↗️',
    single_leg_balance: '🦶',
    lateral_hops: '↔️',
    hand_release_pushups: '💪',
    shuttle_run: '🏃‍♂️',
  };
  return icons[testType] || '🏃';
}
