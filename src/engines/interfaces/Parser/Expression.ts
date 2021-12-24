import Base from "../../utils/Parser/Base.ts";

/*

import AST from "../../utils/AST.ts";
import * as Tree from "../../utils/Tree/index.ts";

*/

import Token from "../../utils/Token.ts";

export interface TreeListLessExpression {
  isValue: boolean;
  callback: Function;
  isList: false;
  name: string | symbol;
};

export interface TreeListExpression extends Omit<TreeListLessExpression, "isList"> {
  //isEnd: (tree: Tree.TokenListLess | Tree.TokenList, ast: AST) => boolean | Promise<boolean>;
  isEnd: Function;
  list: Base[];
  isList: true;
};

export type TreeExpression = TreeListExpression | TreeListLessExpression;
