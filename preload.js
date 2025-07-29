const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  closeWindow: () => ipcRenderer.send('close-window'),
  requestOpenFile: () => ipcRenderer.send('request-open-file'),
  onFilePath: (callback) => ipcRenderer.on('file-path', (event, path) => callback(path))
});
