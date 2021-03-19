export default class MVCPart {
  constructor (calc3) {
    this.calc3 = calc3
  }

  get model () {
    return this.calc3.model
  }

  get view () {
    return this.calc3.view
  }

  get controller () {
    return this.calc3.controller
  }

  get calc () {
    return this.calc3.calc
  }
}
