import Base from "./Base.ts";

export default class Type extends Base {
  type: string;
  callback: Function;

  constructor(callback: Function, type: string) {
    super();

    this.type = type;
    this.callback = callback;
  }
};
