import { Type, FunctionApplication } from './functionSupers.js'
import * as THREE from 'three'
import { ZeroVector3 } from './misc'

class Camera extends FunctionApplication {

}
Camera.type = Type.CAMERA

export class PerspectiveCamera extends Camera {
  static expectedArgs () {
    return [
      { name: 'position', type: Type.VECTOR3 },
      { name: 'lookAt', type: Type.VECTOR3, default: new ZeroVector3() },
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

  init (calculatorThree) {
    this.calculatorThree = calculatorThree
    this.lookAt = new THREE.Vector3(0, 0, 0)
    this.applyArgs(this.args)
    calculatorThree.camera = this.threeObject
    calculatorThree.applyGraphpaperBounds()
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
    this.calculatorThree.camera.updateProjectionMatrix()
    // this.controls.update()
    this.calculatorThree.rerender()
    // camera = this.threeObject
  }

  dispose () {
    this.calculatorThree.initDefaultCamera()
  }
}
