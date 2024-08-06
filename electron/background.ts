import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import { spawn, exec } from 'child_process'
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
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Papa = require('papaparse')

let basePath: string | null = null

const iqaPath = path.join(__dirname, 'iqa', 'iqa.exe')
const iqaProcess = spawn(iqaPath)

iqaProcess.on('error', (err) => {
  console.error('Error starting iqa.exe:', err)
})

// Initialize app window
// =====================
function createWindow() {
  console.log('System info', { isProduction, platform, architucture })
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 676,
    height: 950,
    backgroundColor: '#000',
    webPreferences: {
      devTools: !isProduction,
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false
    },

    titleBarStyle: 'hiddenInset',
    // frame: platform === 'darwin',
    frame: true, // <= Remove this line if you wanted to implement your own title bar
    titleBarOverlay: platform === 'darwin' && { height: headerSize },
    title: 'IQA'
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
  })
  return result.filePaths
})

ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  return result.filePaths
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

function killIQAProcesses() {
  if (process.platform === 'win32') {
    exec('taskkill /F /IM iqa.exe', (error, _stdout, _stderr) => {
      if (error) {
        console.error(`Error killing IQA processes: ${error}`)
        return
      }
      console.log('All IQA processes terminated')
    })
  } else {
    exec('pkill -f iqa', (error, _stdout, _stderr) => {
      if (error) {
        console.error(`Error killing IQA processes: ${error}`)
        return
      }
      console.log('All IQA processes terminated')
    })
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    killIQAProcesses()
    app.quit()
  }
})

app.on('will-quit', () => {
  killIQAProcesses()
})

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })

  if (result.canceled) {
    return null
  } else {
    const folderPath = result.filePaths[0]
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif']
    const imageFiles: string[] = []

    try {
      const files = fs.readdirSync(folderPath)
      console.log(`Files in folder: ${files.length}`) // Debugging line

      for (const file of files) {
        const ext = path.extname(file).toLowerCase()
        if (imageExtensions.includes(ext)) {
          imageFiles.push(file)
        }
      }
      console.log(`Image files found: ${imageFiles.length}`)
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error reading directory: ${error.message}`)
      } else {
        console.error('An unknown error occurred')
      }
      return null
    }

    return { folderPath, imageCount: imageFiles.length }
  }
})

ipcMain.handle('read-csv', async (_event, csvPath) => {
  try {
    const filePath = path.resolve(csvPath)
    const fileContent = await fs.promises.readFile(filePath, 'utf8')
    console.log('File Content:', fileContent)

    // Parse CSV data to JSON without headers
    const parsedData = Papa.parse(fileContent, {
      header: false,
      dynamicTyping: true,
      skipEmptyLines: true
    })

    console.log('Parsed JSON Data:', parsedData.data)
    console.log('Parsed Errors:', parsedData.errors)

    return { success: true, data: parsedData.data }
  } catch (error) {
    console.error('Error reading CSV file:', error)

    // Type guard to check if error is an instance of Error
    if (error instanceof Error) {
      return { success: false, error: error.message }
    } else {
      return { success: false, error: 'An unknown error occurred' }
    }
  }
})

// Handle setting the base path from the renderer process
ipcMain.handle('set-base-path', (_event, csvPath) => {
  basePath = path.dirname(csvPath)
  console.log('Base path set to:', basePath)
  return { success: true, basePath }
})
