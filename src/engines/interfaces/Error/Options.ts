import Trace from "../../utils/Trace.ts";
import Stack from "../../utils/Stack.ts";

export default interface Options {
  start: Trace;
  end: Trace;
  stack: Stack;
  raw: string;
};
