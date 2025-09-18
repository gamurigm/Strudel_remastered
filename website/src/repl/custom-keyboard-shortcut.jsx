/* @refresh skip */
// Archivo de configuración para agregar atajo de teclado personalizado
// Los atajos SOLO deben afectar al canal actual (editor con foco y sesión activa)

export function addCustomKeyboardShortcut(editorRef, opts = {}) {
  const { solo = true, sessionId, handleEvaluate } = opts;

  const isThisEditorFocused = () => {
    const el = editorRef.current?.view?.dom;
    if (!el) return false;
    const active = document.activeElement;
    if (!active) return false;
    return el === active || el.contains(active) || active.closest?.('.cm-editor') === el;
  };

  const isThisSessionActive = () => {
    if (solo) return true; // modo single repl
    const activeId = typeof window !== 'undefined' ? window.__strudelActiveSessionId : undefined;
    return !!activeId && activeId === sessionId;
  };

  const safeRun = (fn) => {
    try { fn?.(); } catch (e) { console.warn('shortcut error', e); }
  };

  const handleKeyDown = (e) => {
    // Gating estricto: foco + sesión activa
    if (!isThisEditorFocused()) return;
    if (!isThisSessionActive()) return;

    // No usar Ctrl/Cmd+R como atajo: si se pulsa dentro del editor, bloquear recarga y no hacer nada más
    if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase?.() === 'r') {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

  // Atajos

    // Ctrl+.: toggle play/pause
    if ((e.ctrlKey || e.metaKey) && e.key === '.') {
      e.preventDefault(); e.stopPropagation();
      if (editorRef.current) safeRun(() => editorRef.current.toggle());
      return;
    }

    // Ctrl+Shift+Enter: evaluar desde el ciclo 0
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
      e.preventDefault(); e.stopPropagation();
      if (editorRef.current) {
        safeRun(() => editorRef.current.repl?.setCycle?.(0));
        safeRun(() => editorRef.current.evaluate());
      }
      return;
    }

    // Ctrl+Enter / Cmd+Enter: EXACTAMENTE igual que el botón Update
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); e.stopPropagation();
      if (typeof handleEvaluate === 'function') {
        safeRun(() => handleEvaluate());
      } else if (editorRef.current) {
        // fallback
        safeRun(() => editorRef.current.evaluate());
      }
      return;
    }

    // Alt+Enter: evaluar (igual que Update)
    if (e.altKey && e.key === 'Enter') {
      e.preventDefault(); e.stopPropagation();
      if (typeof handleEvaluate === 'function') {
        safeRun(() => handleEvaluate());
      } else if (editorRef.current) {
        safeRun(() => editorRef.current.evaluate());
      }
      return;
    }

  // Ctrl+Shift+X: Stop (evita conflictos con navegador)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'x') {
      e.preventDefault(); e.stopPropagation();
      if (editorRef.current) {
        safeRun(() => editorRef.current.stop?.());
        safeRun(() => editorRef.current.repl?.stop?.());
        safeRun(() => editorRef.current.repl?.scheduler?.stop?.());
      }
      return;
    }
  };

  // Listener en documento, pero con gating de foco + sesión
  document.addEventListener('keydown', handleKeyDown, true);

  return () => {
    document.removeEventListener('keydown', handleKeyDown, true);
  };
}

// Lista de atajos disponibles
export const customShortcuts = {
  'Ctrl+Enter': 'Ejecutar/Evaluar (igual que Update)',
  'Alt+Enter': 'Ejecutar/Evaluar (alternativa)',
  'Ctrl+.': 'Pausar/Reanudar reproducción',
  'Ctrl+Shift+Enter': 'Ejecutar desde el principio',
  'Ctrl+Shift+X': 'Stop',
  'Alt+1-9': 'Cambiar entre buffers',
  'Alt+←/→': 'Navegar entre buffers',
};