export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function dateStr(date) {
  return date.toISOString().slice(0, 10);
}

export function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateStr(d);
}

export function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateStr(d);
}

export function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];

  // Pad with nulls for days before the 1st
  for (let i = 0; i < firstDay; i++) days.push(null);

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    days.push(dateStr(date));
  }

  return days;
}

export function getMonthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function calculateStreak(doses, medications) {
  const activeMeds = medications.filter(m => m.active && m.frequency !== 'as_needed');
  if (activeMeds.length === 0) return 0;

  let streak = 0;
  const today = todayStr();
  let checkDate = today;

  while (true) {
    const dayDoses = doses.filter(d => d.date === checkDate && d.status === 'taken');
    let allTaken = true;

    for (const med of activeMeds) {
      // Only count meds that existed on this date
      const medCreated = new Date(med.createdAt).toISOString().slice(0, 10);
      if (checkDate < medCreated) continue;

      for (const slot of med.timeSlots) {
        const hasDose = dayDoses.some(d => d.medicationId === med.id && d.scheduledSlot === slot);
        if (!hasDose) { allTaken = false; break; }
      }
      if (!allTaken) break;
    }

    // Today is allowed to be incomplete (still in progress)
    if (!allTaken && checkDate !== today) break;
    if (!allTaken && checkDate === today) {
      // Don't break streak for today — check yesterday
      const d = parseDate(checkDate);
      d.setDate(d.getDate() - 1);
      checkDate = dateStr(d);
      continue;
    }

    streak++;
    const d = parseDate(checkDate);
    d.setDate(d.getDate() - 1);
    checkDate = dateStr(d);

    // Safety: don't go back more than 365 days
    if (streak > 365) break;
  }

  return streak;
}

export function adherenceForDate(doses, medications, dateStr) {
  const activeMeds = medications.filter(m => m.active && m.frequency !== 'as_needed');
  if (activeMeds.length === 0) return null;

  const dayDoses = doses.filter(d => d.date === dateStr && d.status === 'taken');
  let expected = 0;
  let taken = 0;

  for (const med of activeMeds) {
    const medCreated = new Date(med.createdAt).toISOString().slice(0, 10);
    if (dateStr < medCreated) continue;

    for (const slot of med.timeSlots) {
      expected++;
      if (dayDoses.some(d => d.medicationId === med.id && d.scheduledSlot === slot)) taken++;
    }
  }

  if (expected === 0) return null;
  return taken / expected;
}

export function adherenceForRange(doses, medications, startDate, endDate) {
  const activeMeds = medications.filter(m => m.active && m.frequency !== 'as_needed');
  if (activeMeds.length === 0) return null;

  let totalExpected = 0;
  let totalTaken = 0;

  const current = parseDate(startDate);
  const end = parseDate(endDate);

  while (current <= end) {
    const ds = dateStr(current);
    const dayDoses = doses.filter(d => d.date === ds && d.status === 'taken');

    for (const med of activeMeds) {
      const medCreated = new Date(med.createdAt).toISOString().slice(0, 10);
      if (ds < medCreated) continue;

      for (const slot of med.timeSlots) {
        totalExpected++;
        if (dayDoses.some(d => d.medicationId === med.id && d.scheduledSlot === slot)) totalTaken++;
      }
    }

    current.setDate(current.getDate() + 1);
  }

  if (totalExpected === 0) return null;
  return totalTaken / totalExpected;
}
