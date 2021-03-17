import DesThree from './DesThree'

let Calc
let CalcThree

const waitInterval = setInterval(() => {
  if (window.Calc) {
    clearInterval(waitInterval)
    Calc = window.Calc
    // TODO: remove references to CalcThree elsewhere in the code
    CalcThree = new DesThree(Calc)
    CalcThree.init()
    window.CalcThree = CalcThree
  }
}, 50)
