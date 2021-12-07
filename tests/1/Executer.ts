import { Executer, AST, Token } from "../../mod.ts";
import parser from "./Parser.ts";
import * as ExecuterArgument from "../../src/engines/interfaces/ExecuterArgument.ts";

const __filename = new URL('', import.meta.url).pathname;
const __dirname = new URL('.', import.meta.url).pathname;
const main = new URL("", Deno.mainModule).pathname;
const executer = new Executer;

declare global {
  interface Window {
    sum: Function | any;
    sub: Function | any;
  }
};

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

export default async function run(): Promise<any> {
  let res;

  try {
    const ast = parser();

    console.time(`Executer`);

    res = await executer
      .run(ast);
  } catch (e) {
    console.log(`${e}`, e);
    Deno.exit(1);
  }

  console.timeEnd(`Executer`);

  if (main === __filename) console.log(`Result:`, res);

  return res;
};

if (main === __filename) run();
