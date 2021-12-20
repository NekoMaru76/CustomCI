import AST from "../../utils/AST.ts";
import Base from "../../utils/Parser/Base.ts";

export default interface ParseTokens {
  ast: AST,
  list: Base[]
};
