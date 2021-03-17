class Light extends IntermediateObject {
  static type = Type.OBJECT

  static expectedArgs() {
    return [
      {name: 'intensity', type: Type.NUM, default: 1},
      {name: 'color', type: Type.COLOR, default: new White()},
      {name: 'position', type: Type.VECTOR3, default: new ZeroVector3()},
      // TODO: additional args (distance, decay)
      // https://threejs.org/docs/index.html#api/en/lights/PointLight
    ]
  }

  constructor(args, threeObject) {
    super(new threeObject())
    this.applyArgs(args)
  }

  argChanged(name, value) {
    switch (name) {
      case 'color':
        this.threeObject.color = value.threeObject
        break
      case 'intensity':
        this.threeObject.intensity = value
        break
      case 'position':
        this.threeObject.position.copy(value.threeObject)
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
