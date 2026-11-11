import { ui } from '../ui';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import type { Activity } from '../types';
import { Animation } from './Animation';
import { useStepSwipe } from './useStepSwipe';
import { STEP_SECONDS } from '../../motion/timing';
export function Lesson({ activity, reduced }: { activity: Activity; reduced: boolean }) {
  const [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false),
    [replay, setReplay] = useState(0),
    [animate, setAnimate] = useState(false),
    [pauseSignal, setPauseSignal] = useState(0),
    [speed, setSpeed] = useState(1),
    [sceneAvailable, setSceneAvailable] = useState(reduced);
  const last = activity.steps.length - 1,
    current = activity.steps[step];
  const phases = activity.steps.slice(0, step + 1).filter((s) => s.phase);
  const phase = phases.at(-1)?.phase;
  const pause = () => {
    setPlaying(false);
    setPauseSignal((n) => n + 1);
  };
  const go = (n: number, adjacent = true) => {
    pause();
    const next = Math.max(0, Math.min(last, n));
    setStep(next);
    setAnimate(adjacent && next === step + 1);
    setReplay((v) => v + 1);
  };
  const toggle = () => {
    if (playing) {
      pause();
      return;
    }
    if (step === last) setStep(0);
    setAnimate(true);
    setPlaying(true);
    setReplay((n) => n + 1);
  };
  useEffect(() => {
    if (!playing || !sceneAvailable) return;
    const delay =
      Math.max(
        (STEP_SECONDS + 2) * 1000,
        3500 + [current.why, ...(current.prose || [])].join(' ').split(/\s+/).length * 400,
      ) + (current.phase ? 2500 : 0);
    const timer = setTimeout(() => {
      if (step === last) {
        setPlaying(false);
        return;
      }
      setStep((n) => n + 1);
      setAnimate(true);
      setReplay((n) => n + 1);
    }, delay / speed);
    return () => clearTimeout(timer);
  }, [playing, step, last, speed, current, sceneAvailable]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        target.isContentEditable ||
        /INPUT|TEXTAREA|SELECT/.test(target.tagName)
      )
        return;
      const table = target.closest('.sign-table-scroll');
      if (
        table &&
        table.scrollWidth > table.clientWidth + 2 &&
        ['ArrowLeft', 'ArrowRight'].includes(e.key)
      )
        return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (step < last) go(step + 1);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (step > 0) go(step - 1);
      }
      if (e.key === ' ' && !target.closest('button,a')) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [step, last, playing]);
  const swipe = useStepSwipe((direction) => {
    const next = step + direction;
    if (next >= 0 && next <= last) go(next);
  });
  return (
    <section className="reading-board" aria-label={ui.board}>
      <div className="slide-surface" {...swipe} aria-describedby="gesture-help">
        <p id="gesture-help" className="sr-only">
          {ui.gesture}
        </p>
        <div className="reading-step-title" aria-live="polite">
          <div className="reading-position">
            <span className="reading-phase">{phase}</span>
            <span>
              {ui.step} {step + 1} / {activity.steps.length}
            </span>
          </div>
          <h1>{current.title}</h1>
        </div>
        <Animation
          activity={activity}
          step={step}
          reduced={reduced}
          replay={replay}
          animate={animate}
          speed={speed}
          pauseSignal={pauseSignal}
          onAvailable={setSceneAvailable}
        />
        <div className="reading-explanation" aria-live="polite">
          <p>{current.why}</p>
          {step === 0 && activity.note && <p className="reading-note">{activity.note}</p>}
        </div>
      </div>
      <div className="reading-controls">
        <button
          className="button secondary"
          aria-label={ui.previousStep}
          disabled={step === 0}
          onClick={() => go(step - 1)}
        >
          <ChevronLeft size={19} />
          <span>{ui.previous}</span>
        </button>
        <button
          className="button primary next-step"
          aria-label={ui.nextStep}
          disabled={step === last}
          onClick={() => go(step + 1)}
        >
          <span>{ui.nextStep}</span>
          <ChevronRight size={19} />
        </button>
        <label className="step-select">
          <span className="sr-only">{ui.chooseStep}</span>
          <select
            aria-label={ui.chooseStep}
            value={step}
            onChange={(e) => go(+e.target.value, false)}
          >
            {activity.steps.map((s, i) => (
              <option key={i} value={i}>
                {i + 1}. {s.title}
              </option>
            ))}
          </select>
        </label>
        <div className="reading-auto">
          <button
            className="square"
            aria-label={playing ? ui.pause : ui.play}
            title={playing ? ui.pause : ui.autoplay}
            onClick={toggle}
          >
            {playing ? <Pause size={19} /> : <Play size={19} />}
          </button>
          <button
            className="square"
            aria-label={ui.replay}
            title={ui.replay}
            onClick={() => {
              pause();
              setAnimate(true);
              setReplay((n) => n + 1);
            }}
          >
            <RotateCcw size={18} />
          </button>
          <label className="speed">
            <span className="sr-only">{ui.speed}</span>
            <select aria-label={ui.speed} value={speed} onChange={(e) => setSpeed(+e.target.value)}>
              <option value={0.5}>0,5×</option>
              <option value={1}>1×</option>
              <option value={1.5}>1,5×</option>
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}
