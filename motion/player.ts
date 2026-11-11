import { theme } from '../src/theme';
import { Player, Stage, Vector2 } from '@motion-canvas/core';
import project from './project?project';
import type { Activity } from '../src/types';
import { STEP_SECONDS as STEP, SETTLED_SECONDS } from './timing';
import { createPlaybackController } from './playback-controller';
const FPS = 30;
export interface Controller {
  seek(step: number): void;
  replay(step: number, speed: number): void;
  pause(): void;
  setSpeed(speed: number): void;
  destroy(): void;
}
export function mount(
  host: HTMLElement,
  activity: Activity,
  onReady: () => void,
  onError: (message: string) => void,
): Controller {
  const stage = new Stage();
  stage.configure({ size: new Vector2(1000, 400), resolutionScale: 1, background: theme.board });
  stage.finalBuffer.setAttribute('aria-hidden', 'true');
  host.replaceChildren(stage.finalBuffer);
  const player = new Player(
    { ...project, variables: { activity } },
    { fps: FPS, size: new Vector2(1000, 400) },
    { loop: false, muted: true },
    0,
  );
  let disposed = false,
    initialized = false;
  const transport = createPlaybackController(player, {
    fps: FPS,
    stepSeconds: STEP,
    settledSeconds: SETTLED_SECONDS,
  });
  const unrender = player.onRender.subscribe(async () => {
    try {
      if (!disposed)
        await stage.render(player.playback.currentScene, player.playback.previousScene);
    } catch (e) {
      onError(String(e));
      player.deactivate();
    }
  });
  const uncalc = player.onRecalculated.subscribe(() => {
    // setSpeed recalculates the timeline too. Only the first calculation should
    // initialize the selected step; later ones restore the player's own frame.
    if (!disposed && !initialized) {
      initialized = true;
      onReady();
    }
  });
  const unframe = player.onFrameChanged.subscribe((frame) => {
    host.dataset.frame = String(frame);
    transport.onFrame(frame);
  });
  const unstate = player.onStateChanged.subscribe((state) => {
    host.dataset.playbackState = state.paused ? 'paused' : 'playing';
  });
  const unlog = player.logger.onLogged.subscribe((payload) => {
    if (payload.level === 'error') onError(payload.message);
  });
  return {
    seek: transport.seek,
    replay: transport.replay,
    pause: transport.pause,
    setSpeed: transport.setSpeed,
    destroy() {
      disposed = true;
      transport.destroy();
      player.deactivate();
      unrender();
      uncalc();
      unframe();
      unstate();
      unlog();
      host.replaceChildren();
      delete host.dataset.frame;
      delete host.dataset.playbackState;
    },
  };
}
