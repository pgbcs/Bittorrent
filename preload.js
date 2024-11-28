const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'), 
  seeder: () => ipcRenderer.invoke('seeder'), 
  navigateTo: (route) => ipcRenderer.invoke('navigate-to', route),
  onFileSelected: (callback) => ipcRenderer.on('file-selected', callback),
  onMainMessage: (callback) => ipcRenderer.on('main-to-renderer', callback),
  progress: (callback) => ipcRenderer.on('progress', callback),
  sendMessage: (data) => ipcRenderer.send("next", data),
  sendMessage2: (data) => ipcRenderer.send("next2", data),
  sendFormData: (email, password) => ipcRenderer.send('form-data', { email, password }),
  continue: (data) => ipcRenderer.send("continue",data),
  continue1: () => ipcRenderer.send("continue1"),
  onLoginStatus: (callback) => ipcRenderer.on('login-status', (event, status) => callback(status)),
  down1: (callback) => ipcRenderer.on('down1', callback),
  down2: (callback) => ipcRenderer.on('down2', callback),
  exitApp: () => ipcRenderer.invoke('exitApp')

});

