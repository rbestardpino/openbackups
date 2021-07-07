const cron = require('node-cron')
const path = require('path')
const fs = require('fs')
const backupStore = require('./store/backup')
const { zip, COMPRESSION_LEVEL } = require('zip-a-folder')
const { performance } = require('perf_hooks')

let tasks = {}

function schedule(bkp) {
  tasks[bkp.name] = cron.schedule(bkp.cron, () => {
    doTask(bkp)
  })
}

function stop(bkp) {
  tasks[bkp.name].stop()
  delete tasks[bkp.name]
}

function doTask(bkp) {
  const start = performance.now()

  const p = path.join(bkp.bkpDir, 'last')
  if (!fs.existsSync(p))
    fs.mkdirSync(p, {
      recursive: true,
    })

  checkNumberOfBkps(bkp)
  makeBkp(bkp)

  const end = performance.now()
  const time = (end - start) / 1000
  bkp.time = time

  backupStore.update(bkp)

  const showNotification = require('../main')
  showNotification(bkp)
}

function checkNumberOfBkps(bkp) {
  fs.readdir(bkp.bkpDir, (err, files) => {
    if (err) throw err

    files = files.filter((file) => file.endsWith('.zip')).sort()

    const surplus = files.length - bkp.maxStoredBkps + 1
    if (surplus <= 0) return

    const extraFiles = files.splice(0, surplus)

    for (const file of extraFiles) {
      fs.unlink(path.join(bkp.bkpDir, file), (err) => {
        if (err) throw err
      })
    }
  })
}

function makeBkp(bkp) {
  const lastdir = path.join(bkp.bkpDir, 'last')
  fs.readdir(lastdir, (err, files) => {
    if (err) throw err

    files
      .filter((file) => file.endsWith('.zip'))
      .sort()
      .pop()

    for (const file of files) {
      fs.unlink(path.join(lastdir, file), (err) => {
        if (err) throw err
      })
    }
  })

  const filename = `${bkp.name}-${getDate()}.zip`
  const outfile = path.join(bkp.bkpDir, filename)
  zip(bkp.dir, outfile, COMPRESSION_LEVEL.high).then(() => {
    fs.copyFile(outfile, path.join(lastdir, filename), (err) => {
      if (err) throw err
    })
  })
  bkp.lastExec = new Date()
}

function getDate() {
  const date = new Date()

  const yyyy = date.getFullYear()
  const mm = `0${date.getMonth()}`.slice(-2)
  const dd = `0${date.getDate()}`.slice(-2)
  const hh = `0${
    date.toLocaleString().split(' ')[2] === 'AM'
      ? date.getHours() + 12
      : date.getHours()
  }`.slice(-2)
  const MM = `0${date.getMinutes()}`.slice(-2)
  const ss = `0${date.getSeconds()}`.slice(-2)

  return `${yyyy}-${mm}-${dd}-${hh}-${MM}-${ss}`
}

module.exports = { schedule, stop, doTask }
