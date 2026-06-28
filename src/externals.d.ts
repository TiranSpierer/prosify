declare module 'markdown-it-container' {
  import MarkdownIt from 'markdown-it';
  function container(md: MarkdownIt, name: string, opts?: any): void;
  export default container;
}

declare module 'markdown-it-task-lists' {
  import MarkdownIt from 'markdown-it';
  function taskLists(md: MarkdownIt, opts?: any): void;
  export default taskLists;
}

declare module 'sirv' {
  import { RequestHandler } from 'http';
  function sirv(dir: string, opts?: any): any;
  export default sirv;
}
