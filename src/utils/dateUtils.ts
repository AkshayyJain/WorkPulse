export function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function formatWeekRange(weekStart?: string, weekEnd?: string): string {
  if (!weekStart) return 'Current Week';
  const start = formatDisplayDate(weekStart);
  const end = weekEnd ? formatDisplayDate(weekEnd) : '';
  return end ? `${start} – ${end}` : start;
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// Helper to get current week start (Monday) and end (Sunday)
export function getReportingWeek(date: Date = new Date()): { weekStart: string; weekEnd: string } {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd: sunday.toISOString().split('T')[0],
  };
}

// Format past week
export function getPastReportingWeek(weeksAgo: number): { weekStart: string; weekEnd: string } {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - (weeksAgo * 7));
  return getReportingWeek(targetDate);
}
