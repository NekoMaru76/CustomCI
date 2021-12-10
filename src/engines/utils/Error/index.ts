import Options from "../../interfaces/Error/Options.ts";
import Trace from "../../utils/Trace.ts";
import Stack from "../../utils/Stack.ts";

export default class Error {
  name: string = `Error`;
  message: string;
  start: Trace;
  end: Trace;
  stack: Stack;
  raw: string;

  constructor(message: string, options: Options) {
    this.message = message,
    this.start = options.start,
    this.end = options.end,
    this.raw = options.raw,
    this.stack = options.stack;
  }
  toString() {
    return `Start: ${this.start}\nEnd: ${this.end}\n${this.name}: ${this.message}\nRaw: ${this.raw}\n${this.stack}\n`;
  }
};
