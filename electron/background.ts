import * as path from 'path'
import * as os from 'os'
import { app, BrowserWindow, session, ipcMain, dialog } from 'electron'
import singleInstance from './singleInstance'
import dynamicRenderer from './dynamicRenderer'
import titleBarActionsModule from './modules/titleBarActions'
import updaterModule from './modules/updater'
import macMenuModule from './modules/macMenu'

// Initilize
// =========
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
const isProduction = process.env.NODE_ENV !== 'development'
const platform: 'darwin' | 'win32' | 'linux' = process.platform as any
const architucture: '64' | '32' = os.arch() === 'x64' ? '64' : '32'
const headerSize = 32
const modules = [titleBarActionsModule, macMenuModule, updaterModule]
const fs = require('fs');

// Initialize app window
// =====================
function createWindow() {
  console.log('System info', { isProduction, platform, architucture })
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 676,
    height: 800,
    backgroundColor: '#000',
    webPreferences: {
      devTools: !isProduction,
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },

    titleBarStyle: 'hiddenInset',
    // frame: platform === 'darwin',
    frame: true, // <= Remove this line if you wanted to implement your own title bar
    titleBarOverlay: platform === 'darwin' && { height: headerSize },
    title: 'electron-nuxt3'
  })

  // Lock app to single instance
  if (singleInstance(app, mainWindow)) return

  // Open the DevTools.
  !isProduction &&
    mainWindow.webContents.openDevTools({
      mode: 'bottom'
    })

  return mainWindow
}

// Function to open file dialog
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile']
  });
  return result.filePaths;
})

ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result.filePaths;
})

// App events
// ==========
app.whenReady().then(async () => {
  if (!isProduction) {
    try {
      await session.defaultSession.loadExtension(path.join(__dirname, '../..', '__extensions', 'vue-devtools'))
    } catch (err) {
      console.log('[Electron::loadExtensions] An error occurred: ', err)
    }
  }

  const mainWindow = createWindow()
  if (!mainWindow) return

  // Load renderer process
  dynamicRenderer(mainWindow)

  // Initialize modules
  console.log('-'.repeat(30) + '\n[+] Loading modules...')
  modules.forEach((module) => {
    try {
      module(mainWindow)
    } catch (err: any) {
      console.log('[!] Module error: ', err.message || err)
    }
  })

  console.log('[!] Loading modules: Done.' + '\r\n' + '-'.repeat(30))

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    // if (BrowserWindow.getAllWindows().length === 0) createWindow()
    mainWindow.show()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled) {
    return null;
  } else {
    const folderPath = result.filePaths[0];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const imageFiles: string[] = [];

    try {
      const files = fs.readdirSync(folderPath);
      console.log(`Files in folder: ${files.length}`); // Debugging line

      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (imageExtensions.includes(ext)) {
          imageFiles.push(file);
        }
      }
      console.log(`Image files found: ${imageFiles.length}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error reading directory: ${error.message}`);
      } else {
        console.error('An unknown error occurred');
      }
      return null;
    }
    
    return { folderPath, imageCount: imageFiles.length };
  }
});

ipcMain.handle('read-csv', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const basePath = path.dirname(filePath);
    return { success: true, data, basePath };
  } catch (err) {
    let errorMessage = 'An unknown error occurred';
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return { success: false, error: errorMessage };
  }
});