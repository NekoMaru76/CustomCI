import Stack from "../utils/Stack.ts";
import Position from "../utils/Position.ts";
import Trace from "../utils/Trace.ts";
import Token from "../utils/Token.ts";
import Operator from "../utils/Operator.ts";
import LexerError from "../utils/Error/Lexer.ts";
import * as IToken from "../interfaces/Lexer/Token.ts";
import IOperator from "../interfaces/Lexer/Operator.ts";
import * as ITokenList from "../interfaces/Lexer/TokenList.ts";

type T = IToken.Base | IToken.Continuous;
type IT = ITokenList.Base | ITokenList.Continuous;

export default class Lexer {
  tokens: Array<T> = [];
  operators: Array<IOperator> = [];
  readonly unknown: symbol = Symbol("UNKNOWN");

  addToken(arg: T): Lexer {
    this.tokens.push(arg);

    return this;
  }

  addOperator(arg: IOperator): Lexer {
    this.operators.push(arg);

    return this;
  }

  /**
    * Runs lexer
    * @param {string} code
    * @param {string} file
    * @param {Stack} stack
    * @returns {Array<Token | Operator>}
    */
  run(code: string, file: string, stack: Stack = new Stack): Array<Token | Operator> {
    const result: Array<Token | Operator> = [];
    const { tokens, unknown, operators } = this;
    const operatorsList: IOperator[] = operators.sort((a: IOperator, b: IOperator) => b.value.length-a.value.length);
    let tokensList: IT[] = [];
    let c = 1;
    let l = 1;
    let bef: Token | undefined;
    let befCanCollide: boolean = false;

    for (const token of tokens) {
      const t = token.isContinuous ? (token as (IToken.Continuous)) : (token as (IToken.Base));

      for (const startValue of token.startValues) {
        const o: any = {
          ...t,
          startValue
        };

        delete o.startValues;

        tokensList.push(o);
      }
    }

    tokensList = tokensList.sort((a: IT, b: IT) => b.startValue.length-a.startValue.length);

    let i = 0;

    function counter(string: string) {
      for (const char of string) {
        if (char === "\n") {
          l++;
          c = 1;
        } else {
          c++;
        }
      }

      i++;
    }

    for (; i < code.length;) {
      const char = code[i];

      let next = false;
      const posStart = new Position(i, c, l, file);
      const traceStart = new Trace(`[Lexer]`, posStart);
      const currentStack = new Stack(stack.limit);

      currentStack.traces.push(traceStart);

      for (const tokenList of tokensList) {
        const { type, startValue, mustSkip, canCollide, isContinuous } = tokenList;
        const raw = code.slice(i, i+startValue.length);

        if (startValue === raw) {
          counter(raw);

          const vs = [raw];

          if (isContinuous) {
            const { values } = tokenList as ITokenList.Continuous;

            let stop = false;

            while (!stop) {
              stop = true;

              for (const value of values) {
                const raw = code.slice(i, i+value.length);

                if (raw !== value) continue;

                counter(raw);
                vs.push(raw);

                stop = false;

                break;
              }
            }
          }


          const posEnd = new Position(i-1, c-1, l, file);
          const traceEnd = new Trace(`[Lexer]`, posEnd);

          if (!mustSkip) {
            const token = new Token(type, vs.join(""), {
              start: traceStart,
              end: traceEnd,
              stack: currentStack
            });

            if (!bef || !befCanCollide || !canCollide || [bef?.type, token.type].includes(unknown) || bef?.type !== token.type) result.push(token);
            else {
              bef.end = token.end;
              bef.value += token.value;
            }

            bef = token;
            befCanCollide = canCollide;
          }

          next = true;

          break;
        }
      }

      if (!next) {
        for (const { type, value, level } of operatorsList) {
          const raw = code.slice(i, i+value.length);

          if (value === raw) {
            counter(raw);

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
          bef = new Token(unknown, char, {
            start: traceStart,
            end: traceStart,
            stack: currentStack
          });
          befCanCollide = false;

          result.push(bef);

          i++;
          c++;
        }
      }
    }

    return result;
  }
};
