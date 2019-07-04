import { BetterBackoff } from "./better-backoff";

describe('About better backoff', () => {

  describe('when initializing', () => {
    it('should initialize with no errors (default)', () => {
      const verify = () => new BetterBackoff();
      expect(verify).not.toThrow();
    });

    it('should throw error when seed < 0', () => {
      const verify = () => new BetterBackoff({ seed: -10, min: 0, max: 0 });
      expect(verify).toThrow();
    });

    it('should throw error when max < min', () => {
      const verify = () => new BetterBackoff({ seed: 10, min: 50, max: 0 });
      expect(verify).toThrow();
    });

    it('should throw error when min < 0', () => {
      const verify = () => new BetterBackoff({ seed: 10, min: -10, max: 100 });
      expect(verify).toThrow();
    });

    it('should set the current wait to seed when started', () => {
      const bb = new BetterBackoff({ seed: 1300, max: 0, min: 0 });
      expect(bb.currentWait).toEqual(1300);
    });

    it('should set the current wait to seed when started with another value', () => {
      const bb = new BetterBackoff({ seed: 100, max: 0, min: 0 });
      expect(bb.currentWait).toEqual(100);
    });

    it('should set the current wait to seed when started with yet another value', () => {
      const bb = new BetterBackoff({ seed: 0, max: 0, min: 0 });
      expect(bb.currentWait).toEqual(0);
    });

  });

  describe('when backing off', () => {

    it('it should have the wait time as zero when seed, min and max are all 0', () => {
      const bb = new BetterBackoff({ seed: 0, max: 0, min: 0 });
      for (let i = 0; i < 1000; i++) {
        expect(bb.currentWait).toBe(0);
        bb.backoff();
      }
    });

    it('it should increase the wait to be between 50 and 1000 every time', () => {
      let bb: BetterBackoff;
      for (let i = 0; i < 1000; i++) {
        bb = new BetterBackoff({ seed: i, max: 1000, min: 50 });
        expect(bb.currentWait).toBe(i);
        bb.backoff();
        expect(bb.currentWait).toBeGreaterThanOrEqual(i + 50);
        expect(bb.currentWait).toBeLessThanOrEqual(i + 1000);
      }
    });

    it('it should increase the wait in a fibbonaci fashion with seed 1 and entropy [0,0] every time backoff is called', () => {
      const bb = new BetterBackoff({ seed: 1, min: 0, max: 0 });

      // Called 10 times
      const expected = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
      for (let i = 0; i < 10; i++) {
        bb.backoff();
        expect(bb.currentWait).toBe(expected[i]);
      }
    });

    it('it should increase the wait in a fibbonaci fashion with entropy 50 and 1000 every time backoff is called', () => {
      const bb = new BetterBackoff({ seed: 0, min: 50, max: 1000 });

      // Called 5 times
      let previous = bb.previousWait;
      let current = bb.currentWait;
      for (let i = 0; i < 5; i++) {
        bb.backoff();
        expect(bb.currentWait).toBeGreaterThanOrEqual(previous + current + 50);
        expect(bb.currentWait).toBeLessThanOrEqual(previous + current + 1000);
        previous = current;
        current = bb.currentWait;
      }
    });

  });

  describe('when coming forth', () => {

    it("should come back to the previous wait time", () => {
      const bb = new BetterBackoff({ seed: 10, min: 100, max: 1000 });
      for (let i = 0; i < 10; i++) {
        // Backing off 10 times
        bb.backoff();
      }
      const previous = bb.previousWait;
      bb.comeForth();
      expect(bb.currentWait).toBe(previous);
    });

    it("should not change when already on the minimum wait", () => {
      const bb = new BetterBackoff({ seed: 10, min: 100, max: 1000 });
      expect(bb.currentWait).toBe(10);
      expect(bb.previousWait).toBe(0);
      bb.comeForth();
      expect(bb.currentWait).toBe(10);
      expect(bb.previousWait).toBe(0);
    });
  });

  describe('when resetting', () => {

    it("should reset back to currentWait being seed after resetting", () => {
      const bb = new BetterBackoff({ seed: 10, min: 100, max: 1000 });
      for (let i = 0; i < 10; i++) {
        // Backing off 10 times
        bb.backoff();
      }
      bb.reset();
      expect(bb.currentWait).toBe(10);
    });

  });

  describe('when waiting', () => {

    it("should not fail execution", async () => {
      const bb = new BetterBackoff();
      bb.backoff();
      const temp = bb.currentWait;
      expect(bb.currentWait).toBeGreaterThan(0);
      await bb.wait();
      expect(bb.currentWait).toBe(temp);
    });

    it("should call the exec function", async () => {
      const bb = new BetterBackoff();
      bb.backoff();
      const temp = bb.currentWait;
      await bb.wait((waitTime: number) => {
        expect(waitTime).toBe(temp);
      });
    });

  });
});