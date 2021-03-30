import DCGView from 'DCGView'

export default class SegmentedControl extends DCGView.Class {
  template () {
    return (
      <div
        class='dcg-segmented-control-container'
        role='group' ariaLabel='fog type'
      >
        {
          this.props.names().map((name, i) => (
            <div
              key={i}
              class={() => ({
                'dcg-segmented-control-btn': true,
                'dcg-dark-gray-segmented-control-btn': true,
                'dcg-selected dcg-active': i === this.props.selectedIndex()
              })}
              role='button'
              ariaLabel={name}
              onTap={() => this.props.setSelectedIndex(i)}
            >
              {name}
            </div>
          ))
        }
      </div>
    )
  }
}
