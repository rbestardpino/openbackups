// GENERAL PRELOAD RULE: DO NOT write code that modifies the HTML document in preload,
// Instead expose the attribute using contextBridge.
// Example:
// BAD -> document.getElementById('foo').innerText = 'bar'
// GOOD -> contextBridge.exposeInMainWorld('api', { foo: 'bar' })

const customTitlebar = require('custom-electron-titlebar')
const { app, shell } = require('electron').remote
const { ipcRenderer, contextBridge } = require('electron')
const path = require('path')
const cron = require('node-cron')
const backupStore = require('./utils/store/backup')
const configStore = require('./utils/store/config')
const fs = require('fs')

window.addEventListener('DOMContentLoaded', () => {
  new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex('#181621'),
    shadow: true,
    menu: null,
    titleHorizontalAlignment: 'left',
  })

  //TODO: make the app multilanguage given app.getLocale()
})

contextBridge.exposeInMainWorld('api', {
  events: {
    send: (channel, data) => {
      const validChannels = ['add-bkp', 'delete-bkp', 'update-cfg']
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data)
      }
    },
    receive: (channel, func) => {
      let validChannels = ['updated-bkps', 'update-downloaded']
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args))
      }
    },
  },
  app: {
    version: app.getVersion(),
    description: null,
    path: app.getAppPath(),
    userDataPath: app.getPath('userData'),
    locale: app.getLocale(),
    icon: path.join(__dirname, 'public', 'assets', 'img', 'icon.png'),
    firstTime: firstTime(),
  },
  cron: {
    validate: (expression) => cron.validate(expression),
  },
  store: {
    // Do not expose methods with write capabilities (set, add, delete, etc.)
    // Those ones need to be handled via events
    bkps: {
      getAll() {
        return backupStore.getAll()
      },
      get(name) {
        return backupStore.get(name)
      },
      exists(name) {
        return backupStore.exists(name)
      },
    },
    cfg: {
      schema: configStore.get('schema'),
      get(key) {
        return configStore.get(key)
      },
    },
  },
  misc: {
    openExternal: (url) => shell.openExternal(url),
  },
})

function firstTime() {
  const firstTimeFilePath = path.resolve(app.getPath('userData'), '.first-time')
  let isFirstTime
  try {
    fs.closeSync(fs.openSync(firstTimeFilePath, 'wx'))
    isFirstTime = true
  } catch (e) {
    if (e.code === 'EEXIST') {
      isFirstTime = false
    } else {
      throw e
    }
  }
  return isFirstTime
}
