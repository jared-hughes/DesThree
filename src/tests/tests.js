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
    name: 'Shows box',
    expects: [
      'startup: Box is visible'
    ]
  },
  {
    name: 'Shows box from single experssion',
    expects: [
      'startup: Box is visible'
    ]
  },
  {
    name: 'Movable box',
    expects: [
      'startup: Box is visible',
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
  }
]
const expects = _expects.map((e, i) => ({ ...e, state: states[i] }))
export default expects
