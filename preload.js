const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'), 
  seeder: () => ipcRenderer.invoke('seeder'), 
  navigateTo: (route) => ipcRenderer.invoke('navigate-to', route),
  onFileSelected: (callback) => ipcRenderer.on('file-selected', callback),
  onMainMessage: (callback) => ipcRenderer.on('main-to-renderer', callback),
  progress: (callback) => ipcRenderer.on('progress', callback),
  sendMessage: (data) => ipcRenderer.send("next", data),
  sendFormData: (email, password) => ipcRenderer.send('form-data', { email, password }),
  continue: (data) => ipcRenderer.send("continue",data),
  continue1: (data) => ipcRenderer.send("continue1",data),
  onLoginStatus: (callback) => ipcRenderer.on('login-status', (event, status) => callback(status)),
});
