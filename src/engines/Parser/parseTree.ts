import AST from "../utils/AST.ts";
import ParserError from "../utils/Error/Parser.ts";
import Token from "../utils/Token.ts";
import Operator from "../utils/Operator.ts";
import Position from "../utils/Position.ts";
import Stack from "../utils/Stack.ts";
import * as IArgument from "../interfaces/Parser/Argument.ts";
import Trace from "../utils/Trace.ts";
import * as IExpression from "../interfaces/Parser/Expression.ts";
import * as Tree from "../utils/Tree/index.ts";
import * as TokenParser from "../utils/Parser/index.ts";
import IOperator from "../interfaces/Parser/Operator.ts";
import IParseTokens from "../interfaces/Parser/ParseTokens.ts";
import Expression from "../utils/Expression.ts";
import getError from "../utils/Parser/getError.ts";
import getTools from "../utils/Parser/getTools.ts";

export default async function parseTree(arg: IArgument.ParseTokensArgument): Promise<AST> {
  const { expressions, plugins, tree, operators, data } = arg;
  const ast = new AST(data?.type || "Program", {
    isValue: !!(data?.type && data?.type !== "Program"),
    body: [],
    start: tree.start,
    raw: []
  });
  const _ = ast;

  if (!data.i) data.i = 0;

  const error = getError(data);

  for (; data.i < tree.list.length; data.i++) {
    const tr = tree.list[data.i];

    switch (true) {
      case tr instanceof Tree.TokenList: {
        const tree = tr as Tree.TokenList;
        const f = expressions.get(tree.token.type) as IExpression.TreeListExpression;
        const clone = {
          ...data
        };
        const carg = {
          ...arg
        };

        clone.i = 0;
        carg.data = clone;

        const tools = getTools(tree.list, {
          ...carg,
          run: parseTree
        }, error) as any;
        const expression = new Expression(f.name, tree);
        const baseArg = {
          expressions,
          operators,
          data: clone,
          tools,
          ast,
          plugins,
          list: tree.list,
          expression
        };

        tools.push = expression.list.push.bind(expression.list);

        for (const tokenParser of f.list) {
          switch (true) {
            case tokenParser instanceof TokenParser.Type: {
              const tr: Tree.TokenListLess | Tree.TokenList = tree.list[clone.i++];
              const tP = tokenParser as TokenParser.Type;

              tools.expectType(tr.token, tP.type);
              await tP.callback({
                ...baseArg,
                tree: tr
              });

              break;
            }
            case tokenParser instanceof TokenParser.Operator: {
              await (tokenParser as (TokenParser.Operator)).callback(baseArg);

              break;
            }
            case tokenParser instanceof TokenParser.Custom: {
              await (tokenParser as (TokenParser.Custom)).callback(baseArg);

              break;
            }
            case tokenParser instanceof TokenParser.Rest: {
              let stop = false;
              const copy = {
                ...baseArg
              } as any;
              const end = () => stop = true;
              const parser = tokenParser as TokenParser.Rest;

              copy.tools = {
                ...copy.tools
              };
              copy.tools.end = end;

              while (!stop) {
                await parser.callback(copy);
              }

              break;
            }
            case tokenParser instanceof TokenParser.Value: {
              const value = await baseArg.tools.getValue();

              tools.expectValue(value.ast);
              await (tokenParser as TokenParser.Value).callback({
                ...value,
                ...baseArg
              });

              break;
            }
            case tokenParser instanceof TokenParser.Base: throw new Error(`Shouldn't use Base of TokenParser.`);
            default: throw new Error(`Invalid TokenParser.`);
          }
        }

        const copy = { ...baseArg } as any;

        copy.tools = { ...copy.tools };
        copy.tools.push = ast.body.push.bind(ast.body);

        await f.callback(copy);

        break;
      }
      case tr instanceof Tree.TokenLessList: throw new Error(`Unexpected TokenLessList tree`);
      case tr instanceof Tree.TokenListLess: {
        const tree = tr as Tree.TokenListLess;
        const f = expressions.get(tree.token.type) as IExpression.TreeListExpression;
        const tools = getTools([], {
          ...arg,
          run: parseTree
        }, error) as any;
        const expression = new Expression(f.name, tree);
        const baseArg = {
          expressions,
          operators,
          data,
          tools,
          ast,
          plugins,
          list: [],
          expression
        };

        const copy = { ...baseArg } as any;

        copy.tools = { ...copy.tools };
        copy.tools.push = ast.body.push.bind(ast.body);

        await f.callback(copy);

        break;
      }
    }

    if (ast.type === "Value" && (data.isEnd && await data.isEnd(tr, ast) || !data.isEnd)) {
      ast.end = tr.end;

      break;
    }
  }

  if (ast.type === "Value" && data.isEnd) error.unexpectedEndOfLine(tree.end);

  ast.raw.push(...ast.body.map((a: Expression) => a.raw.join("")));

  ast.end = ast.body[ast.body.length-1]?.tree.end || tree.end;

  return ast;
};
