import { domaineExercises } from './td4-domaines';
import { identiteExercises } from './td4-identites';
import { trigExercises } from './td4-trig';
// @new-lesson-import
import { definePresentation } from './define';

export const exercises = definePresentation([
  ...domaineExercises,
  ...identiteExercises,
  ...trigExercises,
  // @new-lesson-entry
]);
export const activities = exercises.flatMap((section) => section.activities);
export const getActivity = (id: string) => activities.find((activity) => activity.id === id);
