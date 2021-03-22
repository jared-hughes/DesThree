import { Type, FunctionApplication } from './functionSupers.js'
import * as THREE from 'three'

class Vector extends FunctionApplication {
  constructor (x, y, z) {
    super(new THREE.Vector3(x, y, z))
  }
}
Vector.type = Type.VECTOR3

export class ZeroVector3 extends Vector {
  constructor () {
    super(0, 0, 0)
  }
}

export class Vector3 extends Vector {
  static expectedArgs () {
    return [
      { name: 'x', type: Type.NUM },
      { name: 'y', type: Type.NUM },
      { name: 'z', type: Type.NUM }
    ]
  }

  constructor (args) {
    super(args.x, args.y, args.z)
  }

  argChanged (name, value) {
    switch (name) {
      case 'x':
      case 'y':
      case 'z':
        this.threeObject[name] = value
        break
    }
  }
}

export class Color extends FunctionApplication {
  constructor (r, g, b) {
    super(new THREE.Color(clampMap255(r), clampMap255(g), clampMap255(b)))
  }
}
Color.type = Type.COLOR

function clampMap255 (x) {
  if (x < 0) return 0
  else if (x > 255) return 1
  else return x / 255
}

export class ColorRGB extends Color {
  static expectedArgs () {
    return [
      { name: 'r', type: Type.NUM },
      { name: 'g', type: Type.NUM },
      { name: 'b', type: Type.NUM }
    ]
  }

  // forced to do this while there is no observe on advancedStyling colors
  constructor (args) {
    super(...['r', 'g', 'b'].map(c => args[c]))
  }

  argChanged (name, value) {
    switch (name) {
      case 'r':
      case 'g':
      case 'b':
        this.threeObject[name] = clampMap255(value)
        break
    }
  }
}

export class Show extends FunctionApplication {
  static expectedArgs () {
    return [
      { name: 'object', type: Type.OBJECT }
    ]
  }

  constructor (args) {
    super(null)
    this.args = args
  }

  init (calc3) {
    this.calc3 = calc3
    this.applyArgs(this.args)
  }

  argChanged (name, value) {
    switch (name) {
      case 'object':
        if (this.threeObject) {
          this.calc3.model.scene.remove(this.threeObject)
        }
        this.threeObject = value.threeObject
        this.calc3.model.scene.add(this.threeObject)
        break
    }
  }

  dispose () {
    this.calc3.model.scene.remove(this.threeObject)
  }

  hide () {
    this.calc3.model.scene.remove(this.threeObject)
  }
}
Show.type = Type.NULL
Show.affectsScene = true
