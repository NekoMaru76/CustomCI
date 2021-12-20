import Token from "../Token.ts";
import Stack from "../Stack.ts";

export default class Base {
  start: Token;
  end: Token;
  isValue: boolean;
  stack: Stack;

  constructor(stack: Stack, start: Token, end: Token, isValue: boolean = false) {
    this.start = start;
    this.end = end;
    this.stack = stack;
    this.isValue = isValue;
  }
};
