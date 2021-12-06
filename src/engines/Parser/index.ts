import AST from "../utils/AST.ts";
import ParserError from "../utils/ParserError.ts";
import Token from "../utils/Token.ts";
import Position from "../utils/Position.ts";
import Stack from "../utils/Stack.ts";
import { Argument } from "../interfaces/ParserArgument.ts";

export default class Parser {
  expressions: Map<string, Function> = new Map;
  plugins: Map<string, any> = new Map;
  templates: any = {
    AccessVariables: (expressionType: string = "AccessVariable", tokenTypes: Array<string> = []): Function => (arg: Argument): AST => {
      const {
        tools: {
          next, getToken, getIndex, expectTypes, previous, isEnd
        },
        tokens, ast: mainAst
      } = arg;
      const ast = new AST(expressionType, {
        isValue: true,
        body: []
      });

      ast.data.body.push(getToken());
      ast.raw.push(...ast.data.body[0].raw);

      ast.trace = ast.data.body[0].trace;
      ast.stack = Stack.combine(10, mainAst.stack, ast.data.body[0]?.stack);
      ast.start = ast.data.body[0].position;

      let nextToken: Token = ast.data.body[0];

      while (!isEnd()) {
        try {
          expectTypes(getToken(getIndex()+1), tokenTypes);

          nextToken = next();

          ast.data.body.push(nextToken);
          ast.raw.push(...nextToken.raw);
        } catch {
          break;
        }
      }

      ast.end = nextToken?.position || ast.data.body[ast.data.body.length-1]?.position;

      return ast;
    },
    Numbers: (expressionType: string = "NumberLiteral", tokenTypes: Array<string> = []): Function => (arg: Argument): AST => {
      const {
        tools: {
          next, getToken, getIndex, expectTypes, previous, isEnd
        },
        tokens, ast: mainAst
      } = arg;
      const ast = new AST(expressionType, {
        isValue: true,
        body: []
      });

      ast.data.body.push(getToken());

      ast.trace = ast.data.body[0].trace;
      ast.stack = Stack.combine(10, mainAst.stack, ast.data.body[0].stack);
      ast.start = ast.data.body[0].position;

      let nextToken: Token = ast.data.body[0];

      while (!isEnd()) {
        try {
          expectTypes(getToken(getIndex()+1), tokenTypes);

          nextToken = next();

          ast.data.body.push(nextToken);
        } catch {
          break;
        }
      }

      ast.raw.push(...ast.data.body.map((v: Token) => v.value));

      ast.end = nextToken?.position || ast.data.body[ast.data.body.length-1]?.position;

      return ast;
    }
  };
  addAccessVariables(expressionType: string = "AccessVariable", tokenTypes: Array<string>): Parser {
    this.expressions.set(`ALPHABET`, this.templates.AccessVariables(expressionType, tokenTypes));

    return this;
  }
  addNumbers(expressionType: string = "NumberLiteral", tokenTypes: Array<string>): Parser {
    this.expressions.set(`NUMBER`, this.templates.Numbers(expressionType, tokenTypes));

    return this;
  }
  run(tokens: Array<Token>, data: any = { i: 0, stack: new Stack }): AST {
    const { expressions, plugins } = this;
    const ast = new AST(data?.type || "Main", {
      isValue: !!(data?.type && data?.type !== "Main"),
      body: []
    }, []);
    let token;

    if (!data.i) data.i = 0;

    for (; data.i < tokens.length; data.i++) {
      token = tokens[data.i];

      const expression = expressions.get(token.type);
      let ind = data.i;

      if (!ast.start) {
        ast.start = token.position;
        ast.trace = token.trace;
        ast.stack = Stack.combine(10, data.stack, token.stack);
      }
      if (data.i >= tokens.length-1) ast.end = token.position;

      function error(message: string, position: Position = tokens[data.i].position, stack: Stack = tokens[data.i].stack): never {
        throw new ParserError(message, position, stack);
      }

      error.unexpectedToken = (token: Token = tokens[data.i]): never => error(`Unexpected token TOKEN(${token.type})`, token.position, token.stack);
      error.expectedOneOfTheseTokensInsteadGot = (token: Token = tokens[data.i], expected: Array<string>): never => error(`Expected one of these tokens: LIST(${expected.map(type => `TOKEN(${type})`).join(" : ")}), instead got TOKEN(${token.type})`, token.position, token.stack);
      error.expectedTokenInsteadGot = (token: Token = tokens[data.i], expected: string): never => error(`Expected token TOKEN(${expected}), instead got TOKEN(${token.type})`, token.position, token.stack);
      error.unexpectedEndOfLine = (token: Token = tokens[data.i]): never => error(`Unexpected end of line`, token.position, token.stack);
      error.expressionIsNotExist = (token: Token = tokens[data.i]): never => error(`Expression for TOKEN(${token.type}) is not exist`, token.position, token.stack);
      ast.end = token.position;

      switch (data?.type) {
        case "Main": break;
        case "Value": {
          if (data?.end.includes(token.type)) return ast;

          break;
        }
      }

      if (!expression) error.expressionIsNotExist();

      const arg = {
        expressions,
        data,
        tools: {
          isEnd: (): Boolean => tokens.length <= data.i+1,
          getToken: (ind: number = data.i): Token | undefined => tokens[ind],
          getIndex: (): number => data.i,
          next(ignore: Array<string> = []): Token | undefined {
            while (1) {
              tokens[++data.i] ?? error.unexpectedEndOfLine(tokens[data.i-1] as Token);

              if (!ignore.includes(tokens[data.i].type)) return tokens[data.i];
            }
          },
          previous(ignore: Array<string> = []): Token | undefined {
            while (data.i > -1) {
              if (!ignore.includes(tokens[--data.i]?.type)) return tokens[data.i];
            }
          },
          expectTypes: (token: Token, types: Array<string> = []): any => !types.includes(token.type) && error.expectedOneOfTheseTokensInsteadGot(token, types),
          expectType: (token: Token, type: string): any => token.type !== type && error.expectedTokenInsteadGot(token, type),
          getValue: (end: any): AST => {
            const clone = { ...data };

            clone.type = "Value";
            clone.end = end;

            const returned = this.run(tokens, clone);

            data.i = clone.i;

            return returned.data.body[0];
          },
          error
        },
        tokens,
        ast,
        plugins
      };

      if (typeof expression === "function") {
        ast.data.body.push(expression(arg));
      }

      ast.raw.push(...tokens.slice(Math.min(data.i, ind), Math.max(data.i, ind)+1).map(token => token.raw));
    }

    ast.end = token?.position || ast.start;

    return ast;
  }
};