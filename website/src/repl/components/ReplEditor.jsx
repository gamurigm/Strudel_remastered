import Loader from '@src/repl/components/Loader';
import { HorizontalPanel, VerticalPanel } from '@src/repl/components/panel/Panel';
import { Code } from '@src/repl/components/Code';
import UserFacingErrorMessage from '@src/repl/components/UserFacingErrorMessage';
import { Header } from './Header';
import SnippetFloatingPanel from './SnippetFloatingPanel.jsx';
import { useSettings } from '@src/settings.mjs';
import { useEffect } from 'react';
// Importar estilos CSS para arreglar problemas del editor
import './CodeMirrorFix.css';

// type Props = {
//  context: replcontext,
// }

export default function ReplEditor(Props) {
  const { context, sessionId, ...editorProps } = Props;
  const { containerRef, editorRef, error, init, pending } = context;
  const settings = useSettings();
  const { panelPosition, isZen } = settings;

  // Focus editor when component is clicked
  const handleClick = () => {
    if (editorRef?.current?.view) {
      try {
        editorRef.current.view.focus();
      } catch (err) {
        console.warn('Error focusing editor:', err);
      }
    }
  };

  // Efectos para garantizar que el editor funcione correctamente
  useEffect(() => {
    // Cuando el componente se monta, añadir un manejador global para Enter
    const handleKeyPress = (e) => {
      // Si tenemos el editor inicializado y el foco está en algún lugar del editor
      if (editorRef?.current && containerRef?.current?.contains(document.activeElement)) {
        if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
          // Forzar el foco al editor
          try { 
            editorRef.current.view.focus();
          } catch {}
        }
      }
    };

    // Garantizar que el editor tenga foco después de cargar
    const focusTimer = setTimeout(() => {
      try {
        if (editorRef?.current?.view) {
          editorRef.current.view.focus();
          
          // Intentar forzar una nueva línea en el editor para probar que funciona
          const testInsertText = "\n";
          editorRef.current.view.dispatch({
            changes: {
              from: 0,
              insert: testInsertText
            }
          });
        }
      } catch {}
    }, 1000);

    // Registrar manejador global
    document.addEventListener('keydown', handleKeyPress);
    
    // Limpiar al desmontar
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      clearTimeout(focusTimer);
    };
  }, [editorRef, containerRef]);

  // Generar un ID único para el panel de snippets si no hay sessionId
  const snippetSessionId = sessionId || `fallback-${context.editorRef?.current?.id || Date.now()}`;

  return (
    <div 
      className="h-full flex flex-col relative" 
      {...editorProps}
      onClick={handleClick}
    >
      <Loader active={pending} />
      <Header context={context} />
      {/* Mostrar siempre el panel de snippets */}
      <SnippetFloatingPanel context={context} sessionId={snippetSessionId} />
      <div className="grow flex relative overflow-hidden">
        <Code containerRef={containerRef} editorRef={editorRef} init={init} />
        {!isZen && panelPosition === 'right' && <VerticalPanel context={context} />}
      </div>
      <UserFacingErrorMessage error={error} />
      {!isZen && panelPosition === 'bottom' && <HorizontalPanel context={context} />}
    </div>
  );
}
