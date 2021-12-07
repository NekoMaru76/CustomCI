import Position from "./Position.ts";
import Trace from "./Trace.ts";
import Stack from "./Stack.ts";

interface Options {
  raw?: Array<string>;
  start?: Position;
  end?: Position;
  trace?: Trace;
  stack?: Stack;
  data?: any;
}

export default class AST {
  type: string;
  data: any;
  raw: Array<string>;
  start?: Position;
  end?: Position;
  trace?: Trace;
  stack?: Stack;

  constructor(type: string, options?: Options) {
    this.type = type,
    this.data = options?.data || {},
    this.end = options?.end,
    this.start = options?.start,
    this.trace = options?.trace,
    this.stack = options?.stack || new Stack,
    this.raw = options?.raw || [];
  }

  get position() {
    return this.trace?.position;
  }
};
