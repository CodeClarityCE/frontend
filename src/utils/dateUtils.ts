/**
 * Native JavaScript date utilities to replace moment.js
 * Provides common date formatting, relative time, and date calculation functions
 */

// Constants for relative time calculations
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;
const YEAR_MS = 365 * DAY_MS;

/**
 * Format a date according to common patterns used in the application
 */
export function formatDate(
  date: Date | string | null | undefined,
  format = "LL",
): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check for invalid dates (like the moment check for 'Mon Jan 01 0001')
  if (!isValidDate(dateObj)) return "";

  const options: Intl.DateTimeFormatOptions = {};

  switch (format) {
    case "LL": // "September 4, 1986"
      options.year = "numeric";
      options.month = "long";
      options.day = "numeric";
      break;
    case "MMM DD, YYYY": // "Sep 04, 1986"
      options.year = "numeric";
      options.month = "short";
      options.day = "2-digit";
      break;
    case "MMM DD, YYYY [at] h:mm A": {
      // "Sep 04, 1986 at 3:30 PM"
      const dateStr = dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
      const timeStr = dateObj.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      return `${dateStr} at ${timeStr}`;
    }
    case "YYYY": // "1986"
      return dateObj.getFullYear().toString();
    case "MMM": // "Sep"
      return dateObj.toLocaleDateString("en-US", { month: "short" });
    case "DD": // "04"
      return dateObj.getDate().toString().padStart(2, "0");
    case "MMM DD": // "Sep 04"
      options.month = "short";
      options.day = "2-digit";
      break;
    case "MMM DD, YYYY HH:mm": {
      // "Sep 04, 1986 15:30"
      const dateStr = dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
      const timeStr = dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return `${dateStr} ${timeStr}`;
    }
    case "MMM DD, HH:mm": {
      // "Sep 04, 15:30"
      const dateStr = dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
      });
      const timeStr = dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return `${dateStr}, ${timeStr}`;
    }
    default:
      options.year = "numeric";
      options.month = "long";
      options.day = "numeric";
  }

  return dateObj.toLocaleDateString("en-US", options);
}

/**
 * Get relative time string (e.g., "3 hours ago", "2 days ago")
 * Replaces moment().fromNow()
 */
export function formatRelativeTime(
  date: Date | string | null | undefined,
): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (!isValidDate(dateObj)) return "";

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();

  if (diffMs < 0) {
    // Future date
    const absDiff = Math.abs(diffMs);
    if (absDiff < MINUTE_MS) return "in a few seconds";
    if (absDiff < HOUR_MS)
      return `in ${Math.floor(absDiff / MINUTE_MS)} minutes`;
    if (absDiff < DAY_MS) return `in ${Math.floor(absDiff / HOUR_MS)} hours`;
    if (absDiff < WEEK_MS) return `in ${Math.floor(absDiff / DAY_MS)} days`;
    if (absDiff < MONTH_MS) return `in ${Math.floor(absDiff / WEEK_MS)} weeks`;
    if (absDiff < YEAR_MS) return `in ${Math.floor(absDiff / MONTH_MS)} months`;
    return `in ${Math.floor(absDiff / YEAR_MS)} years`;
  }

  // Past date
  if (diffMs < MINUTE_MS) return "a few seconds ago";
  if (diffMs < HOUR_MS) {
    const minutes = Math.floor(diffMs / MINUTE_MS);
    return minutes === 1 ? "a minute ago" : `${minutes} minutes ago`;
  }
  if (diffMs < DAY_MS) {
    const hours = Math.floor(diffMs / HOUR_MS);
    return hours === 1 ? "an hour ago" : `${hours} hours ago`;
  }
  if (diffMs < WEEK_MS) {
    const days = Math.floor(diffMs / DAY_MS);
    return days === 1 ? "a day ago" : `${days} days ago`;
  }
  if (diffMs < MONTH_MS) {
    const weeks = Math.floor(diffMs / WEEK_MS);
    return weeks === 1 ? "a week ago" : `${weeks} weeks ago`;
  }
  if (diffMs < YEAR_MS) {
    const months = Math.floor(diffMs / MONTH_MS);
    return months === 1 ? "a month ago" : `${months} months ago`;
  }

  const years = Math.floor(diffMs / YEAR_MS);
  return years === 1 ? "a year ago" : `${years} years ago`;
}

/**
 * Calculate the difference between two dates in specified units
 * Replaces moment().diff()
 */
