const { app, Tray, Menu, ipcMain, Notification } = require('electron')
const AutoLaunch = require('auto-launch')
const path = require('path')
const createWindow = require('./utils/window')
const backupStore = require('./utils/store/backup')
const configStore = require('./utils/store/config')
const tasks = require('./utils/tasks')
const { autoUpdater } = require('electron-updater')

const dev = !app.isPackaged

let top = {}

const lock = app.requestSingleInstanceLock()
if (!lock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (top.win) {
      if (top.win.isMinimized()) top.win.restore()
      top.win.focus()
      top.win.show()
    }
  })

  app.once('ready', (ev) => {
    if (process.platform === 'win32') app.setAppUserModelId('Open Backups')
    enableAutoLaunch()
    initializeWindow()
    initializeTray()
    initializeStores()
    initializeTasks()
  })
}

app.on('before-quit', (ev) => {
  top.win.removeAllListeners('close')
  top = null
})

// Prevents users to navigate the internet freely
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (ev) => {
    ev.preventDefault()
  })
})

//Handle IPC (& others) events vv
ipcMain.on('add-bkp', (_, bkp) => {
  if (!bkp.bkpDir) bkp.bkpDir = path.join(configStore.get('bkpDir'), bkp.name)

  if (!bkp.maxStoredBkps) bkp.maxStoredBkps = configStore.get('maxStoredBkps')

  backupStore.add(bkp)

  top.win.send('updated-bkps', backupStore.getAll())

  tasks.schedule(bkp)
})

ipcMain.on('delete-bkp', (_, name) => {
  const bkp = backupStore.get(name)
  backupStore.delete(name)
  tasks.stop(bkp)
})

ipcMain.on('update-cfg', (_, { key, value }) => {
  configStore.set(key, value)
})

ipcMain.on('update', () => {
  autoUpdater.quitAndInstall()
})

autoUpdater.on('update-downloaded', (args) => {
  top.win.send('update-downloaded', args)
})
//Handle IPC (& others) events ^^

// Initializers vv
function enableAutoLaunch() {
  const autoLaunch = new AutoLaunch({
    name: 'Open Backups',
    path: app.getPath('exe'),
    isHidden: true, // TODO: find a workaround to this
  })

  const runOnStartUp = configStore.get('runOnStartUp')

  autoLaunch.isEnabled().then((isEnabled) => {
    if (!isEnabled && runOnStartUp) autoLaunch.enable()
    if (isEnabled && !runOnStartUp) autoLaunch.disable()
  })
}

function initializeWindow() {
  top.win = createWindow(path.join(__dirname, 'public', 'index.html'), {
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      devTools: dev,
    },
  })

  top.win.once('ready-to-show', () => {
    win.show()
    autoUpdater.checkForUpdatesAndNotify()
  })

  top.win.on('close', (ev) => {
    ev.sender.hide()
    ev.preventDefault()
  })
}

function initializeTray() {
  top.tray = new Tray(
    path.join(__dirname, 'public', 'assets', 'img', 'icon.png')
  )

  top.tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'Open Backups',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Open',
        click: () => {
          top.win.show()
        },
      },
      { type: 'separator' },
      {
        label: 'Force Quit',
        click: () => {
          app.quit()
        },
      },
    ])
  )
  top.tray.setToolTip('Open Backups')
  top.tray.on('click', () => {
    top.win.show()
  })
}

function initializeStores() {
  backupStore.init()
  const config = require('./config')
  configStore.init(config)
}

function initializeTasks() {
  //TODO: make execOnAppStart setting actually matter

  const bkps = backupStore.getAll()
  for (const bkp of bkps) {
    tasks.schedule(bkp)
  }
}
// Initializers ^^

function showNotification(bkp) {
  if (!configStore.get('showNotification')) return

  const notif = new Notification({
    title: `Backup '${bkp.name}' made succesfully`,
    body: `Time taken: ${bkp.time} seconds`,
    icon: path.join(__dirname, 'public', 'assets', 'img', 'icon.png'),
  })
  notif.show()

  notif.on('click', () => {
    top.win.show()
  })
}

module.exports = showNotification
