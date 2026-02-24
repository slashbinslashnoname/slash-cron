const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const { execSync } = require('child_process');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 700,
    minHeight: 500,
    backgroundColor: '#0b0e17',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  Menu.setApplicationMenu(null);
  win.loadFile('renderer/index.html');
}

ipcMain.handle('crontab:load', async () => {
  try {
    const raw = execSync('crontab -l', { encoding: 'utf-8' });
    return { ok: true, data: raw };
  } catch (err) {
    if (err.stderr && err.stderr.includes('no crontab')) {
      return { ok: true, data: '' };
    }
    return { ok: false, error: err.stderr || err.message };
  }
});

ipcMain.handle('crontab:save', async (_event, raw) => {
  try {
    execSync('crontab -', { input: raw, encoding: 'utf-8' });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.stderr || err.message };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
