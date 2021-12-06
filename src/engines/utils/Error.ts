import Position from "./Position.ts";
import Stack from "./Stack.ts";

export default class Error {
  name: string = `Error`;
  message: string;
  position: Position;
  stack: Stack;

  constructor(message: string, position: Position, stack: Stack) {
    this.message = message,
    this.position = position,
    this.stack = stack;
  }
  toString() {
    return `POSITION(${this.position})\n\nNAME(${this.name}): MESSAGE(${this.message})\nSTACK(\n${this.stack}\n)`;
  }
};
