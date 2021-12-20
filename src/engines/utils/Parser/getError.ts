import Operator from "../Operator.ts";
import Token from "../Token.ts";
import Expression from "../Expression.ts";
import ParserError from "../Error/Parser.ts";

export default function getError(data: any) {
  function error(message: string, token: Token): never {
    throw new ParserError(message, {
      start: token.start,
      end: token.end,
      stack: token.stack,
      raw: token.value
    });
  }

  error.unexpectedOperator = (operator: Operator): never => error(`Unexpected operator ${String(operator.type)}`, operator);
  error.unexpectedToken = (token: Token): never => error(`Unexpected token ${String(token.type)}`, token);
  error.expectedOneOfTheseTokensInsteadGot = (token: Token, expected: Array<string | symbol>): never => error(`Expected one of these tokens: (${expected.map(String).join(", ")}), instead got ${String(token.type)}`, token);
  error.expectedTokenInsteadGot = (token: Token, expected: string | symbol): never => error(`Expected token ${String(expected)}, instead got ${String(token.type)}`, token);
  error.unexpectedEndOfLine = (token: Token): never => error(`Unexpected end of line`, token);
  error.expressionIsNotExist = (token: Token): never => error(`Expression for ${String(token.type)} is not exist`, token);
  error.operatorIsNotExist = (operator: Token): never => error(`Operator for ${String(operator.type)} is not exist`, operator);
  error.expectedValue = (expression: Expression): never => {
    throw new ParserError(`Expected value`, {
      raw: expression.raw.join(""),
      start: expression.tree.start.start,
      end: expression.tree.end.end,
      stack: expression.tree.stack
    });
  };

  return error;
};
