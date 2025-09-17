// Archivo de configuración para agregar atajo de teclado personalizado
// Este código agrega Ctrl+U como atajo alternativo para ejecutar/actualizar el código

export function addCustomKeyboardShortcut(editorRef) {
  // Agregar listener para el atajo personalizado
  const handleKeyDown = (e) => {
    // Ctrl+E o Cmd+E (para Mac) - E de "Execute/Evaluar"
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault(); // Prevenir comportamiento por defecto del navegador
      
      // Ejecutar el código
      if (editorRef.current) {
        editorRef.current.evaluate();
        console.log('Código ejecutado con Ctrl+E');
      }
    }
    
    // Alt+Enter para ejecutar (alternativa común en REPLs)
    if (e.altKey && e.key === 'Enter') {
      e.preventDefault();
      
      if (editorRef.current) {
        editorRef.current.evaluate();
        console.log('Código ejecutado con Alt+Enter');
      }
    }
    
    // Ctrl+. (punto) para detener/pausar
    if ((e.ctrlKey || e.metaKey) && e.key === '.') {
      e.preventDefault();
      
      if (editorRef.current) {
        editorRef.current.toggle();
        console.log('Reproducción pausada/reanudada con Ctrl+.');
      }
    }
    
    // Ctrl+Shift+Enter para ejecutar desde el principio
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      
      if (editorRef.current) {
        // Resetear el tiempo a 0 y ejecutar
        if (editorRef.current.repl) {
          editorRef.current.repl.setCycle(0);
        }
        editorRef.current.evaluate();
        console.log('Código ejecutado desde el inicio con Ctrl+Shift+Enter');
      }
    }
  };
  
  // Agregar el listener al documento
  document.addEventListener('keydown', handleKeyDown);
  
  // Retornar función de limpieza
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}

// Lista de atajos disponibles
export const customShortcuts = {
  'Ctrl+E': 'Ejecutar/Evaluar código',
  'Alt+Enter': 'Ejecutar código (alternativa)',
  'Ctrl+.': 'Pausar/Reanudar reproducción',
  'Ctrl+Shift+Enter': 'Ejecutar desde el principio',
  'Ctrl+Enter': 'Ejecutar código (original)',
  'Alt+1-9': 'Cambiar entre buffers',
  'Alt+←/→': 'Navegar entre buffers'
};