export function calculateDateDifference(
  date1: Date | string | null | undefined,
  date2: Date | string | null | undefined,
  unit:
    | "milliseconds"
    | "seconds"
    | "minutes"
    | "hours"
    | "days"
    | "weeks"
    | "months"
    | "years" = "milliseconds",
): number {
  if (!date1 || !date2) return 0;

  const dateObj1 = typeof date1 === "string" ? new Date(date1) : date1;
  const dateObj2 = typeof date2 === "string" ? new Date(date2) : date2;

  if (!isValidDate(dateObj1) || !isValidDate(dateObj2)) return 0;

  const diffMs = dateObj1.getTime() - dateObj2.getTime();

  switch (unit) {
    case "seconds":
      return Math.floor(diffMs / 1000);
    case "minutes":
      return Math.floor(diffMs / MINUTE_MS);
    case "hours":
      return Math.floor(diffMs / HOUR_MS);
    case "days":
      return Math.floor(diffMs / DAY_MS);
    case "weeks":
      return Math.floor(diffMs / WEEK_MS);
    case "months":
      return Math.floor(diffMs / MONTH_MS);
    case "years":
      return Math.floor(diffMs / YEAR_MS);
    default:
      return diffMs;
  }
}

/**
 * Check if a date is expiring soon (within specified days)
 * Replaces moment.duration().asDays() <= threshold logic
 */
export function isDateExpiring(
  date: Date | string | null | undefined,
  thresholdDays = 14,
): boolean {
  if (!date) return false;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (!isValidDate(dateObj)) return false;

  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffDays = diffMs / DAY_MS;

  return diffDays > 0 && diffDays <= thresholdDays;
}

/**
 * Get the number of days until a date expires
 * Replaces moment.duration(moment(date).diff(new Date())).asDays()
 */
export function getDaysUntilExpiry(
  date: Date | string | null | undefined,
): number {
  if (!date) return 0;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (!isValidDate(dateObj)) return 0;

  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  return Math.ceil(diffMs / DAY_MS);
}

/**
 * Check if a date is valid (not null, undefined, or invalid Date)
 * Replaces moment's invalid date detection
 */
export function isValidDate(date: Date | string | null | undefined): boolean {
  if (!date) return false;

  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check for invalid Date object
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return false;

  // Check for the specific invalid date pattern that moment was checking for
  // 'Mon Jan 01 0001 00:17:30 GMT+0017' indicates an invalid/default date
  if (dateObj.getFullYear() === 1) return false;

  return true;
}

/**
 * Format current date in MMM DD format
 * Replaces moment().format('MMM DD')
 */
export function formatCurrentDate(format = "MMM DD"): string {
  return formatDate(new Date(), format);
}

/**
 * Check if a package is outdated (> 182 days old)
 * Common pattern used in dependency health checks
 */
export function isPackageOutdated(
  date: Date | string | null | undefined,
  thresholdDays = 182,
): boolean {
  if (!date) return false;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (!isValidDate(dateObj)) return false;

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = diffMs / DAY_MS;

  return diffDays > thresholdDays;
}

/**
 * Get week range for a specific week number and year
 * Replaces moment().day('Monday').year(year).week(weekNumber) logic
 */
export function getWeekRange(
  weekNumber: number,
  year: number,
): { start: Date; end: Date } {
  // Create a date for January 1st of the given year
  const jan1 = new Date(year, 0, 1);

  // Find the first Monday of the year
  const firstMonday = new Date(jan1);
  const dayOfWeek = jan1.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  firstMonday.setDate(jan1.getDate() + daysUntilMonday);

  // Calculate the start of the requested week
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);

  // Calculate the end of the week (Sunday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return { start: weekStart, end: weekEnd };
}

/**
 * Format a date range
 * Common pattern for displaying week ranges
 */
export function formatDateRange(
  startDate: Date,
  endDate: Date,
  format = "MMM DD",
): string {
  return `${formatDate(startDate, format)} - ${formatDate(endDate, format)}`;
}

/**
 * Alias for formatRelativeTime - provides distance to now
 * e.g., "3 hours", "2 days", etc. (without "ago")
 */
export function formatDistanceToNow(
  date: Date | string | null | undefined,
): string {
  const relativeTime = formatRelativeTime(date);
  // Remove "ago" and "in" prefixes to get just the distance
  return relativeTime
    .replace(/ ago$/, "")
    .replace(/^in /, "")
    .replace(/^a /, "1 ");
}
