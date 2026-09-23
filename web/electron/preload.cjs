const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('offline', {
  isElectron: true,
  close: () => ipcRenderer.send('offline:close'),
  saveFile: (filename, data) => ipcRenderer.invoke('app:save-file', { filename, data }),
})
