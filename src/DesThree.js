import Controller from './Controller'
import Model from './Model'
import View from './View'

export default class DesThree {
  constructor (calculator) {
    this.model = new Model(this)
    this.view = new View(this)
    this.controller = new Controller(this)
    this.calc = calculator
  }

  init () {
    this.model.init()
    this.view.init()
    this.controller.init()
  }
}
