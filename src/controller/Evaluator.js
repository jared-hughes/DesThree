import MVCPart from 'MVCPart'
import Parser from 'controller/Parser'
import { Type, FunctionApplicationList } from 'functions/functionSupers'
import { helperExpression, cleanLatex } from 'utils'

export default class Evaluator extends MVCPart {
  constructor (calc3) {
    super(calc3)
    this.parser = new Parser()
    this.values = {} // {variableName: FunctionApplicationList value}
    this.dependents = {} // {variableName: FunctionApplicationList object dependents}
    this.errorMessages = {} // {exprID: error message}
    this.exprVariables = {} // {exprID: list of variables defined in that experssion}
    this.latexDefinitions = {} // {exprID: raw latex of expression} (to check for change)
    // detached variables are not cleared when the expressions list changes
    this.detachedVariables = new Set() // set of variable names
  }

  clearDetachedVariables () {
    this.detachedVariables = new Set()
    this.detachedVariables.forEach(varName => this.deleteVariable(varName))
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

  registerHelperExpression (object, expr, expectedArg) {
    // Desmos request #78115: 'numericValue' event is triggered for both
    // numeric and list values in some cases. May cause issues.
    helperExpression(
      this.calc3.calc, expr, 'listValue',
      value => {
        object.changeArg(expectedArg.name, value)
      }
    )
    helperExpression(
      this.calc3.calc, expr, 'numericValue',
      value => {
        if (expectedArg.type !== Type.LIST && !isNaN(value)) {
          object.changeArg(expectedArg.name, value)
        }
      }
    )
  }

  registerDependence (object, varName, expectedArg) {
    object.dependencies[varName] = expectedArg.name
    if (this.values[varName]) {
      object.changeArg(expectedArg.name, this.values[varName])
    }
    this.dependents[varName] = this.dependents[varName] || new Set()
    this.dependents[varName].add(object)
  }

  generateObject (varName, func, args) {
    const onSetDefined = () => this.variableChanged(varName)
    const object = new FunctionApplicationList(this.calc3, func, args, onSetDefined)

    func.expectedArgs().forEach((expectedArg, i) => {
      object.expectedArgsByName[expectedArg.name] = expectedArg
      if (i < args.length) {
        const expr = args[i]
        object.argValues[expectedArg.name] = expectedArg.default ?? null
        if (expectedArg.type === Type.NUM || expectedArg.type === Type.LIST) {
          this.registerHelperExpression(object, expr, expectedArg)
        } else {
          this.registerDependence(object, expr, expectedArg)
        }
      } else if (i >= args.length && expectedArg.default !== undefined) {
        object.changeArg(expectedArg.name, expectedArg.default)
      } else {
        object.changeArg(expectedArg.name, undefined)
        // throw Error(`Not enough arguments in call to function: ${args.length}`)
      }
    })

    return { object: object }
  }

  addDefinition (variable, func, args, exprID, isDetached) {
    if (func === null || func === undefined) return
    if (isDetached && this.detachedVariables.has(variable)) {
      this.deleteVariable(variable)
    }
    if (this.nextDefinedVariables.has(variable) || this.detachedVariables.has(variable)) {
      const error = `Duplicate variable: ${variable}`
      console.warn(error)
      this.errorMessages[exprID] = error
    } else {
      this.nextDefinedVariables.add(variable)
      if (isDetached) {
        this.detachedVariables.add(variable)
      }
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

  addNewExpression (latex, exprID, isDetached = false) {
    // definition changed to a new definition
    const { error, defs } = this.parser.parseDesThree(
      cleanLatex(latex),
      0,
      isDetached ? { enablePrivates: true } : {}
    )
    this.exprVariables[exprID] = []
    if (error) {
      // TODO: better error handling (GH#7). This is repeated 3+ times
      console.warn(error)
      this.errorMessages[exprID] = error
    } else {
      defs.forEach(newDef => {
        this.addDefinition(
          newDef.variable, newDef.func, newDef.args, exprID, isDetached
        )
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
        rawLatex.slice(2), // slice off the '@3'
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
      .forEach(object => {
        const argName = object.dependencies[variable]
        object.changeArg(argName, this.values[variable])
      })
  }
}
