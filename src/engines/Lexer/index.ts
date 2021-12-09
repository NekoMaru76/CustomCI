import Stack from "../utils/Stack.ts";
import Position from "../utils/Position.ts";
import Trace from "../utils/Trace.ts";
import Token from "../utils/Token.ts";
import LexerError from "../utils/Error/Lexer.ts";
import LexerToken from "../interfaces/Lexer/Token.ts";
import LexerOperator from "../interfaces/Lexer/Operator.ts";

interface Unknown {
  type: string;
  readonly value: unique symbol;
};

export default class Lexer {
  tokens: Array<LexerToken> = [];
  unknown: (Unknown | any);
  operators: Array<LexerOperator> = [];

  /**
    * Adds unique symbol
    * @returns {Lexer}
    */

  addUnknown(type: string): Lexer {
    this.unknown = {
      type,
      value: Symbol("")
    };

    return this;
  }

  /**
    * Adds a token
    * @param {string} type
    * @param {*} value
    * @returns {Lexer}
    */
  addToken(type: string, value: string): Lexer {
    this.tokens.push({ type, value });

    return this;
  }

  /**
    * Adds tokens
    * @param {string} type
    * @param {Array<string>} tokens
    * @returns {Lexer}
    */
  addOneTypeTokens(type: string, ...tokens: Array<string>): Lexer {
    for (const token of tokens) this.addToken(type, token);

    return this;
  }

  /**
    * Adds alphabets tokens
    * @returns {Lexer}
    */
  addAlphabets(): Lexer {
    this.addOneTypeTokens(`ALPHABET`, ...`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`);

    return this;
  }

  /**
    * Adds whitespaces tokens
    * @returns {Lexer}
    */
  addWhitespaces(): Lexer {
    this
      .addToken(`NEW_LINE`, `\n`)
      .addToken(`SPACE`, ` `);

    return this;
  }

  /**
    * Adds symbols tokens
    * @returns {Lexer}
    */
  addSymbols(): Lexer {
    this
      .addToken(`UNDER_SCORE`, `_`);

    return this;
  }

  /**
    * Adds numbers tokens
    * @returns {Lexer}
    */
  addNumbers(): Lexer {
    this.addOneTypeTokens(`NUMBER`, ...`0123456789.`);

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
    const { tokens, unknown } = this;
    let c = 1;
    let l = 1;

    for (let i = 0; i < code.length; i++) {
      const char = code[i];

      let next = false;
      const position = new Position(i, c, l, file);
      const trace = new Trace(`[Lexer]`, position);

      for (const { type, value } of tokens) {
        const raw = code.slice(i, i+value.length);

        if (value.length < code.length-i+1 && value === raw) {
          result.push(new Token(type, value, { raw, trace, stack }));

          next = true;

          break;
        }
      }

      if (!next) {
        if (unknown) result.push(new Token(unknown.type, unknown.value, {
          raw: code[i],
          trace,
          stack
        }));
        else throw new LexerError(`Unexpected character CHAR(${char} : ${char.charCodeAt(0)})`, { position, stack });
      }

      switch (char) {
        case "\n": {
          l++;
          c = 1;

          break;
        }
        default: c++;
      }
    }

    return result;
  }
};
