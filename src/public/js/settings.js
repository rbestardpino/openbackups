document.addEventListener('DOMContentLoaded', function () {
  let html = ''
  const schema = api.store.cfg.schema
  for (const key in schema) {
    html += getSettingsFormHTML(key, schema[key])
  }
  document.getElementById('settings-modal-form').innerHTML = html
})

function getSettingsFormHTML(key, schema) {
  const value = api.store.cfg.get(key)
  let html = `Unable to build HTML for type "${schema.type}" for setting "${key}"`
  if (schema.type === 'boolean') {
    html = `<form> <label> <input id="${key}" type="checkbox" class="filled-in" ${
      value ? 'checked' : ''
    } onchange="updateSetting(this.id, this.checked)" /> <span >${
      schema.description
    }</span > </label> </form>`
  }
  if (schema.type === 'number') {
    html = `<p>${schema.description}</p> <form> <div class="input-field"> <input id="${key}" value="${value}" type="number" onchange="updateSetting(this.id, this.value)" /> </div> </form>`
  }
  if (schema.type === 'path') {
    html = `<p>${schema.description}</p> <form> <div class="input-field"> <input id="${key}" value="${value}" type="text" onchange="updateSetting(this.id, this.value)" /> </div> </form>`
  }
  return `<div class="row"><p><strong>${schema.scope}: ${schema.title}</strong></p>${html}</div><div class="container divider"></div>`
}

function updateSetting(key, value) {
  // TODO: add validation for inputs, if path: must be valid path.. etc.
  api.events.send('update-cfg', { key: key, value: value })
}

function searchSettings(query) {
  const q = query.toLowerCase()
  let html = ''
  const schema = api.store.cfg.schema
  for (const key in schema) {
    if (
      schema[key].title.toLowerCase().includes(q) ||
      schema[key].scope.toLowerCase().includes(q) ||
      key.toLowerCase().includes(q) ||
      schema[key].description.toLowerCase().includes(q) ||
      schema[key].type.toLowerCase().includes(q)
    )
      html += getSettingsFormHTML(key, schema[key])
  }
  document.getElementById('settings-modal-form').innerHTML = html
}
