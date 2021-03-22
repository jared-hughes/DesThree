import { Type, ConstructorPassthrough } from './functionSupers.js'
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
