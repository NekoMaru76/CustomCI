import Position from "./Position.ts";

export default class Trace {
  name: string;
  position: Position;

  constructor(name: string, position: Position) {
    this.name = name,
    this.position = position;
  }
  toString() {
    return `POSITION(${this.position}) NAME(${this.name})`;
  }
};
