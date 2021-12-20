import Token from "../Token.ts";
import Base from "./Base.ts";
import TokenListLess from "./TokenListLess.ts";
import TokenList from "./TokenList.ts";
import Stack from "../Stack.ts";

export default class TokenLessListTree extends Base {
  list: (TokenListLess | TokenList)[];

  constructor(stack: Stack, start: Token, end: Token = start, isValue: boolean = false, list: (TokenListLess | TokenList)[] = []) {
    super(stack, start, end, isValue);

    this.list = list;
  }
};
