import { Lexer, Token } from "../../mod.ts";

const __filename = new URL('', import.meta.url).pathname;
const __dirname = new URL('.', import.meta.url).pathname;
const main = new URL("", Deno.mainModule).pathname;
const lexer = new Lexer;
const file = `${__dirname}/Raw.nt`;
const content = await Deno.readTextFile(file);

lexer
  .addToken({
    type: "IDENTIFIERS",
    startValues: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split(""),
    values: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_0123456789".split(""),
    mustSkip: false,
    canCollide: true,
    isContinuous: true
  })
  .addToken({
    type: "NUMBERS",
    startValues: "0123456789".split(""),
    values: "0123456789_".split(""),
    mustSkip: false,
    canCollide: true,
    isContinuous: true
  })
  .addToken({
    type: "NEW_LINE",
    startValues: ["\n"],
    values: ["\n"],
    mustSkip: true,
    canCollide: true,
    isContinuous: true
  })
  .addToken({
    type: "SPACE",
    startValues: [" "],
    mustSkip: false,
    canCollide: false,
    isContinuous: false
  })
  .addToken({
    type: "OPEN_BRACKET",
    startValues: ["("],
    mustSkip: false,
    canCollide: false,
    isContinuous: false
  })
  .addToken({
    type: "CLOSE_BRACKET",
    startValues: [")"],
    mustSkip: false,
    canCollide: false,
    isContinuous: false
  });

export default function run(): Array<Token> | never {
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
