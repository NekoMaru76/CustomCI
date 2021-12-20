import Position from "./Position.ts";
import Stack from "./Stack.ts";
import Token from "./Token.ts";
import Expression from "./Expression.ts";

interface Options {
  raw?: Array<string>;
  start: Token;
  end?: Token;
  stack?: Stack;
  data?: any;
  body?: Array<Expression>;
  isValue?: Boolean;
}

export default class AST {
  type: string;
  raw: Array<string>;
  start: Token;
  end: Token;
  stack: Stack;
  data: any;
  body: Array<Expression>;
  isValue: Boolean;

  constructor(type: string, options: Options) {
    this.type = type,
    this.data = options.data || {},
    this.stack = options.stack || new Stack,
    this.start = options.start,
    this.end = options.end || this.start,
    this.body = options.body || [],
    this.isValue = options.isValue || false,
    this.raw = options.raw || [];
  }
};
