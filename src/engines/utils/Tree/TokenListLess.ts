import Token from "../Token.ts";
import Base from "./Base.ts";
import Stack from "../Stack.ts";

export default class TokenListLessTree extends Base {
  token: Token;

  constructor(stack: Stack, start: Token, end: Token = start, isValue: boolean = false, token: Token) {
    super(stack, start, end, isValue);

    this.token = token;
  }
};
