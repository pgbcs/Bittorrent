const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'), 
  seeder: () => ipcRenderer.invoke('seeder'), 
  navigateTo: (route) => ipcRenderer.invoke('navigate-to', route),
  onFileSelected: (callback) => ipcRenderer.on('file-selected', callback),
  onMainMessage: (callback) => ipcRenderer.on('main-to-renderer', callback),
  sendMessage: (data) => ipcRenderer.send("next", data)
});
