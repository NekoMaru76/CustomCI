import { Parser, AST, Token } from "../../mod.ts";
import * as ParserArgument from "../../src/engines/interfaces/ParserArgument.ts";
import lexer from "./Lexer.ts";

const __filename = new URL('', import.meta.url).pathname;
const __dirname = new URL('.', import.meta.url).pathname;
const main = new URL("", Deno.mainModule).pathname;
const parser = new Parser;

parser
  .addNumbers("NumberLiteral", ["NUMBER", "UNDER_SCORE"])
  .addAccessVariables("AccessVariable", ["ALPHABET", "UNDER_SCORE"])
  .expressions
    .set(`NEW_LINE`, (arg: ParserArgument.Argument) => {
      const ast = new AST(`NewLine`, {
        data: {
          isValue: false
        }
      });
      const token = arg.tools.getToken();

      ast.start = ast.end = token.position;
      ast.stack = token.stack;
      ast.trace = token.trace;

      return ast;
    })
    .set(`OPEN_BRACKET`, (arg: ParserArgument.Argument) => {
      const { tools: { next, getToken, error, getValue, getIndex, previous, isEnd }, ast: mainAst, tokens } = arg;
      const ast = new AST(`CallExpression`, {
        data: {
          isValue: true,
          body: []
        }
      });
      const name = mainAst.data.body.pop();

      !name && error.unexpectedEndOfLine(getToken());
      name.type !== "AccessVariable" && error.unexpectedToken(getToken());

      const values: Array<Token> = [];
      let nextToken = next();

      ast.start = ast.end = nextToken?.position;
      ast.stack = nextToken?.stack;
      ast.trace = nextToken?.trace;

      while (nextToken?.type !== "CLOSE_BRACKET") {
        switch (getToken(getIndex()+1)?.type) {
          case undefined: error.unexpectedEndOfLine(getToken(getIndex()-2));
          default: {
            values.push(getValue(["CLOSE_BRACKET", `SPACE`]));

            if (getToken()?.type === "CLOSE_BRACKET") {
                previous();

                break;
            }

            {
              const nextToken = getToken(getIndex()+1);

              switch (nextToken?.type) {
                case undefined: error.unexpectedEndOfLine(getToken(getIndex()-1));
                case "SPACE":
                case "NEW_LINE": error.unexpectedToken(nextToken);
              }
            }
          }
        }

        ast.end = nextToken?.position;
        nextToken = next();
      }

      ast.data.body.push({
        name, values
      });

      return ast;
    });


export default function run(): AST {
  const lexed = lexer();

  try {
    console.time(`Parser`);

    const res = parser.run(lexed);

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
