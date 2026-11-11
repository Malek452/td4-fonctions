import { useRef } from 'react';
import type { TouchEvent } from 'react';
interface Gesture {
  id: number;
  x: number;
  y: number;
  started: number;
  cancelled: boolean;
}
/** Only deliberate one-finger horizontal swipes turn a slide. Native vertical
 * scrolling, pinch zoom, controls and horizontally overflowing math stay usable. */
export function useStepSwipe(onDirection: (direction: -1 | 1) => void) {
  const gesture = useRef<Gesture | null>(null);
  const cancel = () => {
    gesture.current = null;
  };
  const onTouchStart = (e: TouchEvent<HTMLElement>) => {
    cancel();
    if (e.touches.length !== 1) return;
    const target = e.target as Element;
    if (
      target.closest('button,a,input,select,textarea,[contenteditable="true"],[data-swipe-ignore]')
    )
      return;
    // Overflowing formulas own their horizontal scroll gesture.
    let element: Element | null = target;
    while (element && element !== e.currentTarget) {
      if (
        element.scrollWidth > element.clientWidth + 2 &&
        ['auto', 'scroll'].includes(window.getComputedStyle(element).overflowX)
      )
        return;
      element = element.parentElement;
    }
    const finger = e.touches[0],
      width = window.innerWidth;
    // Leave the browser's edge navigation gestures alone.
    if (finger.clientX < 24 || finger.clientX > width - 24) return;
    gesture.current = {
      id: finger.identifier,
      x: finger.clientX,
      y: finger.clientY,
      started: Date.now(),
      cancelled: false,
    };
  };
  const onTouchMove = (e: TouchEvent<HTMLElement>) => {
    const g = gesture.current;
    if (!g) return;
    if (e.touches.length !== 1) {
      cancel();
      return;
    }
    const f = Array.from(e.touches).find((t) => t.identifier === g.id);
    if (!f) {
      cancel();
      return;
    }
    const dx = Math.abs(f.clientX - g.x),
      dy = Math.abs(f.clientY - g.y);
    if (dy > 18 && dy > dx) g.cancelled = true;
  };
  const onTouchEnd = (e: TouchEvent<HTMLElement>) => {
    const g = gesture.current;
    cancel();
    if (!g || g.cancelled || e.touches.length > 0 || Date.now() - g.started > 1200) return;
    const f = Array.from(e.changedTouches).find((t) => t.identifier === g.id);
    if (!f) return;
    const dx = f.clientX - g.x,
      dy = f.clientY - g.y;
    const width = e.currentTarget.getBoundingClientRect().width || window.innerWidth;
    const threshold = Math.min(90, Math.max(48, width * 0.12));
    if (Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * 1.6)
      onDirection(dx < 0 ? 1 : -1);
  };
  return { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: cancel };
}
