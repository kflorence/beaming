import { Storage } from '../storage.js'
import { confirm } from '../dialog.js'

const $profiles = document.getElementById('settings-profile')
const $name = document.getElementById('settings-profile-name')

function add (profile) {
  const selected = Storage.Profile.get() ?? Storage.Profiles.Default

  const li = document.createElement('li')
  li.classList.add('profile')
  li.classList.toggle('selected', profile.id === selected.id)
  li.dataset.id = profile.id

  const left = document.createElement('div')
  left.classList.add('flex-left')
  left.textContent = profile.name
  li.append(left)

  if (profile.id !== Storage.Profiles.Default.id) {
    const right = document.createElement('div')
    right.classList.add('flex-right')

    const span = document.createElement('span')
    span.classList.add('remove')
    span.title = 'Remove Profile'
    right.append(span)

    const icon = document.createElement('i')
    icon.classList.add('ph-bold', 'ph-trash')
    span.append(icon)

    li.append(right)
  }

  $profiles.append(li)
}

document.getElementById('settings-profile-create').addEventListener('click', () => {
  if (!$name.value.length) {
    return
  }

  const profile = Storage.Profiles.add($name.value)
  Storage.Profiles.set(profile.id)

  $profiles.querySelector('.selected').classList.remove('selected')
  add(profile)

  $name.value = ''
})

$profiles.addEventListener('click', (event) => {
  const $profile = event.target.closest('.profile')
  const $remove = event.target.closest('.remove')
  const id = $profile?.dataset.id
  if ($remove) {
    confirm('Are you sure you want to remove this profile? This cannot be undone.', () => {
      Storage.Profiles.remove(id)
      $profile.remove()
      if ($profile.classList.contains('selected')) {
        // If the removed profile was selected, select the last profile that was created
        const $selected = $profiles.querySelector('li:last-child')
        $selected.classList.add('selected')
        Storage.Profiles.set($selected.dataset.id)
      }
    })
  } else {
    if (!$profile || $profile.classList.contains('selected')) {
      return
    }

    $profiles.querySelector('.selected').classList.toggle('selected')
    Storage.Profiles.set(id)
    $profile.classList.add('selected')
  }
})

const profiles = [Storage.Profiles.Default].concat(Storage.Profiles.get())
profiles.forEach((profile) => add(profile))
