import AST from "./AST.ts";

export default class Code {
  ast: AST;
  code: string;

  constructor(ast: AST, code: string) {
    this.ast = ast,
    this.code = code;
  }
};
