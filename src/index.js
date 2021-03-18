import DesThree from './DesThree'

const waitInterval = setInterval(() => {
  if (window.Calc) {
    clearInterval(waitInterval)
    const Calc = window.Calc
    const CalcThree = new DesThree(Calc)
    CalcThree.init()
    window.CalcThree = CalcThree
  }
}, 50)
