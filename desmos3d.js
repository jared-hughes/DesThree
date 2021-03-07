// ==UserScript==
// @name         Desmos Three.js
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Use three.js directly in Desmos
// @author       You
// @match        https://www.desmos.com/calculator/*
// @require      https://threejs.org/build/three.js
// @grant        none
// ==/UserScript==

// TODO: change the @require build of three.js to point to a specific version

// latest graph: https://www.desmos.com/calculator/t6eycvwnzx

(function() {
'use strict';

let Calc
let THREE
let CalcThree

const Type = Object.freeze({
  NUM: 'numericValue',
  LIST: 'listValue',
  COLOR: {},
  MATERIAL: {},
  GEOMETRY: {},
  OBJECT: {}, // subclass of THREE.Object3D; includes light and mesh; anything that can move in 3D
  CAMERA: {},
  NULL: {},
})

function helperExpression(expr, type, callback) {
  let helper = Calc.HelperExpression({latex: expr})
  helper.observe(type, () => {
    const val = isNaN(helper.numericValue) ? parseFloat(expr) : helper.numericValue
    callback(val)
  })
  return helper
}


class DesThree {
  constructor() {
    this.renderer = null
    this.scene = new THREE.Scene()
    this.camera = null
    this.definitions = {}
    this.values = {}
    this.dependents = {}
  }

  init() {
    this.initDefaultCamera()
    this.injectStyle()
    this.initRenderer()
    this.observeGraphpaperBounds()
    this.observeGraph()
  }

  applyGraphpaperBounds() {
    const bounds = Calc.graphpaperBounds.pixelCoordinates;
    this.renderer.setSize(bounds.width, bounds.height);
    this.renderer.domElement.width = bounds.width;
    this.renderer.domElement.height = bounds.height;
    // top is always 0
    this.renderer.domElement.style.left = bounds.left + "px";
    this.camera.aspect = bounds.width / bounds.height;
    this.camera.updateProjectionMatrix();
    this.rerender()
  }

  observeGraphpaperBounds() {
    // the observer doesn't get called the first time
    this.applyGraphpaperBounds()
    Calc.observe('graphpaperBounds', () => this.applyGraphpaperBounds());
  }

  isDefinitionEqual(a, b) {
    return a && b && a.func == b.func
    && a.args.length == b.args.length
    && a.args.every((e, i) => b.args[i] == e)
  }

  parse(text) {
    // prune comments
    text = text.replaceAll(/#[^\n]*\n/g, "")

    let defs = []
    let index = 0
    let assignRegex = /\s*(?<variable>\w+)\s*=\s*/y
    let funcNameRegex = /\s*(?<func>\w+)\s*\(/y
    while (index < text.length) {
      const match = assignRegex.exec(text)
      let variable
      if (match) {
        variable = match.groups.variable
        funcNameRegex.lastIndex = assignRegex.lastIndex
      } else {
        throw "ParseError: expected variable assignment"
      }

      const match2 = funcNameRegex.exec(text)
      let func
      if (match2) {
        func = match2.groups.func
      } else {
        throw "ParseError: expected function name"
      }

      let braceStack = ["("]
      let args = []
      let lastArg = ""
      for (index=funcNameRegex.lastIndex; braceStack.length > 0; index++) {
        if (index >= text.length) {
          throw "ParseError: EOF before closing function"
        }
        const c = text[index]
        if ("([{".includes(c)) {
          braceStack.push(c)
        } else if (")]}".includes(c)) {
          if ("([{"[")]}".indexOf(c)] != braceStack.pop()) {
            throw "ParseError: mismatched braces"
          }
        }
        if (braceStack.length == 0) {
          // at this point, the outer function is closed
          if (lastArg != "") {
            args.push(lastArg.trim())
          }
          defs.push({
            variable,
            func,
            args,
          })
        } else if (c == "," && braceStack.length == 1) {
          // all braces are closed (except the opening paren), so this comma separates arguments
          args.push(lastArg.trim())
          lastArg = ""
        } else {
          lastArg += c;
        }
      }
      assignRegex.lastIndex = index
      funcNameRegex.lastIndex = index
    }
    return defs
  }

  deleteVariable(variable) {
    if (variable in this.values) {
      this.values[variable].dispose()
      delete this.values[variable]
      delete this.definitions[variable]
    }
  }

  changeVariable(variable, value) {
    this.deleteVariable(variable)
    if (value !== null) this.values[variable] = value
    this.variableChanged(variable)
  }

  variableChanged(variable) {
    // console.log("variable changed", variable);
    (this.dependents[variable] || [])
    .forEach(object => object.afterDepChanged(variable))
  }

  generateObject(def) {
    const funcs = {
      'ColorRGB': Color,
      // materials
      MeshBasicMaterial,
      MeshLambertMaterial,
      MeshToonMaterial,
      MeshNormalMaterial,
      MeshDepthMaterial,
      MeshPhongMaterial,
      // geometries
      IcosahedronGeometry,
      DodecahedronGeometry,
      OctahedronGeometry,
      TetrahedronGeometry,
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
    if (def.func in funcs) {
      let object = new funcs[def.func](def.args)
      object.variable = def.variable
      return object
    } else {
      throw `Function ${def.func} not supported`
    }
  }

  setThreeExprs(ids) {
    document.querySelectorAll('.three-textexpr')
    .forEach(el => {
      el.classList.remove('three-textexpr')
      // revert "enter" starting the next element
      const textarea = el.querySelector('textarea')
      textarea.onkeydown = textarea.onKeyDownBackup
      textarea.spellcheck = true
    })
    ids.forEach(id => {
      const el = document.querySelector(`.dcg-expressiontext[expr-id="${id}"]`)
      el.classList.add('three-textexpr')
      // suppress "enter" starting the next element
      const textarea = el.querySelector('textarea')
      textarea.onKeyDownBackup = textarea.onkeydown
      textarea.onkeydown = e => {
        const e1 = e.key == "Enter" && textarea.selectionEnd != textarea.value.length
        const e2 = e.key == "ArrowDown" && textarea.selectionEnd != textarea.value.length
        const e3 = e.key == "ArrowUp" && textarea.selectionStart != 0
        if (!(e1 || e2 || e3)) {
          textarea.onKeyDownBackup(e)
        }
      }
      textarea.spellcheck = false
    })
  }

  injectStyle() {
    const styleEl = document.createElement('style')
    // <div>Icons made by <a href="https://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
    styleEl.innerHTML = `
      .three-textexpr .dcg-tab .dcg-icon-text::before {
        content: "";
        background-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjBweCIgaGVpZ2h0PSIyMHB4IiB2aWV3Qm94PSItMzAgMCA1MTEgNTEyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Im00MzYuMjIyNjU2IDEyMS4zNTkzNzUtMjEwLjIwNzAzMS0xMjEuMzU5Mzc1LTIxMC4yMDMxMjUgMTIxLjM1OTM3NSAyMTAuMjAzMTI1IDEyMS4zNjMyODF6bTAgMCIvPjxwYXRoIGQ9Im0yNDEuMjczNDM4IDUxMiAyMTAuMjYxNzE4LTEyMS4zOTQ1MzF2LTI0Mi44NDc2NTdsLTIxMC4yNjE3MTggMTIxLjM5MDYyNnptMCAwIi8+PHBhdGggZD0ibS41IDE0Ny43NTc4MTJ2MjQyLjg0NzY1N2wyMTAuMjU3ODEyIDEyMS4zOTQ1MzF2LTI0Mi44NTE1NjJ6bTAgMCIvPjwvc3ZnPgo=);
        position: absolute;
        width: 20px;
        height: 20px;
        left: -2px;
        color: #7b7b7b;
      }
    `
    document.head.appendChild(styleEl)
  }

  graphChanged() {
    let parsed = []
    let threeExprs = []
    Calc.getState().expressions.list.map(expr => {
      if (expr.type == "text") {
        const text = expr.text || ""
        const parts = text.split(/^\s*@three\s*/)
        if (parts.length === 2) {
          try {
            parsed.push(...this.parse(parts[1]))
          } catch {
            console.warn("Parse Error. Oh well.")
          }
          threeExprs.push(expr.id)
        }
      }
    })
    // TODO: check for cyclic definitions
    // TODO: check for two+ cameras defined
    this.setThreeExprs(threeExprs)
    let changedDefinitions = {}
    let nextVariables = new Set()
    parsed.forEach(newDef => {
      const variable = newDef.variable;
      const oldDef = this.definitions[variable]
      if (nextVariables.has(variable)) {
        throw `Duplicate variable: ${variable}`
      }
      nextVariables.add(variable)
      if (!this.isDefinitionEqual(newDef, oldDef)) {
        changedDefinitions[variable] = newDef
      }
    })
    for (let variable in this.definitions) {
      if (!nextVariables.has(variable)) {
        this.changeVariable(variable, null)
      }
    }
    for (let variable in changedDefinitions) {
      this.changeVariable(variable, this.generateObject(changedDefinitions[variable]))
      this.definitions[variable] = changedDefinitions[variable]
    }
  }

  observeGraph() {
    Calc.observeEvent('change', () => this.graphChanged());
    this.graphChanged();
  }

  rerender() {
    // console.groupCollapsed("rerender", performance.now())
    // console.log(scene)
    // console.log(camera)
    // console.log(values)
    // console.log("defined:", Object.entries(values).filter(([e, v]) => v.isDefined).map(([e,v]) => e))
    // console.log("undefined:", Object.entries(values).filter(([e, v]) => !v.isDefined).map(([e,v]) => e))
    // console.groupEnd()
    this.renderer.render(this.scene, this.camera);
  }

  initDefaultCamera() {
    // default camera position
    this.camera = new THREE.PerspectiveCamera(
      75, // FOV (degrees)
      1, // aspect ratio, temp until first `applyGraphpaperBounds`
      0.1, 1000 // clipping plane
    );
    this.camera.position.x = 3
    this.camera.lookAt(0,0,0)
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.domElement.style.position = 'absolute';
    const container = document.querySelector(".dcg-container")
    container.prepend(this.renderer.domElement);
    container.querySelector(".dcg-grapher").style.opacity = 0
  }
}

class IntermediateObject {
  constructor(expectedArgs, args, threeObject) {
    this.threeObject = threeObject
    // expectedArgs: [{name:x, type:numericValue}]
    if (args.length !== expectedArgs.length) {
      // shouldn't get to this point
      throw "Argument length mismatch"
    }
    this.isDefined = false
    this.values = {}
    this.dependencies = {}
    this.helpers = {}
    if (expectedArgs.length === 0) {
      this.setDefined(true)
    }
    args.forEach((expr, i) => {
      const type = expectedArgs[i].type
      this.values[expectedArgs[i].name] = null;
      if (type == Type.NUM || type == Type.LIST) {
        const helper = helperExpression(expr, type, value => {
          this.changeArg(expectedArgs[i].name, value)
        })
        this.helpers[expectedArgs[i].name] = {
          type,
          helper,
        }
      } else {
        this.dependencies[expr] = expectedArgs[i].name
        if (CalcThree.values[expr]) {
          this.afterDepChanged(expr)
        }
        CalcThree.dependents[expr] = CalcThree.dependents[expr] || new Set()
        CalcThree.dependents[expr].add(this)
      }
    })
  }

  afterDepChanged(variable) {
    const argName = this.dependencies[variable]
    this.changeArg(argName, CalcThree.values[variable])
  }

  changeArg(argName, value) {
    this.values[argName] = value
    if (value === undefined) {
      if (this.isDefined) this.setDefined(false)
    } else {
      this.argChanged(argName, value)
      if (Object.values(this.values).some(e => e === null || e === undefined || e.isDefined === false)) {
        if (this.isDefined) this.setDefined(false)
      } else {
        this.setDefined(true)
      }
    }
  }

  setDefined(defined) {
    this.isDefined = defined
    if (this.type === Type.OBJECT3D) {
      this.threeObject.visible = defined
    }
    CalcThree.variableChanged(this.variable)
  }

  dispose() {
    console.log("disposing", this)
    // this.values.forEach((value, i) => {
    //   value.helper && value.helper.unObserve(value.type)
    // })
    this._dispose && this._dispose()
  }
}

class Color extends IntermediateObject {
  static type = Type.COLOR

  // forced to do this while there is no observe on advancedStyling colors
  constructor(args) {
    const expectedArgs = [
      {name: 'r', type: Type.NUM},
      {name: 'g', type: Type.NUM},
      {name: 'b', type: Type.NUM},
    ]
    super(expectedArgs, args, new THREE.Color())
  }

  static clampMapRGBComponent(x) {
    if (x < 0) return 0
    else if (x > 255) return 1
    else return x / 255
  }

  argChanged(name, value) {
    switch (name) {
      case 'r':
      case 'g':
      case 'b':
        this.threeObject[name] = Color.clampMapRGBComponent(value)
        break
    }
  }
}

class MeshMaterial extends IntermediateObject {
  static type = Type.MATERIAL

  constructor(args, threeObject) {
    const expectedArgs = [
      {name: 'color', type: Type.COLOR},
    ]
    super(expectedArgs, args, new threeObject())
  }

  argChanged(name, value) {
    switch (name) {
      case 'color':
        this.threeObject.color.set(value.threeObject)
        break
    }
  }
}

class MeshBasicMaterial extends MeshMaterial {
  // consistent color regardless of lighting
  constructor(args) {
    super(args, THREE.MeshBasicMaterial)
  }
}

class MeshLambertMaterial extends MeshMaterial {
  // needs lights
  constructor(args) {
    super(args, THREE.MeshLambertMaterial)
  }
}

class MeshPhongMaterial extends MeshMaterial {
  constructor(args) {
    super(args, THREE.MeshPhongMaterial)
  }
}

class MeshToonMaterial extends MeshMaterial {
  constructor(args) {
    super(args, THREE.MeshToonMaterial)
  }
}

class MeshNormalMaterial extends IntermediateObject {
  constructor(args) {
    super([], args, new THREE.MeshNormalMaterial())
  }
}

class MeshDepthMaterial extends IntermediateObject {
  // Because we use a logarithmic depth buffer, camera has to be *very*
  // close to the object to get any lightness (close to near value of clipping plane)
  constructor(args) {
    super([], args, new THREE.MeshDepthMaterial())
  }
}

class Light extends IntermediateObject {
  static type = Type.OBJECT

  constructor(args, threeObject) {
    const expectedArgs = [
      // NOTE: can add color, distance, decay
      // https://threejs.org/docs/index.html#api/en/lights/PointLight
      {name: 'color', type: Type.COLOR},
      {name: 'intensity', type: Type.NUM},
    ]
    super(expectedArgs, args, new threeObject())
  }

  argChanged(name, value) {
    switch (name) {
      case 'color':
        this.threeObject.color = value.threeObject
        break
      case 'intensity':
        this.threeObject.intensity = value
        break
    }
  }
}

class PointLight extends Light {
  constructor(args) {
    super(args, THREE.PointLight)
  }
}

class AmbientLight extends Light {
  constructor(args) {
    super(args, THREE.AmbientLight)
  }
}

class Position extends IntermediateObject {
  static type = Type.OBJECT

  constructor(args) {
    const expectedArgs = [
      {name: 'object', type: Type.OBJECT},
      {name: 'x', type: Type.NUM},
      {name: 'y', type: Type.NUM},
      {name: 'z', type: Type.NUM},
    ]
    super(expectedArgs, args, new THREE.Group())
  }

  argChanged(name, value) {
    switch (name) {
      case 'x':
      case 'y':
      case 'z':
        this.threeObject.position[name] = value
        break
      case 'object':
        // replace the current object
        this.threeObject.clear()
        this.threeObject.add(value.threeObject)
    }
  }
}

class PolyhedronGeometry extends IntermediateObject {
  static type = Type.GEOMETRY

  constructor(args, threeConstructor) {
    const expectedArgs = [
      {name: 'radius', type: Type.NUM}, // should default to 1
      {name: 'detail', type: Type.NUM}, // should default to 0
    ]
    super(expectedArgs, args, new threeConstructor(3, 0))
    this.threeConstructor = threeConstructor
  }

  argChanged(name, value) {
    switch (name) {
      case 'radius':
        // Any modification after instantiation does not change the geometry.
        // so must create a new object
        const detail = this.threeObject.parameters.detail
        this.threeObject.dispose()
        this.threeObject = new this.threeConstructor(value, detail)
        break
      case 'detail':
        const radius = this.threeObject.parameters.radius
        this.threeObject.dispose()
        this.threeObject = new this.threeConstructor(radius, value)
        break
    }
  }

  _dispose() {
    this.threeObject.dispose()
  }
}

class IcosahedronGeometry extends PolyhedronGeometry {
  constructor(args) {
    super(args, THREE.IcosahedronGeometry)
  }
}

class DodecahedronGeometry extends PolyhedronGeometry {
  constructor(args) {
    super(args, THREE.DodecahedronGeometry)
  }
}

class OctahedronGeometry extends PolyhedronGeometry {
  constructor(args) {
    super(args, THREE.OctahedronGeometry)
  }
}

class TetrahedronGeometry extends PolyhedronGeometry {
  constructor(args) {
    super(args, THREE.TetrahedronGeometry)
  }
}

class Mesh extends IntermediateObject {
  static type = Type.OBJECT

  constructor(args) {
    const expectedArgs = [
      {name: 'geometry', type: Type.GEOMETRY},
      {name: 'material', type: Type.MATERIAL}
    ]
    super(expectedArgs, args, new THREE.Mesh())
  }

  argChanged(name, value) {
    switch (name) {
      case 'geometry':
        // TODO; point by reference, so don't always need to change?
        // argChanged → changeArg
        // conditionally call `variableChanged` above
        this.threeObject.geometry = value.threeObject
        break
      case 'material':
        this.threeObject.material = value.threeObject
        break
    }
  }
}

class Show extends IntermediateObject {
  static type = Type.NULL

  constructor(args) {
    const expectedArgs = [
      {name: 'object', type: Type.OBJECT},
    ]
    super(expectedArgs, args, null)
  }

  argChanged(name, value) {
    switch (name) {
      case 'object':
        if (this.threeObject) {
          CalcThree.scene.remove(this.threeObject)
        }
        this.threeObject = value.threeObject
        CalcThree.scene.add(this.threeObject)
        break
    }
    CalcThree.rerender()
  }

  _dispose() {
    CalcThree.scene.remove(this.threeObject)
  }
}

class PerspectiveCamera extends IntermediateObject {
  static type = Type.CAMERA

  constructor(args) {
    const expectedArgs = [
      {name: 'x', type: Type.NUM},
      {name: 'y', type: Type.NUM},
      {name: 'z', type: Type.NUM},
      {name: 'lx', type: Type.NUM},
      {name: 'ly', type: Type.NUM},
      {name: 'lz', type: Type.NUM},
      {name: 'fov', type: Type.NUM},
      {name: 'near', type: Type.NUM},
      {name: 'far', type: Type.NUM},
    ]
    super(expectedArgs, args, new THREE.PerspectiveCamera(75, CalcThree.camera.aspect, 0.1, 1000))
    // this.controls = new OrbitControls(this.threeObject, renderer.domElement)
    this.lookAt = new THREE.Vector3(0, 0, 0)
    this.threeObject.lookAt(this.lookAt)
    CalcThree.camera = this.threeObject
  }

  argChanged(name, value) {
    switch (name) {
      case 'x':
      case 'y':
      case 'z':
        this.threeObject.position[name] = value
        break
      case 'lx':
        this.lookAt.setX(value)
        break
      case 'ly':
        this.lookAt.setY(value)
        break
      case 'lz':
        this.lookAt.setZ(value)
        break
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

  _dispose() {
    CalcThree.initDefaultCamera()
  }
}

const waitInterval = setInterval(() => {
  if (window.Calc) {
    clearInterval(waitInterval)
    THREE = window.THREE
    Calc = window.Calc
    CalcThree = new DesThree()
    CalcThree.init()
    window.CalcThree = CalcThree
  }
}, 50)
})();
