import Trace from "./Trace.ts";
import Stack from "./Stack.ts";
import Position from "./Position.ts";

interface Options {
  start: Trace;
  end: Trace;
  stack: Stack;
};

export default class Token {
  type: string | symbol;
  value: string;
  start: Trace;
  end: Trace;
  stack: Stack;

  constructor(type: string | symbol, value: string, {
    stack, start, end
  }: Options) {
    this.type = type;
    this.value = value;
    this.end = end;
    this.start = start;
    this.stack = stack;
  }
};
