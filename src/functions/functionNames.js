import {
  MeshLambertMaterial, MeshNormalMaterial, MeshBasicMaterial, MeshDepthMaterial,
  MeshPhongMaterial, MeshToonMaterial
} from './meshMaterials'
import {
  DodecahedronGeometry, IcosahedronGeometry, TetrahedronGeometry,
  OctahedronGeometry, TorusKnotGeometry, CylinderGeometry, FrustumGeometry,
  SphereGeometry, TorusGeometry, ConeGeometry, BoxGeometry
} from './geometries.js'
import { Mesh, Position } from './object3ds'
import { PointLight, AmbientLight } from './lights'
import { PerspectiveCamera } from './cameras'
import { ColorRGB, Vector3, Show } from './misc'

const functionNames = {
  RGB: ColorRGB,
  '': Vector3,
  // materials
  LambertMaterial: MeshLambertMaterial,
  NormalMaterial: MeshNormalMaterial,
  BasicMaterial: MeshBasicMaterial,
  DepthMaterial: MeshDepthMaterial,
  PhongMaterial: MeshPhongMaterial,
  ToonMaterial: MeshToonMaterial,
  // geometries
  Dodecahedron: DodecahedronGeometry,
  Icosahedron: IcosahedronGeometry,
  Tetrahedron: TetrahedronGeometry,
  Octahedron: OctahedronGeometry,
  TorusKnot: TorusKnotGeometry,
  Cylinder: CylinderGeometry,
  Frustum: FrustumGeometry,
  Sphere: SphereGeometry,
  Torus: TorusGeometry,
  Cone: ConeGeometry,
  Box: BoxGeometry,
  // objects
  Mesh,
  // lights
  PointLight,
  AmbientLight,
  // camera
  PerspectiveCamera,
  // setup
  Position,
  Show,
}

export default functionNames
