import Token from "./Token.ts";
import Trace from "./Trace.ts";
import Stack from "./Stack.ts";
import Position from "./Position.ts";

interface Options {
  start: Trace,
  end: Trace,
  stack: Stack,
  level: number;
};

export default class Operator extends Token {
  level: number;

  constructor(type: string, value: string, {
    stack, start, end, level
  }: Options) {
    super(type, value, { stack, start, end });

    this.level = level;
  }
};
