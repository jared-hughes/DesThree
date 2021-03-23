export function applyToEntries (object, func) {
  return Object.fromEntries(
    Object.entries(object)
      .map(([k, v]) => [k, func(v, k)])
  )
}

export function helperExpression (calculator, expr, type, callback) {
  const helper = calculator.HelperExpression({ latex: expr })
  helper.observe(type, () => {
    // check for isNaN to get around HelperExpression({latex: "5"})
    // having a numericValue of NaN (Desmos request #77875). Bug does not occur for lists
    const val = helper.listValue ?? (isNaN(helper.numericValue) ? parseFloat(expr) : helper.numericValue)
    callback(val)
  })
  return helper
}
