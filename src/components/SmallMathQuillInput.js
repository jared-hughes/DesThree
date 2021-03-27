import DCGView from 'DCGView'
import { MathQuillView } from './desmosComponents'
import functionNames from 'functions/functionNames'

const desmosAutoOperators = window.require('main/mathquill-operators').getAutoOperators()
const autoOperatorNamesList = desmosAutoOperators.split(' ').filter(e => e !== 'int')
autoOperatorNamesList.push(...Object.keys(functionNames).filter(e => e.length > 0))
const autoOperatorNames = autoOperatorNamesList.join(' ')

export default class SmallMathQuillInput extends DCGView.Class {
  template () {
    return (
      <MathQuillView
        isFocused={false}
        latex={this.props.latex()}
        capExpressionSize={80}
        config={{
          autoOperatorNames: autoOperatorNames
        }}
        getAriaLabel={() => this.props.ariaLabel()}
        getAriaPostLabel=''
        onUserChangedLatex={e => this.props.onUserChangedLatex(e)}
        onFocusedChanged={() => {}}
        hasError={false}
        selectOnFocus
        needsSystemKeypad={false}
      >
        <span
          class={() => ({
            'dcg-math-field': true,
            'dcg-math-input': true,
            'dcg-invalid': false,
            'dcg-focus': false
          })}
          dcgDataLimit={() => 40}
        />
      </MathQuillView>
    )
  }
}
