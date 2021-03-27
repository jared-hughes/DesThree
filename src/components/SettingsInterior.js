import DCGView from 'DCGView'
import { Checkbox, If } from './desmosComponents'
import { FogModes } from 'model/graphSettings'
import SmallMathQuillInput from './SmallMathQuillInput'

export default class SettingsInterior extends DCGView.Class {
  init () {
    this.controller = this.props.controller()
  }

  template () {
    return (
      <div className='@3-scene-settings'>
        <div className='dcg-group-title'>
          Scene
        </div>
        <Checkbox
          onChange={() => this.toggleFog()}
          checked={() => this.getFogMode() !== FogModes.NONE}
          ariaLabel='Fog'
          green
        >
          Fog
        </Checkbox>
        <If
          predicate={() => this.getFogMode() !== FogModes.NONE}
        >{() => (
          <div>
            Near:
            <SmallMathQuillInput
              latex={() => this.getSettingsLatex('fogNearLatex')}
              onUserChangedLatex={latex => this.handleSetLatex('fogNearLatex', latex)}
              ariaLabel='fogNear'
            />
            Far:
            <SmallMathQuillInput
              latex={() => this.getSettingsLatex('fogFarLatex')}
              onUserChangedLatex={latex => this.handleSetLatex('fogFarLatex', latex)}
              ariaLabel='fogFar'
            />
            Color:
            <SmallMathQuillInput
              latex={() => this.getSettingsLatex('fogColorLatex')}
              onUserChangedLatex={latex => this.handleSetLatex('fogColorLatex', latex)}
              ariaLabel='fogNear'
            />
          </div>
        )}
        </If>
      </div>
    )
  }

  getFogMode () {
    return this.controller.getGraphSettings().fogMode
  }

  toggleFog () {
    this.controller.setGraphSettings({
      fogMode: this.getFogMode() === FogModes.NONE ? FogModes.LINEAR : FogModes.NONE
    })
  }

  getSettingsLatex (name) {
    return this.controller.getGraphSettings()[name] || ''
  }

  handleSetLatex (name, latex) {
    this.controller.setGraphSettings({
      [name]: latex
    })
  }
}
