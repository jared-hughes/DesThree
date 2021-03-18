import expects from './tests'

const paramIndex = (new URL(document.location)).searchParams.get('testDesThree')

if (paramIndex !== null) {
  const interval = setInterval(() => {
    if (document.querySelector('.save-button')) {
      init()
      clearInterval(interval)
    }
  }, 100)
}

function init () {
  let currentIndex = -1
  let testIndex = 0
  console.log('Testing mode enabled')

  const saveButton = document.querySelector('.save-button')

  const prevButton = saveButton.cloneNode(true)
  prevButton.firstChild.innerHTML = 'Prev Graph'
  prevButton.addEventListener('click', () => { setState(currentIndex - 1); setTestIndex(0) })
  saveButton.after(prevButton)

  const passButton = prevButton.cloneNode(true)
  passButton.firstChild.innerHTML = 'Pass'
  passButton.addEventListener('click', pass)
  prevButton.after(passButton)

  passButton.firstChild.classList.add('dcg-btn-green')
  passButton.firstChild.classList.remove('disabled-save-btn')

  const title = document.querySelector('.dcg-variable-title')
  title.style.maxWidth = '600px'
  saveButton.style.display = 'none'

  const buttonContainer = document.querySelector('.save-btn-container')
  buttonContainer.after(title)
  buttonContainer.style.position = 'relative'
  buttonContainer.style.top = '-18px'

  document.querySelector('.align-center-container').style.display = 'none'

  const url = new URL(window.document.location)

  setState(parseInt(paramIndex))
  setTestIndex(0)

  function setState (index) {
    index = Math.min(index, expects.length - 1)
    index = Math.max(index, 0)
    currentIndex = index
    console.log(`Switching to test graph #${index}`)
    if (index === 0) {
      prevButton.firstChild.classList.remove('dcg-btn-green')
      prevButton.firstChild.classList.add('disabled-save-btn')
    } else {
      prevButton.firstChild.classList.add('dcg-btn-green')
      prevButton.firstChild.classList.remove('disabled-save-btn')
    }
    url.searchParams.set('testDesThree', index)
    const title = `DesThree test #${index}`
    window.history.pushState({}, title, url.href)
    document.title = title
    window.Calc.setState(expects[index].state)
  }

  function setTestIndex (index) {
    if (index >= expects[currentIndex].expects.length && index > 0) {
      if (currentIndex + 1 < expects.length) {
        setState(currentIndex + 1)
        setTestIndex(0)
      }
      return
    }
    testIndex = index
    console.log(expects[currentIndex].expects[testIndex])
    title.innerHTML = (`Test #${currentIndex}.${testIndex}: "${expects[currentIndex].name}"`)
  }

  function pass () {
    console.log(`✓ Pass #${currentIndex}.${testIndex}`)
    setTestIndex(testIndex + 1)
  }
}
