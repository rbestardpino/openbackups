const Store = require('electron-store')

const store = {
  store: new Store({
    name: 'settings',
  }),

  init(config) {
    for (const cfg in config) {
      if (!this.has(cfg)) this.set(cfg, config[cfg].def)
    }
    this.set('schema', config)
  },

  get(key) {
    return this.store.get(key)
  },

  set(key, value) {
    return this.store.set(key, value)
  },

  has(key) {
    return this.store.has(key)
  },
}

module.exports = store
