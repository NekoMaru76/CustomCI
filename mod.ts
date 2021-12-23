// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import Error from "./src/engines/utils/Error/Base.ts";
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

export * as TokenParser from "./src/engines/utils/Parser/index.ts";
export { Error };
export { default as Expression } from "./src/engines/utils/Expression.ts";
export * as Tree from "./src/engines/utils/Tree/index.ts";
export { default as Lexer } from "./src/engines/Lexer/index.ts";
export { default as Parser } from "./src/engines/Parser/index.ts";
export { default as AST } from "./src/engines/utils/AST.ts";
export { default as Position } from "./src/engines/utils/Position.ts";
export { default as Stack } from "./src/engines/utils/Stack.ts";
export { default as Token } from "./src/engines/utils/Token.ts";
export { default as Trace } from "./src/engines/utils/Trace.ts";
export { default as Transformer } from "./src/engines/Transformer/index.ts";
export { default as Executer } from "./src/engines/Executer/index.ts";
export const version = "v2.1";
