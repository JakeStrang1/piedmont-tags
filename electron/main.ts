import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

const PRESETS_DIRNAME = 'assets'
const PRESETS_FILENAME = 'presets.json'

const getPresetsFilePath = () => {
  if (VITE_DEV_SERVER_URL) {
    return path.join(process.env.APP_ROOT, 'src', PRESETS_DIRNAME, PRESETS_FILENAME)
  }
  const dir = path.join(app.getPath('userData'), PRESETS_DIRNAME)
  return path.join(dir, PRESETS_FILENAME)
}

const readPresetsJson = async () => {
  const filePath = getPresetsFilePath()
  await mkdir(path.dirname(filePath), { recursive: true })

  try {
    const raw = await readFile(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    if (err.code === 'ENOENT') {
      await writeFile(filePath, '[]', 'utf8')
      return []
    }
    throw error
  }
}

const writePresetsJson = async (value: unknown) => {
  if (!Array.isArray(value)) {
    throw new Error('Presets payload must be an array')
  }
  const filePath = getPresetsFilePath()
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(value, null, 2), 'utf8')
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    show: false, // Don't show until maximized
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Maximize the window before showing it
  win.maximize()
  win.show()

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)

ipcMain.removeHandler('presets:read')
ipcMain.handle('presets:read', async () => {
  return readPresetsJson()
})

ipcMain.removeHandler('presets:write')
ipcMain.handle('presets:write', async (_event, presets: unknown) => {
  await writePresetsJson(presets)
  return true
})
