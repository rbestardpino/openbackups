let sortable

function searchBkp(query) {
  let bkps = api.store.bkps.getAll()

  if (query !== '') bkps = bkps.filter((bkp) => bkp.name.includes(query))

  updateBkpsDiv(bkps)
  //TODO: it changes the order of elements when searching if order had been changed
}

api.events.receive('update-downloaded', (args) => {
  console.log(args)
})

document.addEventListener('DOMContentLoaded', function () {
  // MATERIALIZE
  M.Sidenav.init(document.querySelectorAll('.sidenav'))
  M.Datepicker.init(document.querySelectorAll('.datepicker'), {
    container: 'body',
  })
  M.Timepicker.init(document.querySelectorAll('.timepicker'), {
    container: 'body',
  })
  M.Modal.init(document.querySelectorAll('.modal'))
  M.FloatingActionButton.init(document.querySelectorAll('.fixed-action-btn'), {
    hoverEnabled: false,
    direction: 'top',
  })
  M.Tooltip.init(document.querySelectorAll('.tooltipped'))
  M.TapTarget.init(document.querySelectorAll('.tap-target'))

  //SORTABLE
  // TODO: custom order need to stay when restarting the app
  sortable = new Sortable(document.getElementById('bkps'), {
    handle: '.handle',
    animation: 600, // TODO: Make this a setting, new scope: preferences
  })

  // APP ATTRIBUTES AND OTHERS
  document.getElementById('app-version').innerText = api.app.version
  document.getElementById('app-location').innerText = api.app.path
  document.getElementById('locale').innerText = api.app.locale
  document.getElementById('sidenav-logo').src = api.app.icon
  document.getElementById('user-data-location').innerText = api.app.userDataPath

  // OPEN URLS ON OS BROWSER
  Array.from(document.getElementsByClassName('external-url')).forEach(
    (elem) => {
      elem.addEventListener('click', () => api.misc.openExternal(elem.href))
    }
  )

  // OPEN FIRST TIME MODAL
  if (api.app.firstTime)
    M.Modal.getInstance(document.getElementById('welcome-modal')).open()

  const bkps = api.store.bkps.getAll()
  if (bkps.length === 0)
    document.getElementById('add-bkp-fab').classList.add('pulse')
  updateBkpsDiv(bkps)
})

api.events.receive('updated-bkps', (bkps) => updateBkpsDiv(bkps))

function updateBkpsDiv(bkps) {
  let html = ''
  for (const bkp of bkps) {
    html += createBkpHTML(bkp)
  }
  document.getElementById('bkps').innerHTML = html
}

function submitForm(advanced) {
  if (advanced) {
    if (!satisfyRequiredInputs(['name', 'cron', 'dir'])) return

    const inputs = getInputs(['name', 'cron', 'description', 'dir'])

    if (existsBkp(inputs.name) || !isValidCron(inputs.cron)) return

    M.toast({
      html: 'Backup configuration created succesfully',
      classes: 'toast-success',
    })

    M.Modal.getInstance(
      document.getElementById('add-advanced-bkp-modal')
    ).close()

    document.getElementById('add-advanced-bkp-form').reset()

    api.events.send('add-bkp', inputs)
  }
}

function getInputs(inputs) {
  let formData = {}
  for (const input of inputs) {
    if (input === 'dir') {
      formData[input] = document.getElementById(`${input}-label`).value
      continue
    }
    formData[input] = document.getElementById(input).value
  }
  return formData
}

let currentStep = 1
let input = {}

function formStepControl(displacement) {
  if (displacement > 0) {
    if (!checkRequiredFields()) return
    storeInputs()
  }

  currentStep += displacement

  updateFormHTML()

  console.log(input)
}

function checkRequiredFields(advanced) {
  if (advanced) {
    return
  }

  if (currentStep === 1) {
    if (!document.getElementById('name').value) {
      document.querySelector('label[for="name"]').classList.add('red-text')
      M.toast({
        html: 'The name is required',
        completeCallback: () => {
          document
            .querySelector('label[for="name"]')
            ?.classList.remove('red-text')
        },
        classes: 'toast-error',
      })
      return false
    }
  }
  return true
}

function satisfyRequiredInputs(inputs) {
  let satisfy = true
  for (const input of inputs) {
    if (!document.getElementById(input).value) {
      let missingInput = input
      let elem = document.querySelector(`label[for="${input}"]`)
      if (input === 'dir') {
        elem = document.getElementById(`${input}-label`)

        missingInput = 'folder to backup'
      }
      elem.classList.add('red-text')
      M.toast({
        html: `The ${missingInput} is required`,
        completeCallback: () => {
          elem?.classList.remove('red-text')
        },
        classes: 'toast-error',
      })
      satisfy = false
    } else {
      if (input === 'name') {
        const value = document.getElementById(input).value
        if (value.includes('/') || value.includes('\\')) {
          const elem = document.querySelector(`label[for="${input}"]`)
          elem.classList.add('red-text')
          M.toast({
            html: `The name cannot contain slashes ('/', '\\')`,
            completeCallback: () => {
              elem?.classList.remove('red-text')
            },
            classes: 'toast-error',
          })
          satisfy = false
        }
      }
    }
  }
  return satisfy
}

