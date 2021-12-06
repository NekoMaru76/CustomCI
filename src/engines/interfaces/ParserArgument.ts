import AST from "../utils/AST.ts";
import Token from "../utils/Token.ts";
import Stack from "../utils/Stack.ts";
import Position from "../utils/Position.ts";

export interface Error {
  unexpectedToken: Function,
  expectedOneOfTheseTokensInsteadGot: Function,
  expectedTokenInsteadGot: Function,
  unexpectedEndOfLine: Function,
  expressionIsNotExist: Function,
  (message: string, position: Position, stack: Stack): Function
};
export interface Tools {
  next: Function,
  getToken: Function,
  getIndex: Function,
  expectTypes: Function,
  previous: Function,
  error: Error,
  getValue: Function,
  isEnd: Function,
  expectType: Function
};
export interface Argument {
  tools: Tools,
  tokens: Array<Token>,
  data: any,
  plugins: Map<string, any>,
  expressions: Map<string, Function>,
  ast: AST
};