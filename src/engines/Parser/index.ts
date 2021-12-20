import AST from "../utils/AST.ts";
import Token from "../utils/Token.ts";
import Operator from "../utils/Operator.ts";
import Position from "../utils/Position.ts";
import Stack from "../utils/Stack.ts";
import Trace from "../utils/Trace.ts";
import * as TokenParser from "../utils/Parser/index.ts";
import * as IExpression from "../interfaces/Parser/Expression.ts";
import IOperator from "../interfaces/Parser/Operator.ts";
import parseTokens from "./parseTokens.ts";
import parseTree from "./parseTree.ts";
import getError from "../utils/Parser/getError.ts";
import TokenLessListTree from "../utils/Tree/TokenLessList.ts";

const inter = <Type>(cb: Function): Promise<Type> => new Promise(($: Function, _: Function) => {
  setTimeout(async () => {
    try {
      $(await cb());
    } catch (e) {
      _(e);
    }
  });
});

export default class Parser {
  expressions: Map<string | symbol, IExpression.TreeExpression> = new Map;
  operators: Map<string | symbol, IOperator> = new Map;
  plugins: Map<string | symbol, any> = new Map;

  addExpression(type: string, options: IExpression.TreeExpression): Parser {
    this.expressions.set(type, options);

    return this;
  }

  /**
    * Runs parser
    * @param {Array<Token>} tokens
    * @param {*} data
    * @returns {AST}
    */
  async run(tokens: Array<Token>, data: any = { stack: new Stack }): Promise<AST | any> {
    const { expressions, plugins, operators } = this;

    if (!tokens.length) throw new Error(`Tokens cannot be empty`);

    const tree = new TokenLessListTree(data.stack, tokens[0]);
    const info = {
      i: 0,
      ...data
    };
    const error = getError(info);

    for (; info.i < tokens.length; info.i++) {
      const token = tokens[info.i];
      const a = await parseTokens(token, tokens, expressions, info, error);

      tree.list.push(a);
    }

    return await parseTree({
      expressions, tree, data, plugins, operators
    });
  }
};
