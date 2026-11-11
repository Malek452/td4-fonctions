// Deliberately independent of the author's active content registry.
// Keep these working recipes even when a new course replaces the demo.
import powers from '../examples/powers';
import algebra from '../examples/algebra';
import signs from '../examples/signs';
import circle from '../examples/circle';
import concepts from '../examples/concepts';
import { definePresentation } from '../src/content/define';
export const exercises = definePresentation([powers, algebra, signs, circle, concepts]);
export const getActivity = (id: string) =>
  exercises.flatMap((e) => e.activities).find((a) => a.id === id);
