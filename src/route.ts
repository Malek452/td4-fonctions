import type { Exercise } from './types';
/** Stable activity IDs survive reordering; old indexed links are accepted for imported decks. */
export function readRoute(sections: Exercise[], hash: string) {
  const first = { exercise: sections[0].id, index: 0 };
  const match = /^#activity\/([a-zA-Z0-9_-]+)$/.exec(hash);
  if (match) {
    for (const section of sections) {
      const index = section.activities.findIndex((a) => a.id === match[1]);
      if (index >= 0) return { exercise: section.id, index };
    }
    return first;
  }
  const legacy = /^#exercice-(\d+)(?:-(\d+))?$/.exec(hash);
  const section = sections.find((s) => s.id === Number(legacy?.[1]));
  return section
    ? {
        exercise: section.id,
        index: Math.max(0, Math.min(section.activities.length - 1, Number(legacy?.[2] || 1) - 1)),
      }
    : first;
}
