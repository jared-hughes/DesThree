import { Type, FunctionApplication } from './functionSupers.js'
import * as THREE from 'three';

class Geometry extends FunctionApplication {

}
Geometry.type = Type.GEOMETRY

class PassthroughGeometry extends Geometry {
  static expectedArgs() {
    let expectedArgs = this._expectedArgs()
    expectedArgs.order = expectedArgs.order || expectedArgs.map(({name}) => name)
    return expectedArgs
  }

  constructor(args, threeConstructor) {
    super(new threeConstructor())
    this.values = {}
    this.threeConstructor = threeConstructor
    this.applyArgs(args)
  }

  argChanged(name, value) {
    this.values[name] = value
    this.threeObject.dispose()
    this.threeObject = new this.threeConstructor(
      ...this.constructor.expectedArgs().order.map(name => this.values[name])
    )
  }
}

class PolyhedronGeometry extends PassthroughGeometry {
  static _expectedArgs() {
    return [
      {name: 'radius', type: Type.NUM},
      {name: 'detail', type: Type.NUM, default: 0},
    ]
  }

  constructor(args, threeConstructor) {
    super(args, threeConstructor)
  }
}

export class IcosahedronGeometry extends PolyhedronGeometry {
  constructor(args) {
    super(args, THREE.IcosahedronGeometry)
  }
}

export class DodecahedronGeometry extends PolyhedronGeometry {
  constructor(args) {
    super(args, THREE.DodecahedronGeometry)
  }
}

export class OctahedronGeometry extends PolyhedronGeometry {
  constructor(args) {
    super(args, THREE.OctahedronGeometry)
  }
}

export class TetrahedronGeometry extends PolyhedronGeometry {
  constructor(args) {
    super(args, THREE.TetrahedronGeometry)
  }
}

export class SphereGeometry extends PassthroughGeometry {
  static _expectedArgs() {
    return [
      {name: 'radius', type: Type.NUM},
      {name: 'widthSegments', type: Type.NUM, default: 16},
      {name: 'heightSegments', type: Type.NUM, default: 12},
      // TODO: more args
    ]
  }

  constructor(args) {
    super(args, THREE.SphereGeometry)
  }
}

export class TorusGeometry extends PassthroughGeometry {
  static _expectedArgs() {
    return [
      {name: 'radius', type: Type.NUM},
      {name: 'tube', type: Type.NUM},
      {name: 'radialSegments', type: Type.NUM, default: 8},
      {name: 'tubularSegments', type: Type.NUM, default: 32},
      {name: 'arc', type: Type.NUM, default: 2*Math.PI},
    ]
  }

  constructor(args) {
    super(args, THREE.TorusGeometry)
  }
}

export class TorusKnotGeometry extends PassthroughGeometry {
  static _expectedArgs() {
    let expectedArgs = [
      {name: 'radius', type: Type.NUM},
      {name: 'tube', type: Type.NUM},
      {name: 'radialSegments', type: Type.NUM, default: 8},
      {name: 'tubularSegments', type: Type.NUM, default: 64},
      {name: 'p', type: Type.NUM, default: 2},
      {name: 'q', type: Type.NUM, default: 3},
    ]
    expectedArgs.order = ['radius', 'tube', 'tubularSegments', 'radialSegments', 'p', 'q']
    return expectedArgs
  }

  constructor(args) {
    super(args, THREE.TorusKnotGeometry)
  }
}

export class BoxGeometry extends PassthroughGeometry {
  static _expectedArgs() {
    return [
      {name: 'width', type: Type.NUM},
      {name: 'height', type: Type.NUM},
      {name: 'depth', type: Type.NUM},
      // TODO: more args
    ]
  }
  constructor(args) {
    super(args, THREE.BoxGeometry)
  }
}

export class ConeGeometry extends PassthroughGeometry {
  static _expectedArgs() {
    return [
      {name: 'radius', type: Type.NUM},
      {name: 'height', type: Type.NUM},
      {name: 'radialSegments', type: Type.NUM, default: 16},
      {name: 'heightSegments', type: Type.NUM, default: 1},
      // TODO: more args (see FrustumGeometry)
    ]
  }
  constructor(args) {
    super(args, THREE.ConeGeometry)
  }
}

export class FrustumGeometry extends PassthroughGeometry {
  static _expectedArgs() {
    return [
      {name: 'radiusTop', type: Type.NUM},
      {name: 'radiusBottom', type: Type.NUM},
      {name: 'height', type: Type.NUM},
      {name: 'radialSegments', type: Type.NUM, default: 16},
      {name: 'heightSegments', type: Type.NUM, default: 1},
      // TODO: more args (update ConeGeometry & CylinderGeometry)
    ]
  }

  constructor(args) {
    super(args, THREE.CylinderGeometry)
  }
}

export class CylinderGeometry extends PassthroughGeometry {
  static _expectedArgs() {
    let expectedArgs = [
      {name: 'radius', type: Type.NUM},
      {name: 'height', type: Type.NUM},
      {name: 'radialSegments', type: Type.NUM, default: 16},
      {name: 'heightSegments', type: Type.NUM, default: 1},
      // TODO: more args (see FrustumGeometry)
    ]
    expectedArgs.order = ['radius', 'radius', 'height', 'radialSegments', 'heightSegments']
    return expectedArgs
  }

  constructor(args) {
    super(args, THREE.CylinderGeometry)
  }
}
