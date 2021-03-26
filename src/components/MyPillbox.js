import dcgview from 'dcgview'
import { Pillbox } from './desmosComponents'

export default class MyPillbox extends dcgview.Class {
  template () {
    return (
      <div
        style={{
          'background-image': 'linear-gradient(white, gray)',
          'padding-top': '200vh'
        }}
      >
        <Pillbox controller={this.props.controller()} />
      </div>
    )
  }
}
