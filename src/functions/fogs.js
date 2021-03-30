import { Type, FunctionApplication } from './functionSupers.js'
import * as THREE from 'three'

class Fog extends FunctionApplication {
  constructor (args, threeObject) {
    // aspect ratio is set as 1 temporarily
    super(threeObject)
    this.args = args
  }

  init (calc3) {
    this.calc3 = calc3
    this.applyArgs(this.args)
    this.calc3.model.scene.fog = this.threeObject
  }

  hide () {
    this.calc3.model.scene.fog = null
  }
}
Fog.type = Type.NULL
Fog.affectsScene = true

export class LinearFog extends Fog {
  static expectedArgs () {
    return [
      { name: 'near', type: Type.NUM },
      { name: 'far', type: Type.NUM },
      { name: 'color', type: Type.COLOR }
    ]
  }

  constructor (args) {
    super(args, new THREE.Fog())
  }

  argChanged (name, value) {
    switch (name) {
      case 'near':
        this.threeObject.near = value
        break
      case 'far':
        this.threeObject.far = value
        break
      case 'color':
        this.threeObject.color = value.threeObject
        break
    }
  }
}

export class FogExp2 extends Fog {
  static expectedArgs () {
    return [
      { name: 'density', type: Type.NUM },
      { name: 'color', type: Type.COLOR }
    ]
  }

  constructor (args) {
    super(args, new THREE.FogExp2())
  }

  argChanged (name, value) {
    switch (name) {
      case 'density':
        this.threeObject.density = value
        break
      case 'color':
        this.threeObject.color = value.threeObject
        break
    }
  }
}
