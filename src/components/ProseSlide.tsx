import { useEffect, useRef, useState } from 'react';
export function ProseSlide({
  paragraphs,
  animate,
  speed,
  pauseSignal,
}: {
  paragraphs: string[];
  animate: boolean;
  speed: number;
  pauseSignal: number;
}) {
  const initialPause = useRef(pauseSignal);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (pauseSignal !== initialPause.current) setPaused(true);
  }, [pauseSignal]);
  return (
    <div
      className={'prose-slide' + (animate ? ' is-animated' : '')}
      style={{
        animationDuration: `${0.65 / speed}s`,
        animationPlayState: paused ? 'paused' : 'running',
      }}
    >
      {paragraphs.map((text, i) => (
        <p key={i}>{text}</p>
      ))}
    </div>
  );
}
