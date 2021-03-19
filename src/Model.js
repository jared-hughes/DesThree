import * as THREE from 'three'
import MVCPart from 'MVCPart'

export default class Model extends MVCPart {
  constructor (calc3) {
    super(calc3)
    this.camera = null
    this.definitions = {}
    this.values = {}
    this.dependents = {}
    this.scene = new THREE.Scene()
  }

  init () {
    this.initDefaultCamera()
  }

  initDefaultCamera () {
    // default camera position
    this.camera = new THREE.PerspectiveCamera(
      75, // FOV (degrees)
      1, // aspect ratio, temp until first `applyGraphpaperBounds`
      0.1, 1000 // clipping plane
    )
    this.camera.position.x = 3
    this.camera.lookAt(0, 0, 0)
  }

  setDefinitions (nextDefinitions) {
    this.definitions = nextDefinitions
    this.view.setCanvasVisible(Object.keys(nextDefinitions).length > 0)
  }

  setThreeExprs (exprs, errors) {
    this.view.applyThreeExprs(exprs, errors)
  }

  deleteVariable (variable) {
    if (variable in this.values) {
      this.values[variable].dispose()
      delete this.values[variable]
    }
  }

  changeVariable (variable, valueFunc) {
    // pass in function instead of value itself to defer construction
    // until after deleting the variable
    this.deleteVariable(variable)
    if (valueFunc !== null) {
      const value = valueFunc()
      if (value.error) {
        console.warn(value.error)
      } else {
        this.values[variable] = value
      }
    }
    this.variableChanged(variable)
  }

  variableChanged (variable) {
    console.log('variable changed', variable);
    (this.dependents[variable] || [])
      .forEach(object => object.afterDepChanged(variable))
  }

  setBounds (bounds) {
    this.view.setBounds(bounds)
    this.camera.aspect = bounds.width / bounds.height
    this.camera.updateProjectionMatrix()
    this.rerender()
  }

  rerender () {
    this.view.rerender()
  }
}
