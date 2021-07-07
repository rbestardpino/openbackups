const path = require('path')
const { app } = require('electron')

const config = {
  bkpDir: {
    def: path.join(app.getPath('userData'), 'backups'),
    type: 'path',
    scope: 'Backups',
    title: 'Backup Folder',
    description: 'Controls the folder where backups will be stored',
  },
  maxStoredBkps: {
    def: 10,
    type: 'number',
    scope: 'Backups',
    title: 'Max Stored Backups',
    description:
      'Controls the maximum backups that will be stored of each configuration',
  },
  execOnAppStart: {
    def: false,
    type: 'boolean',
    scope: 'Global',
    title: 'Run on Startup',
    description:
      "Execute backups on app start if they should have been executed while app wasn't running",
  },
  showNotification: {
    def: true,
    type: 'boolean',
    scope: 'Global',
    title: 'Show Notification',
    description: 'Show a notification every time a backup has been made',
  },
  runOnStartUp: {
    def: true,
    type: 'boolean',
    scope: 'Global',
    title: 'Run on Start Up',
    description: 'Run app when the computer starts',
  },
}

module.exports = config
