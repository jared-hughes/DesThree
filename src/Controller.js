import Parser from './controller/Parser'
import functionNames from './functions/functionNames'
import { FunctionApplicationList } from './functions/functionSupers'
import MVCPart from 'MVCPart'

export default class Controller extends MVCPart {
  constructor (calc3) {
    super(calc3)
    this.parser = new Parser()
  }

  init () {
    this.observeGraph()
    this.observeGraphpaperBounds()
    this.initDispatchListener()
  }

  handleDispatchedEvent (e) {
    switch (e.type) {
      case 'toggle-add-expression':
        this.view.modifyAddExpressionDropdown()
        break
    }
  }

  initDispatchListener () {
    this.calc.controller.dispatcher.register(e => this.handleDispatchedEvent(e))
  }

  generateObject (def) {
    if (def.func in functionNames) {
      const object = new FunctionApplicationList(this.calc3, functionNames[def.func], def.args)
      object.variable = def.variable
      return { object: object }
    } else {
      return { error: `Function ${def.func} not supported` }
    }
  }

  observeGraph () {
    this.calc.observeEvent('change', () => this.graphChanged())
    this.graphChanged()
  }

  graphChanged () {
    // TODO: pass expression id into inner argument variable generator
    const threeExprs = new Set()
    const errorsByExprId = {}
    const nextDefinitions = {} // {[expression id]: rawLatex}
    const nextExprVariables = {} // {[expression id]: [list of affected variables]}
    const nextVariables = new Set()
    // TODO: can this just be this.calc.getExpressions()?
    this.calc.getState().expressions.list.forEach(expr => {
      const rawLatex = expr.latex || ''
      if (expr.type === 'expression' && rawLatex.startsWith('@3')) {
        nextDefinitions[expr.id] = rawLatex
        threeExprs.add(expr.id)
        if (this.model.definitions[expr.id] === rawLatex) {
          // definition remains same; no change
          nextExprVariables[expr.id] = this.model.exprVariables[expr.id]
          this.model.exprVariables[expr.id].forEach(v => nextVariables.add(v))
        } else {
          // definition changed to a new definition
          const latex = rawLatex
            .slice(2) // slice off the '@3'
            .replaceAll(/\\left|\\right/g, '')
            .replaceAll(/\\ /g, ' ')
          const { error, defs } = this.parser.parseDesThree(latex, 0)
          nextExprVariables[expr.id] = []
          if (error) {
            // TODO: better error handling (GH#7). This is repeated 3+ times
            console.warn(error)
            errorsByExprId[expr.id] = error
          } else {
            defs.forEach(newDef => {
              if (newDef.func === null || newDef.func === undefined) return
              const variable = newDef.variable
              if (nextVariables.has(variable)) {
                const error = `Duplicate variable: ${variable}`
                console.warn(error)
                errorsByExprId[expr.id] = error
              } else {
                nextVariables.add(variable)
                nextExprVariables[expr.id].push(variable)
                // TODO: know this is a fresh variable?
                const { object, error } = this.generateObject(newDef)
                if (error) {
                  console.warn(error)
                  errorsByExprId[expr.id] = error
                } else {
                  this.model.changeVariable(variable, () => object)
                }
              }
            })
          }
        }
      }
    })

    // TODO: check for cyclic definitions
    // TODO: check for two+ cameras defined
    this.model.setThreeExprs(threeExprs, errorsByExprId)

    for (const variable in this.model.values) {
      if (!nextVariables.has(variable)) {
        // this variable was deleted from use
        this.model.changeVariable(variable, null)
      }
    }
    this.model.setDefinitions(nextDefinitions)
    this.model.exprVariables = nextExprVariables
  }

  observeGraphpaperBounds () {
    // the observer doesn't get called the first time
    this.applyGraphpaperBounds()
    this.calc.observe('graphpaperBounds', () => this.applyGraphpaperBounds())
  }

  applyGraphpaperBounds () {
    const bounds = this.calc.graphpaperBounds.pixelCoordinates
    this.model.setBounds(bounds)
  }
}
