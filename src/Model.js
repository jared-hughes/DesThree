import * as THREE from 'three'
import MVCPart from 'MVCPart'
import { initGraphSettings, FogModes } from 'model/graphSettings'
/* global VERSION */

export default class Model extends MVCPart {
  constructor (calc3) {
    super(calc3)
    this.camera = null
    this.scene = new THREE.Scene()
    this.exprs = new Set()
    // reset on every graph load
    // TODO: persist save state
    this.graphSettings = initGraphSettings()
    this.fogThreeObject = null
  }

  init () {
    this.initDefaultCamera()
    this.initExpressionsObserver()
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

  initExpressionsObserver () {
    const targetNode = document.querySelector('.dcg-template-expressioneach')
    const config = { attributes: false, childList: true, subtree: false }
    const observer = new window.MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        for (const addedNode of mutation.addedNodes) {
          if (addedNode.nodeName === '#text') {
            continue
          }
          const id = addedNode.attributes['expr-id']?.value
          if (addedNode.classList.contains('dcg-mathitem') && this.exprs.has(id)) {
            this.view.updateThreeExpr(addedNode, id)
          }
        }
      }
    })
    observer.observe(targetNode, config)
  }

  setThreeExprs (exprs) {
    for (const id of this.exprs) {
      if (!exprs.has(id)) {
        this.view.removeThreeExpr(id)
      }
    }
    for (const id of exprs) {
      this.view.addThreeExpr(id)
    }
    this.exprs = exprs
  }

  setBounds (bounds) {
    this.view.setBounds(bounds)
    this.camera.aspect = bounds.width / bounds.height
    this.camera.updateProjectionMatrix()
    this.rerender()
  }

  rerender () {
    this.view.rerender()
  }

  clearHeader () {
    this.header = {}
  }

  applyHeaderData (expr, data) {
    this.header = data
    this.headerExpr = expr
    this.applyHeaderStyle()
  }

  applyHeaderStyle () {
    if (this.header.version === VERSION) {
      this.view.markCorrectVersion()
    } else {
      this.view.markWrongVersion()
    }
  }

  initDefaultHeader () {
    this.header = {
      version: VERSION
    }
    this.insertHeader()
  }

  insertHeader () {
    const lines = [
      `⚠️ Heads up! This graph requires DesThree version ${VERSION} to be viewed as intended. Install DesThree at https://github.com/jared-hughes/DesThree#Installation.`
    ]
    const e = this.calc.controller.createItemModel({
      id: '@3-header', // + this.calc.controller.generateId(),
      type: 'text',
      text: lines.join('\n')
    })
    this.calc.controller._toplevelInsertItemAt(0, e, true, undefined)
    this.calc.controller._closeAddExpression()
    // this.view.markCorrectVersion()
  }

  applyGraphSettingsJSON (json) {
    if (json !== this.graphSettingsJSON) {
      const obj = JSON.parse(json)
      this.graphSettings = obj
      this.applyFog(this.graphSettings)
    }
  }

  setGraphSettingsProperty (key, value) {
    this.graphSettings[key] = value
    this.graphSettingsJSON = JSON.stringify(this.graphSettings)
    this.calc.controller.dispatch({
      type: 'set-graph-settings',
      xAxisLabel: this.graphSettingsJSON
    })
    switch (key) {
      case 'fogMode':
      case 'fogNearLatex':
      case 'fogFarLatex':
      case 'fogColorLatex':
      case 'fogDensityLatex':
        this.applyFog(this.graphSettings)
        break
      case 'camPositionLatex':
      case 'camLookAtLatex':
      case 'camFOVLatex':
      case 'camNearLatex':
      case 'camFarLatex':
        this.applyCamera(this.graphSettings)
        break
      default:
        throw new Error(`Unexpected property: ${key}`)
    }
  }

  applyFog ({ fogMode, fogNearLatex, fogFarLatex, fogColorLatex, fogDensityLatex }) {
    const colorAppendString = fogColorLatex ? ',' + fogColorLatex : ''
    if (fogMode === FogModes.NONE) {
      this.controller.evaluator.deleteVariable('__fog')
    } else if (fogMode === FogModes.LINEAR) {
      this.controller.evaluator.addNewExpression(
        `__fog=LinearFog(${fogNearLatex}, ${fogFarLatex}${colorAppendString})`,
        '__fog',
        true
      )
    } else if (fogMode === FogModes.EXP) {
      this.controller.evaluator.addNewExpression(
        `__fog=FogExp2(${fogDensityLatex}${colorAppendString})`,
        '__fog',
        true
      )
    }
    this.rerender()
  }

  applyCamera ({ camPositionLatex, camLookAtLatex, camFOVLatex, camNearLatex, camFarLatex }) {
    const args = [
      camPositionLatex, camLookAtLatex, camFOVLatex, camNearLatex, camFarLatex
    ]
    this.controller.evaluator.addNewExpression(
      `__cam=PerspectiveCamera(${args.join(',')})`,
      '__cam',
      true
    )
  }
}
