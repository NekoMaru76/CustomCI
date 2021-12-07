import AST from "./AST.ts";

export default class Execute {
  ast: AST;
  callback: Function;

  constructor(ast: AST, callback: Function) {
    this.ast = ast,
    this.callback = callback;
  }
};
