import { Type, FunctionApplication } from './functionSupers.js'
import * as THREE from 'three'
import { MeshNormalMaterialStatic } from './meshMaterials'
import { Vector3 } from './misc'

export class Position extends FunctionApplication {
  // https://threejs.org/docs/index.html#api/en/objects/Group
  static expectedArgs () {
    return [
      { name: 'object', type: Type.OBJECT },
      { name: 'position', type: Type.VECTOR3 }
    ]
  }

  constructor (args) {
    // TODO: InstancedMesh ("Use InstancedMesh if you have to render a large number of objects with the same geometry and material but with different world transformations.")
    super(new THREE.Group())
    this.applyArgs(args)
  }

  argChanged (name, value) {
    switch (name) {
      case 'position':
        this.threeObject.position.copy(value.threeObject)
        break
      case 'object':
        // replace the current object
        this.threeObject.clear()
        // need to add to a group instead of just setting position of clone
        // in case there is an offset position of a position
        this.threeObject.add(value.threeObject.clone())
    }
  }
}
Position.type = Type.OBJECT

export class Mesh extends FunctionApplication {
  static expectedArgs () {
    return [
      { name: 'geometry', type: Type.GEOMETRY },
      { name: 'material', type: Type.MATERIAL, default: new MeshNormalMaterialStatic() },
      { name: 'position', type: Type.VECTOR3, default: new Vector3(0, 0, 0) }
    ]
  }

  constructor (args) {
    super(new THREE.Mesh())
    this.threeObject.castShadow = true
    this.threeObject.receiveShadow = true
    this.applyArgs(args)
  }

  argChanged (name, value) {
    switch (name) {
      case 'geometry':
        this.threeObject.geometry = value.threeObject
        break
      case 'material':
        this.threeObject.material = value.threeObject
        break
      case 'position':
        this.threeObject.position.copy(value.threeObject)
        break
    }
  }
}
Mesh.type = Type.OBJECT
