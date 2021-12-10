import AST from "../utils/AST.ts";
import ParserError from "../utils/Error/Parser.ts";
import Token from "../utils/Token.ts";
import Operator from "../utils/Operator.ts";
import Position from "../utils/Position.ts";
import Stack from "../utils/Stack.ts";
import { Argument } from "../interfaces/Parser/Argument.ts";
import Trace from "../utils/Trace.ts";

const inter = <Type>(cb: Function): Promise<Type> => new Promise(($: Function, _: Function) => {
  setTimeout(async () => {
    try {
      $(await cb());
    } catch (e) {
      _(e);
    }
  });
});

export default class Parser {
  expressions: Map<string, Function> = new Map;
  operators: Map<string, Function> = new Map;
  plugins: Map<string, any> = new Map;
  templates: any = {

    /**
      * Returns a callback that parses lexer into AST
      * @param {string} type - AST's type
      */
    Math(type: string): Function {

      /**
        * Parses lexer into AST
        * @param {Argument} arg
        */
      return async function callback(arg: Argument): Promise<AST> {
        const {
          tools: {
            getOperator, getIndex, isEnd, expectValue, getValue, error, next, getToken
          },
          tokens, ast: mainAst
        } = arg;
        const operator = getOperator();
        const ast = new AST(type, {
          isValue: true,
          body: mainAst.body.splice(mainAst.body.length-1, 1),
          start: operator.start,
          raw: [],
          end: operator.end
        });

        if (isEnd(getIndex()+1)) error.unexpectedEndOfLine(operator);

        next();

        const nextToken = await getValue();

        expectValue(nextToken);
        ast.body.push(nextToken);

        ast.end = nextToken.end;

        return ast;
      };
    },

    /**
      * Returns a callback that parses lexer into AST to access variables
      * @param {string} type - AST's type
      * @param {Array<string>} types - Tokens' type
      */
    AccessVariables(type: string, types: Array<string> = []): Function {

      /**
        * Parses lexer into AST to access variables
        * @param {Argument} arg
        */
      return function callback(arg: Argument): AST {
        const {
          tools: {
            next, getToken, getIndex, expectTypes, isEnd
          },
          tokens, ast: mainAst
        } = arg;
        let nextToken = getToken();
        const ast = new AST(type, {
          isValue: true,
          body: mainAst.body.splice(mainAst.body.length-1, 1),
          start: nextToken.start,
          raw: [],
          end: nextToken.end
        });

        ast.body.push(nextToken);
        ast.raw.push(...nextToken.raw);

        ast.stack = Stack.combine(10, [mainAst.stack, nextToken?.stack]);

        while (!isEnd()) {
          try {
            expectTypes(getToken(getIndex()+1), types);

            nextToken = next();

            ast.body.push(nextToken);
            ast.raw.push(...nextToken.raw);
          } catch {
            break;
          }
        }

        ast.end = nextToken?.end || ast.end;

        return ast;
      };
    },

    /**
      * Returns a callback that parses lexer into AST to numbers
      * @param {string} type - AST's type
      * @param {Array<string>} types - Tokens' type
      */
    Numbers(type: string, types: Array<string> = []): Function {

      /**
        * Parses lexer into AST to access variables
        * @param {Argument} arg
        */
      return function callback(arg: Argument): AST {
        const {
          tools: {
            next, getToken, getIndex, expectTypes, isEnd
          },
          tokens, ast: mainAst
        } = arg;
        let nextToken = getToken();
        const ast = new AST(type, {
          isValue: true,
          body: mainAst.body.splice(mainAst.body.length-1, 1),
          start: nextToken.start,
          raw: [],
          end: nextToken.end
        });

        ast.body.push(nextToken);

        ast.stack = Stack.combine(10, [mainAst.stack, nextToken?.stack]);

        while (!isEnd()) {
          try {
            expectTypes(getToken(getIndex()+1), types);

            nextToken = next();

            ast.body.push(nextToken);
          } catch {
            break;
          }
        }

        ast.raw.push(...ast.body.map((v: Token) => v.value));

        ast.end = nextToken?.end || ast.end;

        return ast;
      };
    }
  };

  /**
    * Adds alphabets expression
    * @param {string} [type=ALPHABET] - AST's type
    * @param {Array<string>} types - Tokens' type
    * @returns {Parser}
    */
  addAccessVariables(type: string = "AccessVariable", tokenTypes: Array<string>): Parser {
    return this.addMultipleTypesExpression(tokenTypes, this.templates.AccessVariables(type, tokenTypes));
  }

