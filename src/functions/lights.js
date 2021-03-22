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
      case 'intensity':
        this.threeObject.intensity = value
        break
      case 'color':
        this.threeObject.color = value.threeObject
        break
      case 'direction':
        // direction points from position to (0, 0, 0) [default]
        // so position should be the negative vector of direction
        this.threeObject.position.copy(value.threeObject.clone().multiplyScalar(-1))
        break
    }
  }
}

export class SpotLight extends Light {
  // careful, target behaves weirdly
  static expectedArgs () {
    return [
      { name: 'intensity', type: Type.NUM, default: 1 },
      { name: 'position', type: Type.VECTOR3 },
      { name: 'target', type: Type.VECTOR3, default: new Vector(0, 0, 0) },
      { name: 'color', type: Type.COLOR, default: new Color(255, 255, 255) },
      { name: 'angle', type: Type.NUM, default: Math.PI / 3 },
      { name: 'penumbra', type: Type.NUM, default: 0 },
      { name: 'distanceLimit', type: Type.NUM, default: 0 },
      { name: 'decay', type: Type.NUM, default: 1 }
    ]
  }

  constructor (args) {
    super(new THREE.SpotLight())
    this.applyArgs(args)
  }

  init (calc3) {
    this.calc3 = calc3
    this.calc3.model.scene.add(this.threeObject.target)
  }

  argChanged (name, value) {
    switch (name) {
      case 'intensity':
        this.threeObject.intensity = value
        break
      case 'position':
        this.threeObject.position.copy(value.threeObject)
        break
      case 'target':
        this.threeObject.target.position.copy(value.threeObject)
        break
      case 'color':
        this.threeObject.color = value.threeObject
        break
      case 'angle':
        this.threeObject.angle = value
        break
      case 'penumbra':
        this.threeObject.penumbra = value
        break
      case 'distanceLimit':
        this.threeObject.distance = value
        break
      case 'decay':
        this.threeObject.decay = value
        break
    }
  }

  dispose () {
    this.calc3.model.scene.remove(this.threeObject.target)
  }
}
