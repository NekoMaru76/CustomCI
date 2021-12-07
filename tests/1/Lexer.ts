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
  try {
    console.time(`Lexer`);

    const res = lexer.run(content, file);

    console.timeEnd(`Lexer`);

    if (main === __filename) console.log(res);

    return res;
  } catch (e) {
    console.log(`${e}`);
    Deno.exit(1);
  }
};

if (main === __filename) run();
