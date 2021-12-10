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

  /**
    * Runs compiler
    * @param {string} code
    * @param {string} file
    * @param {Stack} stack
    * @returns {string} Compiled code
    */

  async run(code: string, file: string, stack: Stack = new Stack): Promise<string> {
    const { lexer, parser, transformer } = this;
    const lexed = lexer.run(code, file, stack);
    const ast = await parser.run(lexed);
    const compiled = transformer.run(ast);

    return compiled;
  }
};
