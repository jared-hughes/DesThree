# DesThree

[Desmos](https://www.desmos.com/calculator) is a wonderful user-friendly calculator for graphing in two dimensions. However, creating three-dimensional projects can be confusing at first, but more importantly they are slow due to essentially having to recompute meshes and projections on every frame.

[Three.js](https://threejs.org/) is an excellent rendering library that simplifies much of the process of WebGL and web shaders.

The goal of this project is to unite the two:

 - The user-friendliness of Desmos, including sliders, MathQuill, and more
 - The power of WebGL to make fast 3D animations easily.

This project is unofficial, so it may break at any time due to changes in the Desmos code.

## Development

1. Clone the repository
2. [Allow TamperMonkey access to file URLs](https://www.tampermonkey.net/faq.php?ext=dhdg#Q204)
3. `npm install`
4. `npm run dev`
5. Load `dist/index.dev.user.js` into TamperMonkey
6. The script should automatically update (except for metadata changes) because `dist/index.dev.user.js` loads `dist/index.prod.user.js` through file URL

## Installation

1. Install the TamperMonkey browser extension
2. Click https://github.com/jared-hughes/DesThree/raw/master/desThree.user.js, then hit <kbd>Install</kbd>.
  - ⚠️ Be sure you trust myself and the source code. Malicious userscripts can make unwanted access to your data (this one does not).
3. Open https://www.desmos.com/calculator/znvwjvv8wg to test it! You should see 9 blue-ish boxes moving up and down.
4. Updates should be handled automatically. If you want to check early for updates, click <kbd>Check for userscript updates</kbd> on the Tampermonkey extension icon.

Please report any bugs here on the [Github issues tracker](https://github.com/jared-hughes/DesThree/issues/) or discuss on the [Unofficial Desmos Discord](https://discord.gg/vCBupKs9sB) at #programming.

## Usage

DesThree will automatically load in *every* graph you load with the userscript enabled, and at present, it completely covers the normal 2D graph.

To create a DesThree expression, insert it from the <kbd>➕</kbd> menu in the top-left as you might insert a folder or an image. You can also type `@3` at the start of a normal expression to begin a DesThree expression; the icon to the left should switch to the shape of a cube.

If DesThree ever stops showing something or stops being responsive, save and reload the page. If it still doesn't work, it's probably the fault of your expressions.

If you ever can't type something (e.g. `PointLight` automatically replaces `int` with an integral), type it in some other tab/program and copy-paste into Desmos.

### Example 1: Setting Camera Position

The simplest expression you can write simply sets the position of the camera as `(x,y,z)=(1,2,5)` (https://www.desmos.com/calculator/41c8uy2xoo):

```js
pos = (1,2,5)
PerspectiveCamera(pos)
```
  - You can't see anything because we didn't place anything in the scene.
  - All functions start with capital letters
  - Variable names must start with a letter but can have letters, digits, or underscores elsewhere:
    - Valid: `cameraPos`, `camera_pos`, `cube_1`, `thr33js`
    - Invalid: `12cube`, `_moo`
  - The y-axis points up by default.
  - The camera points to `(0,0,0)` by default.

### Example 2: Showing a Cube

Showing a cube may be more complicated than what you expect. The process goes as follows:

  - Define a cube geometry. This holds the shape of the cube but cannot be shown by itself.
  - Define the material to be used.
  - Create a mesh, which combines the material and geometry into one object. Meshes default to being placed at `(0,0,0)`.
  - Show the mesh

These steps can be done as follows (https://www.desmos.com/calculator/xa2jew0a9n):

```js
pos = (1,2,5)
PerspectiveCamera(pos)
cubeGeometry = Box(1,1,1)
material = NormalMaterial()
mesh = Mesh(cubeGeometry, material)
Show(mesh)
```

Alternatively, you can place them all in one expression (https://www.desmos.com/calculator/dw3c2jbczi):

```js
PerspectiveCamera((1,2,5))
Show(Mesh(Box(1,1,1), NormalMaterial()))
```

- Be careful: `PerspectiveCamera` seems to have double parentheses, but the inner ones are for the point `(1,2,5)`—only the outer ones are for the function call.
- `Box` takes three arguments: width, height, length. To make a cube, we use the same value for all three
- `NormalMaterial` takes no arguments. Example 5 will go over the different kinds of materials
- `Mesh` simply takes the geometry and material and arguments.
- `Show` takes the mesh and shows it. This does not occur automatically because we sometimes want to store a mesh in a variable and not show it until after some transformations


### Example 3: Moving Box Position

A great part about using Desmos is that we can use sliders and math in the expressions.

To see an example, we will move the box around in 3D. We use the `Position` function to create a new mesh that corresponds to the mesh translated (https://www.desmos.com/calculator/rdn9xsm0ai):

```js
PerspectiveCamera((1,2,5))
cubeGeometry = Box(1,1,1)
material = NormalMaterial()
mesh = Mesh(cubeGeometry, material)
x_0 = 0
y_0 = 0
z_0 = 0
meshp = Position(mesh, (x_0, y_0, z_0))
Show(meshp)
```

Alternatively, we can specify position directly in the `Mesh` function (https://www.desmos.com/calculator/wsyb0l9fpy):
```js
meshp = Mesh(cubeGeometry, material, (x_0, y_0, z_0))
Show(meshp)
```
  - Desmos generates sliders for each position variable, which we can use in the function. Try dragging the sliders!
  - Note that we are now showing `meshp`, the `mesh` correctly positioned in 3D.

### Example 4: Moving Camera Position

To improve our future viewing, we will orbit the camera using equations of [spherical coordinates](https://en.wikipedia.org/wiki/Spherical_coordinate_system).

This simply involves a few more equations instead of placing the camera at a fixed position (https://www.desmos.com/calculator/ietknqkjsr):
```js
r_c = 5
theta_c = 0
phi_c = 0
pos = (r_c·cos(phi_c)cos(theta_c), r_c·sin(phi_c), r_c·cos(phi_c)sin(theta_c))
PerspectiveCamera(pos)
cubeGeometry = Box(1,1,1)
material = NormalMaterial()
mesh = Mesh(cubeGeometry, material)
x_0 = 0
y_0 = 0
z_0 = 0
meshp = Position(mesh, (x_0, y_0, z_0))
Show(meshp)
```

### Example 5: Materials and Lights

Remember how we're using `NormalMaterial` above? That is the simplest material (and the default if none is given to the `Mesh` function): there are no arguments, and we don't have to deal with lights. Each face is simply colored based on its normal vector.

Two other materials exist that are always visible regardless of lights:
  - `DepthMaterial`: also takes no arguments
  - `BasicMaterial`: takes a color as argument and always shows that color regardless of lighting

Other materials exist for shading meshes, and these handle lights:

  - `LambertMaterial`
  - `PhongMaterial`
  - `ToonMaterial`

Each of these take color as their only argument.

Use them as follows:

```js
material = LambertMaterial(RGB(10, 80, 180))
mesh = Mesh(geometry, material)
show(mesh)
```

With these last few materials, you need to add lights if you want to see anything.

Let's add a single point light at `(-7, 6, 2)` with an intensity (brightness) of 1 (https://www.desmos.com/calculator/utlbo3ifrx):

```js
Show(Position(PointLight(1), (-7, 6, 2)))
```

(Alternatively, you can use `Show(PointLight(1, RGB(255,255,255), (-7,6,2)))`, which avoids the `Position` function).

Looks good right? Yes, but try rotating to the back side (https://www.desmos.com/calculator/b2i93iyk0l). Ugh, that's too dark.

One solution would be to add more point lights so nothing can be dark, but that would get confusing and not look good. Instead, let's add an ambient light, which adds the intensity to every face (https://www.desmos.com/calculator/4c7ktmyhxe):

```js
Show(AmbientLight(0.3))
```

- Ambient lights have no position
- An ambient light fakes light reflecting off of other surfaces (wherever we look, there's normally a wall or ground reflecting light onto the back side of objects we look at; this is simulated by ambient light)
- In almost all cases, you want only one ambient light
- You normally want to stick with an intensity between `0.01` (dark faces can be almost completely black—good for moody scenes) to `0.5` (all faces are easily visible)

### Example 6: Lists

Anywhere a number can be accepted, a list of values can be accepted instead.

Let's make a sphere with radius `1` and place it at x-coordinates `[-10, -5, 0, 5, 10]` (https://www.desmos.com/calculator/n51emwwmly):

```js
geometry = Sphere(1)
mesh = Mesh(geometry, material)
meshp = Position(mesh, ([-10,-5,...,10], 0, 0))
Show(meshp)
```

Just like in vanilla Desmos, if several lists are passed to a function, a list is produced from applying the function to corresponding terms with the output length being the minimum of the lengths of the input lists (https://www.desmos.com/calculator/fkta2c4gzj):

```js
L_x = [-10,-5,...,10]
mesh = Mesh(geometry, material)
meshp = Position(mesh, L_x, (0.05*L_x^2, 0))
Show(meshp)
```

You can even make a list of geometries (https://www.desmos.com/calculator/sbk9q2p8ft)

```js
L_x = [-12.5,-7.5,...,12.5]
geometry = Sphere(0.02*L_x^2+0.5)
mesh = Mesh(geometry, material)
meshp = Position(mesh, L_x, (0.02*L_x^2, 0))
Show(meshp)
```

Go crazy, and have fun!

## Function Reference

### Functions that return a Geometry


#### [Icosahedron](https://threejs.org/docs/#api/en/geometries/IcosahedronGeometry), [Dodecahedron](https://threejs.org/docs/#api/en/geometries/DodecahedronGeometry), [Octahedron](https://threejs.org/docs/#api/en/geometries/OctahedronGeometry), [Tetrahedron](https://threejs.org/docs/#api/en/geometries/TetrahedronGeometry)

Property | Type | Default | Description
--- | --- | --- | ---
radius | number | | Radius of circumscribing sphere
detail | number | 0 | If `detail > 0`, the polyhedron becomes more rounded towards a sphere

#### [Sphere](https://threejs.org/docs/#api/en/geometries/SphereGeometry)

Property | Type | Default | Description
--- | --- | --- | ---
radius | number | | Radius of circumscribing sphere
widthSegments | number | 16 | Greater = smoother
heightSegments | number | 12 | Greater = smoother

#### [Torus](https://threejs.org/docs/#api/en/geometries/TorusGeometry)

Property | Type | Default | Description
--- | --- | --- | ---
radius | number | | Radius from center of torus to center of tube in cross section
tube | number | | Radius of tube
radialSegments | number | 16 | Greater = smoother
tubularSegments | number | 12 | Greater = smoother
arc | number | 2π | Arc angle

#### [TorusKnot](https://threejs.org/docs/#api/en/geometries/TorusKnotGeometry)

Property | Type | Default | Description
--- | --- | --- | ---
radius | number | |
tube | number | | Radius of tube
radialSegments | number | 64 | Greater = smoother
tubularSegments | number | 8 | Greater = smoother
p | number | 2 | How many times the geometry winds around its axis of rotational symmetry
q | number | 3 | How many times the geometry winds around a circle in the interior of the torus

#### [Cone](https://threejs.org/docs/#api/en/geometries/ConeGeometry)

Property | Type | Default | Description
--- | --- | --- | ---
radius | number | |
height | number | |
radialSegments | number | 16 | Greater = smoother
heightSegments | number | 1 |

#### [Frustum](https://threejs.org/docs/#api/en/geometries/CylinderGeometry)

Property | Type | Default | Description
--- | --- | --- | ---
radiusTop | number | |
radiusBottom | number | |
height | number | |
radialSegments | number | 16 | Greater = smoother
heightSegments | number | 1 |

#### [Cylinder](https://threejs.org/docs/#api/en/geometries/CylinderGeometry)

Just a convenience to avoid having to pass the same value for `radiusTop` and `radiusBottom` in `Frustum`.

Property | Type | Default | Description
--- | --- | --- | ---
radius | number | |
height | number | |
radialSegments | number | 16 | Greater = smoother
heightSegments | number | 1 |

### Functions that return a Material

#### [BasicMaterial](https://threejs.org/docs/index.html#api/en/materials/MeshBasicMaterial)

Property | Type | Default | Description
--- | --- | --- | ---
color | Color | white |

Always colored as the given color, ignoring lighting.

#### [NormalMaterial](https://threejs.org/docs/index.html#api/en/materials/MeshNormalMaterial)

No arguments. Each face is colored based on its normal vector.

#### [DepthMaterial](https://threejs.org/docs/index.html#api/en/materials/MeshDepthMaterial)

No arguments. Colors each point in gray-scale based on its depth from the camera. This is not very useful for general rendering and usually shows up mostly black unless the object is very close to the camera.

#### [LambertMaterial](https://threejs.org/docs/index.html#api/en/materials/MeshLambertMaterial)

Property | Type | Default | Description
--- | --- | --- | ---
color | Color | white |

This uses [Gourand shading](https://en.wikipedia.org/wiki/Gouraud_shading), which calculates shading for each vertex and does linear interpolation to find pixel shading. As such, it only tends to look best for low-poly objects like cubes/boxes.

#### [PhongMaterial](https://threejs.org/docs/index.html#api/en/materials/MeshPhongMaterial)

Property | Type | Default | Description
--- | --- | --- | ---
color | Color | white |

This uses [Phong shading](https://en.wikipedia.org/wiki/Phong_shading), which calculates shading on each pixel and additionally includes specular highlights (shiny surfaces). This tends to look better than MeshLambertMaterial for rounded objects like spheres but is slower.

#### [ToonMaterial](https://threejs.org/docs/index.html#api/en/materials/MeshPhongMaterial)

Property | Type | Default | Description
--- | --- | --- | ---
color | Color | white |

Looks like a cartoon drawing.

### Functions that return an Object3D (something that can be shown)

#### [Mesh](https://threejs.org/docs/#api/en/objects/Mesh)

Property | Type | Default | Description
--- | --- | --- | ---
geometry | Geometry | |
material | Material | `NormalMaterial()` |
position | Vector3 | (0,0,0) |

#### [PointLight](https://threejs.org/docs/index.html#api/en/lights/PointLight), [AmbientLight](https://threejs.org/docs/index.html#api/en/lights/AmbientLight)

Property | Type | Default | Description
--- | --- | --- | ---
intensity | number | 1 | Brightness
color | Color | white |
position | Vector3 | (0,0,0) | ignored for `AmbientLight`s

#### Position

Property | Type | Default | Description
--- | --- | --- | ---
object | Object3D | | `Geometry` not accepted, only others in this "Functions that return an Object3D" section.
position | Vector3 | | Vector by which to translate the object.

### Functions that directly affect the scene

#### [PerspectiveCamera](https://threejs.org/docs/index.html#api/en/cameras/PerspectiveCamera)

Property | Type | Default | Description
--- | --- | --- | ---
position | Vector3 | | Position of the camera
lookAt | Vector3 | (0,0,0) | Position of the point the camera looks at
fov | number | 75 | field of view (degrees, <kbd>planned:</kbd> Change treatment based on radian mode of calculator)
near | number | 0.1 | near clipping plane of [camera frustum](https://en.wikipedia.org/wiki/Viewing_frustum)
far | number | 1000 | far clipping plane of [camera frustum](https://en.wikipedia.org/wiki/Viewing_frustum)

#### Show

Property | Type | Default | Description
--- | --- | --- | ---
object | Object3D | |

### Miscellaneous

#### [RGB](https://threejs.org/docs/#api/en/math/Color)

Property | Type | Default | Description
--- | --- | --- | ---
r | number | | Red component, 0 to 255
g | number | | Green component, 0 to 255
b | number | | Blue component, 0 to 255
