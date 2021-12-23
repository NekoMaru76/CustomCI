import Base from "./Base.ts";

export default class Type extends Base {
  type: string | symbol;
  callback: Function;

  constructor(callback: Function, type: string | symbol) {
    super();

    this.type = type;
    this.callback = callback;
  }
};
