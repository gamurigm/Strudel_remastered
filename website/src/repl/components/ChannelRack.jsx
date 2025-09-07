import { useState, useCallback } from 'react';

// ChannelRack: canales autónomos y síncronos usando un stack evaluado único.
// Canal 1 = editor principal (no se muestra aquí). Canales extra tienen su propio mini editor.
// Al reproducir se genera un código compuesto: stack(canal1, canal2, ...).
// Mantiene sincronía porque se evalúa una sola vez sobre el mismo clock.

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);

export default function ChannelRack({ context }) {
  const { editorRef, onEvaluate, onStop } = context || {};
  const [channels, setChannels] = useState([]); // canales adicionales (2..n)
  const [isPlaying, setIsPlaying] = useState(false);

  const addChannel = useCallback(() => {
    setChannels(prev => [...prev, { id: genId(), name: String(prev.length + 2), code: '', enabled: true }]);
  }, []);

  const updateChannel = useCallback((id, patch) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  }, []);

  const removeChannel = useCallback((id) => {
    setChannels(prev => prev.filter(c => c.id !== id));
  }, []);

  const buildCompositeCode = useCallback(() => {
    const mainCode = editorRef?.current?.getCode?.() || '';
    const activeExtras = channels.filter(c => c.enabled && c.code.trim()).map(c => c.code.trim());
    const parts = [];
    if (mainCode.trim()) parts.push(mainCode.trim());
    parts.push(...activeExtras);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    // envolver cada bloque en paréntesis para aislar
    const wrapped = parts.map(p => `(\n${p}\n)`);
    return `// composite generado automáticamente\nstack(\n${wrapped.join(',\n')}\n)`;
  }, [channels, editorRef]);

  const play = useCallback(() => {
    const code = buildCompositeCode();
    if (!code) return;
    try {
      onEvaluate?.(code);
      setIsPlaying(true);
    } catch (e) {
      console.error('Error al evaluar canales compuestos', e);
    }
  }, [buildCompositeCode, onEvaluate]);

  const stop = useCallback(() => {
    try { onStop?.(); } catch(_) {}
    setIsPlaying(false);
  }, [onStop]);

  const togglePlay = useCallback(() => {
    isPlaying ? stop() : play();
  }, [isPlaying, play, stop]);

  // Cuando cambia algo relevante y está reproduciendo, re-evaluar para mantener sincronía.
  const autoRefresh = useCallback(() => {
    if (isPlaying) {
      play();
    }
  }, [isPlaying, play]);

  return (
  <div className="fixed left-2 bottom-2 z-[90] max-h-[60vh] w-64 flex flex-col gap-2 text-[11px] font-mono">
      <div className="backdrop-blur-sm bg-black/60 border border-white/10 rounded-lg p-2 flex items-center gap-2">
        <span className="text-white/70">Canales</span>
        <button
          onClick={addChannel}
            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
          disabled={channels.length >= 8}
        >+ </button>
        <button
          onClick={togglePlay}
          className={[
            'px-2 py-0.5 rounded text-xs',
            isPlaying ? 'bg-red-600/80 hover:bg-red-500 text-white' : 'bg-green-600/70 hover:bg-green-500 text-white'
          ].join(' ')}
        >{isPlaying ? 'Stop' : 'Play'}</button>
      </div>
      <div className="overflow-auto thin-scroll flex flex-col gap-2 pr-1">
        {channels.map((ch) => (
          <div key={ch.id} className="backdrop-blur-sm bg-black/50 border border-white/10 rounded-md p-2 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <input
                value={ch.name}
                onChange={(e) => updateChannel(ch.id, { name: e.target.value })}
                className="bg-white/10 rounded px-1 py-0.5 w-14 outline-none text-white/80"
              />
              <label className="flex items-center gap-1 cursor-pointer text-white/60">
                <input
                  type="checkbox"
                  checked={ch.enabled}
                  onChange={(e) => { updateChannel(ch.id, { enabled: e.target.checked }); autoRefresh(); }}
                /> on
              </label>
              <button
                onClick={() => { removeChannel(ch.id); autoRefresh(); }}
                className="ml-auto text-white/50 hover:text-white"
                title="Eliminar canal"
              >×</button>
            </div>
            <textarea
              value={ch.code}
              onChange={(e) => { updateChannel(ch.id, { code: e.target.value }); autoRefresh(); }}
              placeholder="patrón..."
              className="h-20 resize-y bg-black/40 border border-white/10 rounded p-1 text-white/80 font-mono text-[11px] leading-snug outline-none focus:border-white/30"
            />
          </div>
        ))}
        {!channels.length && (
          <div className="text-white/40 text-xs px-1">Canal 1 = editor. Añade (+) para más.</div>
        )}
      </div>
    </div>
  );
}
