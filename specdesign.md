## Wants/Needs

In order of sidebar of [https://threejs.org/docs/index.html](https://threejs.org/docs/index.html):

### Cameras
- Toggle Orthographic/Perspective Camera
- `OrthographicCamera`
  - can define left/right/top/bottom same as Desmos's `graphpaperBounds.mathCoordinates`
  - near/far: need to give values
- (partial) `PerspectiveCamera`
  - fov: options
    - compute based on Desmos's left/right, some trig and a zoom factor
    - fixed FOV
    - use `OrbitControls`
  - near/far: need to give values

### Core
- Use `Raycaster` for `clickableObject`s?

### Geometries

- `BufferGeometry`

- 2D Geometries taking only numbers as arguments
  - `CircleGeometry`
  - `PlaneGeometry`
- 3D Geometries taking only numbers as arguments
  - `BoxGeometry`
  - `ConeGeometry`
  - `CylinderGeometry`
  - ✓ `PolyhedronGeometry`
    - ✓ `DodecahedronGeometry`
    - ✓ `IcosahedronGeometry`
    - ✓ `OctahedronGeometry`
    - ✓ `TetrahedronGeometry`
  - `SphereGeometry`
  - `TorusGeometry`
  - `TorusKnotGeometry`
- Take another geometry as input
  - `EdgesGeometry`
  - `WireframeGeometry`
- Takes a path (THREE.Shape() -- handles `moveTo`, `lineTo`, `bezierCurveTo`, ...?) as input. Maybe use an array of points
  - `ExtrudeGeometry` (takes a path as input and moveTo/lineTo commands. Maybe link to parametric?)
  - `RingGeometry`
- Takes an array of points as input
  - `LatheGeometry` (revolve, takes array of points to revolve)
- Takes a function as input
  - `ParametricGeometry` (`(u,v) -> (x,y,z)`) (Can work like our existing spherical coordinate graphers)
  - `TubeGeometry` (`t -> (x,y,z)`)
- Heck
  - `TextGeometry`

### Helpers
Seem to be geared towards debugging (e.g. showing lights, arrows, bounding boxes) but can eventually be relevant

### Lights

All take colors (`advancedStyling` FTW!)

- ✓ `AmbientLight`
- `DirectionLight`
- `HemisphereLight`
- ✓ `PointLight`
- `SpotLight`

### Loaders
Probably not going to deal with these for a while. Maybe will end up doing `BufferGeometryLoader` and `*TextureLoader`.

### Materials

Looks kinda realistic:
- ✓ `MeshBasicMaterial` (not affected by lighting, fastest)
- ✓ `MeshToonMaterial`
- ✓ `MeshLambertMaterial` (faster)
- ✓ `MeshPhongMaterial` (fast)
- `MeshStandardMaterial` (slow)
- `MeshPhysicalMaterial` (slowest)

Miscellaneous:
- `LineBasicMaterial`, `LineDashedMaterial`
- `PointsMaterial`
- `ShadowMaterial` (renders only the shadows on an object)

Debug
- ✓ `MeshDepthMaterial`
- ✓ `MeshNormalMaterial`

Not considering yet due to complexity
- `MeshMatcapMaterial`
- `ShaderMaterial` and `RawShaderMaterial` (it would be epic to get this to work)
- `SpriteMaterial`

### Objects

- `Line`, `LineLoop`, `LineSegments`
- ○ `Group`
- `Points`
- `Sprite` (need to load image)

### Scenes

- `Fog`, `FogExp2`

### Textures

- `CanvasTexture`: Desmos 2D renders to a canvas, hence texture
- other textures / image from Desmos Image (easy as data URI in the expressions list)

### Controls

- `OrbitControls`, `TrackballControls`
- `FirstPersonControls`, `FlyControls`
- `PointerLockControls`

### Geometries

- `ConvexGeometry`
- 3d mesh from point cloud: https://discourse.threejs.org/t/3d-mesh-from-cloud-of-points/12324/11


## Design

Desmos notes with commands inside them, separated by commas. Should be able to use `HelperExpression`s to evaluate each comma-separated part

- `BoxGeometry(3,4,5)`

Ooh I want tooltips giving argument order/names and what each command does.

Need argument types allowed:
- Colors (for lights, materials)
- Numbers
- Lists of numbers (for x,y,z coordinates)
  - May want to allow variadic functions by allowing lists of points for `Shape`s (`ExtrudeGeometry` and other purposes)
- Material (Desmos3D name -- should know by position that this is not vanilla argument and should not be listened to)

Want to re-use materials across objects

How to handle transformations? → reference https://threejs.org/docs/index.html#api/en/core/Object3D. `scene.autoUpdate` defaults to `true`.

Use images as textures?

Shadows?
