class Base {
    name = `Error`;
    message;
    start;
    end;
    stack;
    raw;
    constructor(message, options){
        this.message = message, this.start = options.start, this.end = options.end, this.raw = options.raw, this.stack = options.stack;
    }
    toString() {
        return `Start: ${this.start.toString()}\nEnd: ${this.end.toString()}\n${this.name}: ${this.message}\nRaw: ${this.raw}\n${this.stack.toString()}\n`;
    }
}
class LexerError extends Base {
    name = 'LexerError';
}
class ParserError extends Base {
    name = 'ParserError';
}
class ExecuterError extends Base {
    name = 'ExecuterError';
}
class TransformerError extends Base {
    name = 'TransformerError';
}
class Base1 {
}
class Rest extends Base1 {
    tokens = [];
    callback;
    constructor(callback){
        super();
        this.callback = callback;
    }
}
class Value extends Base1 {
    callback;
    constructor(callback){
        super();
        this.callback = callback;
    }
}
class Operator extends Value {
    before = [];
    after = [];
    constructor(callback){
        super(callback);
    }
}
class Custom extends Base1 {
    callback;
    constructor(callback){
        super();
        this.callback = callback;
    }
}
class Type extends Base1 {
    type;
    callback;
    constructor(callback, type){
        super();
        this.type = type;
        this.callback = callback;
    }
}
const mod = {
    Base: Base1,
    Rest: Rest,
    Value: Value,
    Operator: Operator,
    Custom: Custom,
    Type: Type
};
class Expression {
    list = [];
    raw = [];
    tree;
    type;
    constructor(type, tree){
        this.tree = tree;
        this.type = type;
    }
}
class Base2 {
    start;
    end;
    isValue;
    stack;
    constructor(stack, start, end, isValue = false){
        this.start = start;
        this.end = end;
        this.stack = stack;
        this.isValue = isValue;
    }
}
class TokenLessListTree extends Base2 {
    list;
    constructor(stack, start, end = start, isValue = false, list = []){
        super(stack, start, end, isValue);
        this.list = list;
    }
}
class TokenListTree extends Base2 {
    list;
    token;
    constructor(stack, start, end = start, isValue = false, token, list = []){
        super(stack, start, end, isValue);
        this.token = token;
        this.list = list;
    }
}
class TokenListLessTree extends Base2 {
    token;
    constructor(stack, start, end = start, isValue = false, token){
        super(stack, start, end, isValue);
        this.token = token;
    }
}
const mod1 = {
    Base: Base2,
    TokenLessList: TokenLessListTree,
    TokenList: TokenListTree,
    TokenListLess: TokenListLessTree
};
class Stack {
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
        return this.traces.map((trace)=>`\tat ${trace.toString()}`
        ).join("\n");
    }
    static combine(limit, stacks) {
        const stack = new Stack(limit);
        for (const st of stacks)if (st instanceof Stack) stack.traces.push(...st.traces);
        return stack;
    }
}
class Position {
    index;
    column;
    file;
    line;
    constructor(index, column, line, file){
        this.index = index, this.column = column, this.file = file, this.line = line;
    }
    toString() {
        return `${this.file} : ${this.index} : ${this.column} : ${this.line}`;
    }
}
class Trace {
    name;
    position;
    constructor(name, position){
        this.name = name, this.position = position;
    }
    toString() {
        return `${this.name} ${this.position.toString()}`;
    }
}
class Token {
    type;
    value;
    start;
    end;
    stack;
    constructor(type, value, { stack , start , end  }){
        this.type = type;
        this.value = value;
        this.end = end;
        this.start = start;
        this.stack = stack;
    }
}
class Lexer {
    tokens = [];
    operators = [];
    unknown = Symbol("UNKNOWN");
    addToken(arg) {
        this.tokens.push(arg);
        return this;
    }
    addOperator(arg) {
        this.operators.push(arg);
        return this;
    }
    run(code, file, stack = new Stack) {
        const result = [];
        const { tokens , unknown , operators  } = this;
        const operatorsList = operators.sort((a, b)=>b.value.length - a.value.length
        );
        let tokensList = [];
        let c = 1;
        let l = 1;
        let bef;
        let befCanCollide = false;
        for (const token of tokens){
            const t = token.isContinuous ? token : token;
            for (const startValue of token.startValues){
                const o = {
                    ...t,
                    startValue
                };
                delete o.startValues;
                tokensList.push(o);
            }
        }
        tokensList = tokensList.sort((a, b)=>b.startValue.length - a.startValue.length
        );
        let i = 0;
        function counter(string) {
            for (const __char of string){
                if (__char === "\n") {
                    l++;
                    c = 1;
                } else {
                    c++;
                }
            }
            i++;
        }
        for(; i < code.length;){
            const __char = code[i];
            let next = false;
            const posStart = new Position(i, c, l, file);
            const traceStart = new Trace(`[Lexer]`, posStart);
            const currentStack = new Stack(stack.limit);
            currentStack.traces.push(traceStart);
            for (const tokenList of tokensList){
                const { type , startValue , mustSkip , canCollide , isContinuous  } = tokenList;
                const raw = code.slice(i, i + startValue.length);
                if (startValue === raw) {
                    counter(raw);
                    const vs = [
                        raw
                    ];
                    if (isContinuous) {
                        const { values  } = tokenList;
                        let stop = false;
                        while(!stop){
                            stop = true;
                            for (const value of values){
                                const raw = code.slice(i, i + value.length);
                                if (raw !== value) continue;
                                counter(raw);
                                vs.push(raw);
                                stop = false;
                                break;
                            }
                        }
                    }
                    const posEnd = new Position(i - 1, c - 1, l, file);
                    const traceEnd = new Trace(`[Lexer]`, posEnd);
                    if (!mustSkip) {
                        const token = new Token(type, vs.join(""), {
                            start: traceStart,
                            end: traceEnd,
                            stack: currentStack
                        });
                        if (!bef || !befCanCollide || !canCollide || [
                            bef?.type,
                            token.type
                        ].includes(unknown) || bef?.type !== token.type) result.push(token);
                        else {
                            bef.end = token.end;
                            bef.value += token.value;
                        }
                        bef = token;
                        befCanCollide = canCollide;
                    }
                    next = true;
                    break;
                }
            }
            if (!next) {
                for (const { type , value , level  } of operatorsList){
                    const raw = code.slice(i, i + value.length);
                    if (value === raw) {
                        counter(raw);
                        const posEnd = new Position(i, c, l, file);
                        const traceEnd = new Trace(`[Lexer]`, posEnd);
                        result.push(new Token(type, raw, {
                            start: traceStart,
                            end: traceEnd,
                            stack: currentStack
                        }));
                        next = true;
                        break;
                    }
                }
                if (!next) {
                    result.push(new Token(unknown, __char, {
                        start: traceStart,
                        end: traceStart,
                        stack: currentStack
                    }));
                    i++;
                    c++;
                }
            }
        }
        return result;
    }
}
async function parseTokens(token, tokens, expressions, data, error) {
    const f = expressions.get(token.type);
    switch(true){
        case !f:
            error.expressionIsNotExist(token);
        case f?.isList:
            {
                const exp = f;
                const list = [];
                while(1){
                    const token = tokens[++data.i];
                    if (!token) error.unexpectedEndOfLine(tokens[data.i - 1]);
                    if (await exp.isEnd(token)) break;
                    list.push(await parseTokens(token, tokens, expressions, data, error));
                }
                return new TokenListTree(data.stack, token, tokens[data.i], exp.isValue, token, list);
            }
        default:
            return new TokenListLessTree(data.stack, token, token, f?.isValue, token);
    }
}
class AST {
    type;
    raw;
    start;
    end;
    stack;
    data;
    body;
    isValue;
    constructor(type, options){
        this.type = type, this.data = options.data || {
        }, this.stack = options.stack || new Stack, this.start = options.start, this.end = options.end || this.start, this.body = options.body || [], this.isValue = options.isValue || false, this.raw = options.raw || [];
    }
}
function getError(data) {
    function error(message, token) {
        throw new ParserError(message, {
            start: token.start,
            end: token.end,
            stack: token.stack,
            raw: token.value
        });
    }
    error.unexpectedOperator = (operator)=>error(`Unexpected operator ${String(operator.type)}`, operator)
    ;
    error.unexpectedToken = (token)=>error(`Unexpected token ${String(token.type)}`, token)
    ;
    error.expectedOneOfTheseTokensInsteadGot = (token, expected)=>error(`Expected one of these tokens: (${expected.map(String).join(", ")}), instead got ${String(token.type)}`, token)
    ;
    error.expectedTokenInsteadGot = (token, expected)=>error(`Expected token ${String(expected)}, instead got ${String(token.type)}`, token)
    ;
    error.unexpectedEndOfLine = (token)=>error(`Unexpected end of line`, token)
    ;
    error.expressionIsNotExist = (token)=>error(`Expression for ${String(token.type)} is not exist`, token)
    ;
    error.operatorIsNotExist = (operator)=>error(`Operator for ${String(operator.type)} is not exist`, operator)
    ;
    error.expectedValue = (expression)=>{
        throw new ParserError(`Expected value`, {
            raw: expression.raw.join(""),
            start: expression.tree.start.start,
            end: expression.tree.end.end,
            stack: expression.tree.stack
        });
    };
    return error;
}
function getTools(list, __data__, error) {
    const { data , expressions , plugins , operators , run  } = __data__;
    return {
        isEnd: (ind = data.i)=>list.length <= ind + 1
        ,
        getTree: (ind = data.i)=>{
            return list[ind];
        },
        getIndex: ()=>data.i
        ,
        expectValue: (expression)=>!expression.tree.isValue && error.expectedValue(expression)
        ,
        next (filter = []) {
            const _ = Array.isArray(filter) ? (tree)=>!filter.includes(String(tree.token?.type))
             : filter;
            while(1){
                list[++data.i] ?? error.unexpectedEndOfLine(list[data.i - 1]);
                if (_(list[data.i])) return list[data.i];
            }
        },
        previous (filter = []) {
            const _ = Array.isArray(filter) ? (tree)=>filter.includes(String(tree.token?.type))
             : filter;
            while(data.i > 0){
                if (_(list[--data.i])) return list[data.i];
            }
        },
        expectTypes: (token, types)=>!types.includes(token.type) && error.expectedOneOfTheselistInsteadGot(token, types)
        ,
        expectType: (token, type)=>token.type !== type && error.expectedTokenInsteadGot(token, type)
        ,
        async getValue (tree, end) {
            const clone = {
                ...data
            };
            let tr = tree;
            if (!(tree instanceof TokenLessListTree || tree instanceof TokenListTree)) {
                tr = tree;
                tr = new TokenListTree(tr.stack, tr.start, tr.end, tr.isValue, tr.token, [
                    tr
                ]);
            }
            clone.type = "Value";
            clone.isEnd = end;
            const returned = await run({
                expressions,
                plugins,
                list,
                operators,
                data: clone,
                tree: tr
            });
            return {
                ast: returned,
                data: clone
            };
        },
        error
    };
}
async function parseTree(arg) {
    const { expressions , plugins , tree , operators , data  } = arg;
    const ast = new AST(data?.type || "Program", {
        isValue: !!(data?.type && data?.type !== "Program"),
        body: [],
        start: tree.start,
        raw: []
    });
    if (!data.i) data.i = 0;
    const error = getError(data);
    for(; data.i < tree.list.length; data.i++){
        const tr = tree.list[data.i];
        switch(true){
            case tr instanceof TokenListTree:
                {
                    const tree = tr;
                    const f = expressions.get(tree.token.type);
                    const clone = {
                        ...data
                    };
                    const carg = {
                        ...arg
                    };
                    clone.i = 0;
                    carg.data = clone;
                    const tools = getTools(tree.list, {
                        ...carg,
                        run: parseTree
                    }, error);
                    const expression = new Expression(f.name, tree);
                    const baseArg = {
                        expressions,
                        operators,
                        data: clone,
                        tools,
                        ast,
                        plugins,
                        list: tree.list,
                        expression
                    };
                    tools.push = expression.list.push.bind(expression.list);
                    expression.raw.push(tree.start.value);
                    for (const tokenParser of f.list){
                        switch(true){
                            case tokenParser instanceof Type:
                                {
                                    const tr = tree.list[clone.i++];
                                    const tP = tokenParser;
                                    tools.expectType(tr.token, tP.type);
                                    await tP.callback({
                                        ...baseArg,
                                        tree: tr
                                    });
                                    break;
                                }
                            case tokenParser instanceof Operator:
                                {
                                    await tokenParser.callback(baseArg);
                                    break;
                                }
                            case tokenParser instanceof Custom:
                                {
                                    await tokenParser.callback(baseArg);
                                    break;
                                }
                            case tokenParser instanceof Rest:
                                {
                                    let stop = false;
                                    const copy = {
                                        ...baseArg
                                    };
                                    const end = ()=>stop = true
                                    ;
                                    const parser = tokenParser;
                                    copy.tools = {
                                        ...copy.tools
                                    };
                                    copy.tools.end = end;
                                    while(!stop){
                                        await parser.callback(copy);
                                    }
                                    break;
                                }
                            case tokenParser instanceof Value:
                                {
                                    const value = await baseArg.tools.getValue();
                                    tools.expectValue(value.ast);
                                    await tokenParser.callback({
                                        ...value,
                                        ...baseArg
                                    });
                                    break;
                                }
                            case tokenParser instanceof Base1:
                                throw new Error(`Shouldn't use Base of TokenParser.`);
                            default:
                                throw new Error(`Invalid TokenParser.`);
                        }
                    }
                    expression.raw.push(tree.end.value);
                    ast.body.push(await f.callback(baseArg));
                    break;
                }
            case tr instanceof TokenLessListTree:
                throw new Error(`Unexpected TokenLessList tree`);
            case tr instanceof TokenListLessTree:
                {
                    const tree = tr;
                    const f = expressions.get(tree.token.type);
                    const tools = getTools([], {
                        ...arg,
                        run: parseTree
                    }, error);
                    const expression = new Expression(f.name, tree);
                    const baseArg = {
                        expressions,
                        operators,
                        data,
                        tools,
                        ast,
                        plugins,
                        list: [],
                        expression
                    };
                    expression.raw.push(tree.token.value);
                    ast.body.push(await f.callback(baseArg));
                    break;
                }
        }
        if (ast.type === "Value" && (data.isEnd && await data.isEnd(tr, ast) || !data.isEnd)) {
            ast.end = tr.end;
            break;
        }
    }
    if (ast.type === "Value" && data.isEnd) error.unexpectedEndOfLine(tree.end);
    ast.raw.push(...ast.body.map((a)=>a.raw.join("")
    ));
    ast.end = ast.body[ast.body.length - 1]?.tree.end || tree.end;
    return ast;
}
class Parser {
    expressions = new Map;
    operators = new Map;
    plugins = new Map;
    addExpression(type, options) {
        this.expressions.set(type, options);
        return this;
    }
    async run(tokens, data = {
        stack: new Stack
    }) {
        const { expressions , plugins , operators  } = this;
        if (!tokens.length) throw new Error(`Tokens cannot be empty`);
        const tree = new TokenLessListTree(data.stack, tokens[0]);
        const info = {
            i: 0,
            ...data
        };
        const error = getError(info);
        for(; info.i < tokens.length; info.i++){
            const token = tokens[info.i];
            const a = await parseTokens(token, tokens, expressions, info, error);
            tree.list.push(a);
        }
        return await parseTree({
            expressions,
            tree,
            data,
            plugins,
            operators
        });
    }
}
class Transformer {
    expressions = new Map;
    plugins = new Map;
    injected = {
        before: [],
        after: []
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
    async run(ast) {
        const { expressions , plugins , injected  } = this;
        const result = [];
        for (const expression1 of ast.body){
            const func = this.expressions.get(expression1.type);
            function error(message, expression) {
                throw new TransformerError(message, {
                    start: expression.tree.start.start,
                    end: expression.tree.end.end,
                    stack: expression.tree.stack,
                    raw: expression.raw.join("")
                });
            }
            error.unexpectedExpression = (expression)=>error(`Unexpected expression ${String(expression.type)}`, expression)
            ;
            error.expectedOneOfTheseExpressionsInsteadGot = (expression, expected)=>error(`Expected one of these expressions: (${expected.map(String).join(" : ")}), instead got ${String(expression.type)}`, expression)
            ;
            error.expectedExpressionInsteadGot = (expression, expected)=>error(`Expected expression ${String(expected)}, instead got ${String(expression.type)}`, expression)
            ;
            error.expressionIsNotExist = (expression)=>error(`Expression ${String(expression.type)} is not exist`, expression)
            ;
            error.expectedValue = (expression)=>error(`Expected value`, expression)
            ;
            if (!func) error.expressionIsNotExist(expression1);
            result.push(func?.({
                expressions,
                plugins,
                ast,
                tools: {
                    error,
                    expectTypes: (expression, types = [])=>!types.includes(expression.type) && error.expectedOneOfTheseExpressionsInsteadGot(expression, types)
                    ,
                    expectType: (expression, type)=>expression.type !== type && error.expectedExpressionInsteadGot(expression, type)
                    ,
                    expectValue: (expression)=>!expression.tree.isValue && error.expectedValue(expression)
                },
                expression: expression1
            }));
        }
        return [
            ...injected.before,
            ...result,
            ...injected.after
        ].join("");
    }
}
class Executer {
    expressions = new Map;
    plugins = new Map;
    injected = {
        before: [],
        after: []
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
    async run(ast) {
        const { expressions , plugins , injected  } = this;
        let ret;
        for (const cb of injected.before)ret = await cb();
        for (const expression1 of ast.body){
            const func = this.expressions.get(expression1.type);
            function error(message, expression) {
                throw new ExecuterError(message, {
                    start: expression.tree.start.start,
                    end: expression.tree.end.end,
                    stack: expression.tree.stack,
                    raw: expression.raw.join("")
                });
            }
            error.unexpectedExpression = (expression)=>error(`Unexpected expression ${String(expression.type)}`, expression)
            ;
            error.expectedOneOfTheseExpressionsInsteadGot = (expression, expected)=>error(`Expected one of these expressions: (${expected.map(String).join(", ")}), instead got ${String(expression.type)}`, expression)
            ;
            error.expectedExpressionInsteadGot = (expression, expected)=>error(`Expected expression ${String(expected)}, instead got ${String(expression.type)}`, expression)
            ;
            error.expressionIsNotExist = (expression)=>error(`Expression ${String(expression.type)} is not exist`, expression)
            ;
            error.expectedValue = (expression)=>error(`Expected value`, expression)
            ;
            if (!func) error.expressionIsNotExist(expression1);
            ret = await func?.({
                expressions,
                plugins,
                ast,
                expression: expression1,
                tools: {
                    error,
                    expectTypes: (expression, types = [])=>!types.includes(expression.type) && error.expectedOneOfTheseExpressionsInsteadGot(expression, types)
                    ,
                    expectType: (expression, type)=>expression.type !== type && error.expectedExpressionInsteadGot(expression, type)
                    ,
                    expectValue: (expression)=>!expression.tree.isValue && error.expectedValue(expression)
                }
            });
        }
        for (const cb1 of injected.after)ret = await cb1();
        return ret;
    }
}
Object.assign({
    Lexer: LexerError,
    Parser: ParserError,
    Excuter: ExecuterError,
    Transformer: TransformerError
}, Base);
export { Base as Error };
export { Expression as Expression };
export { Lexer as Lexer };
export { Parser as Parser };
export { AST as AST };
export { Position as Position };
export { Stack as Stack };
export { Token as Token };
export { Trace as Trace };
export { Transformer as Transformer };
export { Executer as Executer };
const version = "v2.2";
export { mod as TokenParser };
export { mod1 as Tree };
export { version as version };
