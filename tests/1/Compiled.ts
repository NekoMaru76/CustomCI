const sum = (...args: number[]) => args.reduce((a: number, b: number) => a+b);
const sub = (...args: number[]) => args.reduce((a: number, b: number) => a-b);
console.log(sum(10,1))