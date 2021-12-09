import Options from "../../interfaces/Error/Options.ts";
import Position from "../../utils/Position.ts";
import Stack from "../../utils/Stack.ts";

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
