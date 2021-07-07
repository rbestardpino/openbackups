const { BrowserWindow } = require('electron')
const path = require('path')

// default window settings
const defaultOptions = {
  backgroundColor: '#272536',
  width: 1100,
  minWidth: 300,
  height: 620,
  minHeight: 200,
  center: true,
  frame: false,
  icon: path.join(__dirname, '..', 'public', 'assets', 'img', 'logo.png'),
  title: 'Open Backups',
  webPreferences: {
    contextIsolation: true,
    enableRemoteModule: true,
  },
}

function createWindow(file, options) {
  options.webPreferences = {
    ...defaultOptions.webPreferences,
    ...options.webPreferences,
  }
  win = new BrowserWindow({ ...defaultOptions, ...options })

  win.loadFile(file)

  return win
}

module.exports = createWindow
