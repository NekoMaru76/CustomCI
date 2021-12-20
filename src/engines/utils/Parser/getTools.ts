import Token from "../Token.ts";
import * as Tree from "../Tree/index.ts";
import * as IArgument from "../../interfaces/Parser/Argument.ts";
import Expression from "../Expression.ts";

export default function getTools(list: ((Tree.TokenListLess))[], __data__: any, error: any): IArgument.Tools {
  const { data, expressions, plugins, operators, run } = __data__;

  return {
    /**
      * @param {number} [ind=data.i]
      * @returns {boolean}
      */
    isEnd: (ind: number = data.i): Boolean => list.length <= ind+1,

    getTree: (ind: number = data.i): (Tree.TokenListLess) | undefined => {
      return list[ind];
    },

    getIndex: (): number => data.i,
    expectValue: (expression: Expression): boolean | never => !expression.tree.isValue && error.expectedValue(expression),
    next(filter: (Array<string | symbol> | Function) = []): (Tree.TokenListLess) | undefined {
      const _ = Array.isArray(filter) ? (tree: (Tree.TokenListLess)) => !filter.includes(String((tree as Tree.TokenListLess).token?.type)) : filter;

      while (1) {
        list[++data.i] ?? error.unexpectedEndOfLine(list[data.i-1]);

        if (_(list[data.i])) return list[data.i];
      }
    },
    previous(filter: (Array<string | symbol> | Function) = []): (Tree.TokenListLess) | undefined {
      const _ = Array.isArray(filter) ? (tree: (Tree.TokenListLess)) => filter.includes(String((tree as Tree.TokenListLess).token?.type)) : filter;

      while (data.i > 0) {
        if (_(list[--data.i])) return list[data.i];
      }
    },
    expectTypes: (token: Token, types: Array<string | symbol>): boolean | never => !types.includes(token.type) && error.expectedOneOfTheselistInsteadGot(token, types),
    expectType: (token: Token, type: string | symbol): boolean | never => token.type !== type && error.expectedTokenInsteadGot(token, type),
    async getValue(tree: (Tree.TokenList | Tree.TokenListLess)[], end: Function): Promise<IArgument.GetValue> {
      const clone = { ...data };

      clone.type = "Value";
      clone.isEnd = end;

      const returned = await run({ expressions, plugins, list, operators, data: clone, tree });

      return {
        ast: returned,
        data: clone
      };
    },
    error
  };
}
