import { contextBridge, ipcRenderer } from 'electron'
const api = {
  scanFiles: (p: string) => ipcRenderer.invoke('scan-files', p),
  renameFile: (o: string, pl: any) => ipcRenderer.invoke('rename-file', o, pl),
  undoRename: (c: string, o: string) => ipcRenderer.invoke('undo-rename', c, o),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  searchTPDB: (t: string, q: string) => ipcRenderer.invoke('search-tpdb', t, q),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url)
}
if (process.contextIsolated) { contextBridge.exposeInMainWorld('electron', api) } else { window.electron = api }