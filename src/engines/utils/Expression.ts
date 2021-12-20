import Token from "./Token.ts";
import * as Tree from "./Tree/index.ts";

export default class Expression {
  list: Expression[] = [];
  raw: String[] = [];
  tree: (Tree.TokenList | Tree.TokenListLess);
  type: string | symbol;

  constructor(type: string | symbol, tree: (Tree.TokenList | Tree.TokenListLess)) {
    this.tree = tree;
    this.type = type;
  }
};
