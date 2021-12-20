import Base from "./Base.ts";

export default class Rest extends Base {
  tokens: Base[] = [];
  callback: Function;

  constructor(callback: Function) {
    super();

    this.callback = callback;
  }
};
