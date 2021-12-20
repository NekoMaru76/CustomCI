import Stack from "../utils/Stack.ts";
import Position from "../utils/Position.ts";
import Trace from "../utils/Trace.ts";
import Token from "../utils/Token.ts";
import AST from "../utils/AST.ts";
import ExecuterError from "../utils/Error/Executer.ts";
import * as Tree from "../utils/Tree/index.ts";
import * as ExecuterArgument from "../interfaces/Executer/Argument.ts";
import Expression from "../utils/Expression.ts";

interface Injected {
  before: Array<Function>;
  after: Array<Function>;
};

export default class Executer {
  expressions: Map<string | symbol, Function> = new Map;
  plugins: Map<string | symbol, any> = new Map;
  injected: Injected = {
    before: [],
    after: []
  };

  /**
    * Injects a callback before executing
    * @param {Function} callback
    * @returns {Executer}
    */
  injectBefore(callback: Function): Executer {
    this.injected.before.push(callback);

    return this;
  }

  /**
    * Injects a callback after executing
    * @param {Function} callback
    * @returns {Executer}
    */
  injectAfter(callback: Function): Executer {
    this.injected.after.push(callback);

    return this;
  }

  /**
    * Adds an expression
    * @param {string | symbol} name
    * @param {Function} expression
    * @returns {Executer}
    */
  addExpression(name: string | symbol, expression: Function): Executer {
    this.expressions.set(name, expression);

    return this;
  }

  /**
    * Adds multiple expressions
    * @param {string | symbol} name
    * @param {Array<Function>} expressions
    * @returns {Executer}
    */
  addExpressions(name: string | symbol, ...expressions: Array<Function>): Executer {
    for (const expression of expressions) this.expressions.set(name, expression);

    return this;
  }

  /**
    * Runs executer
    * @param {AST} ast
    * @returns {Promise<*>}
    */
  async run(ast: AST): Promise<any> {
    const { expressions, plugins, injected } = this;

    let ret;

    for (const cb of injected.before) ret = await cb();
    for (const expression of ast.body) {
      const func = this.expressions.get(expression.type);

      function error(message: string, expression: Expression): never {
        throw new ExecuterError(message, {
          start: expression.tree.start.start,
          end: expression.tree.end.end,
          stack: expression.tree.stack,
          raw: expression.raw.join("")
        });
      }

      error.unexpectedExpression = (expression: Expression): never => error(`Unexpected expression ${String(expression.type)}`, expression);
      error.expectedOneOfTheseExpressionsInsteadGot = (expression: Expression, expected: Array<string | symbol>): never => error(`Expected one of these expressions: (${expected.map(String).join(", ")}), instead got ${String(expression.type)}`, expression);
      error.expectedExpressionInsteadGot = (expression: Expression, expected: string | symbol): never => error(`Expected expression ${String(expected)}, instead got ${String(expression.type)}`, expression);
      error.expressionIsNotExist = (expression: Expression): never => error(`Expression ${String(expression.type)} is not exist`, expression);
      error.expectedValue = (expression: Expression): never => error(`Expected value`, expression);

      if (!func) error.expressionIsNotExist(expression);

      ret = await func?.({
        expressions,
        plugins,
        ast,
        expression,
        tools: {
          error,
          expectTypes: (expression: Expression, types: (string | symbol)[] = []): any => !types.includes(expression.type) && error.expectedOneOfTheseExpressionsInsteadGot(expression, types),
          expectType: (expression: Expression, type: string | symbol): any => expression.type !== type && error.expectedExpressionInsteadGot(expression, type),
          expectValue: (expression: Expression): any => !expression.tree.isValue && error.expectedValue(expression)
        }
      });
    }
    for (const cb of injected.after) ret = await cb();

    return ret;
  }
};
