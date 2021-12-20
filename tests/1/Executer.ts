import { Expression, Executer, AST, Token } from "../../mod.ts";
import parser from "./Parser.ts";
import * as ExecuterArgument from "../../src/engines/interfaces/Executer/Argument.ts";

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
  .injectBefore(() => window.sum = (...args: number[]) => args.reduce((a: number, b: number) => a+b))
  .injectBefore(() => window.sub = (...args: number[]) => args.reduce((a: number, b: number) => a-b))
  .addExpression("NewLine", () => null)
  .addExpression("Identifiers", (arg: ExecuterArgument.Argument) => {
    return arg.expression.tree.token.value;
  })
  .addExpression("Numbers", (arg: ExecuterArgument.Argument) => {
    return Number(arg.expression.tree.token.value.replaceAll("_", ""));
  })
  .addExpression("CallExpression", (arg: ExecuterArgument.Argument) => {
    const {
      tools,
      ast,
      plugins,
      expressions,
      expression
    } = arg;

    let name = expression.tree.token.value;

    switch (name) {
      case "log": {
        name = "console.log";

        break;
      }
      case "sum":
      case "sub":
      case "mul":
      case "div": break;
      default: tools.error(`${name} is not a valid function name`, expression);
    }

    const values = expression.list.map((value: Expression) => {
      tools.expectValue(value);
      return executer.expressions.get(value.type)?.({
        tools,
        plugins,
        expressions,
        ast,
        expression: value,
        previousExpression: expression
      });
    });

    return eval(`${name}(${values.join(",")})`);
  });

export default async function run(): Promise<any> {
  let res;

  try {
    const ast = await parser();

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
