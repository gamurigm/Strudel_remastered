import { useEffect, useState, useCallback } from 'react';
import { MiniRepl } from '@src/docs/MiniRepl';

// Defaults auto-escribibles (seccion marcada) ------------------------------
const DEFAULT_BEATS = [
// <AUTO-DEFAULTS-START>
  `$: sound("bd*2 ~ bd sd").bank("Linn9000")
$: sound("hh*8").gain("[0.2 0.5 0.9 0.5]*2").hpf(8000)`
// <AUTO-DEFAULTS-END>
];

// Componente reutilizable para la lista editable de mini REPLs (beats)
export function WelcomeBeats({
  storageKey = 'welcomeBeatsV1',
  defaults = DEFAULT_BEATS,
  maxCols = 3,
  maxHeight = 180,
  enableFileSave = true, // bandera para mostrar botón guardar archivo
}) {
  const [beats, setBeats] = useState(defaults);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  // Cargar de localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) setBeats(arr);
      }
    } catch (e) { /* noop */ }
    setLoaded(true);
  }, [storageKey]);

  const persist = useCallback((next) => {
    setBeats(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch (e) { /* noop */ }
  }, [storageKey]);

  const onEval = useCallback((index) => (code) => {
    setBeats(prev => {
      const copy = [...prev];
      copy[index] = code;
      try { localStorage.setItem(storageKey, JSON.stringify(copy)); } catch (e) { /* noop */ }
      return copy;
    });
  }, [storageKey]);

  const addBeat = () => {
    persist([...beats, `sound("bd sd [~ bd] sd").bank("RolandTR808")`]);
  };
  const reset = () => persist(defaults);
  const removeBeat = useCallback((index) => {
    if (!window.confirm('Eliminar este beat?')) return;
    const next = beats.filter((_, i) => i !== index);
    persist(next.length ? next : defaults.slice(0, 1));
  }, [beats, defaults, persist]);

  const saveToSource = async () => {
    setSaving(true); setSaveMsg(null);
    try {
      const res = await fetch('/api/update-welcome-beats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beats }),
      });
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch {
        throw new Error('Respuesta no JSON (status ' + res.status + ')');
      }
      if (!res.ok || !json.ok) throw new Error(json.error || 'Error desconocido');
      setSaveMsg('Archivo actualizado');
    } catch (e) {
      setSaveMsg('No se pudo guardar: ' + e.message);
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="mt-0 mb-3 flex flex-wrap gap-2 items-center text-xs opacity-80">
        <button onClick={addBeat} className="px-2 py-1 rounded bg-lineHighlight hover:bg-background border border-lineHighlight">+ beat</button>
        {enableFileSave && (
          <button onClick={saveToSource} disabled={saving} className="px-2 py-1 rounded bg-lineHighlight hover:bg-background border border-lineHighlight disabled:opacity-40">
            {saving ? '…' : 'guardar archivo'}
          </button>
        )}
        {!loaded && <span className="text-[10px] opacity-50">cargando…</span>}
        {saveMsg && <span className="text-[10px] opacity-70">{saveMsg}</span>}
        <span className="ml-auto pr-1 opacity-40">{beats.length}</span>
      </div>
      <div className={`grid gap-4 md:grid-cols-${Math.min(maxCols, beats.length)}`}>
        {beats.map((code, i) => (
          <div key={i} className="relative group">
            <button
              onClick={() => removeBeat(i)}
              className="absolute -right-2 -top-2 z-10 w-6 h-6 rounded-full text-xs font-bold bg-lineHighlight border border-lineHighlight hover:bg-background opacity-70 group-hover:opacity-100"
              title="eliminar"
            >×</button>
            <MiniRepl
              tune={code}
              punchcard
              punchcardLabels={false}
              maxHeight={maxHeight}
              onEvaluate={onEval(i)}
            />
          </div>
        ))}
      </div>
      {enableFileSave && <p className="mt-2 text-[10px] opacity-50">Guardado en archivo sólo funciona en modo dev (no producción).</p>}
    </>
  );
}
