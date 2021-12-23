export default interface Operator {
  level: number;
  type: string | symbol;
  value: string;
  mustSkip: boolean;
};
