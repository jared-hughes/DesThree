import MVCPart from 'MVCPart'
import Evaluator from 'controller/Evaluator'

export default class Controller extends MVCPart {
  constructor (calc3) {
    super(calc3)
    this.evaluator = new Evaluator(calc3)
  }

  init () {
    this.initDispatchListener()
    this.observeGraph()
    this.observeGraphpaperBounds()
    this.freshGraph()
  }

  handleDispatchedEvent (e) {
    /* DEV-START */
    console.log('Event', e)
    /* DEV-END */
    switch (e.type) {
      case 'toggle-add-expression':
        this.view.modifyAddExpressionDropdown()
        break
      case 'show-expressions-list':
        this.graphChanged()
        this.model.applyHeaderStyle()
        this.model.initExpressionsObserver()
        break
      case 'toggle-graph-settings':
        this.view.mountSettings()
        break
      case 'set-state':
        this.freshGraph()
        break
    }
  }

  setGraphSettings (e) {
    for (const k in e) {
      this.model.setGraphSettingsProperty(k, e[k])
    }
    if ('fogMode' in e) {
      this.view.updateSettingsView()
    }
  }

  initDispatchListener () {
    this.calc.controller.dispatcher.register(e => this.handleDispatchedEvent(e))
  }

  observeGraph () {
    this.calc.observeEvent('change', () => this.graphChanged())
    this.graphChanged()
  }

  foundHeader (expr) {
    const regex = /version (?<version>\d+\.\d+\.\d+(?:-dev)?)/
    const match = expr.text.match(regex)
    if (match === null) {
      throw new Error(`version not found in header ${expr.text}`)
    }
    const graphVersion = match.groups.version
    this.model.applyHeaderData(expr, {
      version: graphVersion
    })
  }

  freshGraph () {
    this.model.applyGraphSettingsJSON(
      this.calc.controller.getGraphSettings().xAxisLabel
    )
    this.graphChanged()
  }

  graphChanged () {
    // TODO: pass expression id into inner argument variable generator
    this.model.clearHeader()
    let headerFound = false
    let hasDesThree = false
    const threeExprs = new Set()

    this.evaluator.startUpdateBatch()
    this.calc.getState().expressions.list.forEach(expr => {
      if (expr.id === '@3-header') {
        headerFound = true
        this.foundHeader(expr)
      }
      const rawLatex = expr.latex || ''
      if (expr.type === 'expression' && rawLatex.startsWith('@3')) {
        hasDesThree = true
        threeExprs.add(expr.id)
        this.evaluator.addExpressionMaybeDuplicate(rawLatex, expr.id)
      }
    })
    if (!headerFound && hasDesThree) {
      this.model.initDefaultHeader()
    }
    this.evaluator.endUpdateBatch()

    // TODO: check for cyclic definitions
    // TODO: check for two+ cameras defined
    this.model.setThreeExprs(threeExprs)
    this.view.applyHasDesThree(hasDesThree)
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

  getGraphSettings () {
    return this.model.graphSettings
  }

  dispatch (e) {
    this.calc.controller.dispatch(e)
  }
}