  /**
    * Adds numbers expression
    * @param {string} [type=ALPHABET] - AST's type
    * @param {Array<string>} types - Tokens' type
    * @returns {Parser}
    */
  addNumbers(type: string = "NumberLiteral", tokenTypes: Array<string>): Parser {
    return this.addMultipleTypesExpression(tokenTypes, this.templates.Numbers(type, tokenTypes));
  }

  /**
    * Adds multiple expressions
    * @param {string} type - AST's
    * @param {Array<Function>} callbacks
    * @returns {Parser}
    */
  addOneTypeExpressions(type: string, callbacks: Function[]): Parser {
    for (const callback of callbacks) this.addExpression(type, callback);

    return this;
  }


  /**
    * Adds multiple types expression
    * @param {string[]} types - Tokens' type
    * @param {Function} callback
    * @returns {Parser}
    */
  addMultipleTypesExpression(types: string[], callback: Function): Parser {
    for (const type of types) this.addExpression(type, callback);

    return this;
  }
  /**
    * Adds an expression
    * @param {string} type - Token's type
    * @param {Function} callback
    * @returns {Parser}
    */
  addExpression(type: string, callback: Function): Parser {
    this.expressions.set(type, callback);

    return this;
  }

  /**
    * Adds multiple operators
    * @param {string} type
    * @param {Array<Function>} callbacks
    * @returns {Parser}
    */
  addOneTypeOperators(type: string, ...callbacks: Function[]): Parser {
    for (const callback of callbacks) this.operators.set(type, callback);

    return this;
  }

  /**
    * Adds an operator
    * @param {string} type
    * @param {Function} callback
    * @returns {Parser}
    */
  addOperator(type: string, callback: Function): Parser {
    this.operators.set(type, callback);

    return this;
  }

  /**
    * Adds sum operator
    * @param {string} [tokenType=SUM] - Token's type
    * @param {string} [type=Sum] - AST's type
    * @returns {Parser}
    */
  addSum(type: string = "Sum", tokenType: string = "SUM"): Parser {
    return this.addOperator(tokenType, this.templates.Math(type));
  }

  /**
    * Adds sub operator
    * @param {string} [tokenType=SUB] - Token's type
    * @param {string} [type=Sub] - AST's type
    * @returns {Parser}
    */
  addSub(type: string = "Sub", tokenType: string = "SUB"): Parser {
    return this.addOperator(tokenType, this.templates.Math(type));
  }

  /**
    * Adds div operator
    * @param {string} [tokenType=DIV] - Token's type
    * @param {string} [type=Div] - AST's type
    * @returns {Parser}
    */
  addDiv(type: string = "Div", tokenType: string = "DIV"): Parser {
    return this.addOperator(tokenType, this.templates.Math(type));
  }

  /**
    * Adds mul operator
    * @param {string} [tokenType=MUL] - Token's type
    * @param {string} [type=Mul] - AST's type
    * @returns {Parser}
    */
  addMul(type: string = "Mul", tokenType: string = "MUL"): Parser {
    return this.addOperator(tokenType, this.templates.Math(type));
  }

