// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import Error from "./src/engines/utils/Error/index.ts";
import LexerError from "./src/engines/utils/Error/Lexer.ts";
import ParserError from "./src/engines/utils/Error/Parser.ts";
import ExecuterError from "./src/engines/utils/Error/Executer.ts";
import TransformerError from "./src/engines/utils/Error/Transformer.ts";
import OptionsError from "./src/engines/interfaces/Error/Options.ts";

Object.assign({
  Lexer: LexerError,
  Parser: ParserError,
  Excuter: ExecuterError,
  Transformer: TransformerError
}, Error);

export { Error };
export { default as Lexer } from "./src/engines/Lexer/index.ts";
//export { default as Parser } from "./src/engines/Parser/index.ts";
export { default as AST } from "./src/engines/utils/AST.ts";
export { default as Position } from "./src/engines/utils/Position.ts";
export { default as Stack } from "./src/engines/utils/Stack.ts";
export { default as Token } from "./src/engines/utils/Token.ts";
export { default as Trace } from "./src/engines/utils/Trace.ts";
//export { default as Transformer } from "./src/engines/Transformer/index.ts";
//export { default as Compiler } from "./src/engines/Compiler/index.ts";
//export { default as Executer } from "./src/engines/Executer/index.ts";
//export { default as Interpreter } from "./src/engines/Interpreter/index.ts";
//export { default as Execute } from "./src/engines/utils/Execute.ts";
//export { default as Code } from "./src/engines/utils/Code.ts";
export const version = "v1.0";
