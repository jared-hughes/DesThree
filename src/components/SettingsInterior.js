import DCGView from 'DCGView'
import { Checkbox, If, StaticMathquillView } from './desmosComponents'
import { FogModes } from 'model/graphSettings'
import SmallMathQuillInput from './SmallMathQuillInput'
import SegmentedControl from './SegmentedControl'

export default class SettingsInterior extends DCGView.Class {
  init () {
    this.controller = this.props.controller()
  }

  template () {
    return (
      <div>
        <div
          class='three-camera-settings'
          style={{
            'padding-bottom': '10px',
            'border-bottom': '1px solid #ddd'
          }}
        >
          <div class='dcg-group-title'>
            Camera
          </div>
          <div class='three-wide-mathquill'>
            Position:
            <SmallMathQuillInput
              latex={() => this.getSettingsLatex('camPositionLatex')}
              onUserChangedLatex={latex => this.handleSetLatex('camPositionLatex', latex)}
              ariaLabel='cameraPosition'
            >
              <span
                style={{
                  'max-width': '200px'
                }}
              />
            </SmallMathQuillInput>
          </div>
          <div class='three-wide-mathquill'>
            Look at:
            <SmallMathQuillInput
              latex={() => this.getSettingsLatex('camLookAtLatex')}
              onUserChangedLatex={latex => this.handleSetLatex('camLookAtLatex', latex)}
              ariaLabel='cameraLookAt'
            />
          </div>
          <div class='three-wide-mathquill'>
            FOV:
            <SmallMathQuillInput
              latex={() => this.getSettingsLatex('camFOVLatex')}
              onUserChangedLatex={latex => this.handleSetLatex('camFOVLatex', latex)}
              ariaLabel='camFOV'
            />
          </div>
          <div>
            Clip to:
            <SmallMathQuillInput
              latex={() => this.getSettingsLatex('camNearLatex')}
              onUserChangedLatex={latex => this.handleSetLatex('camNearLatex', latex)}
              ariaLabel='camNear'
            />
            <StaticMathquillView
              config={{}}
              latex={() => '\\le \\mathrm{depth} \\le'}
            />
            <SmallMathQuillInput
              latex={() => this.getSettingsLatex('camFarLatex')}
              onUserChangedLatex={latex => this.handleSetLatex('camFarLatex', latex)}
              ariaLabel='camFar'
            />
          </div>
        </div>
        <div
          class='three-fog-settings'
          style={{
            'padding-top': '10px'
          }}
        >
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
            <div
              style={{
                'padding-top': '10px'
              }}
            >
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
                    <div
                      style={{
                        'padding-top': '10px'
                      }}
                    >
                      Vary on
                      <SmallMathQuillInput
                        latex={() => this.getSettingsLatex('fogNearLatex')}
                        onUserChangedLatex={latex => this.handleSetLatex('fogNearLatex', latex)}
                        ariaLabel='fogNear'
                      />
                      <StaticMathquillView
                        config={{}}
                        latex={() => '\\le \\mathrm{depth} \\le'}
                      />
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
                    <div
                      style={{
                        'padding-top': '10px'
                      }}
                    >
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
              <div class='three-wide-mathquill'>
                Color:
                <SmallMathQuillInput
                  latex={() => this.getSettingsLatex('fogColorLatex')}
                  onUserChangedLatex={latex => this.handleSetLatex('fogColorLatex', latex)}
                  ariaLabel='fogNear'
                />
              </div>
            </div>
          )}
          </If>
        </div>
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
