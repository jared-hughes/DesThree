## DesThree Changelog

The following guide describes changes in each version, including how to migrate graphs from earlier versions to later versions.

### 0.5.2

#### Enhancements

- New functions:
  - Plane, Disk, and Ring (#47)
  - DirectionalLight, SpotLight, HemisphereLight (#43)
  - GridHelper, PolarGridHelper, ArrowHelper, AxesHelper (#10)
  - LinearFog and ExpFog (#56)
  - LatheGeometry, ShapeGeometry, and ExtrudeGeoemtry (#38)
  - BufferGeometry (#36)
- Greatly improve performance for lists of objects (#27)
- Disable the 'int' keyword for integrals in DesThree expressions to allow typing 'PointLight' easily (#8)
- Add warnings for mismatched DesThree versions (#59)

#### Bug fixes

- Make DesThree functions more consistently unitalicized (#9)
- Fix loss of styling in many instances (#24)
- Fix loss of <kbd>insert three</kbd> button after edit list mode is toggled (#53)
- Other small fixes

#### Breaking Changes

No breaking changes are known.

#### Migrating from 0.5.1:

No manual action is required. Just open a DesThree v0.5.1 graph with the DesThree v0.5.2 userscript, and the header (with version) will be updated accordingly.

### 0.5.1

First release
