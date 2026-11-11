/// <reference types="@motion-canvas/core/project" />
declare module '*?project' {
  const project: import('@motion-canvas/core').Project;
  export default project;
}
declare module 'nerdamer/all.min.js' {
  import nerdamer from 'nerdamer';
  export default nerdamer;
}
