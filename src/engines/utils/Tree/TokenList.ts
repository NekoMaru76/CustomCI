import Token from "../Token.ts";
import Base from "./Base.ts";
import TokenListLess from "./TokenListLess.ts";
import Stack from "../Stack.ts";

export default class TokenListTree extends Base {
  list: (TokenListLess | TokenListTree)[];
  token: Token;

  constructor(stack: Stack, start: Token, end: Token = start, isValue: boolean = false, token: Token, list: (TokenListLess | TokenListTree)[] = []) {
    super(stack, start, end, isValue);

    this.token = token;
    this.list = list;
  }
};
