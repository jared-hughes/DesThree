import {
  MeshLambertMaterial, MeshNormalMaterial, MeshBasicMaterial, MeshDepthMaterial,
  MeshPhongMaterial, MeshToonMaterial
} from './meshMaterials'
import {
  DodecahedronGeometry, IcosahedronGeometry, TetrahedronGeometry,
  OctahedronGeometry, TorusKnotGeometry, CylinderGeometry, FrustumGeometry,
  SphereGeometry, TorusGeometry, ConeGeometry, BoxGeometry,
  CircleGeometry, RingGeometry, PlaneGeometry
} from './geometries'
import { Mesh, Position } from './object3ds'
import {
  PointLight, AmbientLight, DirectionalLight, SpotLight, HemisphereLight
} from './lights'
import { PerspectiveCamera } from './cameras'
import { ColorRGB, Vector3, Show } from './misc'
import { GridHelper, PolarGridHelper, ArrowHelper, AxesHelper } from './helpers'
import { LinearFog, FogExp2 } from './fogs'

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
  Plane: PlaneGeometry,
  Disc: CircleGeometry,
  Ring: RingGeometry,
  Cone: ConeGeometry,
  Box: BoxGeometry,
  // objects
  Mesh,
  // lights
  DirectionalLight,
  HemisphereLight,
  AmbientLight,
  PointLight,
  SpotLight,
  // camera
  PerspectiveCamera,
  // setup
  FogExp: FogExp2,
  Fog: LinearFog,
  Position,
  Show,
  // helpers
  PolarGrid: PolarGridHelper,
  SquareGrid: GridHelper,
  ArrowHelper: ArrowHelper,
  Axes: AxesHelper
}

export default functionNames

export const maxFuncNameLength = Math.max(...Object.keys(functionNames).map(c => c.length))
