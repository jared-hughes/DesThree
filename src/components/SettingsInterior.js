import DCGView from 'DCGView'
import { Checkbox, If } from './desmosComponents'
import { FogModes } from 'model/graphSettings'
import SmallMathQuillInput from './SmallMathQuillInput'
import SegmentedControl from './SegmentedControl'

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
            <SegmentedControl
              names={['Linear', 'Exp2']}
              selectedIndex={() => this.getFogMode() === FogModes.LINEAR ? 0 : 1}
              setSelectedIndex={index => this.setFogIndex(index)}
            />
            <If
              predicate={() => this.getFogMode() === FogModes.LINEAR}
            >
              {
                () => (
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
                  </div>
                )
              }
            </If>
            <If
              predicate={() => this.getFogMode() === FogModes.EXP}
            >
              {
                () => (
                  <div>
                    Density:
                    <SmallMathQuillInput
                      latex={() => this.getSettingsLatex('fogDensityLatex')}
                      onUserChangedLatex={latex => this.handleSetLatex('fogDensityLatex', latex)}
                      ariaLabel='fogDensity'
                    />
                  </div>
                )
              }
            </If>
            Color:
            <SmallMathQuillInput
              latex={() => this.getSettingsLatex('fogColorLatex')}
              onUserChangedLatex={latex => this.handleSetLatex('fogColorLatex', latex)}
              ariaLabel='fogNear'
            />
          </div>
        )}
        </If>
        <div className='dcg-group-title'>
          Camera
        </div>
        Position:
        <SmallMathQuillInput
          latex={() => this.getSettingsLatex('camPositionLatex')}
          onUserChangedLatex={latex => this.handleSetLatex('camPositionLatex', latex)}
          ariaLabel='cameraPosition'
        />
        Look at:
        <SmallMathQuillInput
          latex={() => this.getSettingsLatex('camLookAtLatex')}
          onUserChangedLatex={latex => this.handleSetLatex('camLookAtLatex', latex)}
          ariaLabel='cameraLookAt'
        />
        FOV:
        <SmallMathQuillInput
          latex={() => this.getSettingsLatex('camFOVLatex')}
          onUserChangedLatex={latex => this.handleSetLatex('camFOVLatex', latex)}
          ariaLabel='camFOV'
        />
        Clipping planes:
        Near:
        <SmallMathQuillInput
          latex={() => this.getSettingsLatex('camNearLatex')}
          onUserChangedLatex={latex => this.handleSetLatex('camNearLatex', latex)}
          ariaLabel='camNear'
        />
        Far:
        <SmallMathQuillInput
          latex={() => this.getSettingsLatex('camFarLatex')}
          onUserChangedLatex={latex => this.handleSetLatex('camFarLatex', latex)}
          ariaLabel='camFar'
        />
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

  setFogIndex (index) {
    this.controller.setGraphSettings({
      fogMode: [FogModes.LINEAR, FogModes.EXP][index]
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
