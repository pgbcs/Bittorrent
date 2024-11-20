const path = require('path');
const cluster = require("cluster");
const { app, BrowserWindow, ipcMain, dialog,Menu } = require('electron');
const peer = require("./src/Peer/indexUI")

let win
let num_process = process.argv.slice(2);

const createWindow = () => {
    win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true, // Bảo mật
      },
    });
    // Menu.setApplicationMenu(null);
    win.loadFile(path.join(__dirname, 'pages', 'home.html'));
      
    win.setTitle(`User  ${num_process}`);
};
  
app.whenReady().then(() => {
    createWindow();
});

ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Text Files', extensions: ['torrent'] }],
        title: 'Select a Torrent File'
    });

    win.loadFile(path.join(__dirname, 'pages', 'selectfile.html'));

    if (result.filePaths && result.filePaths.length > 0) {

        const filePath = result.filePaths[0];

        try {

        peer.runProcess(filePath,arg = ["download",num_process],win,ipcMain)
        
        } catch (error) {
            console.error('Error reading file:', error);
            return { error: 'Failed to read file' };
        }

    } else {
        console.log('No file selected');
        return { error: 'No file selected' };
    }
});

ipcMain.handle('seeder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Text Files', extensions: ['txt', 'torrent'] }],
});

  // win.loadFile(path.join(__dirname, 'pages', 'down.html'));

  if (result.filePaths && result.filePaths.length > 0) {

      const filePath = result.filePaths[0];

      try {
        win.setTitle(`User share file`);
        peer.runProcess(filePath,arg = ["seeder"])
        return("has run seeder")
      } catch (error) {
          console.error('Error reading file:', error);
          return { error: 'Failed to read file' };
      }

  } else {
      console.log('No file selected');
      return { error: 'No file selected' };
  }
});

ipcMain.handle('navigate-to', (event, route) => {
    switch (route) {
      case 'index':
        win.loadFile(path.join(__dirname, 'pages', 'home.html'));
        break;
      case 'home':
        win.loadFile(path.join(__dirname, 'pages', 'home.html'));
        break;
      default:
        win.loadFile(path.join(__dirname, 'pages', 'index.html'));
    }
});




