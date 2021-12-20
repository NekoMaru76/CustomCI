import Token from "./Token.ts";
import Trace from "./Trace.ts";
import Stack from "./Stack.ts";
import Position from "./Position.ts";

interface Options {
  start: Trace,
  end: Trace,
  stack: Stack,
  level: number;
  before: Token[];
  after: Token[];
};

export default class Operator {
  type: string | symbol;
  value: string;
  start: Trace;
  end: Trace;
  stack: Stack;
  level: number;
  before: Token[];
  after: Token[];

  constructor(type: string, value: string, {
    stack, start, end, level, before, after
  }: Options) {
    this.type = type;
    this.value = value;
    this.end = end;
    this.start = start;
    this.stack = stack;
    this.level = level;
    this.before = before;
    this.after = after;
  }
};
