import Stack from "../utils/Stack.ts";
import Position from "../utils/Position.ts";
import Trace from "../utils/Trace.ts";
import Token from "../utils/Token.ts";
import Operator from "../utils/Operator.ts";
import LexerError from "../utils/Error/Lexer.ts";
import LexerToken from "../interfaces/Lexer/Token.ts";
import LexerOperator from "../interfaces/Lexer/Operator.ts";
import LexerTokenList from "../interfaces/Lexer/TokenList.ts";

export default class Lexer {
  tokens: Array<LexerToken> = [];
  operators: Array<LexerOperator> = [];
  readonly unknown: symbol = Symbol("UNKNOWN");

  /**
    * Adds a token
    * @param {string} type
    * @param {string[]} startValues
    * @param {string[]} values
    * @returns {Lexer}
    */
  addToken(type: string, startValues: string[], values: string[] = startValues): Lexer {
    this.tokens.push({ type, startValues, values });

    return this;
  }

  /**
    * Adds an operator
    * @param {string} type
    * @param {string} value
    * @param {number} level
    * @returns {Lexer}
    */
  addOperator(type: string, value: string, level: number = 1): Lexer {
    this.operators.push({ type, value, level });

    return this;
  }

  /**
    * Adds math operators
    * @returns {Lexer}
    */

  addMath(): Lexer {
    return this
      .addSum()
      .addSub()
      .addDiv()
      .addMul()
  }

  /**
    * Adds alphabets tokens
    * @params {string} type
    * @parms {string[]} startExtraValues
    * @params {string[]} extraValues
    * @returns {Lexer}
    */
  addAlphabets(type: string = "IDENTIFIERS", startExtraValues: string[] = [], extraValues: string[] = []): Lexer {
    const chars = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`.split("");

    this.addToken(type, [...startExtraValues, ...chars], [...extraValues, ...chars]);

    return this;
  }

  /**
    * Adds whitespaces tokens
    * @returns {Lexer}
    */
  addWhitespaces(): Lexer {
    this
      .addToken(`NEW_LINE`, [`\n`])
      .addToken(`SPACE`, [` `]);

    return this;
  }

  /**
    * Adds symbols tokens
    * @returns {Lexer}
    */
  addSymbols(): Lexer {
    this
      .addToken(`UNDER_SCORE`, [`_`]);

    return this;
  }

  /**
    * Adds numbers tokens
    * @params {string} type
    * @parms {string[]} startExtraValues
    * @params {string[]} extraValues
    * @returns {Lexer}
    */
  addNumbers(type: string = "NUMBERS", startExtraValues: string[] = [], extraValues: string[] = []): Lexer {
    const chars = `0123456789`.split("");

    this.addToken(type, [...startExtraValues, ...chars], [...extraValues, ...chars]);

    return this;
  }

  /**
    * Adds sum operator
    * @returns {Lexer}
    */
  addSum(): Lexer {
    this.addOperator(`SUM`, `+`, 1);

    return this;
  }

  /**
    * Adds sub operator
    * @returns {Lexer}
    */
  addSub(): Lexer {
    this.addOperator(`SUB`, `-`, 1);

    return this;
  }

  /**
    * Adds div operator
    * @returns {Lexer}
    */
  addDiv(): Lexer {
    this.addOperator(`DIV`, `/`, 2);

    return this;
  }

  /**
    * Adds mul operator
    * @returns {Lexer}
    */
  addMul(): Lexer {
    this.addOperator(`MUL`, `*`, 2);

    return this;
  }

  /**
    * Runs lexer
    * @param {string} code
    * @param {string} file
    * @param {Stack} stack
    * @returns {Array<Token>}
    */
  run(code: string, file: string, stack: Stack = new Stack): Array<Token> {
    const result: Array<Token> = [];
    const { tokens, unknown, operators } = this;
    const operatorsList: LexerOperator[] = operators.sort((a: LexerOperator, b: LexerOperator) => b.value.length-a.value.length);
    let tokensList: LexerTokenList[] = [];
    let c = 1;
    let l = 1;

    for (const token of tokens)
      for (const startValue of token.startValues) tokensList.push({
        type: token.type,
        startValue,
        values: token.values
      });

    tokensList = tokensList.sort((a: LexerTokenList, b: LexerTokenList) => b.startValue.length-a.startValue.length);

    for (let i = 0; i < code.length;) {
      const char = code[i];

      let next = false;
      const posStart = new Position(i, c, l, file);
      const traceStart = new Trace(`[Lexer]`, posStart);
      const currentStack = new Stack(stack.limit);

      currentStack.traces.push(traceStart);

      for (const { type, startValue, values } of tokensList) {
        const raw = code.slice(i, i+startValue.length);

        if (startValue === raw) {
          for (const char of raw) {
            if (char === "\n") {
              l++;
              c = 1;
            } else {
              c++;
            }

            i++;
          }

          const posEnd = new Position(i, c, l, file);
          const traceEnd = new Trace(`[Lexer]`, posEnd);
          const vs = [raw];

          let stop = false;

          while (!stop) {
            stop = true;

            for (const value of values) {
              const raw = code.slice(i, i+value.length);

              if (raw !== value) continue;

              for (const char of raw) {
                if (char === "\n") {
                  l++;
                  c = 1;
                } else {
                  c++;
                }

                i++;
              }

              vs.push(raw);

              stop = false;

              break;
            }
          }

          result.push(new Token(type, vs.join(""), {
            start: traceStart,
            end: traceEnd,
            stack: currentStack
          }));

          next = true;

          break;
        }
      }

      if (!next) {
        for (const { type, value, level } of operatorsList) {
          const raw = code.slice(i, i+value.length);

          if (value === raw) {
            for (const char of raw) {
              if (char === "\n") {
                l++;
                c = 1;
              } else {
                c++;
              }

              i++;
            }

            const posEnd = new Position(i, c, l, file);
            const traceEnd = new Trace(`[Lexer]`, posEnd);

            result.push(new Token(type, raw, {
              start: traceStart,
              end: traceEnd,
              stack: currentStack
            }));

            next = true;

            break;
          }
        }

        if (!next) {
          result.push(new Token(unknown, char, {
            start: traceStart,
            end: traceStart,
            stack: currentStack
          }));

          i++;
          c++;
        }
      }
    }

    const ret: Token[] = [];

    for (const token of result) {
      const bef = ret[ret.length-1];

      if ([bef?.type, token.type].includes(unknown) || bef?.type !== token.type) ret.push(token);
      else {
        bef.end = token.end;
        bef.value += token.value;
      }
    }

    return ret;
  }
};
