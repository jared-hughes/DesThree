import * as THREE from 'three'
import functionNames, { maxFuncNameLength } from './functions/functionNames'
import MVCPart from 'MVCPart'
/* global VERSION */

export default class View extends MVCPart {
  constructor (calc3) {
    super(calc3)
    this.renderer = null
  }

  init () {
    this.injectStyle()
    this.initRenderer()
  }

  modifyAddExpressionDropdown () {
    if (!document.querySelector('.three-action-newexpression')) {
      const newExpressionNode = document.querySelector('.dcg-action-newexpression')
      const newThreeNode = document.querySelector('.three-action-newexpression')
      if (document.querySelector('.dcg-icon-new-expression') && !newThreeNode) {
        const newNode = newExpressionNode.cloneNode(true)
        newNode.classList.remove('dcg-action-newexpression')
        newNode.classList.add('three-action-newexpression')
        newNode.querySelector('i').nextSibling.nodeValue = 'three'
        newNode.addEventListener('click', () => {
          const d = this.calc.controller.createItemModel({
            latex: '@3',
            type: 'expression',
            id: this.calc.controller.generateId(),
            color: this.calc.controller.getNextColor()
          })
          this.calc.controller.setEditListMode(false)
          this.calc.controller._toplevelNewItemAtSelection(d, {
            shouldFocus: true
          })
          this.calc.controller._closeAddExpression()
          this.calc.controller.updateRenderShellsBeforePaint()
          this.calc.controller.updateViews()
          this.calc.controller.scrollSelectedItemIntoView()
          this.calc.controller.updateRenderShellsAfterDispatch()
        })
        newExpressionNode.after(newNode)
      }
    }
  }

  getExprElement (id) {
    return document.querySelector('.dcg-expressionlist')
      .querySelector(`.dcg-expressionitem[expr-id="${id}"]`)
  }

  updateThreeExpr (outerDomNode, id, error) {
    if (outerDomNode === null) {
      // occurs when the node is inside a collapsed folder
      return
    }
    outerDomNode.classList.add('three-expr')
    if (error) {
      outerDomNode.classList.add('three-error')
    } else {
      outerDomNode.classList.remove('three-error')
    }
    const mqField = outerDomNode?.querySelector('.dcg-mq-editable-field')
    if (mqField) {
      const opt = mqField._mqMathFieldInstance.__controller.root.cursor.options
      const autoOperatorNames = opt.autoOperatorNames
      delete opt.autoCommands.int
      Object.keys(functionNames).forEach(c => {
        autoOperatorNames[c] = c
      })
      autoOperatorNames._maxLength = Math.max(maxFuncNameLength, autoOperatorNames._maxLength)
      // Don't re-render math on the currently selected expression
      // because that messes with cursor
      const mathField = mqField._mqViewInstance.mathField
      if (this.calc.selectedExpressionId !== id && mathField) {
        // force a re-render of the MathQuill without changing graph state
        // warning: if `latex` is changed, MathQuill will apply that change
        //   next time there is any user change to the latex.
        const latex = mathField.latex()
        mqField._mqMathFieldInstance.__controller.renderLatexMath(latex)
      }
    }
  }

  addThreeExpr (id, error) {
    this.updateThreeExpr(this.getExprElement(id), id, error)
  }

  removeThreeExpr (id) {
    const outerDomNode = this.getExprElement(id)
    if (outerDomNode) {
      outerDomNode.classList.remove('three-expr')
      outerDomNode.classList.remove('three-error')
    }
  }

