import states from './testStates.js'

const _expects = [
  {
    name: 'Graph loads',
    expects: [
      'startup: Black canvas with both expressions detected'
    ]
  },
  {
    name: 'Ignore graphs without DesThree expressions',
    expects: [
      'startup: Extension does not place black canvas'
    ]
  },
  {
    name: 'Shows box from single expression',
    expects: [
      'startup: Box is visible',
      'change viewport size: Aspect ratio remains correct'
    ]
  },
  {
    name: 'Movable box',
    expects: [
      'add DesThree expression from dropdown: new expression appears with DesThree logo',
      'type `Show(meshp)` into that expression: Box is visible',
      'change x_{0}: Box moves'
    ]
  },
  {
    name: 'Position directly from Mesh function',
    expects: [
      'startup: Box is visible',
      'change x_{0}: Box moves'
    ]
  },
  {
    name: 'Camera movement',
    expects: [
      'startup: Box is visible',
      'change r_{c}: Camera zooms',
      'change theta_{c}: Camera orbits around box'
    ]
  },
  {
    name: 'Lambert material',
    expects: [
      'startup: Box is visible with Lambert illuminance',
      'change theta_{c}: Backside is black',
      'change x_0: Position of light changes'
    ]
  },
  {
    name: 'Ambient light',
    expects: [
      'startup: Box is visible with Lambert illuminance',
      'change theta_{c}: Backside is brighter than black'
    ]
  },
  {
    name: 'Sphere parabola',
    expects: [
      'startup: Five spheres in shape of parabola are visible'
    ]
  },
  {
    name: 'Sphere parabola with radius',
    expects: [
      'startup: Five spheres with centers along a parabola all tangent to a plane below them'
    ]
  },
  {
    name: 'Breathing boxes',
    expects: [
      'startup: 9 boxes moving in and out. Camera orbits around boxes',
      'change n: number of boxes changes',
      'change r_{cam}: zoom level changes'
    ]
  },
  {
    name: 'All passthrough geometries',
    expects: [
      'startup: 11 different geometries visible'
    ]
  },
  {
    name: 'All materials',
    expects: [
      'startup: 6 spheres visible, each with different materials'
    ]
  }
]
const expects = _expects.map((e, i) => ({ ...e, state: states[i] }))
export default expects
