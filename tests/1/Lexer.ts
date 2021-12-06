import { Lexer, Token } from "../../mod.ts";

const __filename = new URL('', import.meta.url).pathname;
const __dirname = new URL('.', import.meta.url).pathname;
const main = new URL("", Deno.mainModule).pathname;
const lexer = new Lexer;
const file = `${__dirname}/Raw.nt`;
const content = await Deno.readTextFile(file);

lexer
  .addNumbers()
  .addAlphabets()
  .addWhitespaces()
  .addToken(`OPEN_BRACKET`, `(`)
  .addToken(`CLOSE_BRACKET`, `)`);

export default function run(): Array<Token> {
  let res: Array<Token> = [];

  try {
    console.time(`Lexer`);

    res = lexer.run(content, file);
  } catch (e) {
    console.log(`${e}`);
  }

  console.timeEnd(`Lexer`);

  if (main === __filename) console.log(res);

  return res;
};

if (main === __filename) run();
