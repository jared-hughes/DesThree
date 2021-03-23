import { Type, FunctionApplication } from './functionSupers.js'
import * as THREE from 'three'
import { Vector3Once } from './misc'

class Camera extends FunctionApplication {

}
Camera.type = Type.NULL
Camera.affectsScene = true

export class PerspectiveCamera extends Camera {
  static expectedArgs () {
    return [
      { name: 'position', type: Type.VECTOR3 },
      { name: 'lookAt', type: Type.VECTOR3, default: new Vector3Once(0, 0, 0) },
      { name: 'fov', type: Type.NUM, default: 75 },
      { name: 'near', type: Type.NUM, default: 0.1 },
      { name: 'far', type: Type.NUM, default: 1000 }
    ]
  }

  constructor (args) {
    // aspect ratio is set as 1 temporarily
    super(new THREE.PerspectiveCamera(args.fov, 1, args.near, args.far))
    this.args = args
  }

  init (calc3) {
    this.calc3 = calc3
    this.lookAt = new THREE.Vector3(0, 0, 0)
    this.applyArgs(this.args)
    calc3.model.camera = this.threeObject
    calc3.controller.applyGraphpaperBounds()
  }

  argChanged (name, value) {
    switch (name) {
      case 'position':
        this.threeObject.position.copy(value.threeObject)
        break
      case 'lookAt':
        this.lookAt.copy(value.threeObject)
        break
      case 'fov':
        this.threeObject.fov = value
        break
      case 'near':
        this.threeObject.near = value
        break
      case 'far':
        this.threeObject.far = value
        break
    }
    this.threeObject.lookAt(this.lookAt)
    this.calc3.model.camera.updateProjectionMatrix()
  }

  dispose () {
    this.calc3.model.initDefaultCamera()
  }
}
