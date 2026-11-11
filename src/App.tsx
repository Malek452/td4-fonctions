import { presentation } from '../presentation.config';
import { ui } from './ui';
import { readRoute } from './route';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize, Minimize, Waves } from 'lucide-react';
import { exercises as defaultPresentation } from './content';
import type { Exercise } from './types';
import { Lesson } from './components/Lesson';
export default function App({ sections = defaultPresentation }: { sections?: Exercise[] }) {
  const exercises = sections;
  const [route, setRoute] = useState(() => readRoute(exercises, window.location.hash)),
    [full, setFull] = useState(false),
    [fullError, setFullError] = useState('');
  const [reduced, setReduced] = useState(() => {
    try {
      const saved = localStorage.getItem(presentation.storageKey);
      return saved
        ? saved === 'reduced'
        : !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    }
  });
  const shell = useRef<HTMLElement>(null),
    surface = useRef<HTMLDivElement>(null);
  const exerciseIndex = exercises.findIndex((e) => e.id === route.exercise),
    exercise = exercises[exerciseIndex],
    activity = exercise.activities[route.index];
  const isFirst = exerciseIndex === 0 && route.index === 0,
    isLast =
      exerciseIndex === exercises.length - 1 && route.index === exercise.activities.length - 1;
  useEffect(() => {
    const change = () => {
      setRoute(readRoute(exercises, window.location.hash));
      surface.current?.focus({ preventScroll: true });
    };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
    try {
      localStorage.setItem(presentation.storageKey, reduced ? 'reduced' : 'full');
    } catch {
      /* The reader also works with storage disabled. */
    }
  }, [reduced]);
  useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === shell.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  const navigate = (id: number, index = 0) => {
    window.location.hash = `activity/${exercises.find((e) => e.id === id)!.activities[index].id}`;
  };
  const adjacent = (direction: -1 | 1) => {
    const next = route.index + direction;
    if (next >= 0 && next < exercise.activities.length) navigate(exercise.id, next);
    else {
      const ex = exercises[exerciseIndex + direction];
      if (ex) navigate(ex.id, direction === 1 ? 0 : ex.activities.length - 1);
    }
  };
  const toggleFull = async () => {
    setFullError('');
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await shell.current?.requestFullscreen();
    } catch {
      setFullError(ui.fullscreenError);
    }
  };
  return (
    <main className="presentation" ref={shell}>
      <a
        className="skip-link"
        href="#presentation"
        onClick={(e) => {
          e.preventDefault();
          surface.current?.focus();
        }}
      >
        {ui.skip}
      </a>
      <nav className="presentation-nav" aria-label={ui.navigation}>
        <label className="exercise-select">
          <span>{presentation.sectionLabel}</span>
          <select
            aria-label={ui.chooseSection}
            value={exercise.id}
            onChange={(e) => navigate(+e.target.value)}
          >
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {String(ex.id).padStart(2, '0')} · {ex.short}
              </option>
            ))}
          </select>
        </label>
        <div className="question-select">
          <button
            className="icon-button"
            aria-label={ui.previousActivity}
            title={ui.previousActivity}
            disabled={isFirst}
            onClick={() => adjacent(-1)}
          >
            <ChevronLeft size={20} />
          </button>
          <label>
            <span>{presentation.activityLabel}</span>
            <select
              aria-label={ui.chooseActivity}
              value={route.index}
              onChange={(e) => navigate(exercise.id, +e.target.value)}
            >
              {exercise.activities.map((a, i) => (
                <option key={a.id} value={i}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="icon-button"
            aria-label={ui.nextActivity}
            title={ui.nextActivity}
            disabled={isLast}
            onClick={() => adjacent(1)}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="display-options">
          <button
            className="icon-button"
            aria-label={reduced ? ui.enable : ui.reduce}
            title={reduced ? ui.enable : ui.reduce}
            aria-pressed={!reduced}
            onClick={() => setReduced(!reduced)}
          >
            <Waves size={19} />
          </button>
          {typeof document.documentElement.requestFullscreen === 'function' && (
            <button
              className="icon-button"
              aria-label={full ? ui.exitFullscreen : ui.fullscreen}
              title={full ? ui.exitFullscreen : ui.fullscreen}
              aria-pressed={full}
              onClick={toggleFull}
            >
              {full ? <Minimize size={19} /> : <Maximize size={19} />}
            </button>
          )}
        </div>
      </nav>
      {fullError && (
        <p className="display-error" role="status">
          {fullError}
        </p>
      )}
      <div id="presentation" className="presentation-content" tabIndex={-1} ref={surface}>
        <Lesson key={activity.id} activity={activity} reduced={reduced} />
      </div>
    </main>
  );
}
