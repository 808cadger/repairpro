// electron/preload.js — AutoRepairIQ Pro context bridge
// Aloha from Pearl City! 🌺

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
});
