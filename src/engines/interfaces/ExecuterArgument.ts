import AST from "../utils/AST.ts";
import Token from "../utils/Token.ts";
import Stack from "../utils/Stack.ts";
import Position from "../utils/Position.ts";

export interface Error {
  unexpectedExpression: Function,
  expectedOneOfTheseExpressionsInsteadGot: Function,
  expectedExpressionInsteadGot: Function,
  expressionIsNotExist: Function,
  expectedValue: Function,
  (message: string, expression: AST): Function
};
export interface Tools {
  expectTypes: Function,
  error: Error,
  expectType: Function,
  expectValue: Function,
  next: Function,
  getValue: Function
};
export interface Argument {
  tools: Tools,
  plugins: Map<string, any>,
  expressions: Map<string, Function>,
  ast: AST
};
