import * as TokenParser from "../utils/Parser/index.ts";
import * as Tree from "../utils/Tree/index.ts";
import * as IExpression from "../interfaces/Parser/Expression.ts";
import Token from "../utils/Token.ts";

export default async function parseTokens(token: Token, tokens: Token[], expressions: Map<string | symbol, IExpression.TreeExpression>, data: any, error: any): Promise<Tree.TokenList | Tree.TokenListLess | never> {
  const f = expressions.get(token.type);

  switch (true) {
    case !f: error.expressionIsNotExist(token);
    case f?.isList: {
      const exp = f as (IExpression.TreeListExpression);
      const list: (Tree.TokenList | Tree.TokenListLess)[] = [];

      while (1) {
        const token = tokens[++data.i];

        if (!token) error.unexpectedEndOfLine(tokens[data.i-1]);
        if (await exp.isEnd(token, tokens, data)) break;

        list.push(await parseTokens(token, tokens, expressions, data, error));
      }
      
      return new Tree.TokenList(data.stack, token, tokens[data.i], exp.isValue, token, list);
    }
    default: return new Tree.TokenListLess(data.stack, token, token, f?.isValue, token);
  }
};
