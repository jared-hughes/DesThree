import states from './testStates'

if (/testDesThree/.test(window.location.search)) {
  const interval = setInterval(() => {
    if (document.querySelector('.save-button')) {
      init()
      clearInterval(interval)
    }
  }, 100)
}

function init () {
  let currentIndex = -1
  console.log('Testing mode enabled')

  const saveButton = document.querySelector('.save-button')

  const prevButton = saveButton.cloneNode(true)
  prevButton.firstChild.innerHTML = 'Prev Test'
  prevButton.addEventListener('click', () => setState(currentIndex - 1))
  saveButton.after(prevButton)

  const nextButton = prevButton.cloneNode(true)
  nextButton.firstChild.innerHTML = 'Next Test'
  nextButton.addEventListener('click', () => setState(currentIndex + 1))
  prevButton.after(nextButton)

  setState(0)

  function setState (index) {
    currentIndex = index
    console.log(`Switching to test graph #${index}`)
    index = Math.min(index, states.length - 1)
    index = Math.max(index, 0)
    if (index === 0) {
      prevButton.firstChild.classList.remove('dcg-btn-green')
    } else {
      prevButton.firstChild.classList.add('dcg-btn-green')
    }
    if (index === states.length - 1) {
      nextButton.firstChild.classList.remove('dcg-btn-green')
    } else {
      nextButton.firstChild.classList.add('dcg-btn-green')
    }
    window.Calc.setState(states[index])
    document.querySelector('.dcg-variable-title').innerHTML = `Test graph #${index}`
  }
}
