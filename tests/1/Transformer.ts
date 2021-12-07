import { Transformer, AST, Token } from "../../mod.ts";
import parser from "./Parser.ts";
import * as TransformerArgument from "../../src/engines/interfaces/TransformerArgument.ts";

const __filename = new URL('', import.meta.url).pathname;
const __dirname = new URL('.', import.meta.url).pathname;
const main = new URL("", Deno.mainModule).pathname;
const transformer = new Transformer;

transformer
  .addAccessVariable()
  .addNumbers()
  .injectBefore("const sum = (...args: number[]) => args.reduce((a: number, b: number) => a+b);\n")
  .injectBefore("const sub = (...args: number[]) => args.reduce((a: number, b: number) => a-b);\n")
  .addExpression("NewLine", () => "")
  .addExpression("CallExpression", (arg: TransformerArgument.Argument) => {
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

    let name: string = transformer.expressions.get("AccessVariable")?.({
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
      default: error(`FUNC(${name}) is not a valid function name`, ast.data.body[0].name.trace, ast.data.body[0].name.stack);
    }

    const values = ast.data.body[0].values.map((value: AST) => {
      expectValue(value);
      return transformer.expressions.get(value.type)?.({
        tools: arg.tools,
        plugins,
        expressions,
        ast: value
      });
    });

    return `${name}(${values.join(",")})`;
  });

export default async function run(): Promise<string> {
  try {
    const ast = parser();

    console.time(`Transformer`);

    const res = transformer
      .run(ast);

    console.timeEnd(`Transformer`);

    return res;
  } catch (e) {
    console.log(`${e}`, e);
    Deno.exit(1);
  }
};

if (main === __filename) run();
