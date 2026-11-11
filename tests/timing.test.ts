import { it } from 'node:test';
import assert from 'node:assert/strict';
import { PlaybackManager, PlaybackStatus, threads, waitFor, useThread } from '@motion-canvas/core';
import { startPlayback, endPlayback } from '@motion-canvas/core/lib/utils/usePlayback';
import { finishStep } from '../motion/step-clock';
import { SETTLED_SECONDS, STEP_SECONDS, BALANCE_SECONDS, SIMPLIFY_SECONDS } from '../motion/timing';

for (const speed of [0.5, 1, 1.5])
  it(`keeps 80 successive slides synchronized despite shorter optional highlights at ${speed}×`, () => {
    const playback = new PlaybackManager();
    playback.fps = 30;
    playback.speed = speed;
    const status = new PlaybackStatus(playback);
    const starts: number[] = [];
    let visible = -1;
    const samples = new Set<number>();
    startPlayback(status);
    try {
      // Real Motion Canvas scheduling, with the early-returning highlights that
      // used to accumulate drift before the second quadratic root.
      const runner = threads(function* () {
        for (let i = 0; i < 80; i++) {
          visible = i;
          starts.push(useThread().time());
          yield* waitFor(
            [0, 0.7, 3.9, 4.84, 5.2, 5.59, BALANCE_SECONDS + 0.25, SIMPLIFY_SECONDS + 0.25][i % 8],
          );
          yield* finishStep(i);
        }
      });
      for (let frame = 0; frame < (80 * STEP_SECONDS * 30) / speed + 5; frame++) {
        playback.frame = frame * speed;
        if (runner.next().done) break;
        const second = (frame * speed) / 30;
        const wanted = Math.floor(second / STEP_SECONDS);
        if (Math.abs((second % STEP_SECONDS) - SETTLED_SECONDS) < speed / 60) {
          assert.equal(visible, wanted, `frame ${frame}: canvas matches the selected slide`);
          samples.add(wanted);
        }
      }
      assert.equal(starts.length, 80);
      assert.equal(samples.size, 80);
      starts.forEach((time, i) => assert.ok(Math.abs(time - i * STEP_SECONDS) < 1e-7));
    } finally {
      endPlayback(status);
    }
  });
