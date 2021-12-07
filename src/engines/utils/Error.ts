import Position from "./Position.ts";
import Stack from "./Stack.ts";

interface Options {
  position: Position;
  stack: Stack;
};

export default class Error {
  name: string = `Error`;
  message: string;
  position: Position;
  stack: Stack;

  constructor(message: string, options: Options) {
    this.message = message,
    this.position = options.position,
    this.stack = options.stack;
  }
  toString() {
    return `POSITION(${this.position})\n\nNAME(${this.name}): MESSAGE(${this.message})\nSTACK(\n${this.stack}\n)`;
  }
};
