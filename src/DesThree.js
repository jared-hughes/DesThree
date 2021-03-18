import functionNames from './functions/functionNames'
import { Type, FunctionApplicationList } from './functions/functionSupers'
import * as THREE from 'three'

export default class DesThree {
  constructor (calculator) {
    this.calculator = calculator
    this.renderer = null
    this.scene = new THREE.Scene()
    this.camera = null
    this.definitions = {}
    this.values = {}
    this.dependents = {}
    this.maxFuncNameLength = Math.max(...Object.keys(functionNames).map(c => c.length))
  }

  init () {
    this.initDefaultCamera()
    this.injectStyle()
    this.initRenderer()
    this.initDropdownListener()
    this.observeGraphpaperBounds()
    this.observeGraph()
  }

  initDropdownListener () {
    const targetNode = document.querySelector('.dcg-add-expression-container')
    const config = { attributes: false, childList: true, subtree: true }
    const observer = new window.MutationObserver((mutationsList, observer) => {
      const newExpressionNode = targetNode.querySelector('.dcg-action-newexpression')
      const newThreeNode = targetNode.querySelector('.three-action-newexpression')
      if (targetNode.querySelector('.dcg-icon-new-expression') && !newThreeNode) {
        const newNode = newExpressionNode.cloneNode(true)
        newNode.classList.remove('dcg-action-newexpression')
        newNode.classList.add('three-action-newexpression')
        newNode.querySelector('i').nextSibling.nodeValue = 'three'
        newNode.addEventListener('click', () => {
          const d = this.calculator.controller.createItemModel({
            latex: '@3',
            type: 'expression',
            id: this.calculator.controller.generateId(),
            color: this.calculator.controller.getNextColor()
          })
          this.calculator.controller.setEditListMode(false)
          this.calculator.controller._toplevelNewItemAtSelection(d, {
            shouldFocus: true
          })
          this.calculator.controller._closeAddExpression()
          this.calculator.controller.updateRenderShellsBeforePaint()
          this.calculator.controller.updateViews()
          this.calculator.controller.scrollSelectedItemIntoView()
          this.calculator.controller.updateRenderShellsAfterDispatch()
        })
        newExpressionNode.after(newNode)
      }
    })
    observer.observe(targetNode, config)
  }

  applyGraphpaperBounds () {
    const bounds = this.calculator.graphpaperBounds.pixelCoordinates
    this.renderer.setSize(bounds.width, bounds.height)
    this.renderer.domElement.width = bounds.width
    this.renderer.domElement.height = bounds.height
    // top is always 0
    this.renderer.domElement.style.left = bounds.left + 'px'
    this.camera.aspect = bounds.width / bounds.height
    this.camera.updateProjectionMatrix()
    this.rerender()
  }

  observeGraphpaperBounds () {
    // the observer doesn't get called the first time
    this.applyGraphpaperBounds()
    this.calculator.observe('graphpaperBounds', () => this.applyGraphpaperBounds())
  }

  deleteVariable (variable) {
    if (variable in this.values) {
      this.values[variable].dispose()
      delete this.values[variable]
    }
  }

  changeVariable (variable, valueFunc) {
    // pass in function instead of value itself to defer construction
    // until after deleting the variable
    this.deleteVariable(variable)
    if (valueFunc !== null) this.values[variable] = valueFunc()
    this.variableChanged(variable)
  }

  variableChanged (variable) {
    // console.log("variable changed", variable);
    (this.dependents[variable] || [])
      .forEach(object => object.afterDepChanged(variable))
  }

  throw (msg) {
    this.errorMessage = msg
    throw msg
  }

  generateObject (def) {
    if (def.func in functionNames) {
      const object = new FunctionApplicationList(this, functionNames[def.func], def.args)
      object.variable = def.variable
      return object
    } else {
      this.throw(`Function ${def.func} not supported`)
    }
  }

  getExprElement (id) {
    return document.querySelector('.dcg-expressionlist')
      .querySelector(`.dcg-expressionitem[expr-id="${id}"]`)
  }

  setThreeExprs (ids) {
    document.querySelectorAll('.three-expr')
      .forEach(el => {
        el.classList.remove('three-expr')
      })
    ids.forEach(id => {
      const outerDomNode = this.getExprElement(id)
      const mqField = outerDomNode?.querySelector('.dcg-mq-editable-field')
      if (!mqField) {
        console.warn(`Could not find mqField for expression id ${id}.`)
        return
      }
      const atElement = mqField.querySelector('.dcg-mq-nonSymbola')
      if (atElement && atElement.innerHTML === '@') {
        atElement.remove()
        const digit3Element = mqField.querySelector('.dcg-mq-digit')
        digit3Element?.remove()
      }
      const autoOperatorNames = mqField._mqMathFieldInstance.__controller.root.cursor.options.autoOperatorNames
      Object.keys(functionNames).forEach(c => {
        autoOperatorNames[c] = c
      })
      autoOperatorNames._maxLength = Math.max(this.maxFuncNameLength, autoOperatorNames._maxLength)
      outerDomNode.classList.add('three-expr')
    })
  }

  setExprError (id) {
    this.getExprElement(id).classList.add('three-error')
  }

  clearExprError (id) {
    this.getExprElement(id).classList.remove('three-error')
  }

