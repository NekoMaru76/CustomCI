import { Interpreter, AST, Token } from "../../mod.ts";
import * as ParserArgument from "../../src/engines/interfaces/Parser/Argument.ts";
import * as ExecuterArgument from "../../src/engines/interfaces/Executer/Argument.ts";

const __filename = new URL('', import.meta.url).pathname;
const __dirname = new URL('.', import.meta.url).pathname;
const main = new URL("", Deno.mainModule).pathname;
const interpreter = new Interpreter;
const file = `${__dirname}/Raw.nt`;
const content = await Deno.readTextFile(file);
const { lexer, parser, executer } = interpreter;

declare global {
  interface Window {
    sum: Function | any;
    sub: Function | any;
  }
};

lexer
  .addNumbers()
  .addAlphabets()
  .addWhitespaces()
  .addToken(`OPEN_BRACKET`, `(`)
  .addToken(`CLOSE_BRACKET`, `)`);

parser
  .addNumbers("NumberLiteral", ["NUMBER", "UNDER_SCORE"])
  .addAccessVariables("AccessVariable", ["ALPHABET", "UNDER_SCORE"])
  .expressions
    .set(`NEW_LINE`, (arg: ParserArgument.Argument) => {
      const ast = new AST(`NewLine`, {
        data: {
          isValue: true,
          body: []
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

executer
  .addAccessVariable()
  .addNumbers()
  .injectBefore(() => window.sum = (...args: number[]) => args.reduce((a: number, b: number) => a+b))
  .injectBefore(() => window.sub = (...args: number[]) => args.reduce((a: number, b: number) => a-b))
  .addExpression("NewLine", () => null)
  .addExpression("CallExpression", (arg: ExecuterArgument.Argument) => {
    const {
      tools: {
        expectType,
        expectValue,
        error
      },
      ast,
      plugins,
      expressions
    } = arg;

    expectType(ast.data.body[0].name, "AccessVariable");

    let name: string = executer.expressions.get("AccessVariable")?.({
      tools: arg.tools,
      plugins,
      expressions,
      ast: ast.data.body[0].name
    });

    switch (name) {
      case "log": {
        name = "console.log";

        break;
      }
      case "sum":
      case "sub": break;
      default: error(`FUNC(${name}) is not a valid function name`, ast.data.body[0].name);
    }

    const values = ast.data.body[0].values.map((value: AST) => {
      expectValue(value);
      return executer.expressions.get(value.type)?.({
        tools: arg.tools,
        plugins,
        expressions,
        ast: value
      });
    });

    return eval(`${name}(${values.join(",")})`);
  });

  export default async function run() {
    console.time("Transpiler");

    try {
      const res = await interpreter.run(content, file);

      console.timeEnd("Transpiler");
      console.log(`Result:`, res);

      return res;
    } catch (e) {
      console.log(`${e}`, e);
      Deno.exit(1);
    }
  };

  if (main === __filename) run();
