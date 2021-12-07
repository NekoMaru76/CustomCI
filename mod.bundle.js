class Stack1 {
    limit;
    traces;
    constructor(limit = 10){
        this.limit = 10;
        this.traces = new Proxy([], {
            set: (target, prop, value)=>{
                const ind = parseInt(prop);
                target[ind] = value;
                const { limit  } = this;
                target.splice(10);
                return target[ind] === value;
            }
        });
    }
    toString() {
        return this.traces.map((trace)=>`\tat ${trace}`
        ).join("\n");
    }
    static combine(limit, ...stacks) {
        const stack = new Stack1(limit);
        for (const st of stacks)if (st instanceof Stack1) stack.traces.push(...st.traces);
        return stack;
    }
}
class Position1 {
    index;
    column;
    file;
    line;
    constructor(index, column, line, file){
        this.index = index, this.column = column, this.file = file, this.line = line;
    }
    toString() {
        return `FILE(${this.file}) : INDEX(${this.index}) : COLUMN(${this.column}) : LINE(${this.line})`;
    }
}
class Trace1 {
    name;
    position;
    constructor(name, position){
        this.name = name, this.position = position;
    }
    toString() {
        return `POSITION(${this.position}) NAME(${this.name})`;
    }
}
class Token1 {
    type;
    value;
    raw;
    trace;
    stack;
    constructor(type, value, { raw , stack , trace  }){
        this.type = type, this.value = value, this.raw = raw, this.trace = trace, this.stack = stack;
    }
    get position() {
        return this.trace.position;
    }
}
class Error {
    name = `Error`;
    message;
    position;
    stack;
    constructor(message, options){
        this.message = message, this.position = options.position, this.stack = options.stack;
    }
    toString() {
        return `POSITION(${this.position})\n\nNAME(${this.name}): MESSAGE(${this.message})\nSTACK(\n${this.stack}\n)`;
    }
}
class LexerError1 extends Error {
    name = 'LexerError';
}
class Lexer1 {
    tokens = [];
    unknown;
    addUnknown(type) {
        this.unknown = {
            type,
            value: Symbol("")
        };
        return this;
    }
    addToken(type, value) {
        this.tokens.push({
            type,
            value
        });
        return this;
    }
    addOneTypeTokens(type, ...tokens) {
        for (const token of tokens)this.addToken(type, token);
        return this;
    }
    addAlphabets() {
        this.addOneTypeTokens(`ALPHABET`, ...`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`);
        return this;
    }
    addWhitespaces() {
        this.addToken(`NEW_LINE`, `\n`).addToken(`SPACE`, ` `);
        return this;
    }
    addSymbols() {
        this.addToken(`UNDER_SCORE`, `_`);
        return this;
    }
    addNumbers() {
        this.addOneTypeTokens(`NUMBER`, ...`0123456789.`);
        return this;
    }
    run(code, file, stack = new Stack1) {
        const result = [];
        const { tokens , unknown  } = this;
        let c = 1;
        let l = 1;
        for(let i = 0; i < code.length; i++){
            const __char = code[i];
            let next = false;
            const position = new Position1(i, c, l, file);
            const trace = new Trace1(`[Lexer]`, position);
            for (const { type , value  } of tokens){
                const raw = code.slice(i, i + value.length);
                if (value.length < code.length - i + 1 && value === raw) {
                    result.push(new Token1(type, value, {
                        raw,
                        trace,
                        stack
                    }));
                    next = true;
                    break;
                }
            }
            if (!next) {
                if (unknown) result.push(new Token1(unknown.type, unknown.value, {
                    raw: code[i],
                    trace,
                    stack
                }));
                else throw new LexerError1(`Unexpected character CHAR(${__char} : ${__char.charCodeAt(0)})`, {
                    position,
                    stack
                });
            }
            switch(__char){
                case "\n":
                    {
                        l++;
                        c = 1;
                        break;
                    }
                default:
                    c++;
            }
        }
        return result;
    }
}
class AST1 {
    type;
    data;
    raw;
    start;
    end;
    trace;
    stack;
    constructor(type, options){
        this.type = type, this.data = options?.data || {
        }, this.end = options?.end, this.start = options?.start, this.trace = options?.trace, this.stack = options?.stack || new Stack1, this.raw = options?.raw || [];
    }
    get position() {
        return this.trace?.position;
    }
}
class ParserError1 extends Error {
    name = 'ParserError';
}
class Parser1 {
    expressions = new Map;
    plugins = new Map;
    templates = {
        AccessVariables: (expressionType = "AccessVariable", tokenTypes = [])=>(arg)=>{
                const { tools: { next , getToken , getIndex , expectTypes , previous , isEnd  } , tokens , ast: mainAst  } = arg;
                const ast = new AST1(expressionType, {
                    data: {
                        isValue: true,
                        body: []
                    }
                });
                ast.data.body.push(getToken());
                ast.raw.push(...ast.data.body[0].raw);
                ast.trace = ast.data.body[0].trace;
                ast.stack = Stack1.combine(10, mainAst.stack, ast.data.body[0]?.stack);
                ast.start = ast.data.body[0].position;
                let nextToken = ast.data.body[0];
                while(!isEnd()){
                    try {
                        expectTypes(getToken(getIndex() + 1), ...tokenTypes);
                        nextToken = next();
                        ast.data.body.push(nextToken);
                        ast.raw.push(...nextToken.raw);
                    } catch  {
                        break;
                    }
                }
                ast.end = nextToken?.position || ast.data.body[ast.data.body.length - 1]?.position;
                return ast;
            }
        ,
        Numbers: (expressionType = "NumberLiteral", tokenTypes = [])=>(arg)=>{
                const { tools: { next , getToken , getIndex , expectTypes , previous , isEnd  } , tokens , ast: mainAst  } = arg;
                const ast = new AST1(expressionType, {
                    data: {
                        isValue: true,
                        body: []
                    }
                });
                ast.data.body.push(getToken());
                ast.trace = ast.data.body[0].trace;
                ast.stack = Stack1.combine(10, mainAst.stack, ast.data.body[0].stack);
                ast.start = ast.data.body[0].position;
                let nextToken = ast.data.body[0];
                while(!isEnd()){
                    try {
                        expectTypes(getToken(getIndex() + 1), ...tokenTypes);
                        nextToken = next();
                        ast.data.body.push(nextToken);
                    } catch  {
                        break;
                    }
                }
                ast.raw.push(...ast.data.body.map((v)=>v.value
                ));
                ast.end = nextToken?.position || ast.data.body[ast.data.body.length - 1]?.position;
                return ast;
            }
    };
    addAccessVariables(expressionType = "AccessVariable", tokenTypes) {
        this.expressions.set(`ALPHABET`, this.templates.AccessVariables(expressionType, tokenTypes));
        return this;
    }
    addNumbers(expressionType = "NumberLiteral", tokenTypes) {
        this.expressions.set(`NUMBER`, this.templates.Numbers(expressionType, tokenTypes));
        return this;
    }
    addOneTypeExpressions(tokenType, ...expressionCallbacks) {
        for (const expressionCallback of expressionCallbacks)this.expressions.set(tokenType, expressionCallback);
        return this;
    }
    addExpression(tokenType, expressionCallback) {
        this.expressions.set(tokenType, expressionCallback);
        return this;
    }
    run(tokens, data = {
        i: 0,
        stack: new Stack1
    }) {
        const { expressions , plugins  } = this;
        const ast = new AST1(data?.type || "Main", {
            data: {
                isValue: !!(data?.type && data?.type !== "Main"),
                body: []
            }
        });
        let token;
        if (!data.i) data.i = 0;
        for(; data.i < tokens.length; data.i++){
            token = tokens[data.i];
            const expression = expressions.get(token.type);
            let ind = data.i;
            if (!ast.start) {
                ast.start = token.position;
                ast.trace = token.trace;
                ast.stack = Stack1.combine(10, data.stack, token.stack);
            }
            if (data.i >= tokens.length - 1) ast.end = token.position;
            function error(message, token = tokens[data.i]) {
                throw new ParserError1(message, {
                    position: token.position,
                    stack: token.stack
                });
            }
            error.unexpectedToken = (token = tokens[data.i])=>error(`Unexpected token TOKEN(${token.type})`, token)
            ;
            error.expectedOneOfTheseTokensInsteadGot = (token = tokens[data.i], expected)=>error(`Expected one of these tokens: LIST(${expected.map((type)=>`TOKEN(${type})`
                ).join(" : ")}), instead got TOKEN(${token.type})`, token)
            ;
            error.expectedTokenInsteadGot = (token = tokens[data.i], expected)=>error(`Expected token TOKEN(${expected}), instead got TOKEN(${token.type})`, token)
            ;
            error.unexpectedEndOfLine = (token = tokens[data.i])=>error(`Unexpected end of line`, token)
            ;
            error.expressionIsNotExist = (token = tokens[data.i])=>error(`Expression for TOKEN(${token.type}) is not exist`, token)
            ;
            ast.end = token.position;
            switch(data?.type){
                case "Main":
                    break;
                case "Value":
                    {
                        if (data?.end.includes(token.type)) return ast;
                        break;
                    }
            }
            if (!expression) error.expressionIsNotExist();
            const arg = {
                expressions,
                data,
                tools: {
                    isEnd: ()=>tokens.length <= data.i + 1
                    ,
                    getToken: (ind = data.i)=>tokens[ind]
                    ,
                    getIndex: ()=>data.i
                    ,
                    next (filter = []) {
                        const _ = Array.isArray(filter) ? (token)=>filter.includes(token.type)
                         : filter;
                        while(1){
                            tokens[++data.i] ?? error.unexpectedEndOfLine(tokens[data.i - 1]);
                            if (!_(tokens[data.i])) return tokens[data.i];
                        }
                    },
                    previous (filter = []) {
                        const _ = Array.isArray(filter) ? (token)=>filter.includes(token.type)
                         : filter;
                        while(data.i > -1){
                            if (!_(tokens[--data.i])) return tokens[data.i];
                        }
                    },
                    expectTypes: (token, ...types)=>!types.includes(token.type) && error.expectedOneOfTheseTokensInsteadGot(token, types)
                    ,
                    expectType: (token, type)=>token.type !== type && error.expectedTokenInsteadGot(token, type)
                    ,
                    getValue: (end)=>{
                        const clone = {
                            ...data
                        };
                        clone.type = "Value";
                        clone.end = end;
                        const returned = this.run(tokens, clone);
                        data.i = clone.i;
                        return returned.data.body[0];
                    },
                    error
                },
                tokens,
                ast,
                plugins
            };
            if (typeof expression === "function") {
                ast.data.body.push(expression(arg));
            }
            ast.raw.push(...tokens.slice(Math.min(data.i, ind), Math.max(data.i, ind) + 1).map((token)=>token.raw
            ));
        }
        ast.end = token?.position || ast.start;
        return ast;
    }
}
class TransformerError extends Error {
    name = 'TransformerError';
}
class Code1 {
    ast;
    code;
    constructor(ast, code){
        this.ast = ast, this.code = code;
    }
}
class Transformer1 {
    expressions = new Map;
    plugins = new Map;
    injected = {
        before: [],
        after: []
    };
    templates = {
        AccessVariable (arg) {
            const { ast  } = arg;
            const name = ast.data.body.map((token)=>token.value
            ).join("");
            return name;
        },
        Numbers (arg) {
            const { ast  } = arg;
            return Number(ast.data.body.map((token)=>token.value
            ).join(""));
        }
    };
    injectBefore(code) {
        this.injected.before.push(code);
        return this;
    }
    injectAfter(code) {
        this.injected.after.push(code);
        return this;
    }
    addExpression(name, expression) {
        this.expressions.set(name, expression);
        return this;
    }
    addExpressions(name, ...expressions) {
        for (const expression of expressions)this.expressions.set(name, expression);
        return this;
    }
    addAccessVariable(name = "AccessVariable") {
        return this.addExpression(name, this.templates.AccessVariable);
    }
    addNumbers(name = "NumberLiteral") {
        return this.addExpression(name, this.templates.Numbers);
    }
    run(ast) {
        const { expressions , plugins , injected  } = this;
        const result = [];
        for (const exp of ast.data.body){
            const func = this.expressions.get(exp.type);
            function error(message, expression = exp) {
                throw new TransformerError(message, {
                    position: exp.position,
                    stack: exp.stack
                });
            }
            error.unexpectedExpression = (ast = exp)=>error(`Unexpected expression EXPRESSION(${ast.type})`, ast)
            ;
            error.expectedOneOfTheseExpressionsInsteadGot = (ast = exp, expected)=>error(`Expected one of these expressions: LIST(${expected.map((type)=>`EXPRESSION(${type})`
                ).join(" : ")}), instead got EXPRESSION(${ast.type})`, ast)
            ;
            error.expectedExpressionInsteadGot = (ast = exp, expected)=>error(`Expected expression EXPRESSION(${expected}), instead got EXPRESSION(${ast.type})`, ast)
            ;
            error.expressionIsNotExist = (ast = exp)=>error(`Expression EXPRESSION(${ast.type}) is not exist`, ast)
            ;
            error.expectedValue = (ast = exp)=>error(`Expected value`, ast)
            ;
            if (!func) error.expressionIsNotExist();
            result.push(new Code1(exp, func?.({
                expressions,
                plugins,
                ast: exp,
                tools: {
                    error,
                    expectTypes: (ast, types = [])=>!types.includes(ast.type) && error.expectedOneOfTheseExpressionsInsteadGot(ast, types)
                    ,
                    expectType: (ast, type)=>ast.type !== type && error.expectedExpressionInsteadGot(ast, type)
                    ,
                    expectValue: (ast)=>!ast.data.isValue && error.expectedValue(ast)
                }
            })));
        }
        return [
            ...injected.before,
            ...result.map((code)=>code.code
            ),
            ...injected.after
        ].join("");
    }
}
class Compiler2 {
    lexer = new Lexer1;
    parser = new Parser1;
    transformer = new Transformer1;
    run(code, file, stack = new Stack1) {
        const { lexer , parser , transformer  } = this;
        const lexed = lexer.run(code, file, stack);
        const ast = parser.run(lexed);
        const compiled = transformer.run(ast);
        return compiled;
    }
}
class ExecuterError extends Error {
    name = 'ExecuterError';
}
class Execute1 {
    ast;
    callback;
    constructor(ast, callback){
        this.ast = ast, this.callback = callback;
    }
}
class Executer1 {
    expressions = new Map;
    plugins = new Map;
    injected = {
        before: [],
        after: []
    };
    templates = {
        AccessVariable (arg) {
            const { ast  } = arg;
            return ast.data.body.map((token)=>token.value
            ).join("");
        },
        Numbers (arg) {
            const { ast  } = arg;
            return Number(ast.data.body.map((token)=>token.value
            ).join(""));
        }
    };
    injectBefore(callback) {
        this.injected.before.push(callback);
        return this;
    }
    injectAfter(callback) {
        this.injected.after.push(callback);
        return this;
    }
    addExpression(name, expression) {
        this.expressions.set(name, expression);
        return this;
    }
    addExpressions(name, ...expressions) {
        for (const expression of expressions)this.expressions.set(name, expression);
        return this;
    }
    addAccessVariable(name = "AccessVariable") {
        return this.addExpression(name, this.templates.AccessVariable);
    }
    addNumbers(name = "NumberLiteral") {
        return this.addExpression(name, this.templates.Numbers);
    }
    async run(ast) {
        const { expressions , plugins , injected  } = this;
        const result = [];
        for (const exp of ast.data.body){
            const func = this.expressions.get(exp.type);
            function error(message, expression = exp) {
                throw new ExecuterError(message, {
                    position: exp.position,
                    stack: exp.stack
                });
            }
            error.unexpectedExpression = (ast = exp)=>error(`Unexpected expression EXPRESSION(${ast.type})`, ast)
            ;
            error.expectedOneOfTheseExpressionsInsteadGot = (ast = exp, expected)=>error(`Expected one of these expressions: LIST(${expected.map((type)=>`EXPRESSION(${type})`
                ).join(" : ")}), instead got EXPRESSION(${ast.type})`, ast)
            ;
            error.expectedExpressionInsteadGot = (ast = exp, expected)=>error(`Expected expression EXPRESSION(${expected}), instead got EXPRESSION(${ast.type})`, ast)
            ;
            error.expressionIsNotExist = (ast = exp)=>error(`Expression EXPRESSION(${ast.type}) is not exist`, ast)
            ;
            error.expectedValue = (ast = exp)=>error(`Expected value`, ast)
            ;
            if (!func) error.expressionIsNotExist();
            result.push(new Execute1(exp, ()=>func?.({
                    expressions,
                    plugins,
                    ast: exp,
                    tools: {
                        error,
                        expectTypes: (ast, types = [])=>!types.includes(ast.type) && error.expectedOneOfTheseExpressionsInsteadGot(ast, types)
                        ,
                        expectType: (ast, type)=>ast.type !== type && error.expectedExpressionInsteadGot(ast, type)
                        ,
                        expectValue: (ast)=>!ast.data.isValue && error.expectedValue(ast)
                        ,
                        getValue: (filter = [])=>{
                            const _ = Array.isArray(filter) ? (exp)=>filter.includes(ast.type)
                             : filter;
                            for (const exp of result){
                                if (exp.ast.data.isValue && !_(exp.ast)) return exp;
                            }
                        }
                    }
                })
            ));
        }
        const done = [
            ...injected.before,
            ...result.map((exec)=>exec.callback
            ),
            ...injected.after
        ];
        let ret;
        for (const cb of done)ret = await cb();
        return ret;
    }
}
class Compiler1 {
    lexer = new Lexer1;
    parser = new Parser1;
    executer = new Executer1;
    run(code, file, stack = new Stack1) {
        const { lexer , parser , executer  } = this;
        const lexed = lexer.run(code, file, stack);
        const ast = parser.run(lexed);
        const result = executer.run(ast);
        return result;
    }
}
export { Lexer1 as Lexer };
export { Parser1 as Parser };
export { AST1 as AST };
export { Error as Error };
export { LexerError1 as LexerError };
export { ParserError1 as ParserError };
export { Position1 as Position };
export { Stack1 as Stack };
export { Token1 as Token };
export { Trace1 as Trace };
export { Transformer1 as Transformer };
export { Compiler2 as Compiler };
export { Executer1 as Executer };
export { Compiler1 as Interpreter };
export { Execute1 as Execute };
export { Code1 as Code };
const version1 = "v0.7";
export { version1 as version };
