import Position from "./Position.ts";
import Trace from "./Trace.ts";
import Stack from "./Stack.ts";
import Token from "./Token.ts";

interface Options {
  raw: Array<string>;
  start: Trace;
  end: Trace;
  stack?: Stack;
  data?: any;
  body: Array<any>;
  isValue: Boolean;
}

export default class AST {
  type: string;
  raw: Array<string>;
  start: Trace;
  end: Trace;
  stack: Stack;
  data?: any;
  body: Array<any>;
  isValue: Boolean;

  constructor(type: string, options: Options) {
    this.type = type,
    this.data = options.data || {},
    this.stack = options.stack || new Stack,
    this.start = options.start,
    this.end = options.end || this.start,
    this.body = options.body,
    this.isValue = options.isValue,
    this.raw = options.raw || [];
  }
};
