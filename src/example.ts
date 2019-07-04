import { BetterBackoff } from "./better-backoff";

/**
 *
 * @param skew probability of success [0, 1]
 */
function passOrFail(skew: number = 0.5) {
  return Math.random() <= skew;
}

// In this example everytime a success happens, we comeforth reducing the wait time and decreasing the probability of a success
// When a fail happens, we increase the probability and backoff increasing the wait time.
// plotting the output shows that after the calibrating initial phase the code keeps around 50% probability
// and self manages the backoff times. That approach vs completely reseting is better as it gradually tends to the
// sweet spot.
// In a situation where the 0.05 is maintened in both comeforth and reset, reset is better overral. But in practice, resetting
// causes the probability to drop suddenly and the factor of increase should be tweaked. Change to 0.03 after a backoff shows how
// the difference is massive and the first approach is better on the long run.
async function example() {

  let retries = 0;
  const limit = 100;
  const bb = new BetterBackoff({ seed: 0, min: 1, max: 10 });

  let probability = 0;

  while (retries < limit) {
    const result = passOrFail(probability);
    if (result) {
      bb.comeForth();
      probability = probability - 0.05;
    } else {
      bb.backoff();
      probability = probability + 0.05;
    }
    await bb.wait((waitTime) => {
      // Min max average
      console.log(`${probability.toFixed(2)},${waitTime},${result ? 'comeforth' : 'backoff'}`);
    });
    retries++;
  }

  return;
}

example().then().catch(console.error);