/**
 * This file serves only to wrap the `jsx` function for babel-transform-react-jsx
 * It cannot be renamed or moved.
 */

import dcgview from 'dcgview'

export function jsx (el, props) {
  /**
   * babel-transform-react-jsx calls:
   *   jsx(el, {...props, children: child})
   * or jsxs(el, {...props, children: [child1, child2, ...]})
   * but we want
   *   dcgview.createElement(el, props, ...children)
   * see change info at https://github.com/reactjs/rfcs/blob/createlement-rfc/text/0000-create-element-changes.md
   */
  let children = props.children
  if (!Array.isArray(children)) {
    children = [children]
  }
  delete props.children
  for (const [k, v] of Object.entries(props)) {
    // dcgview.createElement also expects 0-argument functions
    if (typeof v !== 'function') {
      props[k] = dcgview.const(v)
    }
  }
  return dcgview.createElement(el, props, ...children)
}

// jsxs is for a list of children like <Component><A/><B/></Component>
// differences get handled in jsx
export const jsxs = jsx