  /**
    * Runs parser
    * @param {Array<Token>} tokens
    * @param {*} data
    * @returns {AST}
    */
  async run(tokens: Array<Token>, data: any = { i: 0, stack: new Stack }): Promise<AST> {
    const { expressions, plugins, operators } = this;
    const ast = new AST(data?.type || "Main", {
      isValue: !!(data?.type && data?.type !== "Main"),
      body: [],
      start: new Trace("", new Position(0, 0, 0, "")),
      end: new Trace("", new Position(0, 0, 0, "")),
      raw: []
    });
    const self = this;

    if (!data.i) data.i = 0;

    function error(message: string, token: Token = tokens[data.i]): never {
      throw new ParserError(message, {
        start: token.start,
        end: token.end,
        stack: token.stack,
        raw: token.raw
      });
    }

    error.unexpectedOperator = (operator: Operator): never => error(`Unexpected operator ${operator.type}`, operator);
    error.unexpectedToken = (token: Token = tokens[data.i]): never => error(`Unexpected token ${token.type}`, token);
    error.expectedOneOfTheseTokensInsteadGot = (token: Token = tokens[data.i], expected: Array<string>): never => error(`Expected one of these tokens: (${expected.join(", ")}), instead got ${token.type}`, token);
    error.expectedTokenInsteadGot = (token: Token = tokens[data.i], expected: string): never => error(`Expected token ${expected}, instead got ${token.type}`, token);
    error.unexpectedEndOfLine = (token: Token = tokens[data.i]): never => error(`Unexpected end of line`, token);
    error.expressionIsNotExist = (token: Token = tokens[data.i]): never => error(`Expression for ${token.type} is not exist`, token);
    error.operatorIsNotExist = (operator: Token = tokens[data.i]): never => error(`Operator for ${operator.type} is not exist`, operator);
    error.expectedValue = {
      ast: (ast: AST = _.body[_.body.length-1]): never => {
        throw new ParserError(`Expected value`, {
          raw: ast.raw.join(""),
          start: ast.start,
          end: ast.end,
          stack: ast.stack
        });
      },
      token: (token: Token = tokens[data.i]): never => error(`Expected value`, token)
    };

    const _ = ast;

    for (; data.i < tokens.length; data.i++) {
      const token = tokens[data.i];
      const isToken = !(token instanceof Operator);
      const ind = data.i;
      const col = isToken ? Token : Operator;
      const list = isToken ? expressions : operators;
      const tools = {
        /**
          * @param {number} [ind=data.i]
          * @returns {boolean}
          */
        isEnd: (ind: number = data.i): Boolean => tokens.length <= ind+1,

        /**
          * Gets token with the index
          * @param {number} [ind=data.i]
          * @returns {Token | undefined}
          */
        getToken: (ind: number = data.i): Token | undefined => {
          if (tokens[ind] instanceof Operator) error.unexpectedOperator(tokens[ind] as Operator);

          return tokens[ind];
        },

        /**
          * Gets operator with the index
          * @param {number} [ind=data.i]
          * @returns {Operator | undefined}
          */
        getOperator: (ind: number = data.i): Operator | undefined => {
          if (tokens[ind] instanceof Operator) return tokens[ind] as Operator;
        },

        /**
          * Gets token/operator with the index
          * @param {number} [ind=data.i]
          * @returns {Operator | Token | undefined}
          */
        get: (ind: number = data.i): Operator | Token | undefined => tokens[ind] instanceof Operator ? tokens[ind] as Operator : tokens[ind],

        /**
          * Gets current index
          * @returns {number
          */
        getIndex: (): number => data.i,

        /**
          * Check does the AST provided is a valid one, if it isn't, it will throw error. Otherwise returns false.
          * @param {AST} ast
          * @returns {boolean | never}
          */
        expectValue: (ast: AST = _.body[_.body.length-1], position: AST | Token | any = ast): boolean | never => !ast.isValue && error.expectedValue[position instanceof AST ? "ast" : "token"](position),
        next(filter: (Array<string> | Function) = []): Token | undefined {
          const _ = Array.isArray(filter) ? (token: Token) => !filter.includes(token.type) : filter;

          while (1) {
            tokens[++data.i] ?? error.unexpectedEndOfLine(tokens[data.i-1] as Token);

            if (_(tokens[data.i])) return tokens[data.i];
          }
        },
        previous(filter: (Array<string> | Function) = []): Token | undefined {
          const _ = Array.isArray(filter) ? (token: Token) => filter.includes(token.type) : filter;

          while (data.i > 0) {
            if (_(tokens[--data.i])) return tokens[data.i];
          }
        },
        expectTypes: (token: Token, types: Array<string>): boolean | never => !types.includes(token.type) && error.expectedOneOfTheseTokensInsteadGot(token, types),
        expectType: (token: Token, type: string): boolean | never => token.type !== type && error.expectedTokenInsteadGot(token, type),
        async getValue(end: Array<string> = []): Promise<AST> {
          const clone = { ...data };

          clone.type = "Value";
          clone.stop = end;

          const returned = await self.run(tokens, clone);

          data.i = clone.i;

          return returned.body[0];
        },
        error
      };
      const arg = {
        expressions,
        operators,
        data,
        tools,
        tokens,
        ast,
        plugins
      };

      if (!isToken) {/*
        ast.body.push(...(
          await inter<AST>(
            () => this.run((token as Operator).before, {
              stack: data.stack
            })
          )
        ).body);*/
        console.log(ast.body)
      }

      if (!ast.start) {
        ast.start = token.start;
        ast.stack = Stack.combine(10, [data.stack, token.stack]);
      }
      if (data.i >= tokens.length-1) {
        ast.end = tokens[tokens.length-1].end || ast.end;

        break;
      }

      ast.end = token.end;

      const f = list.get(token.type);

      switch (data?.type) {
        case "Main": break;
        case "Value": {
          if (data?.stop?.includes(token.type)) {
            ast.end = tokens[data.i-1]?.end || ast.start;

            return ast;
          }

          break;
        }
      }

      if (typeof f !== "function") error[`${isToken ? "expression" : "operator"}IsNotExist`]();

      ast.body.push(await f?.(arg));
      ast.raw.push(...tokens.slice(Math.min(data.i, ind), Math.max(data.i, ind)+1).map(token => token.raw));
    }

    if (!ast.body.length) error.expectedValue.token(tokens[tokens.length-1]);

    ast.end = tokens[tokens.length-1]?.end || ast.end || ast.start;

    return ast;
  }
};
