import { helperExpression, applyToEntries } from '../utils'

export const Type = Object.freeze({
  NUM: 'numericValue',
  LIST: 'listValue',
  COLOR: 'Color',
  VECTOR3: 'Vector3',
  MATERIAL: 'Material',
  GEOMETRY: 'Geometry',
  OBJECT: 'Object', // subclass of THREE.Object3D; includes light and mesh; anything that can move in 3D
  CAMERA: 'Camera',
  NULL: 'Null'
})

export class FunctionApplicationList {
  constructor (calc3, Func, args) {
    this.calc3 = calc3
    this.isDefined = false
    // childObjects is a list or a single object
    this.childObjects = []
    this.argValues = {}
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
        // this.throw(`Not enough arguments in call to ${this.constructor.name}: ${args.length}`)
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

    const expectedType = this.Func.expectedArgs().filter(({ name }) => name === argName)[0].type
    if (expectedType === Type.LIST && value.length === undefined) {
      // this.throw("Expected a list but received a number")
    }
    if (expectedType !== Type.LIST && expectedType !== Type.NUM && expectedType !== value.type) {
      // this.throw(`TypeError in function ${this.Func.name}: Expected ${expectedType} but received ${value.type}`)
    }

    this.argValues[argName] = value

    if (Object.values(this.argValues).some(e => e === null || e === undefined || e.isDefined === false)) {
      if (this.isDefined) this.setDefined(false)
    } else {
      const minLength = Math.min(...Object.values(this.argValues).map(e => e.childObjects?.length ?? e.length ?? Infinity))
      if (minLength === this.childObjects.length) {
        // number of children stayed same, so just change their args
        if (minLength !== Infinity) {
          /* DEV-START */
          console.log('List value changed: ', argName, value)
          /* DEV-END */
          this.forEach((obj, i) => {
            obj.argChanged(argName, FunctionApplicationList.index(value, i))
          })
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
            applyToEntries(this.argValues, v => FunctionApplicationList.index(v, i))
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
    this.isDefined = defined
    /* DEV-START */
    if (defined) {
      console.log('Now defined: ', this)
    }
    /* DEV-END */
    this.forEach(obj => {
      if (obj.type === Type.OBJECT3D) {
        obj.threeObject.visible = defined
      }
    })
    this.calc3.model.variableChanged(this.variable)
  }

  forEach (func) {
    if (this.childObjects.length !== undefined) {
      this.childObjects.forEach(func)
    } else {
      func(this.childObjects)
    }
  }

  dispose () {
    /* DEV-START */
    console.log('Disposing', this)
    /* DEV-END */
    this.forEach(e => e.dispose())
  }
}

export class FunctionApplication {
  constructor (threeObject) {
    this.threeObject = threeObject
  }

  init (calc3) {

  }

  dispose () {
    this.threeObject.dispose && this.threeObject.dispose()
  }

  applyArgs (args) {
    Object.entries(args)
      .map(([k, v]) => v !== undefined && this.argChanged(k, v))
  }
}
