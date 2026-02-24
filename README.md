<p align="center">
  <img src="https://img.shields.io/badge/Electron-33-47848F?style=flat-square&logo=electron&logoColor=white" />
  <img src="https://img.shields.io/badge/Bun-1.x-f9f1e1?style=flat-square&logo=bun&logoColor=black" />
  <img src="https://img.shields.io/badge/Platform-Linux-FCC624?style=flat-square&logo=linux&logoColor=black" />
</p>

<h1 align="center">⚡ Slash Cron</h1>

<p align="center">
  <strong>A sleek desktop GUI for managing your cron jobs.</strong><br>
  <sub>No more <code>crontab -e</code>. Just open, click, done.</sub>
</p>

<br>

---

## ✨ Features

| | |
|---|---|
| 📋 **View all jobs** | See every cron job with a human-readable schedule description |
| ✏️ **Edit in place** | Modify schedule and command through a clean modal interface |
| ➕ **Quick create** | Add new jobs with preset schedules (hourly, daily, weekly…) |
| 🔀 **Toggle on/off** | Enable or disable jobs with a single click — no deletion needed |
| 🗑️ **Safe delete** | Remove jobs with a confirmation prompt |
| ⚡ **Live preview** | See what your cron expression means as you type |
| 🔒 **Secure** | Context-isolated renderer, no `nodeIntegration`, stdin-piped writes |

---

## 🚀 Getting Started

**Prerequisites:** [Bun](https://bun.sh) installed on a Linux system.

```bash
# Clone & install
git clone <repo-url> slash-cron
cd slash-cron
bun install

# Launch
bun run start
```

That's it. The app reads your current user's crontab and displays it instantly.

---

## 📁 Project Structure

```
slash-cron/
├── main.js                # Electron main process & IPC handlers
├── preload.js             # Context bridge (load / save)
├── package.json
└── renderer/
    ├── index.html         # App shell
    ├── style.css          # Dark theme UI
    ├── app.js             # State management & DOM rendering
    ├── crontab.js         # Crontab parser & serializer
    └── crondesc.js        # Cron expression → human-readable text
```

**7 files. Zero runtime dependencies.** Just Electron.

---

## 🛠️ How It Works

Slash Cron interacts with your system crontab through two simple commands:

| Action | Command | Method |
|--------|---------|--------|
| **Read** | `crontab -l` | Parses output into structured job objects |
| **Write** | `crontab -` | Pipes the full crontab via stdin — no temp files, no shell injection |

The parser handles:
- ✅ Standard 5-field cron expressions
- ✅ Special schedules (`@reboot`, `@daily`, `@hourly`…)
- ✅ Commented-out jobs (toggled off)
- ✅ Environment variables (`PATH=...`, `MAILTO=...`)
- ✅ Plain comments and blank lines (preserved on save)

---

## 🎨 Schedule Presets

The job editor includes one-click presets:

| Preset | Expression |
|--------|-----------|
| Every min | `* * * * *` |
| Hourly | `0 * * * *` |
| Daily | `0 0 * * *` |
| Weekly | `0 0 * * 1` |
| Monthly | `0 0 1 * *` |

Or type any expression — the live preview tells you exactly what it means.

---

## 📝 License

MIT
