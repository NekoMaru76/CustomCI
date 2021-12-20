import Base from "./Base.ts";
import Value from "./Value.ts";

export default class Operator extends Value {
  before: Base[] = [];
  after: Base[] = [];

  constructor(callback: Function) {
    super(callback);
  }
};
