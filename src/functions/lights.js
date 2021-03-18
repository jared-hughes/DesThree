import { Type, FunctionApplication } from './functionSupers.js'
import * as THREE from 'three'
import { ZeroVector3, White } from './misc'

class Light extends FunctionApplication {
  static expectedArgs () {
    return [
      { name: 'intensity', type: Type.NUM, default: 1 },
      { name: 'color', type: Type.COLOR, default: new White() },
      { name: 'position', type: Type.VECTOR3, default: new ZeroVector3() }
      // TODO: additional args (distance, decay)
      // https://threejs.org/docs/index.html#api/en/lights/PointLight
    ]
  }

  constructor (args, ThreeObject) {
    super(new ThreeObject())
    this.applyArgs(args)
  }

  argChanged (name, value) {
    switch (name) {
      case 'color':
        this.threeObject.color = value.threeObject
        break
      case 'intensity':
        this.threeObject.intensity = value
        break
      case 'position':
        this.threeObject.position.copy(value.threeObject)
        break
    }
  }
}
Light.type = Type.OBJECT

export class PointLight extends Light {
  constructor (args) {
    super(args, THREE.PointLight)
  }
}

export class AmbientLight extends Light {
  constructor (args) {
    super(args, THREE.AmbientLight)
  }
}
