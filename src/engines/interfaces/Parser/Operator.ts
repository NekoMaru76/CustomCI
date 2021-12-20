import Base from "../../utils/Parser/Base.ts";

export default interface Operator {
  before: Base[];
  callback: Function;
  after: Base[];
};
