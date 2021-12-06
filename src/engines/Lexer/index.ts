import Stack from "../utils/Stack.ts";
import Position from "../utils/Position.ts";
import Trace from "../utils/Trace.ts";
import Token from "../utils/Token.ts";
import LexerError from "../utils/LexerError.ts";
import LexerToken from "../interfaces/LexerToken.ts";

export default class Lexer {
  tokens: Array<LexerToken> = [];

  addToken(type: string, value: any): Lexer {
    this.tokens.push({ type, value });

    return this;
  }
  addOneTypeTokens(type: string, ...tokens: Array<string>): Lexer {
    for (const token of tokens) this.addToken(type, token);

    return this;
  }
  addAlphabets(): Lexer {
    this.addOneTypeTokens(`ALPHABET`, ...`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`);

    return this;
  }
  addWhitespaces(): Lexer {
    this
      .addToken(`NEW_LINE`, `\n`)
      .addToken(`SPACE`, ` `);

    return this;
  }
  addSymbols(): Lexer {
    this
      .addToken(`UNDER_SCORE`, `_`);

    return this;
  }
  addNumbers(): Lexer {
    this.addOneTypeTokens(`NUMBER`, ...`0123456789.`);

    return this;
  }
  run(code: string, file: string, stack: Stack = new Stack): Array<Token> {
    const result: Array<Token> = [];
    let c = 1;
    let l = 1;

    for (let i = 0; i < code.length; i++) {
      const char = code[i];

      let next = false;
      const position = new Position(i, c, l, file);
      const trace = new Trace(`[Lexer]`, position);

      for (const { type, value } of this.tokens) {
        const raw = code.slice(i, i+value.length);

        if (value.length < code.length-i+1 && value === raw) {
          result.push(new Token(type, value, raw, trace, stack));

          next = true;

          break;
        }
      }

      if (!next) throw new LexerError(`Unexpected character CHAR(${char} : ${char.charCodeAt(0)})`, position, stack);

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