function existsBkp(name) {
  if (!api.store.bkps.exists(name)) return false

  const elem = document.getElementById('name')
  elem.classList.add('red-text')
  M.toast({
    html: `A backup configuration named '${name}' already exists`,
    completeCallback: () => {
      elem?.classList.remove('red-text')
    },
    classes: 'toast-error',
  })

  return true
}

function isValidCron(cron) {
  if (api.cron.validate(cron)) return true

  const elem = document.querySelector('label[for="cron"]')
  elem.classList.add('red-text')
  M.toast({
    html: 'The cron expression is not valid',
    completeCallback: () => {
      elem?.classList.remove('red-text')
    },
    classes: 'toast-error',
  })
  return false
}

function storeInputs() {
  if (currentStep === 1) {
    input.name = document.getElementById('name').value
    input.description = document.getElementById('description').value
    const rbs = Array.from(
      document.querySelectorAll('input[name="recurrency"]')
    )
    input.recurrency = rbs.filter((rb) => rb.checked)[0].value
    return
  }
}

function updateFormHTML() {
  if (currentStep === 1)
    document
      .getElementById('add-bkp-form-previous-step')
      .classList.add('disabled')
  else
    document
      .getElementById('add-bkp-form-previous-step')
      .classList.remove('disabled')

  document.getElementById('add-bkp-step-desc').innerText = form[currentStep].p

  document.getElementById('add-bkp-form').innerHTML = form[currentStep].form
}

function next() {
  formStepControl(1)
}
function prev() {
  formStepControl(-1)
}

const form = {
  1: {
    p: "Name and description, they can be whatever you want. It's just so you can easily recognize it",
    form: '<div class="row"> <div class="input-field col s12"> <i class="material-icons prefix">info</i> <input id="name" type="text" /> <label for="name">Name</label> </div> </div> <div class="row"> <div class="input-field col s12"> <i class="material-icons prefix">description</i> <textarea id="description" class="materialize-textarea" ></textarea> <label for="description">Description</label> </div> </div> <div class="row"> <p>Recurrency:</p> <label class="col s6 m3 l3"> <input name="recurrency" value="h" type="radio" /> <span>Hourly</span> </label> <label class="col s6 m3 l3"> <input name="recurrency" value="d" type="radio" checked /> <span>Daily</span> </label> <label class="col s6 m3 l3"> <input name="recurrency" value="w" type="radio" /> <span>Weekly</span> </label> <label class="col s6 m3 l3"> <input name="recurrency" value="m" type="radio" /> <span>Monthly</span> </label> </div>',
  },
  2: {
    p: 'test',
    form: 'test',
  },
}

function deleteBkp(name) {
  //TODO: add confirmation modal on delete bkp and ask if delete files or not
  api.events.send('delete-bkp', name)

  M.toast({
    html: `Backup configuration named '${name}' deleted correctly`,
    classes: 'toast-success',
  })

  const elem = document.getElementById(`bkp-${name}`)

  const order = sortable.toArray()
  order.push(order.splice(order.indexOf(elem.getAttribute('data-id')), 1)[0])
  sortable.sort(order, true)

  elem.remove()
}

function createBkpHTML(bkp) {
  return `<div class="col s12 m6 l4" id="bkp-${bkp.name}" data-id="bkp-${
    bkp.name
  }"> <div class="card blue-grey darken-3 hoverable"> <div class="card-stacked"> <a href="#!"><i class="material-icons right handle">drag_handle</i></a> <div class="card-content"> <div class="card-title">${
    bkp.name
  }</div> <div class="valign-wrapper"> <i class="material-icons">info_outline</i> <p class="truncate"> &nbsp; ${
    bkp.description || 'No description provided'
  } </p> </div> <div class="valign-wrapper"> <i class="material-icons">timer</i> <p class="truncate">&nbsp; ${
    bkp.cron
  }</p> </div> <div class="valign-wrapper"> <i class="material-icons">folder_open</i> <p class="truncate">&nbsp; ${
    bkp.dir
  }</p> </div> </div> </div> <div class="card-action blue-grey darken-4"> <a href="#!" onclick="deleteBkp('${
    bkp.name
  }')"> <i class="material-icons small">delete</i> </a> <a href="#!"> <i class="material-icons small right activator">expand_less</i> </a> </div> <div class="card-reveal blue-grey darken-4"> <span class="card-title" >${
    bkp.name
  }<i class="material-icons right">close</i></span > <div class="valign-wrapper"> <p> ${
    bkp.description
  } </p> </div> <div class="valign-wrapper"> <i class="material-icons">timer</i> <p class="truncate">&nbsp; ${
    bkp.cron
  }</p> </div> <div class="valign-wrapper"> <i class="material-icons">folder_open</i> <p class="truncate">&nbsp; ${
    bkp.dir
  }</p> </div> </div> </div> </div>`
}
