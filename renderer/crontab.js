const CRON_RE = /^(\S+\s+\S+\s+\S+\s+\S+\s+\S+)\s+(.+)$/;
const SPECIAL_RE = /^(@(?:reboot|hourly|daily|weekly|monthly|yearly|annually))\s+(.+)$/i;
const ENV_RE = /^([A-Z_][A-Z_0-9]*)=(.*)$/;

function isCronToken(token) {
  return /^[\d*,\/\-]+$/.test(token) || /^[a-zA-Z]{3}$/.test(token);
}

function looksLikeCron(line) {
  const m = line.match(CRON_RE);
  if (!m) return SPECIAL_RE.test(line);
  const fields = m[1].split(/\s+/);
  return fields.length === 5 && fields.every(isCronToken);
}

export function parseCrontab(raw) {
  if (!raw) return [];
  return raw.split('\n').map((rawLine) => {
    if (rawLine.trim() === '') return { type: 'blank', raw: rawLine };

    if (rawLine.startsWith('#')) {
      const stripped = rawLine.replace(/^#\s*/, '');
      if (looksLikeCron(stripped)) {
        const special = stripped.match(SPECIAL_RE);
        if (special) {
          return { type: 'job', active: false, schedule: special[1], command: special[2], raw: rawLine };
        }
        const m = stripped.match(CRON_RE);
        return { type: 'job', active: false, schedule: m[1], command: m[2], raw: rawLine };
      }
      return { type: 'comment', text: rawLine, raw: rawLine };
    }

    const special = rawLine.match(SPECIAL_RE);
    if (special) {
      return { type: 'job', active: true, schedule: special[1], command: special[2], raw: rawLine };
    }

    const m = rawLine.match(CRON_RE);
    if (m && looksLikeCron(rawLine)) {
      return { type: 'job', active: true, schedule: m[1], command: m[2], raw: rawLine };
    }

    const envMatch = rawLine.match(ENV_RE);
    if (envMatch) {
      return { type: 'env', name: envMatch[1], value: envMatch[2], raw: rawLine };
    }

    return { type: 'comment', text: rawLine, raw: rawLine };
  });
}

export function serializeCrontab(lines) {
  return lines
    .map((line) => {
      if (line.type === 'job') {
        const body = `${line.schedule} ${line.command}`;
        return line.active ? body : `# ${body}`;
      }
      if (line.type === 'blank') return '';
      if (line.type === 'comment') return line.text;
      if (line.type === 'env') return `${line.name}=${line.value}`;
      return line.raw || '';
    })
    .join('\n');
}
