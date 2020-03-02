import { EditorConfiguration, StringStream, Mode } from 'codemirror'

type TokenType =
  | 'operator'
  | 'bracket'
  | 'keyword'
  | 'variable' | 'variable-2'
  | 'property'
  | 'punctuation'
  | 'number' | 'atom'
  | 'comment'
  | 'string'
  | 'error'

interface State {
  stack: 'default'[];
  line: number;
}

interface Token {
  type: string
  first_column: number
  last_column: number
  line: number
  text: string
}

function makeEmit(stream: StringStream, state: State) {
  return function emitToken(tokenInfo): Token {
    return {
      ...tokenInfo,
      first_column: stream.start,
      last_column: stream.pos,
      line: state.line,
      text: stream.current(),
    };
  };
}

function getToken(
  stream: StringStream,
  state: State,
  expreva: any
): Token | undefined {
  const emitToken = makeEmit(stream, state);
  if (stream.eatSpace()) {
    // skip whitespace
    return undefined;
  }
  const str = stream.string.slice(stream.pos)
  let matched
  for (const rule of expreva.parser.lexer.rules) {
    if (matched = rule.accept(str)) { // stream.match(rule.match)
      stream.pos += matched.length
      return emitToken({
        type: rule.name,
        value: matched.token.value
      })
    }
  }

  // if (stream.match(/#/)) {
  //   if (!stream.match(/\n/)) {
  //     // comment lasts till end of line
  //     stream.match(/.*/); // if no eol encountered, comment lasts till end of file
  //   }
  //   return emitToken('COMMENT');
  // }

  stream.next();
  return emitToken('ERROR');
}

export function defineMode(CodeMirror, expreva) {
  CodeMirror.defineMode('expreva', createMode)
}

function createMode(_config: EditorConfiguration, _modeOptions?: any): Mode<State> {
  const {indentUnit = 2} = _config
  return {
    electricChars: "{}[]();",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    lineComment: "//",
    token: (
      stream: StringStream,
      state: State
    ): TokenType | null => {

      // Keep track of indent levels
      const isStart = stream.sol()

      // Capture multiline comment
      while(stream.eatSpace()){}
      if (stream.string.charAt(stream.pos)==='/' && stream.string.charAt(stream.pos+1)==='*') {
        state.ctx.isComment = true
        stream.next()
        stream.next()
        return 'comment'
      } else if (state.ctx.isComment) {
        if (stream.string.charAt(stream.pos)==='*' && stream.string.charAt(stream.pos+1)==='/') {
          state.ctx.isComment = false
          stream.next()
          stream.next()
        } else {
          stream.next()
        }
        return 'comment'
      }

      const token = getToken(stream, state, expreva);
      if (isStart || !token) { //  || stream.eol()
        state.ctx = { prev: null, start: stream.column(), indentTo: stream.indentation(), nested: 0,
          isComment: state.ctx.isComment ? true : false
        }
        if (!token) return null
      }
      const previousToken = state.ctx.prev
      if (previousToken==null) {
        state.ctx.start = stream.column()
        state.ctx.indentTo = stream.indentation()
      }
      state.ctx.prev = token

      if (token.value === "(" || token.value === "[" || token.value === "{") {
        state.ctx.nested++
        state.ctx.indentTo = state.ctx.start + state.ctx.nested * indentUnit // state.ctx.start+
      } else if (token.value === ")" || token.value === "]" || token.value === "}") {
        state.ctx.nested--
        if (state.ctx.nested > 0) {
          state.ctx.indentTo -= indentUnit
        } else {
          state.ctx.indentTo = state.ctx.start
        }
      }

      state.token = token
      if (token.type==='symbol' && previousToken && previousToken.type==='member') return 'property'

      switch (token.type) {
        case 'number': return 'number';

        case 'open expression':
        case 'open object':
        case 'open list':
          return 'bracket';

        case 'close list':
        case 'close expression':
        case 'close object':
          return 'bracket';

        case 'argument separator':
        case 'end statement':
          return 'punctuation';

        case '+':
        case '-':
        case '*':
        case '/':
        case '^':
        case '!':
        case '>':
        case '>=':
        case '<':
        case '<=':
        case '==':
        case '!=':
        case '||':
        case '&&':
        case '?':
        case ':':

        case 'def':
        case '->':
        case 'lambda':
        case 'member':
          return 'operator';

        case 'if':
        case 'or':
        case 'and':
        case 'not':
        case 'macro':
        case 'return':
        case 'continue':
        case 'break':
          return 'keyword'

        case 'symbol':
          switch(token.value) {
            case 'then':
            case 'else':
              return 'keyword'
            case 'true':
            case 'false':
            case 'nil':
              return 'atom'

            default: return 'variable-2';
          }
        case 'single-quoted string':
        case 'double-quoted string':
            return 'string';

        case 'comment': return 'comment';
        case 'error': return 'error';
        default:
          // console.warn('Unknown token type', token)
          return null
      }
    },
    startState: () => ({
      line: 0,
      ctx: { prev: null, start: 0, indentTo: 0, nested: 0 }
    }),

    indent: function(state, textAfter) {
      var i = state.ctx.indentTo;
      return (typeof i === "number") ?
        i :
        state.ctx.start;
    },

  };
}

export function registerLintHelper(CodeMirror, editor) {

  CodeMirror.registerHelper('lint', 'expreva', () => {
    const parseErrors = editor.getOption('script-errors') || []
    return parseErrors.map((e) => ({
      from: CodeMirror.Pos(e.position.first_line - 1, e.position.first_column),
      to: CodeMirror.Pos(e.position.last_line - 1, e.position.last_column),
      message: e.message,
      severity: 'error'
    }))
  })
}
