import { Type, FunctionApplication } from './functionSupers.js'
import * as THREE from 'three'
import { Vector, Color } from './misc'

class Light extends FunctionApplication {

}
Light.type = Type.OBJECT

class PositionedLight extends FunctionApplication {
  static expectedArgs () {
    return [
      { name: 'intensity', type: Type.NUM, default: 1 },
      { name: 'color', type: Type.COLOR, default: new Color(255, 255, 255) },
      { name: 'position', type: Type.VECTOR3, default: new Vector(0, 0, 0) }
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

export class PointLight extends PositionedLight {
  constructor (args) {
    super(args, THREE.PointLight)
  }
}

export class AmbientLight extends PositionedLight {
  constructor (args) {
    super(args, THREE.AmbientLight)
  }
}

export class DirectionalLight extends Light {
  // careful, shadows cannot be produced easily and cheaply
  static expectedArgs () {
    return [
      { name: 'intensity', type: Type.NUM, default: 1 },
      { name: 'color', type: Type.COLOR, default: new Color(255, 255, 255) },
      { name: 'direction', type: Type.VECTOR3, default: new Vector(0, -1, 0) }
    ]
  }

  constructor (args) {
    super(new THREE.DirectionalLight())
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
      case 'direction':
        // direction points from position to (0, 0, 0) [default]
        // so position should be the negative vector of direction
        this.threeObject.position.copy(value.threeObject.clone().multiplyScalar(-1))
        break
    }
  }
}
