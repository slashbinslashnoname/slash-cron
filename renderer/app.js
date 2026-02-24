import { parseCrontab, serializeCrontab } from './crontab.js';
import { describeCron } from './crondesc.js';

let lines = [];
let editingIndex = -1;

const jobList = document.getElementById('job-list');
const emptyState = document.getElementById('empty-state');
const envSection = document.getElementById('env-section');
const envList = document.getElementById('env-list');
const envToggle = document.getElementById('env-toggle');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const schedulePreview = document.getElementById('schedule-preview');
const fMinute = document.getElementById('f-minute');
const fHour = document.getElementById('f-hour');
const fDom = document.getElementById('f-dom');
const fMonth = document.getElementById('f-month');
const fDow = document.getElementById('f-dow');
const fCommand = document.getElementById('f-command');
const toastContainer = document.getElementById('toast-container');

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Load / Save ───

async function loadCrontab() {
  const result = await window.cron.load();
  if (!result.ok) {
    showToast(`Failed to load crontab: ${result.error}`, 'error');
    return;
  }
  lines = parseCrontab(result.data);
  render();
}

async function saveCrontab() {
  const raw = serializeCrontab(lines);
  const result = await window.cron.save(raw);
  if (result.ok) {
    showToast('Crontab saved', 'success');
  } else {
    showToast(`Save failed: ${result.error}`, 'error');
    await loadCrontab();
  }
}

// ─── Render ───

function render() {
  jobList.innerHTML = '';

  const jobs = lines.filter((l) => l.type === 'job');
  const envs = lines.filter((l) => l.type === 'env');

  // Environment section
  if (envs.length > 0) {
    envSection.classList.remove('hidden');
    envList.innerHTML = envs
      .map((e) => `<div class="env-item"><span class="env-name">${escapeHtml(e.name)}</span>=${escapeHtml(e.value)}</div>`)
      .join('');
  } else {
    envSection.classList.add('hidden');
  }

  // Empty state
  if (jobs.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  // Job cards
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.type !== 'job') continue;

    const card = document.createElement('div');
    card.className = `job-card${line.active ? '' : ' disabled'}`;

    const desc = describeCron(line.schedule);

    card.innerHTML = `
      <div class="job-top">
        <label class="toggle">
          <input type="checkbox" ${line.active ? 'checked' : ''} data-index="${i}">
          <span class="toggle-slider"></span>
        </label>
        <span class="job-description">${escapeHtml(desc)}</span>
        <div class="job-actions">
          <button class="icon-btn" data-action="edit" data-index="${i}" title="Edit">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
          </button>
          <button class="icon-btn danger" data-action="delete" data-index="${i}" title="Delete">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>
      <div class="job-bottom">
        <span class="job-schedule">${escapeHtml(line.schedule)}</span>
        <span class="job-command" title="${escapeHtml(line.command)}">${escapeHtml(line.command)}</span>
      </div>
    `;

    jobList.appendChild(card);
  }
}

// ─── Toggle ───

function toggleJob(index) {
  lines[index].active = !lines[index].active;
  render();
  saveCrontab();
}

// ─── Delete ───

function deleteJob(index) {
  if (!confirm('Delete this cron job?')) return;
  lines.splice(index, 1);
  render();
  saveCrontab();
}

// ─── Modal ───

function getScheduleFromFields() {
  return `${fMinute.value || '*'} ${fHour.value || '*'} ${fDom.value || '*'} ${fMonth.value || '*'} ${fDow.value || '*'}`;
}

function updatePreview() {
  const schedule = getScheduleFromFields();
  schedulePreview.textContent = describeCron(schedule);
}

function openModal(index) {
  editingIndex = index;
  if (index >= 0) {
    modalTitle.textContent = 'Edit Cron Job';
    const job = lines[index];
    const isSpecial = job.schedule.startsWith('@');
    if (isSpecial) {
      fMinute.value = job.schedule;
      fHour.value = '';
      fDom.value = '';
      fMonth.value = '';
      fDow.value = '';
    } else {
      const parts = job.schedule.split(/\s+/);
      fMinute.value = parts[0] || '*';
      fHour.value = parts[1] || '*';
      fDom.value = parts[2] || '*';
      fMonth.value = parts[3] || '*';
      fDow.value = parts[4] || '*';
    }
    fCommand.value = job.command;
  } else {
    modalTitle.textContent = 'New Cron Job';
    fMinute.value = '';
    fHour.value = '';
    fDom.value = '';
    fMonth.value = '';
    fDow.value = '';
    fCommand.value = '';
  }
  updatePreview();
  modalOverlay.classList.remove('hidden');
  fMinute.focus();
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  editingIndex = -1;
}

function saveModal() {
  const schedule = getScheduleFromFields();
  const command = fCommand.value.trim();
  if (!command) {
    showToast('Command cannot be empty', 'error');
    fCommand.focus();
    return;
  }

  if (editingIndex >= 0) {
    lines[editingIndex].schedule = schedule;
    lines[editingIndex].command = command;
  } else {
    lines.push({ type: 'job', active: true, schedule, command });
  }

  closeModal();
  render();
  saveCrontab();
}

// ─── Toast ───

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hiding');
    toast.addEventListener('animationend', () => toast.remove());
  }, 2500);
}

// ─── Event Listeners ───

document.getElementById('btn-refresh').addEventListener('click', loadCrontab);
document.getElementById('btn-add').addEventListener('click', () => openModal(-1));
document.getElementById('btn-cancel').addEventListener('click', closeModal);
document.getElementById('btn-save').addEventListener('click', saveModal);

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
    closeModal();
  }
});

// Schedule field live preview
[fMinute, fHour, fDom, fMonth, fDow].forEach((input) => {
  input.addEventListener('input', updatePreview);
});

// Tab between schedule fields
[fMinute, fHour, fDom, fMonth].forEach((input, i) => {
  input.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      [fMinute, fHour, fDom, fMonth, fDow][i + 1].focus();
    }
  });
});

// Enter in modal saves
fCommand.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    saveModal();
  }
});

// Presets
document.querySelectorAll('.preset').forEach((btn) => {
  btn.addEventListener('click', () => {
    const parts = btn.dataset.schedule.split(' ');
    fMinute.value = parts[0];
    fHour.value = parts[1];
    fDom.value = parts[2];
    fMonth.value = parts[3];
    fDow.value = parts[4];
    updatePreview();
  });
});

// Delegated click for job actions
jobList.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (btn) {
    const index = parseInt(btn.dataset.index, 10);
    if (btn.dataset.action === 'edit') openModal(index);
    if (btn.dataset.action === 'delete') deleteJob(index);
    return;
  }
  const toggle = e.target.closest('.toggle input');
  if (toggle) {
    const index = parseInt(toggle.dataset.index, 10);
    toggleJob(index);
  }
});

// Env toggle
envToggle.addEventListener('click', () => {
  envToggle.classList.toggle('open');
  envList.classList.toggle('collapsed');
});

// ─── Init ───
loadCrontab();
