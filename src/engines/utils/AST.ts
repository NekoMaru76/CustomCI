import Position from "./Position.ts";
import Trace from "./Trace.ts";
import Stack from "./Stack.ts";

export default class AST {
  type: string;
  data: any;
  raw: Array<any>;
  start?: Position;
  end?: Position;
  trace?: Trace;
  stack?: Stack;

  constructor(type: string, data: any = {
    isValue: false
  }, raw: Array<any> = [], start?: Position, end?: Position, trace?: Trace, stack?: Stack) {
    this.type = type,
    this.data = data,
    this.end = end,
    this.start = start,
    this.trace = trace,
    this.stack = stack,
    this.raw = raw;
  }

  get position() {
    return this.trace?.position;
  }
};
