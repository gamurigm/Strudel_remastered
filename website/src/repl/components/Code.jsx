// type Props = {
//   containerRef:  React.MutableRefObject<HTMLElement | null>,
//   editorRef:  React.MutableRefObject<HTMLElement | null>,
//   init: () => void
// }
export function Code(Props) {
  const { editorRef, containerRef, init } = Props;

  // Manejador especial para la tecla Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Si es solo Enter (sin Ctrl/Cmd), asegurarse de que se inserte una nueva línea
      if (!e.ctrlKey && !e.metaKey) {
        // Asegurarse de que el editor tenga foco
        try { 
          if (editorRef.current?.view) {
            editorRef.current.view.focus();
            
            // Evitar que otros manejadores interfieran, pero dejar que CodeMirror lo procese
            e.stopPropagation(); 
            
            // No llamar a e.preventDefault() para permitir que CodeMirror procese el Enter
          }
        } catch (err) {
          console.warn('Error manejando Enter:', err);
        }
      }
    }
  };

  return (
    <section
      className={'text-gray-100 cursor-text pb-0 overflow-auto grow'}
      id="code"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      ref={(el) => {
        containerRef.current = el;
        if (!editorRef.current) {
          init();
        }
      }}
    ></section>
  );
}
