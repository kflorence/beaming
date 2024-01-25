const doorbellOptions = window.doorbellOptions = {
  appKey: "o1smdnJiyxObjMcY0jSTf08TIhA814yLq68rEwTDWTavma7dtIVKEdwzMePE2LHC",
  container: document.getElementById('feedback-container'),
  hideButton: true,
  properties: {}
}

const script = document.createElement('script')
script.setAttribute(
  'src',
  'https://embed.doorbell.io/button/14129/1705777677/init?native_json=1&needs_postmessage=0'
)
document.head.append(script)

document.addEventListener('puzzle-updated', (event) => {
  doorbellOptions.properties.puzzleId = event.detail.state.getId()
})
