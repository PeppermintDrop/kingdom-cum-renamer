import { app, shell, BrowserWindow, ipcMain, dialog, net } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import fs from 'fs'
import path from 'path'
// @ts-ignore
import pkg from '../../package.json'

function createWindow(): void {
  let iconPath = join(__dirname, '../../build/icon.ico')
  if (is.dev) iconPath = join(__dirname, '../../resources/icon.ico')

  const mainWindow = new BrowserWindow({
    width: 1500, height: 1000, show: false, backgroundColor: '#050505', autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: { preload: join(__dirname, '../preload/index.js'), sandbox: false, nodeIntegration: true, contextIsolation: false, webSecurity: false }
  })
  mainWindow.on('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler((details) => { shell.openExternal(details.url); return { action: 'deny' } })
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) { mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']) } 
  else { mainWindow.loadFile(join(__dirname, '../renderer/index.html')) }
}

ipcMain.handle('scan-files', async (_, dirPath) => {
  try {
    const files = await fs.promises.readdir(dirPath);
    const videoFiles = [];
    for (const file of files) {
      if (['.mp4', '.mkv', '.avi', '.wmv', '.mov'].includes(path.extname(file).toLowerCase())) {
        const full = path.join(dirPath, file);
        try { const s = await fs.promises.stat(full); if (s.isFile()) videoFiles.push({ name: file, path: full, size: s.size }); } catch (e) {}
      }
    }
    return videoFiles;
  } catch (e) { return []; }
});

ipcMain.handle('select-directory', async () => (await dialog.showOpenDialog({ properties: ['openDirectory'] })).filePaths);

ipcMain.handle('search-tpdb', async (_, token, query) => {
  return new Promise((resolve, reject) => {
    const req = net.request({ method: 'GET', url: `https://api.theporndb.net/scenes?parse=${encodeURIComponent(query)}` });
    req.setHeader('Authorization', `Bearer ${token}`); req.setHeader('Accept', 'application/json');
    let body = '';
    req.on('response', (res) => { res.on('data', (c) => body += c); res.on('end', () => { try { resolve(JSON.parse(body).data || []); } catch { resolve([]); } }); });
    req.end();
  });
});

ipcMain.handle('rename-file', async (_, oldPath, { targetDir, newName, subFolder, mode }) => {
  const oldDir = path.dirname(oldPath);
  let finalPath = '';
  if (mode === 'rename_only') finalPath = path.join(oldDir, newName);
  else if (mode === 'move_flat') {
    finalPath = path.join(targetDir, newName);
    if (!fs.existsSync(targetDir)) await fs.promises.mkdir(targetDir, { recursive: true });
  } else {
    const newDir = path.join(targetDir, subFolder);
    if (!fs.existsSync(newDir)) await fs.promises.mkdir(newDir, { recursive: true });
    finalPath = path.join(newDir, newName);
  }
  await fs.promises.rename(oldPath, finalPath);
  return { success: true, newPath: finalPath, oldPath: oldPath };
});

ipcMain.handle('undo-rename', async (_, currentPath, originalPath) => {
  try {
    if (fs.existsSync(currentPath)) {
       const originalDir = path.dirname(originalPath);
       if (!fs.existsSync(originalDir)) await fs.promises.mkdir(originalDir, { recursive: true });
       await fs.promises.rename(currentPath, originalPath);
       try {
         const currentDir = path.dirname(currentPath);
         const files = await fs.promises.readdir(currentDir);
         if (files.length === 0) await fs.promises.rmdir(currentDir);
       } catch (e) {}
       return true;
    }
    return false;
  } catch (e) { return false; }
});

ipcMain.handle('get-app-info', () => ({ 
  name: pkg.productName || pkg.name, 
  version: pkg.version, 
  author: pkg.author 
}));

ipcMain.handle('open-external', (_, url) => {
  shell.openExternal(url);
});

app.whenReady().then(() => { electronApp.setAppUserModelId('com.peppermintdrop.kingdomcum'); createWindow(); })