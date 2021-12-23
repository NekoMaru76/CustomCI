import AST from "../../utils/AST.ts";
import Stack from "../../utils/Stack.ts";
import Position from "../../utils/Position.ts";
import Expression from "../../utils/Expression.ts";
import * as IExpression from "./Expression.ts";
import IOperator from "./Operator.ts";
import * as Tree from "../../utils/Tree/index.ts";
import Token from "../../utils/Token.ts";

export interface GetValue {
  ast: AST;
  data: any;
};
export interface ExpectedValue {
  ast: AST,
  token: Token;
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
  (message: string, token: Token): never;
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
  expectValue: Function,
  getTree: Function;
};
export interface Argument {
  tools: Tools,
  tokens: Array<Token>,
  data: any,
  plugins: Map<string | symbol, any>,
  expressions: Map<string | symbol, Function>,
  ast: AST;
};
export interface ParseTokensArgument {
  expressions: Map<string | symbol | symbol, IExpression.TreeExpression>,
  plugins: Map<string | symbol | symbol, any>,
  operators: Map<string | symbol | symbol, IOperator>,
  data: any,
  tree: Tree.TokenLessList;
};
export interface ParserTokenTools extends Tools {
  push: Function;
};
export interface RestParserTokenTools extends ParserTokenTools {
  end: Function;
};
export interface ParserTokenCallbackArgument extends Argument {
  expression: Expression;
  tools: ParserTokenTools
};
export interface ParserTokenArgument extends ParserTokenCallbackArgument {
  tools: ParserTokenTools;
  tree: Tree.TokenList | Tree.TokenListLess;
};
export interface RestParserTokenArgument extends ParserTokenArgument {
  tools: RestParserTokenTools;
};
