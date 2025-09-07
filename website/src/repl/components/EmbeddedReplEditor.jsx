import Loader from '@src/repl/components/Loader';
import { Code } from '@src/repl/components/Code';
import BigPlayButton from '@src/repl/components/BigPlayButton';
import UserFacingErrorMessage from '@src/repl/components/UserFacingErrorMessage';
import { Header } from './Header';

// type Props = {
//  context: replcontext,
// }

import SnippetFloatingPanel from './SnippetFloatingPanel.jsx';

export default function EmbeddedReplEditor(Props) {
  const { context, ...editorProps } = Props;
  const { pending, started, handleTogglePlay, containerRef, editorRef, error, init } = context;
  
  // ID único para snippets en modo embedded
  const snippetSessionId = `embedded-${Date.now()}`;
  
  return (
    <div className="h-full flex flex-col relative" {...editorProps}>
      <Loader active={pending} />
      <Header context={context} embedded={true} />
      <BigPlayButton started={started} handleTogglePlay={handleTogglePlay} />
      {/* Panel de snippets para el modo embedded */}
      <SnippetFloatingPanel context={context} sessionId={snippetSessionId} />
      <div className="grow flex relative overflow-hidden">
        <Code containerRef={containerRef} editorRef={editorRef} init={init} />
      </div>
      <UserFacingErrorMessage error={error} />
    </div>
  );
}
