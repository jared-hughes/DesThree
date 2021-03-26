import DCGView from 'DCGView'
import { Checkbox } from './desmosComponents'
import { FogModes } from 'model/graphSettings'

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
      </div>
    )
  }

  getFogMode () {
    return this.controller.getGraphSettings().fogMode
  }

  toggleFog () {
    this.controller.dispatch({
      type: '@3-set-graph-settings',
      fogMode: this.getFogMode() === FogModes.NONE ? FogModes.LINEAR : FogModes.NONE
    })
  }
}