  injectStyle () {
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

  parseAssignment (text, index) {
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
        variable: '__expr' + this.maxExpr,
        nextIndex: index
      }
    }
  }

  parseFuncName (text, index) {
    const funcNameRegex = /\s*(?:\\operatorname{)?(?<func>\w*)}?\s*\(/y
    funcNameRegex.lastIndex = index
    const match = funcNameRegex.exec(text)

    if (match) {
      return {
        func: match.groups.func,
        nextIndex: funcNameRegex.lastIndex
      }
    } else {
      this.throw('ParseError: expected function name')
    }
  }

  parseDesmos (text, index) {
    const braceStack = []
    let desmosLatex = ''
    for (; !([',', ')'].includes(text[index]) && braceStack.length === 0); index++) {
      if (index >= text.length) {
        this.throw('ParseError: EOF before matched brace in DesmosLatex')
      }
      const c = text[index]
      if ('([{'.includes(c)) {
        braceStack.push(c)
      } else if (')]}'.includes(c)) {
        if ('([{'[')]}'.indexOf(c)] !== braceStack.pop()) {
          this.throw('ParseError: mismatched braces')
        }
      }
      desmosLatex += c
    }
    return {
      latex: desmosLatex.trim(),
      nextIndex: index
    }
  }

  parseDesThreeVariable (text, index) {
    const variableRegex = /\s*(?<variable>[a-zA-Z]\w*)\s*(?=\)|,)/y
    variableRegex.lastIndex = index
    const match = variableRegex.exec(text)

    if (match) {
      return {
        variable: match.groups.variable,
        nextIndex: variableRegex.lastIndex
      }
    } else {
      return null
    }
  }

  parseDesThree (text, index) {
    const desVariable = this.parseDesThreeVariable(text, index)
    if (desVariable) {
      return {
        defs: [
          {
            variable: desVariable.variable,
            func: null,
            args: null
          }
        ],
        nextIndex: desVariable.nextIndex
      }
    }

    const { variable, nextIndex: i1 } = this.parseAssignment(text, index)
    const { func, nextIndex: i2 } = this.parseFuncName(text, i1)
    index = i2

    if (functionNames[func] === undefined) {
      this.throw(`Unidentified function: ${func}`)
    }
    const expectedArgs = functionNames[func].expectedArgs()
    const defs = []
    const args = []

    // 0-argument function
    const zeroArgument = text[index] === ')'
    if (!zeroArgument) {
      for (; text[index - 1] !== ')'; index++) {
        if (index >= text.length) {
          this.throw('ParseError: EOF before closing DesThree matched brace')
        }
        if (args.length >= expectedArgs.length) {
          this.throw(`ParseError: too many arguments in call to ${func}`)
        }
        const expectedType = expectedArgs[args.length].type
        if (expectedType === Type.NUM || expectedType === Type.LIST) {
          const { latex, nextIndex: i3 } = this.parseDesmos(text, index)
          index = i3
          args.push(latex)
        } else {
          const { defs: argDefs, nextIndex: i4 } = this.parseDesThree(text, index)
          index = i4
          defs.push(...argDefs)
          args.push(argDefs[argDefs.length - 1].variable)
        }
      }
    }

    defs.push({
      variable,
      func,
      args
    })

    // return this function's definition preceded by all arguments' definitions
    return {
      defs,
      nextIndex: index + zeroArgument
    }
  }

  graphChanged () {
    // TODO: pass expression id into inner argument variable generator
    const threeExprs = new Set()
    const nextDefinitions = {} // {[expression id]: rawLatex}
    const nextExprVariables = {} // {[expression id]: [list of affected variables]}
    const nextVariables = new Set()
    this.calculator.getState().expressions.list.forEach(expr => {
      const rawLatex = expr.latex || ''
      if (expr.type === 'expression' && rawLatex.startsWith('@3')) {
        nextDefinitions[expr.id] = rawLatex
        threeExprs.add(expr.id)
        if (this.definitions[expr.id] === rawLatex) {
          // definition remains same; no change
          nextExprVariables[expr.id] = this.exprVariables[expr.id]
          this.exprVariables[expr.id].forEach(v => nextVariables.add(v))
        } else {
          // definition changed to a new definition
          const latex = rawLatex
            .slice(2) // slice off the '@3'
            .replaceAll(/\\left|\\right/g, '')
            .replaceAll(/\\ /g, ' ')
          try {
            const { defs } = this.parseDesThree(latex, 0)
            nextExprVariables[expr.id] = []
            defs.forEach(newDef => {
              if (newDef.func === null || newDef.func === undefined) return
              const variable = newDef.variable
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
    for (const variable in this.values) {
      if (!nextVariables.has(variable)) {
        // this variable was deleted from use
        this.changeVariable(variable, null)
      }
    }
    this.definitions = nextDefinitions
    this.exprVariables = nextExprVariables
  }

  observeGraph () {
    this.calculator.observeEvent('change', () => this.graphChanged())
    this.graphChanged()
  }

  rerender () {
    /* DEV-START */
    console.groupCollapsed('rerender', window.performance.now())
    console.log(this.scene)
    console.log(this.camera)
    console.log(this.values)
    console.groupEnd()
    /* DEV-END */
    this.renderer.render(this.scene, this.camera)
  }

  initDefaultCamera () {
    // default camera position
    this.camera = new THREE.PerspectiveCamera(
      75, // FOV (degrees)
      1, // aspect ratio, temp until first `applyGraphpaperBounds`
      0.1, 1000 // clipping plane
    )
    this.camera.position.x = 3
    this.camera.lookAt(0, 0, 0)
  }

  initRenderer () {
    this.renderer = new THREE.WebGLRenderer()
    this.renderer.domElement.style.position = 'absolute'
    this.container = document.querySelector('.dcg-container')
    this.container.prepend(this.renderer.domElement)
  }

  setCanvasVisible (isVisible) {
    this.renderer.domElement.style.visibility = isVisible ? '' : 'hidden'
    this.container.querySelector('.dcg-grapher').style.visibility = isVisible ? 'hidden' : ''
  }
}
