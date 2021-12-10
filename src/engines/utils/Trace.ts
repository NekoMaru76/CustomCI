import Position from "./Position.ts";

export default class Trace {
  name: string;
  position: Position;

  constructor(name: string, position: Position) {
    this.name = name,
    this.position = position;
  }
  toString() {
    return `${this.name} ${this.position}`;
  }
};
