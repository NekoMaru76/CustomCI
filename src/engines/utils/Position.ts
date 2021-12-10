export default class Position {
  index: number;
  column: number;
  file: string;
  line: number;

  constructor(index: number, column: number, line: number, file: string) {
    this.index = index,
    this.column = column,
    this.file = file,
    this.line = line;
  }
  toString() {
    return `${this.file} : ${this.index} : ${this.column} : ${this.line}`;
  }
};
