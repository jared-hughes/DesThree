// ==UserScript==
// @name         DesThree
// @namespace    http://github.com/jared-hughes
// @version      0.3.0
// @description  Desmos bindings for three.js
// @author       Jared Hughes (fireflame241)
// @match        https://www.desmos.com/calculator/*
// @match        https://www.desmos.com/calculator
// @downloadURL  https://github.com/jared-hughes/DesThree/raw/master/desThree.user.js
// @updateURL    https://github.com/jared-hughes/DesThree/raw/master/desThree.user.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/three.js/r126/three.min.js
// @grant        none
// ==/UserScript==

(function() {
'use strict';

let Calc
let THREE
let CalcThree

const Type = Object.freeze({
  NUM: 'numericValue',
  LIST: 'listValue',
  COLOR: 'Color',
  'VECTOR3': 'Vector3',
  MATERIAL: 'Material',
  GEOMETRY: 'Geometry',
  OBJECT: 'Object', // subclass of THREE.Object3D; includes light and mesh; anything that can move in 3D
  CAMERA: 'Camera',
  NULL: 'Null',
})

function applyToEntries(object, func) {
  return Object.fromEntries(
    Object.entries(object)
      .map(([k,v]) => [k, func(v)])
  )
}

function helperExpression(expr, type, callback) {
  let helper = Calc.HelperExpression({latex: expr})
  helper.observe(type, () => {
    // check for isNaN to get around HelperExpression({latex: "5"})
    // having a numericValue of NaN (Desmos request #77875). Bug does not occur for lists
    const val = helper.listValue ?? (isNaN(helper.numericValue) ? parseFloat(expr) : helper.numericValue)
    callback(val)
  })
  return helper
}

class DesThree {
  funcs = {
    'ColorRGB': Color,
    '': Vector3,
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
    this.initDropdownListener()
    this.observeGraphpaperBounds()
    this.observeGraph()
  }

  initDropdownListener() {
    const targetNode = document.querySelector('.dcg-add-expression-container')
    const config = { attributes: false, childList: true, subtree: true }
    const observer = new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        const newExpressionNode = targetNode.querySelector('.dcg-action-newexpression')
        const newThreeNode = targetNode.querySelector('.three-action-newexpression')
        if (targetNode.querySelector('.dcg-icon-new-expression') && !newThreeNode) {
          const newNode = newExpressionNode.cloneNode(true)
          newNode.classList.remove('dcg-action-newexpression')
          newNode.classList.add('three-action-newexpression')
          newNode.querySelector('i').nextSibling.nodeValue = 'three'
          newNode.addEventListener('click', () => {
            let d = Calc.controller.createItemModel({
              latex: "@3",
              type: 'expression',
              id: Calc.controller.generateId(),
              color: Calc.controller.getNextColor(),
            })
            Calc.controller.setEditListMode(false)
            Calc.controller._toplevelNewItemAtSelection(d, {
              shouldFocus: true,
            })
            Calc.controller._closeAddExpression()
            Calc.controller.updateRenderShellsBeforePaint()
            Calc.controller.updateViews()
            Calc.controller.scrollSelectedItemIntoView()
            Calc.controller.updateRenderShellsAfterDispatch()
          })
          console.log(newNode, newExpressionNode)
          newExpressionNode.after(newNode)
        }
      }
    })
    observer.observe(targetNode, config)
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

  throw(msg) {
    this.errorMessage = msg
    throw msg
  }

  generateObject(def) {
    if (def.func in this.funcs) {
      let object = new IntermediateObjectList(this.funcs[def.func], def.args)
      object.variable = def.variable
      return object
    } else {
      this.throw(`Function ${def.func} not supported`)
    }
  }

  getExprElement(id) {
    return document.querySelector(".dcg-expressionlist")
      .querySelector(`.dcg-expressionitem[expr-id="${id}"]`)
  }

  setThreeExprs(ids) {
    document.querySelectorAll('.three-expr')
    .forEach(el => {
      el.classList.remove('three-expr')
    })
    ids.forEach(id => {
      const outerDomNode = this.getExprElement(id)
      const mqField = outerDomNode.querySelector(".dcg-mq-editable-field")
      const atElement = mqField.querySelector('.dcg-mq-nonSymbola')
      if (atElement && atElement.innerHTML == "@") {
        atElement.remove()
        const digit3Element = mqField.querySelector('.dcg-mq-digit')
        digit3Element?.remove()
      }
      let autoOperatorNames = mqField._mqMathFieldInstance.__controller.root.cursor.options.autoOperatorNames
      Object.keys(this.funcs).forEach(c => {
        autoOperatorNames[c] = c
      })
      autoOperatorNames._maxLength = Math.max(this.maxFuncNameLength, autoOperatorNames._maxLength)
      outerDomNode.classList.add('three-expr')
    })
  }

  setExprError(id) {
    this.getExprElement(id).classList.add('three-error')
  }

  clearExprError(id) {
    this.getExprElement(id).classList.remove('three-error')
  }

  injectStyle() {
    const styleEl = document.createElement('style')
    // <div>Icons made by <a href="https://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
    // Data URI with https://websemantics.uk/tools/image-to-data-uri-converter/
    styleEl.innerHTML = `
      .three-expr:not(.three-error) .dcg-tab-interior .dcg-tooltip-hit-area-container {
        display: none
      }
      .three-expr:not(.three-error) .dcg-tab-interior .dcg-expression-icon-container::before {
        content: "";
        position: absolute;
        width: 20px;
        height: 20px;
        top: 2px;
        left: 50%;
        transform: translateX(-50%)
      }
      .three-expr:not(.three-error) .dcg-tab-interior .dcg-expression-icon-container::before,
      .three-action-newexpression .dcg-icon-new-expression::before {
        background-image: url(data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjN2I3YjdiIiB3aWR0aD0iMjBweCIgaGVpZ2h0PSIyMHB4IiB2aWV3Qm94PSItMzAgMCA1MTEgNTEyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Im00MzYuMjIyNjU2IDEyMS4zNTkzNzUtMjEwLjIwNzAzMS0xMjEuMzU5Mzc1LTIxMC4yMDMxMjUgMTIxLjM1OTM3NSAyMTAuMjAzMTI1IDEyMS4zNjMyODF6bTAgMCIvPjxwYXRoIGQ9Im0yNDEuMjczNDM4IDUxMiAyMTAuMjYxNzE4LTEyMS4zOTQ1MzF2LTI0Mi44NDc2NTdsLTIxMC4yNjE3MTggMTIxLjM5MDYyNnptMCAwIi8+PHBhdGggZD0ibS41IDE0Ny43NTc4MTJ2MjQyLjg0NzY1N2wyMTAuMjU3ODEyIDEyMS4zOTQ1MzF2LTI0Mi44NTE1NjJ6bTAgMCIvPjwvc3ZnPgo=);
      }
      .three-action-newexpression .dcg-icon-new-expression::before {
        color: rgba(0,0,0,0);
        background-size: cover;
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
    const funcNameRegex = /\s*(?:\\operatorname{)?(?<func>\w*)}?\s*\(/y
    funcNameRegex.lastIndex = index
    const match = funcNameRegex.exec(text)

    if (match) {
      return {
        func: match.groups.func,
        nextIndex: funcNameRegex.lastIndex
      }
    } else {
      this.throw("ParseError: expected function name")
    }
  }

  parseDesmos(text, index) {
    let braceStack = []
    let desmosLatex = ""
    for (; !([',',')'].includes(text[index]) && braceStack.length == 0); index++) {
      if (index >= text.length) {
        this.throw("ParseError: EOF before matched brace in DesmosLatex")
      }
      const c = text[index]
      if ("([{".includes(c)) {
        braceStack.push(c)
      } else if (")]}".includes(c)) {
        if ("([{"[")]}".indexOf(c)] != braceStack.pop()) {
          this.throw("ParseError: mismatched braces")
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

    if (this.funcs[func] === undefined) {
      this.throw(`Unidentified function: ${func}`)
    }
    const expectedArgs = this.funcs[func].expectedArgs()
    let defs = []
    let args = []

    // 0-argument function
    const zeroArgument = text[index] == ')'
    for (; !zeroArgument && text[index-1] != ')'; index++) {
      if (index >= text.length) {
        this.throw("ParseError: EOF before closing DesThree matched brace")
      }
      if (args.length >= expectedArgs.length) {
        this.throw(`ParseError: too many arguments in call to ${func}`)
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
      nextIndex: index + zeroArgument,
    }
  }

  graphChanged() {
    // TODO: pass expression id into inner argument variable generator
    let threeExprs = new Set()
    let nextDefinitions = {} // {[expression id]: rawLatex}
    let nextExprVariables = {} // {[expression id]: [list of affected variables]}
    let nextVariables = new Set()
    Calc.getState().expressions.list.map(expr => {
      const rawLatex = expr.latex || ""
      if (expr.type == 'expression' && rawLatex.startsWith('@3')) {
        nextDefinitions[expr.id] = rawLatex
        threeExprs.add(expr.id)
        if (this.definitions[expr.id] == rawLatex) {
          // definition remains same; no change
          nextExprVariables[expr.id] = this.exprVariables[expr.id]
          this.exprVariables[expr.id].forEach(v => nextVariables.add(v))
        } else {
          // definition changed to a new definition
          const latex = rawLatex
            .slice(2) // slice off the '@3'
            .replaceAll(/\\left|\\right/g, "")
            .replaceAll(/\\ /g, " ")
          try {
            const {defs} = this.parseDesThree(latex, 0)
            nextExprVariables[expr.id] = []
            defs.forEach(newDef => {
              if (newDef.func === null || newDef.func === undefined) return
              const variable = newDef.variable;
              if (nextVariables.has(variable)) {
                this.throw(`Duplicate variable: ${variable}`)
              }
              nextVariables.add(variable)
              nextExprVariables[expr.id].push(variable)
              // TODO: know this is a fresh variable?
              this.changeVariable(variable, () => this.generateObject(newDef))
            })
            this.clearExprError(expr.id)
          } catch {
            console.warn(this.errorMessage)
            this.setExprError(expr.id)
          }
        }
      }
    })

    this.setCanvasVisible(Object.keys(nextDefinitions).length > 0)

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
    console.groupCollapsed("rerender", performance.now())
    console.log(this.scene)
    console.log(this.camera)
    console.log(this.values)
    console.groupEnd()
    this.renderer.render(this.scene, this.camera)
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
    this.container = document.querySelector(".dcg-container")
    this.container.prepend(this.renderer.domElement);
  }

  setCanvasVisible(isVisible) {
    this.renderer.domElement.style.visibility = isVisible ? "" : "hidden"
    this.container.querySelector(".dcg-grapher").style.visibility = isVisible ? "hidden" : ""
  }
}

class IntermediateObjectList {
  constructor(func, args) {
    this.isDefined = false
    // childObjects is a list or a single object
    this.childObjects = []
    this.argValues = {}
    this.func = func
    this.dependencies = {}
    this.type = func.type

    console.log("Initializing", func.name, args)

    if (func.expectedArgs().length === 0) {
      this.childObjects = new func(this.argValues)
      this.setDefined(true)
    }

    func.expectedArgs().forEach((expectedArg, i) => {
      if (i < args.length) {
        const expr = args[i]
        this.argValues[expectedArg.name] = expectedArg.default ?? null;
        if (expectedArg.type == Type.NUM || expectedArg.type == Type.LIST) {
          // Desmos request #78115: 'numericValue' event is triggered for both
          // numeric and list values in some cases. May cause issues.
          const helper = helperExpression(expr, 'listValue', value => {
            this.changeArg(expectedArg.name, value)
          })
          const helper0 = helperExpression(expr, 'numericValue', value => {
            if (expectedArg.type !== Type.LIST && !isNaN(value)) {
              this.changeArg(expectedArg.name, value)
            }
          })
        } else {
          this.dependencies[expr] = expectedArg.name
          if (CalcThree.values[expr]) {
            this.afterDepChanged(expr)
          }
          CalcThree.dependents[expr] = CalcThree.dependents[expr] || new Set()
          CalcThree.dependents[expr].add(this)
        }
      } else if (i >= args.length && expectedArg.default !== undefined) {
        this.changeArg(expectedArg.name, expectedArg.default)
      } else {
        this.throw(`Not enough arguments in call to ${this.constructor.name}: ${args.length}`)
      }
    })
  }

  afterDepChanged(variable) {
    const argName = this.dependencies[variable]
    this.changeArg(argName, CalcThree.values[variable])
  }

  static index(v, i) {
    return (v.childObjects && v.childObjects[i]) // IntermediateObjectList with several values
      ?? v.childObjects // IntermediateObjectList with one value
      ?? v[i] // List of numbers
      ?? v // Single number
  }

  changeArg(argName, value) {
    // value is either a list of (argument type) or a single (argument type)
    const oldValue = this.argValues[argName]
    if (value === undefined) {
      // simply mark undefined; don't dispose until later
      if (this.isDefined) this.setDefined(false)
      return
    }

    const expectedType = this.func.expectedArgs().filter(({name}) => name === argName)[0].type;
    if (expectedType === Type.LIST && value.length === undefined) {
      this.throw("Expected a list but received a number")
    }
    if (expectedType !== Type.LIST && expectedType !== Type.NUM && expectedType !== value.type) {
      this.throw(`TypeError in function ${this.func.name}: Expected ${expectedType} but received ${value.type}`)
    }

    this.argValues[argName] = value

    if (Object.values(this.argValues).some(e => e === null || e === undefined || e.isDefined === false)) {
      if (this.isDefined) this.setDefined(false)
    } else {
      const minLength = Math.min(...Object.values(this.argValues).map(e => e.childObjects?.length ?? e.length ?? Infinity))
      if (minLength === this.childObjects.length) {
        // number of children stayed same, so just change their args
        if (minLength !== Infinity) {
          console.log("List value changed: ", argName, value)
          this.forEach((obj, i) => {
            obj.argChanged(argName, IntermediateObjectList.index(value, i))
          })
        } else {
          console.log("Single value changed: ", argName, value)
          this.childObjects.argChanged(argName, value)
        }
      } else {
        // number of children changed, so reinitialize
        this.dispose()

        this.childObjects = []
        for (let i=0; i < (minLength === Infinity ? 1 : minLength); i++) {
          let object = new this.func(
            applyToEntries(this.argValues, v => IntermediateObjectList.index(v, i))
          )
          this.childObjects.push(object)
        }
        if (minLength === Infinity) {
          // all arguments are a single value, not a list
          this.childObjects = this.childObjects[0]
        }
      }
      this.setDefined(true)
    }
  }

  setDefined(defined) {
    this.isDefined = defined
    if (defined) {
      console.log("Now defined: ", this)
    }
    this.forEach(obj => {
      if (obj.type === Type.OBJECT3D) {
        obj.threeObject.visible = defined
      }
    })
    CalcThree.variableChanged(this.variable)
  }

  forEach(func) {
    if (this.childObjects.length !== undefined) {
      this.childObjects.forEach(func)
    } else {
      func(this.childObjects)
    }
  }

  dispose() {
    console.log("Disposing", this)
    this.forEach(e => e.dispose())
    this.childObjects = null
  }
}

class IntermediateObject {
  constructor(threeObject) {
    this.threeObject = threeObject
  }

  dispose() {
    this.threeObject.dispose && this.threeObject.dispose()
  }

  applyArgs(args) {
    Object.entries(args)
      .map(([k, v]) => v !== undefined && this.argChanged(k, v))
  }
}

class ZeroVector3 extends IntermediateObject {
  type = Type.VECTOR3
  threeObject = new THREE.Vector3(0, 0, 0)
}

class Vector3 extends IntermediateObject {
  static type = Type.VECTOR3

  static expectedArgs() {
    return [
      {name: 'x', type: Type.NUM},
      {name: 'y', type: Type.NUM},
      {name: 'z', type: Type.NUM},
    ]
  }

  constructor(args) {
    super(new THREE.Vector3(args.x, args.y, args.z))
  }

  argChanged(name, value) {
    switch (name) {
      case 'x':
      case 'y':
      case 'z':
        this.threeObject[name] = value
        break
    }
  }
}

class White {
  type = Type.COLOR
  threeObject = new THREE.Color(1, 1, 1)
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
    super(
      new THREE.Color(
        ...['r','g','b']
        .map(c => Color.clampMapRGBComponent(args[c]))
      )
    )
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
      {name: 'color', type: Type.COLOR, default: new White()},
    ]
  }

  constructor(args, threeObject) {
    super(new threeObject({color: args.color.threeObject}))
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
    super(new THREE.MeshNormalMaterial())
  }
}

class MeshDepthMaterial extends IntermediateObject {
  static expectedArgs() {
    return []
  }

  // Because we use a logarithmic depth buffer, camera has to be *very*
  // close to the object to get any lightness (close to near value of clipping plane)
  constructor(args) {
    super(new THREE.MeshDepthMaterial())
  }
}

class Light extends IntermediateObject {
  static type = Type.OBJECT

  static expectedArgs() {
    return [
      {name: 'intensity', type: Type.NUM, default: 1},
      {name: 'color', type: Type.COLOR, default: new White()},
      // TODO: additional args (distance, decay)
      // https://threejs.org/docs/index.html#api/en/lights/PointLight
    ]
  }

  constructor(args, threeObject) {
    super(new threeObject(args.color.threeObject, args.intensity))
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
  // https://threejs.org/docs/index.html#api/en/objects/Group
  static type = Type.OBJECT

  static expectedArgs() {
    return [
      {name: 'object', type: Type.OBJECT},
      {name: 'position', type: Type.VECTOR3},
    ]
  }

  constructor(args) {
    // TODO: InstancedMesh ("Use InstancedMesh if you have to render a large number of objects with the same geometry and material but with different world transformations.")
    super(new THREE.Group())
    this.applyArgs(args)
  }

  argChanged(name, value) {
    switch (name) {
      case 'position':
        this.threeObject.position.copy(value.threeObject)
        break
      case 'object':
        // replace the current object
        this.threeObject.clear()
        // need to add to a group instead of just setting position of clone
        // in case there is an offset position of a position
        this.threeObject.add(value.threeObject.clone())
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
    super(new THREE.Mesh(args.geometry?.threeObject, args.material?.threeObject))
  }

  argChanged(name, value) {
    switch (name) {
      case 'geometry':
        // TODO; point by reference, so don't always need to change?
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
    super(null)
    this.applyArgs(args)
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

  dispose() {
    CalcThree.scene.remove(this.threeObject)
  }
}

class PerspectiveCamera extends IntermediateObject {
  static type = Type.CAMERA

  static expectedArgs() {
    return [
      {name: 'position', type: Type.VECTOR3},
      {name: 'lookAt', type: Type.VECTOR3, default: new ZeroVector3()},
      {name: 'fov', type: Type.NUM, default: 75},
      {name: 'near', type: Type.NUM, default: 0.1},
      {name: 'far', type: Type.NUM, default: 1000},
    ]
  }

  constructor(args) {
    super(new THREE.PerspectiveCamera(args.fov, CalcThree.camera.aspect, args.near, args.far))
    this.lookAt = new THREE.Vector3(0, 0, 0)
    this.applyArgs(args)
    CalcThree.camera = this.threeObject
    CalcThree.applyGraphpaperBounds()
  }

  argChanged(name, value) {
    switch (name) {
      case 'position':
        this.threeObject.position.copy(value.threeObject)
        break
      case 'lookAt':
        this.lookAt.copy(value.threeObject)
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

  dispose() {
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
