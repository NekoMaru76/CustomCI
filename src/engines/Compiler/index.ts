import Lexer from "../Lexer/index.ts";
import Parser from "../Parser/index.ts";
import Transformer from "../Transformer/index.ts";
import Stack from "../utils/Stack.ts";
import Token from "../utils/Token.ts";
import AST from "../utils/AST.ts";

export default class Compiler {
  lexer = new Lexer;
  parser = new Parser;
  transformer = new Transformer;

  run(code: string, file: string, stack: Stack = new Stack): string {
    const { lexer, parser, transformer } = this;
    const lexed = lexer.run(code, file, stack);
    const ast = parser.run(lexed);
    const compiled = transformer.run(ast);

    return compiled;
  }
};
