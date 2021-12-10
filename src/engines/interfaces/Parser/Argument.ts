import AST from "../../utils/AST.ts";
import Token from "../../utils/Token.ts";
import Stack from "../../utils/Stack.ts";
import Position from "../../utils/Position.ts";

export interface ExpectedValue {
  ast: Function,
  token: Function;
};
export interface Error {
  unexpectedToken: Function,
  unexpectedOperator: Function,
  expectedOneOfTheseTokensInsteadGot: Function,
  expectedTokenInsteadGot: Function,
  unexpectedEndOfLine: Function,
  expressionIsNotExist: Function,
  operatorIsNotExist: Function,
  expectedValue: ExpectedValue,
  (message: string, token: Token): Function;
};
export interface Tools {
  next: Function,
  getIndex: Function,
  expectTypes: Function,
  previous: Function,
  error: Error,
  isEnd: Function,
  expectType: Function,
  getValue: Function,
  getOperator: Function,
  expectValue: Function,
  getToken: Function;
};
export interface Argument {
  tools: Tools,
  tokens: Array<Token>,
  data: any,
  plugins: Map<string, any>,
  expressions: Map<string, Function>,
  ast: AST;
};
