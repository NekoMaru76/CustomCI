import Stack from "../utils/Stack.ts";
import Position from "../utils/Position.ts";
import Trace from "../utils/Trace.ts";
import Token from "../utils/Token.ts";
import AST from "../utils/AST.ts";
import ExecuterError from "../utils/ExecuterError.ts";
import * as ExecuterArgument from "../interfaces/ExecuterArgument.ts";
import Execute from "../utils/Execute.ts";

interface Injected {
  before: Array<Function>;
  after: Array<Function>;
};

export default class Executer {
  expressions: Map<string, Function> = new Map;
  plugins: Map<string, any> = new Map;
  injected: Injected = {
    before: [],
    after: []
  };
  templates: any = {
    AccessVariable(arg: ExecuterArgument.Argument) {
      const { ast } = arg;
      const name = ast.data.body.map((token: Token) => token.value).join("");

      return () => name;
    },
    Numbers(arg: ExecuterArgument.Argument) {
      const { ast } = arg;

      return () => Number(ast.data.body.map((token: Token) => token.value).join(""));
    }
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
    * @param {string} name
    * @param {Function} expression
    * @returns {Executer}
    */
  addExpression(name: string, expression: Function): Executer {
    this.expressions.set(name, expression);

    return this;
  }

  /**
    * Adds multiple expressions
    * @param {string} name
    * @param {Array<Function>} expressions
    * @returns {Executer}
    */
  addExpressions(name: string, ...expressions: Array<Function>): Executer {
    for (const expression of expressions) this.expressions.set(name, expression);

    return this;
  }


  /**
    * Adds access variable expression template
    * @param {string} [name=AccessVariable]
    * @returns {Executer}
    */
  addAccessVariable(name: string = "AccessVariable"): Executer {
    return this.addExpression(name, this.templates.AccessVariable);
  }

  /**
    * Adds numbers expression template
    * @param {string} [name=NumberLiteral]
    * @returns {Executer}
    */
  addNumbers(name: string = "NumberLiteral"): Executer {
    return this.addExpression(name, this.templates.Numbers);
  }

  /**
    * Runs executer
    * @param {AST} ast
    * @returns {Promise<*>}
    */
  async run(ast: AST): Promise<any> {
    const { expressions, plugins, injected } = this;
    const result: Array<Execute> = [];

    for (const exp of ast.data.body) {
      const func = this.expressions.get(exp.type);

      function error(message: string, expression: AST = exp): never {
        throw new ExecuterError(message, {
          position: exp.position,
          stack: exp.stack
        });
      }

      error.unexpectedExpression = (ast: AST = exp): never => error(`Unexpected expression EXPRESSION(${ast.type})`, ast);
      error.expectedOneOfTheseExpressionsInsteadGot = (ast: AST = exp, expected: Array<string>): never => error(`Expected one of these expressions: LIST(${expected.map(type => `EXPRESSION(${type})`).join(" : ")}), instead got EXPRESSION(${ast.type})`, ast);
      error.expectedExpressionInsteadGot = (ast: AST = exp, expected: string): never => error(`Expected expression EXPRESSION(${expected}), instead got EXPRESSION(${ast.type})`, ast);
      error.expressionIsNotExist = (ast: AST = exp): never => error(`Expression EXPRESSION(${ast.type}) is not exist`, ast);
      error.expectedValue = (ast: AST = exp): never => error(`Expected value`, ast);

      if (!func) error.expressionIsNotExist();

      result.push(new Execute(exp, () => func?.({
        expressions,
        plugins,
        ast: exp,
        tools: {
          error,
          expectTypes: (ast: AST, types: Array<string> = []): any => !types.includes(ast.type) && error.expectedOneOfTheseExpressionsInsteadGot(ast, types),
          expectType: (ast: AST, type: string): any => ast.type !== type && error.expectedExpressionInsteadGot(ast, type),
          expectValue: (ast: AST): any => !ast.data.isValue && error.expectedValue(ast),
          getValue: (filter: (Function | Array<string>) = []): AST | undefined => {
            const _ = Array.isArray(filter) ? (exp: AST) => filter.includes(ast.type) : filter;

            for (const exp of result) {
              if (exp.data.isValue && !_(exp)) return exp;
            }
          }
        }
      }))());
    }

    const done: Array<Function> = [...injected.before, ...result.map(exec => exec.callback), ...injected.after];

    let ret;

    for (const cb of done)
      ret = await cb();

    return ret;
  }
};
