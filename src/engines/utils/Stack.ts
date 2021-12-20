import Trace from "./Trace.ts";

export default class Stack {
  limit: number;
  traces: Array<Trace>;

  constructor(limit: number = 10) {
    this.limit = 10;
    this.traces = new Proxy([], {
      set: (target: Array<Trace>, prop: string, value: any) => {
        const ind = parseInt(prop);

        target[ind] = value;

        const { limit } = this;

        target.splice(10);

        return target[ind] === value;
      }
    });
  }
  toString() {
    return this.traces.map(trace => `\tat ${trace.toString()}`).join("\n");
  }
  static combine(limit: number, stacks: Stack[]) {
    const stack = new Stack(limit);

    for (const st of stacks) if (st instanceof Stack) stack.traces.push(...st.traces);

    return stack;
  }
};
