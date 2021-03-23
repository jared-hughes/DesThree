import { Type, ConstructorPassthrough } from './functionSupers.js'
import * as THREE from 'three'

class PassthroughGeometry extends ConstructorPassthrough {

}
PassthroughGeometry.type = Type.GEOMETRY

class PolyhedronGeometry extends PassthroughGeometry {
  static _expectedArgs () {
    return [
      { name: 'radius', type: Type.NUM },
      { name: 'detail', type: Type.NUM, default: 0 }
    ]
  }
}

export class IcosahedronGeometry extends PolyhedronGeometry {
  constructor (args) {
    super(args, THREE.IcosahedronGeometry)
  }
}

export class DodecahedronGeometry extends PolyhedronGeometry {
  constructor (args) {
    super(args, THREE.DodecahedronGeometry)
  }
}

export class OctahedronGeometry extends PolyhedronGeometry {
  constructor (args) {
    super(args, THREE.OctahedronGeometry)
  }
}

export class TetrahedronGeometry extends PolyhedronGeometry {
  constructor (args) {
    super(args, THREE.TetrahedronGeometry)
  }
}

export class SphereGeometry extends PassthroughGeometry {
  static _expectedArgs () {
    return [
      { name: 'radius', type: Type.NUM },
      { name: 'widthSegments', type: Type.NUM, default: 16 },
      { name: 'heightSegments', type: Type.NUM, default: 12 }
      // TODO: more args
    ]
  }

  constructor (args) {
    super(args, THREE.SphereGeometry)
  }
}

export class TorusGeometry extends PassthroughGeometry {
  static _expectedArgs () {
    return [
      { name: 'radius', type: Type.NUM },
      { name: 'tube', type: Type.NUM },
      { name: 'radialSegments', type: Type.NUM, default: 8 },
      { name: 'tubularSegments', type: Type.NUM, default: 32 },
      { name: 'arc', type: Type.NUM, default: 2 * Math.PI }
    ]
  }

  constructor (args) {
    super(args, THREE.TorusGeometry)
  }
}

export class TorusKnotGeometry extends PassthroughGeometry {
  static _expectedArgs () {
    const expectedArgs = [
      { name: 'radius', type: Type.NUM },
      { name: 'tube', type: Type.NUM },
      { name: 'radialSegments', type: Type.NUM, default: 8 },
      { name: 'tubularSegments', type: Type.NUM, default: 64 },
      { name: 'p', type: Type.NUM, default: 2 },
      { name: 'q', type: Type.NUM, default: 3 }
    ]
    expectedArgs.order = ['radius', 'tube', 'tubularSegments', 'radialSegments', 'p', 'q']
    return expectedArgs
  }

  constructor (args) {
    super(args, THREE.TorusKnotGeometry)
  }
}

export class BoxGeometry extends PassthroughGeometry {
  static _expectedArgs () {
    return [
      { name: 'width', type: Type.NUM },
      { name: 'height', type: Type.NUM },
      { name: 'depth', type: Type.NUM }
      // TODO: more args
    ]
  }

  constructor (args) {
    super(args, THREE.BoxGeometry)
  }
}

export class ConeGeometry extends PassthroughGeometry {
  static _expectedArgs () {
    return [
      { name: 'radius', type: Type.NUM },
      { name: 'height', type: Type.NUM },
      { name: 'radialSegments', type: Type.NUM, default: 16 },
      { name: 'heightSegments', type: Type.NUM, default: 1 }
      // TODO: more args (see FrustumGeometry)
    ]
  }

  constructor (args) {
    super(args, THREE.ConeGeometry)
  }
}

export class FrustumGeometry extends PassthroughGeometry {
  static _expectedArgs () {
    return [
      { name: 'radiusTop', type: Type.NUM },
      { name: 'radiusBottom', type: Type.NUM },
      { name: 'height', type: Type.NUM },
      { name: 'radialSegments', type: Type.NUM, default: 16 },
      { name: 'heightSegments', type: Type.NUM, default: 1 }
      // TODO: more args (update ConeGeometry & CylinderGeometry)
    ]
  }

  constructor (args) {
    super(args, THREE.CylinderGeometry)
  }
}

export class CylinderGeometry extends PassthroughGeometry {
  static _expectedArgs () {
    const expectedArgs = [
      { name: 'radius', type: Type.NUM },
      { name: 'height', type: Type.NUM },
      { name: 'radialSegments', type: Type.NUM, default: 16 },
      { name: 'heightSegments', type: Type.NUM, default: 1 }
      // TODO: more args (see FrustumGeometry)
    ]
    expectedArgs.order = ['radius', 'radius', 'height', 'radialSegments', 'heightSegments']
    return expectedArgs
  }

  constructor (args) {
    super(args, THREE.CylinderGeometry)
  }
}

export class CircleGeometry extends PassthroughGeometry {
  static _expectedArgs () {
    const expectedArgs = [
      { name: 'radius', type: Type.NUM },
      { name: 'thetaStart', type: Type.NUM, default: 0 },
      { name: 'thetaLength', type: Type.NUM, default: 2 * Math.PI },
      { name: 'segments', type: Type.NUM, default: 16 }
    ]
    expectedArgs.order = ['radius', 'segments', 'thetaStart', 'thetaLength']
    return expectedArgs
  }

  constructor (args) {
    super(args, THREE.CircleGeometry)
  }
}

export class RingGeometry extends PassthroughGeometry {
  static _expectedArgs () {
    const expectedArgs = [
      { name: 'innerRadius', type: Type.NUM },
      { name: 'outerRadius', type: Type.NUM },
      { name: 'thetaStart', type: Type.NUM, default: 0 },
      { name: 'thetaLength', type: Type.NUM, default: 2 * Math.PI },
      { name: 'thetaSegments', type: Type.NUM, default: 16 },
      { name: 'phiSegments', type: Type.NUM, default: 1 }
    ]
    expectedArgs.order = [
      'innerRadius', 'outerRadius', 'thetaSegments',
      'phiSegments', 'thetaStart', 'thetaLength'
    ]
    return expectedArgs
  }

  constructor (args) {
    super(args, THREE.RingGeometry)
  }
}

export class PlaneGeometry extends PassthroughGeometry {
  static _expectedArgs () {
    return [
      { name: 'width', type: Type.NUM },
      { name: 'height', type: Type.NUM },
      { name: 'widthSegments', type: Type.NUM, default: 1 },
      { name: 'heightSegments', type: Type.NUM, default: 1 }
    ]
  }

  constructor (args) {
    super(args, THREE.PlaneGeometry)
  }
}

export class LatheGeometry extends PassthroughGeometry {
  static _expectedArgs () {
    return [
      { name: 'points', type: Type.VECTOR2, takesList: true },
      { name: 'segments', type: Type.NUM, default: 12 },
      { name: 'phiStart', type: Type.NUM, default: 0 },
      { name: 'phiLength', type: Type.NUM, default: 2 * Math.PI }
    ]
  }

  constructor (args) {
    console.log('EEE', args.points)
    // args.points = args.points.map( abs x)
    super(args, THREE.LatheGeometry)
  }
}
