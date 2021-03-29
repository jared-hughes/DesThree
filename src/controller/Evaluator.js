import MVCPart from 'MVCPart'
import Parser from 'controller/Parser'
import { FunctionApplicationList } from 'functions/functionSupers'

export default class Evaluator extends MVCPart {
  constructor (calc3) {
    super(calc3)
    this.parser = new Parser()
    this.values = {} // {variableName: FunctionApplicationList value}
    this.dependents = {} // {variableName: FunctionApplicationList object dependents}
    this.errorMessages = {} // {exprID: error message}
    this.exprVariables = {} // {exprID: list of variables defined in that experssion}
    this.latexDefinitions = {} // {exprID: raw latex of expression} (to check for change)
  }

  startUpdateBatch () {
    this.nextDefinedVariables = new Set()
  }

  endUpdateBatch () {
    for (const variable in this.values) {
      if (!this.nextDefinedVariables.has(variable)) {
        // this variable was deleted from use
        this.changeVariable(variable, null)
      }
    }
  }

  generateObject (variable, func, args) {
    const object = new FunctionApplicationList(this.calc3, func, args)
    object.variable = variable
    return { object: object }
  }

  // const nextDefinitions = {} // {[expression id]: rawLatex}
  // const nextVariables = new Set()

  addDefinition (variable, func, args, exprID) {
    if (func === null || func === undefined) return
    if (this.nextDefinedVariables.has(variable)) {
      const error = `Duplicate variable: ${variable}`
      console.warn(error)
      this.errorMessages[exprID] = error
    } else {
      this.nextDefinedVariables.add(variable)
      this.exprVariables[exprID].push(variable)
      // TODO: know this is a fresh variable?
      const { object, error } = this.generateObject(variable, func, args)
      if (error) {
        console.warn(error)
        this.errorMessages[exprID] = error
      } else {
        this.changeVariable(variable, () => object)
      }
    }
  }

  addNewExpression (latex, exprID) {
    // definition changed to a new definition
    const { error, defs } = this.parser.parseDesThree(latex, 0)
    this.exprVariables[exprID] = []
    if (error) {
      // TODO: better error handling (GH#7). This is repeated 3+ times
      console.warn(error)
      this.errorMessages[exprID] = error
    } else {
      defs.forEach(newDef => {
        this.addDefinition(newDef.variable, newDef.func, newDef.args, exprID)
      })
    }
  }

  addExpressionMaybeDuplicate (rawLatex, exprID) {
    if (this.latexDefinitions[exprID] === rawLatex) {
      // expression carries over, and its variables remain
      this.exprVariables[exprID].forEach(v => this.nextDefinedVariables.add(v))
    } else {
      this.latexDefinitions[exprID] = rawLatex
      this.addNewExpression(
        rawLatex.slice(2) // slice off the '@3'
          .replaceAll(/\\left|\\right/g, '')
          .replaceAll(/\\ /g, ' '),
        exprID
      )
    }
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
    if (valueFunc !== null) {
      const value = valueFunc()
      if (value.error) {
        console.warn(value.error)
      } else {
        this.values[variable] = value
      }
    }
    this.variableChanged(variable)
  }

  variableChanged (variable) {
    /* DEV-START */
    console.log('variable changed', variable);
    /* DEV-END */
    (this.dependents[variable] || [])
      .forEach(object => object.afterDepChanged(variable))
  }
}
