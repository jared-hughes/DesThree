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

class MeshNormalMaterialStatic extends IntermediateObject {
  type = Type.MATERIAL
  threeObject = new THREE.MeshNormalMaterial()
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
