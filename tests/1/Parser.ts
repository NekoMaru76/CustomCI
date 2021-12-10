import { Parser, AST, Token } from "../../mod.ts";
import * as ParserArgument from "../../src/engines/interfaces/Parser/Argument.ts";
import lexer from "./Lexer.ts";

const __filename = new URL('', import.meta.url).pathname;
const __dirname = new URL('.', import.meta.url).pathname;
const main = new URL("", Deno.mainModule).pathname;
const parser = new Parser;

parser
  .addNumbers("NumberLiteral", ["NUMBER", "UNDER_SCORE"])
  .addAccessVariables("AccessVariable", ["ALPHABET", "UNDER_SCORE"])
  .addSum()
  .addSub()
  .addDiv()
  .addMul()
  .expressions
    .set(`NEW_LINE`, (arg: ParserArgument.Argument) => {
      const token = arg.tools.getToken();
      const ast = new AST(`NewLine`, {
        isValue: false,
        body: [token],
        stack: token.stack,
        end: token.end,
        start: token.start,
        raw: [token.value]
      });

      return ast;
    })
    .set(`OPEN_BRACKET`, async (arg: ParserArgument.Argument) => {
      const { tools: { next, getToken, error, getValue, getIndex, isEnd, expectTypes }, ast: mainAst, tokens } = arg;

      if (isEnd()) error.unexpectedEndOfLine(getToken());

      const token = getToken();
      const ast = new AST(`CallExpression`, {
        isValue: true,
        body: [],
        start: token.start,
        stack: token.stack,
        end: token.end,
        raw: [token.raw]
      });
      const name = mainAst.body.pop();

      !name && error.unexpectedEndOfLine(token);
      name.type !== "AccessVariable" && error.unexpectedToken(token);

      const values: Array<Token> = [];

      if (getToken(getIndex()+1)?.type !== "CLOSE_BRACKET") while (getToken()?.type !== "CLOSE_BRACKET") {
        next();

        const value = await getValue(["CLOSE_BRACKET", "SPACE"]);

        ast.end = getToken()?.position || ast.end || ast.start;

        ast.raw.push(...value.raw);
        expectTypes(getToken(), ["CLOSE_BRACKET", "SPACE"]);
        values.push(value);
      }

      ast.body.push({
        name, values
      });

      return ast;
    });


export default async function run(): Promise<(AST | never)> {
  const lexed = lexer();

  try {
    console.time(`Parser`);

    const res = await parser.run(lexed);

    if (main === __filename) console.log(Deno.inspect(res, {
      depth: Infinity
    }));

    console.timeEnd(`Parser`);

    return res;
  } catch (e) {
    console.log(`${e}`, e);
    Deno.exit(1);
  }
};

if (main === __filename) run();
