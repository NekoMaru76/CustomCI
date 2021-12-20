import { Parser, AST, Token, TokenParser, Expression, Tree } from "../../mod.ts";
import * as ParserArgument from "../../src/engines/interfaces/Parser/Argument.ts";
import lexer from "./Lexer.ts";

const __filename = new URL('', import.meta.url).pathname;
const __dirname = new URL('.', import.meta.url).pathname;
const main = new URL("", Deno.mainModule).pathname;
const parser = new Parser;

parser
  .addExpression("SPACE", {
    isValue: false,
    isList: false,
    name: "Space",
    callback({ tools, expression }: ParserArgument.ParserTokenCallbackArgument): Expression {
      tools.error.unexpectedToken(expression.tree.start);

      return expression;
    }
  })
  .addExpression("OPEN_BRACKET", {
    isValue: true,
    isList: false,
    name: "CallExpression",
    callback({ tools, expression }: ParserArgument.ParserTokenCallbackArgument): Expression {
      tools.error.unexpectedToken(expression.tree.token);

      return expression;
    }
  })
  .addExpression("IDENTIFIERS", {
    isValue: true,
    isList: true,
    name: "CallExpression",
    isEnd: (token: Token) => token.type === "CLOSE_BRACKET",
    list: [
      new TokenParser.Type(() => {}, "OPEN_BRACKET"),
      new TokenParser.Rest(async ({ expression, ast, tools, data }: ParserArgument.RestParserTokenArgument) => {
        const tree = expression.tree as Tree.TokenList;
        const v = await tools.getValue(tree);

        data.i = v.data.i;

        tools.expectValue(v.ast.body[0]);
        tools.push(v.ast.body[0]);
        expression.raw.push(...v.ast.body[0].raw);

        if (tools.isEnd()) return tools.end();

        tools.next();

        const space = tools.getTree().token;

        expression.raw.push(space.value);
        tools.expectType(space, "SPACE");
        tools.next();
      })
    ],
    callback({ expression, ast, tools }: ParserArgument.ParserTokenCallbackArgument): Expression {
      expression.raw.splice(1, 0, "(");

      return expression;
    }
  })
  .addExpression("NUMBERS", {
    isValue: true,
    name: "Numbers",
    isList: false,
    callback({ expression }: ParserArgument.ParserTokenCallbackArgument): Expression {
      return expression;
    }
  });

export default async function run(): Promise<(AST | never)> {
  const lexed = lexer();

  try {
    console.time(`Parser`);

    const res = await parser.run(lexed);

    console.timeEnd(`Parser`);

    if (main === __filename) {
      /*console.log(Deno.inspect(res, {
        depth: Infinity
      }));*/
      console.log(res);
    }

    return res;
  } catch (e) {
    console.log(`${e}`, e);
    Deno.exit(1);
  }
};

if (main === __filename) run();
