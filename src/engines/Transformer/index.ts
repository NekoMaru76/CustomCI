import Stack from "../utils/Stack.ts";
import Position from "../utils/Position.ts";
import Trace from "../utils/Trace.ts";
import Token from "../utils/Token.ts";
import AST from "../utils/AST.ts";
import TransformerError from "../utils/Error/Transformer.ts";
import * as TransformerArgument from "../interfaces/Transformer/Argument.ts";
import Code from "../utils/Code.ts";

interface Injected {
  before: Array<string>;
  after: Array<string>;
};

export default class Transformer {
  expressions: Map<string, Function> = new Map;
  plugins: Map<string, any> = new Map;
  injected: Injected = {
    before: [],
    after: []
  };
  templates: any = {
    AccessVariable(arg: TransformerArgument.Argument) {
      const { ast } = arg;
      const name = ast.body.map((token: Token) => token.value).join("");

      return name;
    },
    Numbers(arg: TransformerArgument.Argument) {
      const { ast } = arg;

      return Number(ast.body.map((token: Token) => token.value).join(""));
    }
  };

  /**
    * Injects a code before compiling
    * @param {string} code
    * @returns {Transformer}
    */
  injectBefore(code: string): Transformer {
    this.injected.before.push(code);

    return this;
  }

  /**
    * Injects a code after compiling
    * @param {string} code
    * @returns {Transformer}
    */
  injectAfter(code: string): Transformer {
    this.injected.after.push(code);

    return this;
  }

  /**
    * Adds an expression
    * @param {string} name
    * @param {Function} expression
    * @returns {Transformer}
    */
  addExpression(name: string, expression: Function): Transformer {
    this.expressions.set(name, expression);

    return this;
  }

  /**
    * Adds multiple expressions
    * @param {string} name
    * @param {Array<Function>} expressions
    * @returns {Transformer}
    */
  addExpressions(name: string, ...expressions: Array<Function>): Transformer {
    for (const expression of expressions) this.expressions.set(name, expression);

    return this;
  }

  /**
    * Adds access variable expressions
    * @param {string} [name=AccessVariable]
    * @returns {Transformer}
    */
  addAccessVariable(name: string = "AccessVariable"): Transformer {
    return this.addExpression(name, this.templates.AccessVariable);
  }

  /**
    * Adds numbers expressions
    * @param {string} [name=NumberLiteral]
    * @returns {Transformer}
    */
  addNumbers(name: string = "NumberLiteral"): Transformer {
    return this.addExpression(name, this.templates.Numbers);
  }

  /**
    * Runs transformer
    * @param {AST} ast
    * @returns {string}
    */
  async run(ast: AST): Promise<string> {
    const { expressions, plugins, injected } = this;
    const result: Array<Code> = [];

    for (const exp of ast.body) {
      const func = this.expressions.get(exp.type);

      function error(message: string, expression: AST = exp): never {
        throw new TransformerError(message, {
          position: exp.position,
          stack: exp.stack,
          raw: exp.raw.join("")
        });
      }

      error.unexpectedExpression = (ast: AST = exp): never => error(`Unexpected expression ${ast.type}`, ast);
      error.expectedOneOfTheseExpressionsInsteadGot = (ast: AST = exp, expected: Array<string>): never => error(`Expected one of these expressions: (${expected.join(" : ")}), instead got EXPRESSION(${ast.type})`, ast);
      error.expectedExpressionInsteadGot = (ast: AST = exp, expected: string): never => error(`Expected expression ${expected}, instead got ${ast.type}`, ast);
      error.expressionIsNotExist = (ast: AST = exp): never => error(`Expression ${ast.type} is not exist`, ast);
      error.expectedValue = (ast: AST = exp): never => error(`Expected value`, ast);

      if (!func) error.expressionIsNotExist();

      result.push(new Code(exp, func?.({
        expressions,
        plugins,
        ast: exp,
        tools: {
          error,
          expectTypes: (ast: AST, types: Array<string> = []): any => !types.includes(ast.type) && error.expectedOneOfTheseExpressionsInsteadGot(ast, types),
          expectType: (ast: AST, type: string): any => ast.type !== type && error.expectedExpressionInsteadGot(ast, type),
          expectValue: (ast: AST): any => !ast.isValue && error.expectedValue(ast)
        }
      })));
    }

    return [...injected.before, ...result.map(code => code.code), ...injected.after].join("");
  }
};
