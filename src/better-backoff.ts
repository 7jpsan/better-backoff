export interface BetterBackoffParams {
  seed: number;
  min: number;
  max: number;
}

export class BetterBackoff {

  private readonly MAX = 1000;
  private readonly MIN = 50;

  private backoffList: number[] = [0, 0];

  private params: BetterBackoffParams;

  public constructor(params?: BetterBackoffParams) {

    this.params = {
      ...{ seed: 0, min: this.MIN, max: this.MAX },
      ...params
    };

    if (this.params.max < this.params.min || this.params.min < 0) {
      throw new Error(`Invalid argument: 'max' must be >= 'min' and >= 0. Actual: '${this.params}'`);
    }

    if (this.params.seed < 0) {
      throw new Error(`Invalid argument: 'seed' must be >= 0. Actual: '${this.params}'`);
    }

    this.backoffList[1] = this.params.seed;
  }

  public comeForth() {
    if (this.backoffList.length > 2) {
      this.backoffList.pop();
    }
  }

  public reset() {
    this.backoffList = this.backoffList.splice(0, 2);
  }

  public backoff() {
    const currentIndex = this.backoffList.length - 1;
    const previousIndex = currentIndex - 1;
    this.backoffList.push(this.backoffList[previousIndex] + this.backoffList[currentIndex] + this.entropy(this.params.min, this.params.max));
  }

  public async wait(exec?: (wait: number) => void) {
    if (exec) {
      exec(this.currentWait);
    }
    return new Promise(resolve => setTimeout(resolve, this.currentWait));
  }

  private entropy(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  public get currentWait() {
    return this.backoffList[this.backoffList.length - 1];
  }

  public get previousWait() {
    return this.backoffList[this.backoffList.length - 2];
  }

}