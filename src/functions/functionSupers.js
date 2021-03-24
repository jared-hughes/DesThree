import { helperExpression, applyToEntries } from '../utils'

export const Type = Object.freeze({
  NUM: 'numericValue',
  LIST: 'listValue',
  COLOR: 'Color',
  VECTOR2: 'Vector2',
  VECTOR3: 'Vector3',
  FACE3: 'Face3',
  MATERIAL: 'Material',
  GEOMETRY: 'Geometry',
  OBJECT: 'Object', // subclass of THREE.Object3D; includes light and mesh; anything that can move in 3D
  NULL: 'Null'
})

export class FunctionApplicationList {
  constructor (calc3, Func, args) {
    this.calc3 = calc3
    this.isDefined = false
    // childObjects is a list or a single object
    this.childObjects = []
    this.argValues = {}
    this.expectedArgsByName = {}
    this.Func = Func
    this.dependencies = {}
    this.type = Func.type

    /* DEV-START */
    console.log('Initializing', Func.name, args)
    /* DEV-END */

    if (Func.expectedArgs().length === 0) {
      this.childObjects = new Func(this.argValues)
      this.childObjects.init(this.calc3)
      this.setDefined(true)
    }

    Func.expectedArgs().forEach((expectedArg, i) => {
      this.expectedArgsByName[expectedArg.name] = expectedArg
      if (i < args.length) {
        const expr = args[i]
        this.argValues[expectedArg.name] = expectedArg.default ?? null
        if (expectedArg.type === Type.NUM || expectedArg.type === Type.LIST) {
          // Desmos request #78115: 'numericValue' event is triggered for both
          // numeric and list values in some cases. May cause issues.
          helperExpression(
            this.calc3.calc, expr, 'listValue',
            value => {
              this.changeArg(expectedArg.name, value)
            }
          )
          helperExpression(
            this.calc3.calc, expr, 'numericValue',
            value => {
              if (expectedArg.type !== Type.LIST && !isNaN(value)) {
                this.changeArg(expectedArg.name, value)
              }
            }
          )
        } else {
          this.dependencies[expr] = expectedArg.name
          if (this.calc3.model.values[expr]) {
            this.afterDepChanged(expr)
          }
          this.calc3.model.dependents[expr] = this.calc3.model.dependents[expr] || new Set()
          this.calc3.model.dependents[expr].add(this)
        }
      } else if (i >= args.length && expectedArg.default !== undefined) {
        this.changeArg(expectedArg.name, expectedArg.default)
      } else {
        this.changeArg(expectedArg.name, undefined)
        // throw Error(`Not enough arguments in call to function: ${args.length}`)
      }
    })
  }

  afterDepChanged (variable) {
    const argName = this.dependencies[variable]
    this.changeArg(argName, this.calc3.model.values[variable])
  }

  static index (v, i) {
    return (v.childObjects && v.childObjects[i]) ?? // FunctionApplicationList with several values
      v.childObjects ?? // FunctionApplicationList with one value
      v[i] ?? // List of numbers
      v // Single number
  }

  changeArg (argName, value) {
    // value is either a list of (argument type) or a single (argument type)
    if (value === undefined) {
      // simply mark undefined; don't dispose until later
      if (this.isDefined) this.setDefined(false)
      return
    }

    this.argValues[argName] = value

    const expectedArg = this.expectedArgsByName[argName]
    const expectedType = expectedArg.type
    if (expectedType === Type.LIST && value.length === undefined) {
      // this.throw("Expected a list but received a number")
    }
    if (expectedType !== Type.LIST && expectedType !== Type.NUM && expectedType !== value.type) {
      // this.throw(`TypeError in function ${this.Func.name}: Expected ${expectedType} but received ${value.type}`)
    }
    if (expectedArg.takesList && value.length === undefined) {
      // this.throw('Expected a list of ${expectedType} but only got one')
    }

    const expectedArgValues = this.Func.expectedArgs().map(({ name }) => this.argValues[name])
    if (expectedArgValues.some(e => e === null || e === undefined || e.isDefined === false)) {
      if (this.isDefined) this.setDefined(false)
    } else {
      const minLength = Math.min(
        ...Object.keys(this.argValues)
          .map(argName => (
            this.expectedArgsByName[argName].takesList
              ? Infinity
              : (
                  this.argValues[argName].childObjects?.length ??
                  this.argValues[argName].length ??
                  Infinity
                )
          ))
      )
      if (minLength === this.childObjects.length) {
        // number of children stayed same, so just change their args
        if (minLength !== Infinity && !expectedArg.takesList) {
          /* DEV-START */
          console.log('List value changed: ', argName, value)
          /* DEV-END */
          this.map((obj, i) => obj.argChanged(argName, FunctionApplicationList.index(value, i)))
        } else {
          /* DEV-START */
          console.log('Single value changed: ', argName, value)
          /* DEV-END */
          this.childObjects.argChanged(argName, value)
        }
      } else {
        // number of children changed, so reinitialize
        this.dispose()

        this.childObjects = []
        for (let i = 0; i < (minLength === Infinity ? 1 : minLength); i++) {
          const object = new this.Func(
            applyToEntries(this.argValues, (v, argName) => (
              this.expectedArgsByName[argName].takesList
                ? v
                : FunctionApplicationList.index(v, i)
            ))
          )
          object.init(this.calc3)
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

  setDefined (defined) {
    /* DEV-START */
    if (defined) {
      console.log('Now defined: ', this)
    } else {
      this.map(obj => obj.hide && obj.hide())
    }
    /* DEV-END */
    const wasDefined = this.isDefined
    this.isDefined = defined
    this.calc3.model.variableChanged(this.variable)
    // defined: about to be visible, so have to rerender
    // wasDefined && !defined: was defined but now is not
    if ((defined || wasDefined) && this.Func.affectsScene) {
      this.calc3.model.rerender()
    }
  }

  map (func) {
    if (this.childObjects.map) {
      return this.childObjects.map(func)
    } else {
      return func(this.childObjects)
    }
  }

  dispose () {
    /* DEV-START */
    console.log('Disposing', this)
    /* DEV-END */
    this.map(e => e.dispose())
  }
}

export class FunctionApplication {
  constructor (threeObject) {
    this.threeObject = threeObject
  }

  init (calc3) {

  }

  dispose () {
    this.threeObject?.dispose && this.threeObject.dispose()
  }

  applyArgs (args) {
    Object.entries(args)
      .map(([k, v]) => v !== undefined && this.argChanged(k, v))
  }
}

export class ConstructorPassthrough extends FunctionApplication {
  static expectedArgs () {
    const expectedArgs = this._expectedArgs()
    expectedArgs.order = expectedArgs.order || expectedArgs.map(({ name }) => name)
    return expectedArgs
  }

  constructor (args, ThreeConstructor, argsInit) {
    super(null)
    this.values = {}
    this.ThreeConstructor = ThreeConstructor
    this.applyArgs(args)
  }

  argChanged (name, value) {
    this.values[name] = value
    this.threeObject?.dispose && this.threeObject.dispose()
    delete this.threeObject
    this.threeObject = new this.ThreeConstructor(
      ...this.constructor.expectedArgs().order
        .map(name => (
          (
            this.values[name]?.childObjects && // FunctionApplicationList
            this.values[name]?.map(e => e.threeObject)
          ) ??
          this.values[name]?.threeObject ?? // FunctionApplication
          this.values[name] // number
        ))
    )
  }
}
