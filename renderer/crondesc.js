const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const SPECIALS = {
  '@reboot': 'At reboot',
  '@hourly': 'Every hour',
  '@daily': 'Every day at 00:00',
  '@weekly': 'Every Sunday at 00:00',
  '@monthly': '1st of every month at 00:00',
  '@yearly': 'Every January 1st at 00:00',
  '@annually': 'Every January 1st at 00:00',
};

function pad(n) {
  return String(n).padStart(2, '0');
}

function describeList(str, names) {
  const parts = str.split(',').map((p) => {
    const n = parseInt(p, 10);
    return names && !isNaN(n) ? (names[n] || p) : p;
  });
  if (parts.length === 1) return parts[0];
  return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
}

function describeDow(field) {
  if (field === '*') return '';
  if (field.includes('-')) {
    const [a, b] = field.split('-').map(Number);
    return `${DAYS[a] || a} through ${DAYS[b] || b}`;
  }
  return describeList(field, DAYS);
}

export function describeCron(schedule) {
  if (!schedule) return '';
  const lower = schedule.toLowerCase();
  if (SPECIALS[lower]) return SPECIALS[lower];

  const parts = schedule.split(/\s+/);
  if (parts.length !== 5) return schedule;

  const [min, hour, dom, month, dow] = parts;

  // Every minute
  if (min === '*' && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    return 'Every minute';
  }

  // Step in minutes: */N * * * *
  if (min.startsWith('*/') && hour === '*' && dom === '*' && dow === '*') {
    const n = min.slice(2);
    return `Every ${n} minute${n === '1' ? '' : 's'}`;
  }

  // Step in hours: 0 */N * * *
  if (hour.startsWith('*/') && dom === '*' && dow === '*') {
    const n = hour.slice(2);
    return `Every ${n} hour${n === '1' ? '' : 's'}`;
  }

  // Every hour at specific minute
  if (min !== '*' && !min.includes('/') && hour === '*' && dom === '*' && dow === '*') {
    return `Every hour at minute ${min}`;
  }

  let time = '';
  if (min !== '*' && hour !== '*' && !min.includes('/') && !hour.includes('/')) {
    if (hour.includes(',')) {
      const hours = hour.split(',');
      time = hours.map((h) => `${pad(h)}:${pad(min)}`).join(' and ');
    } else {
      time = `${pad(hour)}:${pad(min)}`;
    }
  } else if (min !== '*' && hour !== '*') {
    time = `${hour}h, minute ${min}`;
  } else {
    time = schedule;
  }

  let when = '';

  if (dom !== '*' && month !== '*') {
    const m = parseInt(month, 10);
    when = `${MONTHS[m] || month} ${dom}`;
  } else if (dom !== '*') {
    const suffix = dom === '1' ? 'st' : dom === '2' ? 'nd' : dom === '3' ? 'rd' : 'th';
    when = `${dom}${suffix} of every month`;
  } else if (month !== '*') {
    const m = parseInt(month, 10);
    when = `every day in ${MONTHS[m] || month}`;
  }

  let dayStr = '';
  if (dow !== '*') {
    dayStr = describeDow(dow);
    if (dow === '1-5') dayStr = 'weekdays';
    if (dow === '0,6' || dow === '6,0') dayStr = 'weekends';
  }

  // Build final string
  const fragments = [];
  if (when) fragments.push(when);
  else if (dayStr) fragments.push(dayStr);
  else if (dom === '*' && dow === '*') fragments.push('Every day');

  if (time) fragments.push(`at ${time}`);
  if (when && dayStr) fragments.push(`(${dayStr})`);

  return fragments.join(' ') || schedule;
}
