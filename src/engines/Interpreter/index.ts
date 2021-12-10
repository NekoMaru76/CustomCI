import Lexer from "../Lexer/index.ts";
import Parser from "../Parser/index.ts";
import Executer from "../Executer/index.ts";
import Stack from "../utils/Stack.ts";
import Token from "../utils/Token.ts";
import AST from "../utils/AST.ts";

export default class Compiler {
  lexer = new Lexer;
  parser = new Parser;
  executer = new Executer;

  /**
    * Runs interpreter
    * @param {string} code
    * @param {string} file
    * @param {Stack} stack
    * @returns {*}
    */
  async run(code: string, file: string, stack: Stack = new Stack): Promise<any> {
    const { lexer, parser, executer } = this;
    const lexed = lexer.run(code, file, stack);
    const ast = await parser.run(lexed);
    const result = executer.run(ast);

    return result;
  }
};
