import AST from "../../utils/AST.ts";
import Token from "../../utils/Token.ts";
import Stack from "../../utils/Stack.ts";
import Position from "../../utils/Position.ts";
import Expression from "../../utils/Expression.ts";

export interface Error {
  unexpectedExpression: Function,
  expectedOneOfTheseExpressionsInsteadGot: Function,
  expectedExpressionInsteadGot: Function,
  expressionIsNotExist: Function,
  expectedValue: Function,
  (message: string, expression: Expression): Function
};
export interface Tools {
  expectTypes: Function,
  error: Error,
  expectType: Function,
  expectValue: Function
};
export interface Argument {
  tools: Tools,
  plugins: Map<string, any>,
  expressions: Map<string, Function>,
  ast: AST,
  expression: Expression,
  previousExpression?: Expression
};
