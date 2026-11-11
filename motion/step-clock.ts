import { useThread, waitFor } from '@motion-canvas/core';
import type { ThreadGenerator } from '@motion-canvas/core';
import { STEP_SECONDS } from './timing';

/** Anchor each slide to the player's absolute seek time. Optional highlights
 * may finish early; their missing duration must never advance the next slide. */
export function* finishStep(step: number): ThreadGenerator {
  yield* waitFor(Math.max(0, (step + 1) * STEP_SECONDS - useThread().time()));
}
