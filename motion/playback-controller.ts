/** The small part of Motion Canvas controlled by the presentation transport.
 * Kept independent of its renderer so delayed seek/recalculation events can be tested. */
export interface PlaybackPort {
  setSpeed(speed: number): void;
  togglePlayback(playing: boolean): void;
  requestSeek(frame: number): void;
}
export interface PlaybackTiming {
  fps: number;
  stepSeconds: number;
  settledSeconds: number;
}

export function createPlaybackController(player: PlaybackPort, timing: PlaybackTiming) {
  let disposed = false;
  let speed = 1;
  let replay: { begin: number; end: number; armed: boolean } | null = null;
  const frameAt = (seconds: number) => Math.round(seconds * timing.fps);
  return {
    seek(step: number) {
      if (disposed) return;
      replay = null;
      player.togglePlayback(false);
      player.requestSeek(frameAt(step * timing.stepSeconds + timing.settledSeconds));
    },
    replay(step: number, nextSpeed: number) {
      if (disposed) return;
      speed = nextSpeed;
      player.setSpeed(speed);
      const begin = frameAt(Math.max(0, step * timing.stepSeconds));
      replay = {
        begin,
        end: frameAt(Math.max(0, step * timing.stepSeconds) + timing.settledSeconds),
        armed: false,
      };
      // Playing from the final frame can request a reset inside Motion Canvas.
      // The explicit seek must therefore follow the play request.
      player.togglePlayback(true);
      player.requestSeek(begin);
    },
    onFrame(frame: number) {
      if (disposed || !replay) return;
      if (!replay.armed) {
        // A speed change recalculates asynchronously. Its older run may still
        // render the former settled frame before consuming our newer seek.
        // That stale frame must never stop the replay before it has begun.
        // A frame far before the requested start is stale as well.
        if (frame >= replay.begin - 1e-7 && frame <= replay.begin + speed + 1e-7)
          replay.armed = true;
        else return;
      }
      if (frame >= replay.end) {
        replay = null;
        player.togglePlayback(false);
      }
    },
    pause() {
      if (disposed) return;
      replay = null;
      player.togglePlayback(false);
    },
    setSpeed(nextSpeed: number) {
      if (disposed) return;
      speed = nextSpeed;
      player.setSpeed(speed);
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      replay = null;
      player.togglePlayback(false);
    },
  };
}
