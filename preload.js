const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cron', {
  load: () => ipcRenderer.invoke('crontab:load'),
  save: (raw) => ipcRenderer.invoke('crontab:save', raw),
});
