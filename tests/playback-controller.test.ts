import { it } from 'node:test';
import assert from 'node:assert/strict';
import { createPlaybackController, type PlaybackPort } from '../motion/playback-controller';

const timing = { fps: 30, stepSeconds: 10, settledSeconds: 9.5 };

/** Player.prepare snapshots seek/play before awaiting recalculation. The old
 * run can finish after a new replay request, rendering its snapshot first. */
class DelayedPlayer implements PlaybackPort {
  frame = 1485;
  playing = false;
  speed = 1;
  requestedSeek: number | null = null;
  calls: [string, number | boolean][] = [];
  emit: (frame: number) => void = () => {};
  setSpeed(speed: number) {
    this.speed = speed;
    this.calls.push(['speed', speed]);
  }
  togglePlayback(playing: boolean) {
    this.playing = playing;
    this.calls.push(['play', playing]);
  }
  requestSeek(frame: number) {
    this.requestedSeek = frame;
    this.calls.push(['seek', frame]);
  }
  beginRecalculation() {
    const snapshot = this.requestedSeek ?? this.frame;
    this.requestedSeek = null;
    return () => {
      this.frame = snapshot;
      this.emit(this.frame);
    };
  }
  run() {
    if (this.requestedSeek !== null) {
      this.frame = this.requestedSeek;
      this.requestedSeek = null;
    } else if (this.playing) this.frame += this.speed;
    this.emit(this.frame);
  }
}
function setup() {
  const player = new DelayedPlayer();
  const transport = createPlaybackController(player, timing);
  player.emit = transport.onFrame;
  return { player, transport };
}

it('a delayed speed recalculation cannot pause a new replay at the old settled frame', () => {
  const { player, transport } = setup();
  transport.setSpeed(0.5);
  const finishOlderRun = player.beginRecalculation();
  transport.replay(4, 0.5);
  finishOlderRun();
  assert.equal(player.frame, 1485);
  assert.equal(player.playing, true, 'ignore the older render before the requested start');
  player.run();
  assert.equal(player.frame, 1200);
  assert.equal(player.playing, true, 'the explicit seek starts playback');
  for (let n = 0; n < 570; n++) player.run();
  assert.equal(player.frame, 1485);
  assert.equal(player.playing, false, 'stop after this replay actually reaches its end');
});

it('only the latest replay start can arm its stopping boundary', () => {
  const { player, transport } = setup();
  transport.replay(4, 1);
  const finishOlderRun = player.beginRecalculation();
  transport.replay(2, 0.5);
  transport.onFrame(0);
  finishOlderRun();
  assert.equal(
    player.playing,
    true,
    'neither a much earlier frame nor the old seek arms the boundary',
  );
  player.run();
  assert.equal(player.frame, 600);
  assert.equal(player.playing, true);
  for (let n = 0; n < 570; n++) player.run();
  assert.equal(player.frame, 885);
  assert.equal(player.playing, false);
});

it('a speed change during playback keeps the current replay and does not request another seek', () => {
  const { player, transport } = setup();
  transport.replay(4, 1);
  player.run();
  for (let n = 0; n < 50; n++) player.run();
  assert.equal(player.frame, 1250);
  const seeks = player.calls.filter(([kind]) => kind === 'seek').length;
  transport.setSpeed(1.5);
  const finishRecalculation = player.beginRecalculation();
  finishRecalculation();
  assert.equal(player.frame, 1250);
  assert.equal(player.playing, true);
  assert.equal(player.calls.filter(([kind]) => kind === 'seek').length, seeks);
  for (let n = 0; n < 157; n++) player.run();
  assert.equal(player.frame, 1485.5);
  assert.equal(player.playing, false);
});

it('the initial replay seek is accepted within one playback frame at every supported speed', () => {
  for (const speed of [0.5, 1, 1.5]) {
    const { player, transport } = setup();
    transport.replay(4, speed);
    transport.onFrame(1200 - speed);
    transport.onFrame(1485);
    assert.equal(player.playing, true, 'an earlier frame cannot arm the replay');
    transport.onFrame(1200 + speed);
    transport.onFrame(1485);
    assert.equal(player.playing, false, 'a rounded start within one frame can arm it');
  }
});

it('seek and pause cancel the replay, including any later frame from an older run', () => {
  const { player, transport } = setup();
  transport.replay(4, 1);
  player.run();
  transport.seek(7);
  assert.equal(player.playing, false);
  assert.equal(player.requestedSeek, 2385);
  const callsAfterSeek = player.calls.length;
  transport.onFrame(1485);
  assert.equal(player.calls.length, callsAfterSeek);
  transport.replay(1, 1);
  transport.pause();
  const callsAfterPause = player.calls.length;
  transport.onFrame(300);
  transport.onFrame(585);
  assert.equal(player.playing, false);
  assert.equal(player.calls.length, callsAfterPause);
});

it('destroy disables every late frame and public transport operation', () => {
  const { player, transport } = setup();
  transport.replay(4, 1);
  transport.destroy();
  assert.equal(player.playing, false);
  const calls = player.calls.length;
  transport.onFrame(1200);
  transport.onFrame(1485);
  transport.seek(1);
  transport.replay(1, 0.5);
  transport.setSpeed(1.5);
  transport.pause();
  transport.destroy();
  assert.equal(player.calls.length, calls);
});

it('play precedes the explicit replay seek so an end-of-animation reset cannot override it', () => {
  const { player, transport } = setup();
  transport.replay(4, 1);
  assert.deepEqual(player.calls.slice(-2), [
    ['play', true],
    ['seek', 1200],
  ]);
});
