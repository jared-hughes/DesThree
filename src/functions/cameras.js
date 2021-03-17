import { Type, FunctionApplication } from './functionSupers.js'
import * as THREE from 'three';

class Camera extends FunctionApplication {

}
Camera.type = Type.CAMERA

export class PerspectiveCamera extends Camera {
  static expectedArgs() {
    return [
      {name: 'position', type: Type.VECTOR3},
      {name: 'lookAt', type: Type.VECTOR3, default: new ZeroVector3()},
      {name: 'fov', type: Type.NUM, default: 75},
      {name: 'near', type: Type.NUM, default: 0.1},
      {name: 'far', type: Type.NUM, default: 1000},
    ]
  }

  constructor(args) {
    super(new THREE.PerspectiveCamera(args.fov, CalcThree.camera.aspect, args.near, args.far))
    this.lookAt = new THREE.Vector3(0, 0, 0)
    this.applyArgs(args)
    CalcThree.camera = this.threeObject
    CalcThree.applyGraphpaperBounds()
  }

  argChanged(name, value) {
    switch (name) {
      case 'position':
        this.threeObject.position.copy(value.threeObject)
        break
      case 'lookAt':
        this.lookAt.copy(value.threeObject)
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
    CalcThree.camera.updateProjectionMatrix();
    // this.controls.update()
    CalcThree.rerender()
    // camera = this.threeObject
  }

  dispose() {
    CalcThree.initDefaultCamera()
  }
}
