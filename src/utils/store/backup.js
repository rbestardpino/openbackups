const Store = require('electron-store')

const store = {
  store: new Store({
    name: 'bkps',
  }),

  init() {
    if (!this.store.has('bkps')) this.store.set('bkps', [])
  },

  getAll() {
    return this.store.get('bkps')
  },

  set(bkpList) {
    this.store.set('bkps', bkpList)
  },

  add(bkp) {
    this.set([...this.getAll(), bkp])
  },

  get(name) {
    return this.getAll().find((bkp) => bkp.name === name)
  },

  exists(name) {
    return this.getAll().some((bkp) => bkp.name === name)
  },

  delete(name) {
    this.set(this.getAll().filter((bkp) => bkp.name !== name))
  },

  update(bkp) {
    this.delete(bkp.name)
    this.add(bkp)
  },
}

module.exports = store