  injectStyle () {
    const styleEl = document.createElement('style')
    // <div>Icons made by <a href="https://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
    // Data URI with https://websemantics.uk/tools/image-to-data-uri-converter/
    function outermostMQ (selector) {
      return `.three-expr .dcg-expression-mathquill .dcg-mq-root-block
      > ${selector}:not(.dcg-mq-selection),
      .three-expr .dcg-expression-mathquill .dcg-mq-root-block
      > .dcg-mq-selection:nth-child(-n+2) > ${selector}`
    }
    styleEl.innerHTML = `
      .three-expr:not(.three-error) .dcg-tab-interior .dcg-tooltip-hit-area-container {
        display: none
      }
      .three-expr:not(.three-error) .dcg-tab-interior .dcg-expression-icon-container::before {
        content: "";
        position: absolute;
        width: 20px;
        height: 20px;
        top: 2px;
        left: 50%;
        transform: translateX(-50%)
      }
      .three-expr:not(.three-error) .dcg-tab-interior .dcg-expression-icon-container::before,
      .three-action-newexpression .dcg-icon-new-expression::before {
        background-image: url(data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjN2I3YjdiIiB3aWR0aD0iMjBweCIgaGVpZ2h0PSIyMHB4IiB2aWV3Qm94PSItMzAgMCA1MTEgNTEyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Im00MzYuMjIyNjU2IDEyMS4zNTkzNzUtMjEwLjIwNzAzMS0xMjEuMzU5Mzc1LTIxMC4yMDMxMjUgMTIxLjM1OTM3NSAyMTAuMjAzMTI1IDEyMS4zNjMyODF6bTAgMCIvPjxwYXRoIGQ9Im0yNDEuMjczNDM4IDUxMiAyMTAuMjYxNzE4LTEyMS4zOTQ1MzF2LTI0Mi44NDc2NTdsLTIxMC4yNjE3MTggMTIxLjM5MDYyNnptMCAwIi8+PHBhdGggZD0ibS41IDE0Ny43NTc4MTJ2MjQyLjg0NzY1N2wyMTAuMjU3ODEyIDEyMS4zOTQ1MzF2LTI0Mi44NTE1NjJ6bTAgMCIvPjwvc3ZnPgo=);
      }
      .three-action-newexpression .dcg-icon-new-expression::before {
        color: rgba(0,0,0,0);
        background-size: cover;
      }
      ${outermostMQ('span:nth-child(-n+2)')} {
        display: none;
      }
      ${outermostMQ('var.dcg-mq-first:nth-of-type(-n+3)')} {
        padding-left: 0;
      }
      .three-header-hidden {
        position: absolute;
        width: 0;
        height: 0;
        overflow: hidden;
        margin-top: -3px !important;
      }
    `
    document.head.appendChild(styleEl)
  }

  setBounds (bounds) {
    this.renderer.setSize(bounds.width, bounds.height)
    this.renderer.domElement.width = bounds.width
    this.renderer.domElement.height = bounds.height
    // top is always 0
    this.renderer.domElement.style.left = bounds.left + 'px'
  }

  rerender () {
    /* DEV-START */
    console.groupCollapsed('rerender', window.performance.now())
    console.log(this.model.scene)
    console.log(this.model.camera)
    console.log(this.model.values)
    console.groupEnd()
    /* DEV-END */
    this.renderer.render(this.model.scene, this.model.camera)
  }

  initRenderer () {
    this.renderer = new THREE.WebGLRenderer()
    this.renderer.domElement.style.position = 'absolute'
    this.container = document.querySelector('.dcg-container')
    this.container.prepend(this.renderer.domElement)
  }

  setCanvasVisible (isVisible) {
    this.renderer.domElement.style.visibility = isVisible ? '' : 'hidden'
    this.container.querySelector('.dcg-grapher').style.visibility = isVisible ? 'hidden' : ''
  }

  markCorrectVersion () {
    const element = this.getExprElement('@3-header')
    element.classList.add('three-header-hidden')
  }

  markWrongVersion () {
    const element = this.getExprElement('@3-header')
    element.classList.remove('three-header-hidden')
    const outerElement = element.querySelector('.dcg-displayTextarea')
    if (!outerElement) return
    const textElement = outerElement.firstChild
    textElement.textContent = textElement.textContent.replace(
      /. Install[^\n]+/,
      `, but you have version ${VERSION} installed. ` +
      'Read migration information at '
    )
    const link = 'https://github.com/jared-hughes/DesThree/blob/master/docs/CHANGELOG.md'
    const linkElement = textElement.nextElementSibling
    linkElement.innerHTML = link
    linkElement.href = link
  }
}
