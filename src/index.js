let Calc
let THREE
let CalcThree

const waitInterval = setInterval(() => {
  if (window.Calc) {
    clearInterval(waitInterval)
    THREE = window.THREE
    Calc = window.Calc
    // TODO: remove references to CalcThree elsewhere in the code
    CalcThree = new DesThree()
    CalcThree.init()
    window.CalcThree = CalcThree
  }
}, 50)
