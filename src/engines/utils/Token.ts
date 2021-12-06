import Trace from "./Trace.ts";
import Stack from "./Stack.ts";
import Position from "./Position.ts";

export default class Token {
  type: string;
  value: string;
  raw: string;
  trace: Trace;
  stack: Stack;

  constructor(type: string, value: string, raw: string, trace: Trace, stack: Stack) {
    this.type = type,
    this.value = value,
    this.raw = raw,
    this.trace = trace,
    this.stack = stack;
  }
  get position() {
    return this.trace.position;
  }
};
