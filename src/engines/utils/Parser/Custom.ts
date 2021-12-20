import Base from "./Base.ts";

export default class Custom extends Base {
  callback: Function;

  constructor(callback: Function) {
    super();

    this.callback = callback;
  }
};
