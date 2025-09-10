import { useEffect, useState, useCallback, useRef } from 'react';
import { MiniRepl } from '@src/docs/MiniRepl';

// Defaults auto-escribibles (seccion marcada) ------------------------------
const DEFAULT_BEATS = [
// <AUTO-DEFAULTS-START>
// updated 2025-09-10T23:09:23.258Z
  `sound("bd sdasdassasd808")hjgjhg`,
  `sound("hh bd")`,
  `.`,
  `hola ptu puto`,
  `asdsdsadd sd [~ bd] sd").bank("RolandTR808")`,
  `sound(asddddddddddddddddddddddddddd"bd sd [~ bd] sd").bank("RolandTR808")`
// <AUTO-DEFAULTS-END>
];

// Componente reutilizable para la lista editable de mini REPLs (beats)
export function WelcomeBeats({
  storageKey = 'welcomeBeatsV1',
  defaults = DEFAULT_BEATS,
  maxCols = 1,
  maxHeight = 180,
  enableFileSave = true, // bandera para mostrar botón guardar archivo
  autoSave = true,       // auto-guardar al hacer evaluate
  autoSaveDelay = 800,   // ms debounce
}) {
  const [beats, setBeats] = useState(defaults);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const editorRefs = useRef([]);
  const autoSaveTimer = useRef(null);
  const lastSent = useRef(null);

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

  const triggerAutoSave = useCallback((nextBeats) => {
    if (!enableFileSave || !autoSave) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      // evitar enviar si no hay cambios reales vs último payload
      const payload = JSON.stringify(nextBeats);
      if (payload === lastSent.current) return;
      lastSent.current = payload;
      // reutiliza lógica de save, pero mínima: sólo POST
      fetch('/api/update-welcome-beats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beats: nextBeats }),
      }).then(r => r.text().then(t => {
        try { const j = JSON.parse(t); if (!j.ok) console.warn('autoSave error', j); } catch {/* noop */}
      })).catch(()=>{});
    }, autoSaveDelay);
  }, [autoSave, autoSaveDelay, enableFileSave]);

  const onEval = useCallback((index) => (code) => {
    setBeats(prev => {
      const copy = [...prev];
      copy[index] = code;
      try { localStorage.setItem(storageKey, JSON.stringify(copy)); } catch (e) { /* noop */ }
      triggerAutoSave(copy);
      return copy;
    });
  }, [storageKey, triggerAutoSave]);

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
    // capturar código vivo de editores (sin necesidad de pulsar UPDATE)
    const live = editorRefs.current.map(ed => {
      try { return ed?.getCode ? ed.getCode() : null; } catch { return null; }
    });
    let outgoing = beats;
    if (live.some(c => typeof c === 'string')) {
      const merged = beats.map((b,i)=> (typeof live[i] === 'string' ? live[i] : b));
      if (JSON.stringify(merged) !== JSON.stringify(beats)) {
        outgoing = merged;
        setBeats(merged);
        try { localStorage.setItem(storageKey, JSON.stringify(merged)); } catch {}
      }
    }
    setSaving(true); setSaveMsg(null);
    try {
      const res = await fetch('/api/update-welcome-beats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beats: outgoing }),
      });
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch {
        throw new Error('Respuesta no JSON (status ' + res.status + ')');
      }
      if (!res.ok || !json.ok) throw new Error(json.error || 'Error desconocido');
      setSaveMsg('Archivo actualizado (' + json.count + (json.changed ? ' cambios' : ' sin cambios') + ')');
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
              onReady={(ed)=>{ editorRefs.current[i]=ed; }}
            />
          </div>
        ))}
      </div>
      {enableFileSave && <p className="mt-2 text-[10px] opacity-50">Guardado en archivo sólo funciona en modo dev (no producción).</p>}
  {enableFileSave && autoSave && <p className="mt-1 text-[10px] opacity-40">Auto-save después de {autoSaveDelay}ms tras UPDATE/Evaluate.</p>}
    </>
  );
}
