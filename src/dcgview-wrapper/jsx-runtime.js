/**
 * This file serves only to wrap the `jsx` function for babel-transform-react-jsx
 * It cannot be renamed or moved.
 */

import DCGView from 'DCGView'

export function jsx (el, props) {
  /**
   * babel-transform-react-jsx calls:
   *   jsx(el, {...props, children: child})
   * or jsxs(el, {...props, children: [child1, child2, ...]})
   * but we want
   *   DCGView.createElement(el, props, ...children)
   * see change info at https://github.com/reactjs/rfcs/blob/createlement-rfc/text/0000-create-element-changes.md
   */
  let children = props.children
  if (!Array.isArray(children)) {
    // occurs for jsx but not jsxs
    children = [children]
  }
  // "Text should be a const or a getter:"
  children = children.map(e => typeof e === 'string' ? DCGView.const(e) : e)
  delete props.children
  for (const [k, v] of Object.entries(props)) {
    // DCGView.createElement also expects 0-argument functions
    if (typeof v !== 'function') {
      props[k] = DCGView.const(v)
    }
  }
  return DCGView.createElement(el, props, ...children)
}

// jsxs is for a list of children like <Component><A/><B/></Component>
// differences get handled in jsx
export const jsxs = jsx
