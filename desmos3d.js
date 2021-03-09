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

// latest graph: https://www.desmos.com/calculator/oqacytx08i

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
  exprPrefix = "@3"

  funcs = {
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
    SphereGeometry,
    TorusGeometry,
    TorusKnotGeometry,
    CylinderGeometry,
    FrustumGeometry,
    ConeGeometry,
    BoxGeometry,
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

  constructor() {
    this.renderer = null
    this.scene = new THREE.Scene()
    this.camera = null
    this.definitions = {}
    this.values = {}
    this.dependents = {}
    this.maxFuncNameLength = Math.max(...Object.keys(this.funcs).map(c => c.length))
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

  deleteVariable(variable) {
    if (variable in this.values) {
      this.values[variable].dispose()
      delete this.values[variable]
    }
  }

  changeVariable(variable, valueFunc) {
    // pass in function instead of value itself to defer construction
    // until after deleting the variable
    this.deleteVariable(variable)
    if (valueFunc !== null) this.values[variable] = valueFunc()
    this.variableChanged(variable)
  }

  variableChanged(variable) {
    // console.log("variable changed", variable);
    (this.dependents[variable] || [])
    .forEach(object => object.afterDepChanged(variable))
  }

  generateObject(def) {
    if (def.func in this.funcs) {
      let object = new this.funcs[def.func](def.args)
      object.init()
      object.variable = def.variable
      return object
    } else {
      throw `Function ${def.func} not supported`
    }
  }

  setThreeExprs(ids) {
    // TODO
    document.querySelectorAll('.three-expr')
    .forEach(el => {
      el.classList.remove('three-expr')
    })
    const exprList = document.querySelector(".dcg-expressionlist")
    ids.forEach(id => {
      const outerDomNode = exprList.querySelector(`.dcg-expressionitem[expr-id="${id}"]`)
      let autoOperatorNames = outerDomNode.querySelector(".dcg-mq-math-mode")._mqMathFieldInstance.__controller.root.cursor.options.autoOperatorNames
      Object.keys(this.funcs).forEach(c => {
        autoOperatorNames[c] = c
      })
      autoOperatorNames._maxLength = Math.max(this.maxFuncNameLength, autoOperatorNames._maxLength)
      outerDomNode.classList.add('three-expr')
    })
  }

  injectStyle() {
    const styleEl = document.createElement('style')
    // <div>Icons made by <a href="https://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
    // Data URI with https://websemantics.uk/tools/image-to-data-uri-converter/
    styleEl.innerHTML = `
      .three-expr .dcg-tab-interior .dcg-tooltip-hit-area-container {
        display: none
      }
      .three-expr .dcg-tab-interior .dcg-expression-icon-container::before {
        content: "";
        background-image: url(data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjN2I3YjdiIiB3aWR0aD0iMjBweCIgaGVpZ2h0PSIyMHB4IiB2aWV3Qm94PSItMzAgMCA1MTEgNTEyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Im00MzYuMjIyNjU2IDEyMS4zNTkzNzUtMjEwLjIwNzAzMS0xMjEuMzU5Mzc1LTIxMC4yMDMxMjUgMTIxLjM1OTM3NSAyMTAuMjAzMTI1IDEyMS4zNjMyODF6bTAgMCIvPjxwYXRoIGQ9Im0yNDEuMjczNDM4IDUxMiAyMTAuMjYxNzE4LTEyMS4zOTQ1MzF2LTI0Mi44NDc2NTdsLTIxMC4yNjE3MTggMTIxLjM5MDYyNnptMCAwIi8+PHBhdGggZD0ibS41IDE0Ny43NTc4MTJ2MjQyLjg0NzY1N2wyMTAuMjU3ODEyIDEyMS4zOTQ1MzF2LTI0Mi44NTE1NjJ6bTAgMCIvPjwvc3ZnPgo=);
        position: absolute;
        width: 20px;
        height: 20px;
        top: 2px;
        left: 50%;
        transform: translateX(-50%)
      }
      .three-expr .dcg-expression-mathquill .dcg-mq-root-block > span:nth-child(-n+2) {
        display: none;
      }
    `
    document.head.appendChild(styleEl)
  }

  parseAssignment(text, index) {
    const assignRegex = /\s*(?<variable>\w+)\s*=\s*/y
    assignRegex.lastIndex = index
    const match = assignRegex.exec(text)
    if (match) {
      return {
        variable: match.groups.variable,
        nextIndex: assignRegex.lastIndex
      }
    } else {
      this.maxExpr = (this.maxExpr || 0) + 1
      return {
        variable: "__expr" + this.maxExpr,
        nextIndex: index
      }
    }
  }

  parseFuncName(text, index) {
    const funcNameRegex = /\s*(?:\\operatorname{)?(?<func>\w+)}?\s*\(/y
    funcNameRegex.lastIndex = index
    const match = funcNameRegex.exec(text)

    if (match) {
      return {
        func: match.groups.func,
        nextIndex: funcNameRegex.lastIndex
      }
    } else {
      throw "ParseError: expected function name"
    }
  }

  parseDesmos(text, index) {
    let braceStack = []
    let desmosLatex = ""
    for (; !([',',')'].includes(text[index]) && braceStack.length == 0); index++) {
      if (index >= text.length) {
        throw "ParseError: EOF before matched brace in DesmosLatex"
      }
      const c = text[index]
      if ("([{".includes(c)) {
        braceStack.push(c)
      } else if (")]}".includes(c)) {
        if ("([{"[")]}".indexOf(c)] != braceStack.pop()) {
          throw "ParseError: mismatched braces"
        }
      }
      desmosLatex += c
    }
    return {
      latex: desmosLatex.trim(),
      nextIndex: index,
    }
  }

  parseDesThreeVariable(text, index) {
    const variableRegex = /\s*(?<variable>\w+)\s*(?=\)|,)/y
    variableRegex.lastIndex = index
    const match = variableRegex.exec(text)

    if (match) {
      return {
        variable: match.groups.variable,
        nextIndex: variableRegex.lastIndex,
      }
    } else {
      return null
    }
  }

  parseDesThree(text, index) {
    const desVariable = this.parseDesThreeVariable(text, index)
    if (desVariable) {
      return {
        defs: [
          {
            variable: desVariable.variable,
            func: null,
            args: null,
          }
        ],
        nextIndex: desVariable.nextIndex,
      }
    }

    const {variable, nextIndex: i1} = this.parseAssignment(text, index)
    const {func, nextIndex: i2} = this.parseFuncName(text, i1)
    index = i2

    if (!func in this.funcs) {
      throw `Unidentified function: ${func}`
    }
    const expectedArgs = this.funcs[func].expectedArgs()
    let defs = []
    let args = []

    // 0-argument function
    const zeroArgument = text[index] == ')'
    for (; !zeroArgument && text[index-1] != ')'; index++) {
      if (index >= text.length) {
        throw "ParseError: EOF before closing DesThree matched brace"
      }
      const expectedType = expectedArgs[args.length].type
      if (expectedType === Type.NUM || expectedType === Type.LIST) {
        const {latex, nextIndex: i3} = this.parseDesmos(text, index)
        index = i3
        args.push(latex)
      } else {
        const {defs: argDefs, nextIndex: i4} = this.parseDesThree(text, index)
        index = i4
        defs.push(...argDefs)
        args.push(argDefs[argDefs.length-1].variable)
      }
    }

    defs.push({
      variable,
      func,
      args,
    })

    // return this function's definition preceded by all arguments' definitions
    return {
      defs,
      nextIndex: index,
    }
  }

  graphChanged() {
    // TODO: pass expression id into inner argument variable generator
    let threeExprs = new Set()
    let nextDefinitions = {} // {[expression id]: rawLatex}
    let nextExprVariables = {} // {[expression id]: [list of affected variables]}
    let nextVariables = new Set()
    Calc.getState().expressions.list.map(expr => {
    // try{
      const rawLatex = expr.latex || ""
      if (expr.type == "expression" && rawLatex.startsWith(this.exprPrefix)) {
        nextDefinitions[expr.id] = rawLatex
        threeExprs.add(expr.id)
        if (this.definitions[expr.id] == rawLatex) {
          // definition remains same; no change
          nextExprVariables[expr.id] = this.exprVariables[expr.id]
          this.exprVariables[expr.id].forEach(v => nextVariables.add(v))
        } else {
          // definition changed to a new definition
          const latex = rawLatex
            .slice(this.exprPrefix.length)
            .replaceAll(/\\left|\\right/g, "")
            .replaceAll(/\\ /g, " ")
          const {defs} = this.parseDesThree(latex, 0)
          nextExprVariables[expr.id] = []
          defs.forEach(newDef => {
            if (!newDef.func) return
            const variable = newDef.variable;
            if (nextVariables.has(variable)) {
              throw `Duplicate variable: ${variable}`
            }
            nextVariables.add(variable)
            nextExprVariables[expr.id].push(variable)
            // TODO: know this is a fresh variable?
            this.changeVariable(variable, () => this.generateObject(newDef))
          })
        }
      }
    // } catch {console.warn("ParseError. Proper handling TODO")}
    })

    // TODO: check for cyclic definitions
    // TODO: check for two+ cameras defined
    this.setThreeExprs(threeExprs)
    for (let variable in this.values) {
      if (!nextVariables.has(variable)) {
        // this variable was deleted from use
        this.changeVariable(variable, null)
      }
    }
    this.definitions = nextDefinitions
    this.exprVariables = nextExprVariables
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
  constructor(args, threeObject) {
    this.threeObject = threeObject
    this.isDefined = false
    this.values = {}
    this.dependencies = {}
    this.helpers = {}
    if (this.constructor.expectedArgs().length === 0) {
      this.setDefined(true)
    }
    this.args = args
  }

  init() {
    console.log("Initializing", this)
    this.constructor.expectedArgs().forEach((expectedArg, i) => {
      if (i < this.args.length) {
        const expr = this.args[i]
        this.values[expectedArg.name] = null;
        if (expectedArg.type == Type.NUM || expectedArg.type == Type.LIST) {
          const helper = helperExpression(expr, expectedArg.type, value => {
            this.changeArg(expectedArg.name, value)
          })
          this.helpers[expectedArg.name] = {
            type: expectedArg.type,
            helper,
          }
        } else {
          this.dependencies[expr] = expectedArg.name
          if (CalcThree.values[expr]) {
            this.afterDepChanged(expr)
          }
          CalcThree.dependents[expr] = CalcThree.dependents[expr] || new Set()
          CalcThree.dependents[expr].add(this)
        }
      } else if (i >= this.args.length && expectedArg.default !== undefined) {
        this.changeArg(expectedArg.name, expectedArg.default)
      } else {
        throw `Not enough arguments in call to ${this.constructor.name}: ${this.args.length}`
      }
    })
  }

  afterDepChanged(variable) {
    const argName = this.dependencies[variable]
    this.changeArg(argName, CalcThree.values[variable])
  }

  changeArg(argName, value) {
    // TODO: check type of arguments and map over lists
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
    console.log("Disposing", this)
    // this.values.forEach((value, i) => {
    //   value.helper && value.helper.unObserve(value.type)
    // })
    this._dispose && this._dispose()
  }
}

class Color extends IntermediateObject {
  static type = Type.COLOR

  static expectedArgs() {
    return [
      {name: 'r', type: Type.NUM},
      {name: 'g', type: Type.NUM},
      {name: 'b', type: Type.NUM},
    ]
  }

  // forced to do this while there is no observe on advancedStyling colors
  constructor(args) {
    super(args, new THREE.Color())
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

  static expectedArgs() {
    return [
      {name: 'color', type: Type.COLOR, default: {threeObject: new THREE.Color(255,255,255)}},
    ]
  }

  constructor(args, threeObject) {
    super(args, new threeObject())
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
  static type = Type.MATERIAL

  static expectedArgs() {
    return []
  }

  constructor(args) {
    super(args, new THREE.MeshNormalMaterial())
  }
}

class MeshDepthMaterial extends IntermediateObject {
  static expectedArgs() {
    return []
  }

  // Because we use a logarithmic depth buffer, camera has to be *very*
  // close to the object to get any lightness (close to near value of clipping plane)
  constructor(args) {
    super(args, new THREE.MeshDepthMaterial())
  }
}

class Light extends IntermediateObject {
  static type = Type.OBJECT

  static expectedArgs() {
    return [
      {name: 'intensity', type: Type.NUM, default: 1},
      {name: 'color', type: Type.COLOR, default: {threeObject: new THREE.Color(255,255,255)}},
      // TODO: additional args (distance, decay)
      // https://threejs.org/docs/index.html#api/en/lights/PointLight
    ]
  }

  constructor(args, threeObject) {
    super(args, new threeObject())
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

  static expectedArgs() {
    return [
      {name: 'object', type: Type.OBJECT},
      {name: 'x', type: Type.NUM},
      {name: 'y', type: Type.NUM},
      {name: 'z', type: Type.NUM},
    ]
  }

  constructor(args) {
    super(args, new THREE.Group())
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

class PassthroughGeometry extends IntermediateObject {
  static type = Type.GEOMETRY

  static expectedArgs() {
    let expectedArgs = this._expectedArgs()
    expectedArgs.order = expectedArgs.order || expectedArgs.map(({name}) => name)
    return expectedArgs
  }

  constructor(args, threeConstructor) {
    super(args, new threeConstructor())
    this.threeConstructor = threeConstructor
  }

  argChanged(name, value) {
    this.threeObject.dispose()
    this.threeObject = new this.threeConstructor(
      ...this.constructor.expectedArgs().order.map(name => this.values[name])
    )
  }

  _dispose() {
    this.threeObject.dispose()
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

class SphereGeometry extends PassthroughGeometry {
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

class TorusGeometry extends PassthroughGeometry {
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

class TorusKnotGeometry extends PassthroughGeometry {
  static _expectedArgs() {
    return [
      {name: 'radius', type: Type.NUM},
      {name: 'tube', type: Type.NUM},
      // note that this is in the reverse order of TorusGeometry
      {name: 'tubularSegments', type: Type.NUM, default: 64},
      {name: 'radialSegments', type: Type.NUM, default: 8},
      {name: 'p', type: Type.NUM, default: 2},
      {name: 'q', type: Type.NUM, default: 3},
    ]
  }

  constructor(args) {
    super(args, THREE.TorusKnotGeometry)
  }
}

class BoxGeometry extends PassthroughGeometry {
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

class ConeGeometry extends PassthroughGeometry {
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

class FrustumGeometry extends PassthroughGeometry {
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

class CylinderGeometry extends PassthroughGeometry {
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

class Mesh extends IntermediateObject {
  static type = Type.OBJECT

  static expectedArgs() {
    return [
      {name: 'geometry', type: Type.GEOMETRY},
      {name: 'material', type: Type.MATERIAL}
    ]
  }

  constructor(args) {
    super(args, new THREE.Mesh())
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

  static expectedArgs() {
    return [
      {name: 'object', type: Type.OBJECT},
    ]
  }

  constructor(args) {
    super(args, null)
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

  static expectedArgs() {
    return [
      {name: 'x', type: Type.NUM},
      {name: 'y', type: Type.NUM},
      {name: 'z', type: Type.NUM},
      {name: 'lx', type: Type.NUM, default: 0},
      {name: 'ly', type: Type.NUM, default: 0},
      {name: 'lz', type: Type.NUM, default: 0},
      {name: 'fov', type: Type.NUM, default: 75},
      {name: 'near', type: Type.NUM, default: 0.1},
      {name: 'far', type: Type.NUM, default: 1000},
    ]
  }

  constructor(args) {
    super(args, new THREE.PerspectiveCamera(75, CalcThree.camera.aspect, 0.1, 1000))
    // this.controls = new OrbitControls(this.threeObject, renderer.domElement)
    this.lookAt = new THREE.Vector3(0, 0, 0)
    this.threeObject.lookAt(this.lookAt)
    CalcThree.camera = this.threeObject
    CalcThree.applyGraphpaperBounds()
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
    // TODO: remove references to CalcThree elsewhere in the code
    CalcThree = new DesThree()
    CalcThree.init()
    window.CalcThree = CalcThree
  }
}, 50)
})();
