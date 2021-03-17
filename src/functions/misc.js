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
