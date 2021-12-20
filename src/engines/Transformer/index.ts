import Stack from "../utils/Stack.ts";
import Position from "../utils/Position.ts";
import Trace from "../utils/Trace.ts";
import Token from "../utils/Token.ts";
import AST from "../utils/AST.ts";
import TransformerError from "../utils/Error/Transformer.ts";
import * as TransformerArgument from "../interfaces/Transformer/Argument.ts";
import Expression from "../utils/Expression.ts";

interface Injected {
  before: Array<string>;
  after: Array<string>;
};

export default class Transformer {
  expressions: Map<string | symbol, Function> = new Map;
  plugins: Map<string | symbol, any> = new Map;
  injected: Injected = {
    before: [],
    after: []
  };

  injectBefore(code: string): Transformer {
    this.injected.before.push(code);

    return this;
  }
  injectAfter(code: string): Transformer {
    this.injected.after.push(code);

    return this;
  }
  addExpression(name: string | symbol, expression: Function): Transformer {
    this.expressions.set(name, expression);

    return this;
  }
  addExpressions(name: string | symbol, ...expressions: Array<Function>): Transformer {
    for (const expression of expressions) this.expressions.set(name, expression);

    return this;
  }

  /**
    * Runs transformer
    * @param {AST} ast
    * @returns {string}
    */
  async run(ast: AST): Promise<string> {
    const { expressions, plugins, injected } = this;
    const result: Array<string> = [];

    for (const expression of ast.body) {
      const func = this.expressions.get(expression.type);

      function error(message: string, expression: Expression): never {
        throw new TransformerError(message, {
          start: expression.tree.start.start,
          end: expression.tree.end.end,
          stack: expression.tree.stack,
          raw: expression.raw.join("")
        });
      }

      error.unexpectedExpression = (expression: Expression): never => error(`Unexpected expression ${String(expression.type)}`, expression);
      error.expectedOneOfTheseExpressionsInsteadGot = (expression: Expression, expected: Array<string | symbol>): never => error(`Expected one of these expressions: (${expected.map(String).join(" : ")}), instead got ${String(expression.type)}`, expression);
      error.expectedExpressionInsteadGot = (expression: Expression, expected: string | symbol): never => error(`Expected expression ${String(expected)}, instead got ${String(expression.type)}`, expression);
      error.expressionIsNotExist = (expression: Expression): never => error(`Expression ${String(expression.type)} is not exist`, expression);
      error.expectedValue = (expression: Expression): never => error(`Expected value`, expression);

      if (!func) error.expressionIsNotExist(expression);

      result.push(func?.({
        expressions,
        plugins,
        ast,
        tools: {
          error,
          expectTypes: (expression: Expression, types: Array<string | symbol> = []): any => !types.includes(expression.type) && error.expectedOneOfTheseExpressionsInsteadGot(expression, types),
          expectType: (expression: Expression, type: string | symbol): any => expression.type !== type && error.expectedExpressionInsteadGot(expression, type),
          expectValue: (expression: Expression): any => !expression.tree.isValue && error.expectedValue(expression)
        },
        expression
      }));
    }

    return [...injected.before, ...result, ...injected.after].join("");
  }
};
