import { JSDOM } from 'jsdom';
import { afterEach } from 'node:test';
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
Object.defineProperty(globalThis, 'window', { value: dom.window, configurable: true });
Object.defineProperty(globalThis, 'document', { value: dom.window.document, configurable: true });
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
Object.defineProperty(globalThis, 'localStorage', {
  value: dom.window.localStorage,
  configurable: true,
});
Object.defineProperty(globalThis, 'HTMLElement', {
  value: dom.window.HTMLElement,
  configurable: true,
});
Object.defineProperty(globalThis, 'MutationObserver', {
  value: dom.window.MutationObserver,
  configurable: true,
});
Object.defineProperty(window, 'matchMedia', {
  value: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }),
});
window.scrollTo = () => {};
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const { cleanup } = await import('@testing-library/react');
afterEach(() => {
  cleanup();
  localStorage.clear();
});
