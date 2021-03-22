import { Type, ConstructorPassthrough, FunctionApplication } from './functionSupers.js'
import * as THREE from 'three'
import { Color } from './misc'

class PassthroughHelper extends ConstructorPassthrough {

}
PassthroughHelper.type = Type.OBJECT

export class GridHelper extends PassthroughHelper {
  static _expectedArgs () {
    return [
      { name: 'size', type: Type.NUM },
      { name: 'divisions', type: Type.NUM, default: 10 },
      { name: 'colorCenterLine', type: Type.COLOR, default: new Color(255, 255, 255) },
      { name: 'colorGrid', type: Type.COLOR, default: new Color(160, 160, 160) }
    ]
  }

  constructor (args) {
    super(args, THREE.GridHelper)
  }
}

export class PolarGridHelper extends PassthroughHelper {
  static _expectedArgs () {
    return [
      { name: 'radius', type: Type.NUM },
      { name: 'radials', type: Type.NUM, default: 16 },
      { name: 'circles', type: Type.NUM, default: 6 },
      { name: 'divisions', type: Type.NUM, default: 64 },
      { name: 'color1', type: Type.COLOR, default: new Color(255, 255, 255) },
      { name: 'color2', type: Type.COLOR, default: new Color(255, 255, 255) }
    ]
  }

  constructor (args) {
    super(args, THREE.PolarGridHelper)
  }
}

export class ArrowHelper extends FunctionApplication {
  static expectedArgs () {
    return [
      { name: 'origin', type: Type.VECTOR3 },
      { name: 'vector', type: Type.VECTOR3 },
      { name: 'color', type: Type.COLOR, default: new Color(255, 255, 255) },
      { name: 'headLengthScale', type: Type.NUM, default: 0.2 },
      { name: 'headWidthScale', type: Type.NUM, default: 0.4 }
    ]
  }

  constructor (args) {
    super(new THREE.ArrowHelper())
    this.applyArgs(args)
  }

  argChanged (name, value) {
    switch (name) {
      case 'origin':
        this.threeObject.position.copy(value.threeObject)
        break
      case 'vector':
        this.length = value.threeObject.length()
        this.threeObject.setLength(this.length)
        this.threeObject.setDirection(value.threeObject.clone().normalize())
        break
      case 'color':
        this.threeObject.setColor(value.threeObject)
        break
      case 'headLengthScale':
        this.headLengthScale = value
        this.threeObject.setLength(this.length, this.length * this.headLengthScale)
        break
      case 'headWidthScale':
        this.headWidthScale = value
        this.threeObject.setLength(
          this.length,
          this.length * this.headLengthScale,
          this.length * this.headLengthScale * this.headWidthScale
        )
        break
    }
  }
}
ArrowHelper.type = Type.OBJECT

export class AxesHelper extends PassthroughHelper {
  static _expectedArgs () {
    return [
      { name: 'size', type: Type.NUM, default: 1 }
    ]
  }

  constructor (args) {
    super(args, THREE.AxesHelper)
  }
}
