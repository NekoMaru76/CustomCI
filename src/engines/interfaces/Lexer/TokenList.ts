export interface Base {
  type: string;
  startValue: string;
  mustSkip: boolean;
  canCollide: boolean;
  isContinuous: false;
};

export interface Continuous extends Omit<Base, "isContinuous"> {
  isContinuous: true;
  values: string[];
};
