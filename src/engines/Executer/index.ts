import Stack from "../utils/Stack.ts";
import Position from "../utils/Position.ts";
import Trace from "../utils/Trace.ts";
import Token from "../utils/Token.ts";
import AST from "../utils/AST.ts";
import ExecuterError from "../utils/ExecuterError.ts";
import * as ExecuterArgument from "../interfaces/ExecuterArgument.ts";

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

  injectBefore(callback: Function): Executer {
    this.injected.before.push(callback);

    return this;
  }
  injectAfter(callback: Function): Executer {
    this.injected.after.push(callback);

    return this;
  }
  addExpression(name: string, expression: Function): Executer {
    this.expressions.set(name, expression);

    return this;
  }
  addExpressions(name: string, ...expressions: Array<Function>): Executer {
    for (const expression of expressions) this.expressions.set(name, expression);

    return this;
  }
  addAccessVariable(name: string = "AccessVariable"): Executer {
    return this.addExpression(name, this.templates.AccessVariable);
  }
  addNumbers(name: string = "NumberLiteral"): Executer {
    return this.addExpression(name, this.templates.Numbers);
  }
  async run(ast: AST): Promise<any> {
    const { expressions, plugins, injected } = this;
    const result: Array<Function> = [...injected.before];

    for (const exp of ast.data.body) {
      const func = this.expressions.get(exp.type);

      function error(message: string, position: Position = exp.position, stack: Stack = exp.stack): never {
        throw new ExecuterError(message, position, stack);
      }

      error.unexpectedExpression = (ast: AST = exp): never => error(`Unexpected expression EXPRESSION(${ast.type})`, ast.position, ast.stack);
      error.expectedOneOfTheseExpressionsInsteadGot = (ast: AST = exp, expected: Array<string>): never => error(`Expected one of these expressions: LIST(${expected.map(type => `EXPRESSION(${type})`).join(" : ")}), instead got EXPRESSION(${ast.type})`, ast.position, ast.stack);
      error.expectedExpressionInsteadGot = (ast: AST = exp, expected: string): never => error(`Expected expression EXPRESSION(${expected}), instead got EXPRESSION(${ast.type})`, ast.position, ast.stack);
      error.expressionIsNotExist = (ast: AST = exp): never => error(`Expression EXPRESSION(${ast.type}) is not exist`, ast.position, ast.stack);
      error.expectedValue = (ast: AST = exp): never => error(`Expected value`, ast.position, ast.stack);

      if (!func) error.expressionIsNotExist();

      result.push(() => func?.({
        expressions,
        plugins,
        ast: exp,
        tools: {
          error,
          expectTypes: (ast: AST, types: Array<string> = []): any => !types.includes(ast.type) && error.expectedOneOfTheseExpressionsInsteadGot(ast, types),
          expectType: (ast: AST, type: string): any => ast.type !== type && error.expectedExpressionInsteadGot(ast, type),
          expectValue: (ast: AST): any => !ast.data.isValue && error.expectedValue(ast)
        }
      })());
    }

    result.push(...injected.after);

    let ret;

    for (const cb of result)
      ret = await cb();

    return ret;
  }
};
