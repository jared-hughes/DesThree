import functionNames from 'functions/functionNames'
import { Type } from 'functions/functionSupers'

export default class Parser {
  constructor () {
    this.maxExpr = 0
  }

  parseAssignment (text, index) {
    const assignRegex = /\s*(?<variable>\w+)\s*=\s*/y
    assignRegex.lastIndex = index
    const match = assignRegex.exec(text)
    if (match) {
      return {
        variable: match.groups.variable,
        nextIndex: assignRegex.lastIndex
      }
    } else {
      this.maxExpr += 1
      return {
        variable: '__expr' + this.maxExpr,
        nextIndex: index
      }
    }
  }

  parseFuncName (text, index) {
    const funcNameRegex = /\s*(?:\\operatorname{)?(?<func>\w*)}?\s*\(/y
    funcNameRegex.lastIndex = index
    const match = funcNameRegex.exec(text)

    if (match) {
      return {
        func: match.groups.func,
        nextIndex: funcNameRegex.lastIndex
      }
    } else {
      return { error: 'ParseError: expected function name' }
    }
  }

  parseDesmos (text, index) {
    const braceStack = []
    let desmosLatex = ''
    for (; !([',', ')'].includes(text[index]) && braceStack.length === 0); index++) {
      if (index >= text.length) {
        return { error: 'ParseError: EOF before matched brace in DesmosLatex' }
      }
      const c = text[index]
      if ('([{'.includes(c)) {
        braceStack.push(c)
      } else if (')]}'.includes(c)) {
        if ('([{'[')]}'.indexOf(c)] !== braceStack.pop()) {
          return { error: 'ParseError: mismatched braces' }
        }
      }
      desmosLatex += c
    }
    return {
      latex: desmosLatex.trim(),
      nextIndex: index
    }
  }

  parseDesThreeVariable (text, index) {
    const variableRegex = /\s*(?<variable>[a-zA-Z]\w*)\s*(?=\)|,)/y
    variableRegex.lastIndex = index
    const match = variableRegex.exec(text)

    if (match) {
      return {
        variable: match.groups.variable,
        nextIndex: variableRegex.lastIndex
      }
    } else {
      return null
    }
  }

  parseDesThree (text, index) {
    const desVariable = this.parseDesThreeVariable(text, index)
    if (desVariable) {
      return {
        defs: [
          {
            variable: desVariable.variable,
            func: null,
            args: null
          }
        ],
        nextIndex: desVariable.nextIndex
      }
    }

    const { variable, nextIndex: i1 } = this.parseAssignment(text, index)
    const { error, func, nextIndex: i2 } = this.parseFuncName(text, i1)
    if (error) {
      return { error }
    }
    index = i2

    if (functionNames[func] === undefined) {
      return { error: `Unidentified function: ${func}` }
    }
    const expectedArgs = functionNames[func].expectedArgs()
    const defs = []
    const args = []

    // 0-argument function
    const zeroArgument = text[index] === ')'
    if (!zeroArgument) {
      for (; text[index - 1] !== ')'; index++) {
        if (index >= text.length) {
          return { error: 'ParseError: EOF before closing DesThree matched brace' }
        }
        if (args.length >= expectedArgs.length) {
          return { error: `ParseError: too many arguments in call to ${func}` }
        }
        const expectedType = expectedArgs[args.length].type
        if (expectedType === Type.NUM || expectedType === Type.LIST) {
          const { error, latex, nextIndex: i3 } = this.parseDesmos(text, index)
          if (error) {
            return { error }
          }
          index = i3
          args.push(latex)
        } else {
          const { error, defs: argDefs, nextIndex: i4 } = this.parseDesThree(text, index)
          if (error) {
            return { error }
          }
          index = i4
          defs.push(...argDefs)
          args.push(argDefs[argDefs.length - 1].variable)
        }
      }
    }

    defs.push({
      variable,
      func,
      args
    })

    // return this function's definition preceded by all arguments' definitions
    return {
      defs,
      nextIndex: index + zeroArgument
    }
  }
}
