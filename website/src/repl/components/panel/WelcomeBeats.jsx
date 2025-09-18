import { useEffect, useState, useCallback, useRef } from 'react';
import { MiniRepl } from '@src/docs/MiniRepl';

// Defaults auto-escribibles (seccion marcada) ------------------------------
const DEFAULT_BEATS = [
// <AUTO-DEFAULTS-START>
// updated 2025-09-18T00:22:28.738Z
  `const ritmo     = x => x.bank("AlesisHR16").clip(1).gain(0.75)
s("bd!4,[~ sd]!2,[~ hh!2 hh*2]!2").apply(ritmo).room(0.1).delay(.05)`,
  `setCps(90/60/4)  

// Marcación de tiempo simple (metrónomo)
const metronome = stack(
  s("bd").gain(0.5),     // Tiempo fuerte
  s("hh*4").gain(0.5)    // Subdivisión suave
)

const harmony = "<C^9 Fm7 [Am7 D7] Em7 B7b13 F#m7 [FM13 Fo] [Dm11 G7sus]>"
  .chord()
  
  .voicing()
  .s("piano")
  .gain(0.7)
  .room(0.4)
  .release(0.8)

stack(
  metronome,
  harmony  
)._pianoroll({labels:1})`,
  `// Composición simple: "Ritmo Tropical"
setCps(120/60/4)  // Tempo a 120 BPM

// Batería básica
const drums = stack(
  s("bd ~ sd ~"),  // Bombo y caja
  s("hh*4")        // Hi-hats
).gain(0.8)

// Melodía con acordes
const melody = note("<c4 d4 e4 f4 g4 a4 b4 c5>").s("piano").gain(0.6).room(0.3)

// Bajo pulsante
const bass = note("<c2 g2>").s("sawtooth").gain(0.5).lpf(300)

// Combinar todo
stack(drums, melody, bass).room(0.2).gain(0.9)

`,
  `setCps(90/60/4)  

// Marcación de tiempo simple (metrónomo)
const metronome = stack(
  s("bd").gain(0.5),     // Tiempo fuerte
  s("hh*4").gain(0.5)    // Subdivisión suave
)

const harmony = "<C^9 Fm7 [Am7 D7] Em7 B7b13 F#m7 [FM7 Fm6] [Dm9 G7sus]>"
  .chord()
  
  .voicing()
  .s("piano")
  .gain(0.7)
  .room(0.4)
  .release(0.8)

stack(
  metronome,
  harmony  
)._pianoroll({labels:1})`
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
  const [dbSynced, setDbSynced] = useState(false);
  const editorRefs = useRef([]);
  const autoSaveTimer = useRef(null);
  const lastSent = useRef(null);

  // ESTRATEGIA HÍBRIDA: BD es fuente de verdad, archivo se auto-actualiza
  useEffect(() => {
    const loadData = async () => {
      try {
        // PASO 1: Siempre intentar cargar desde BD primero
        let dbBeats = null;
        let dbAvailable = false;
        
        try {
          const dbResponse = await fetch(`/api/sync-beats?storageKey=${storageKey}`);
          if (dbResponse.ok) {
            const dbData = await dbResponse.json();
            if (dbData.ok && dbData.beats && dbData.beats.length > 0) {
              dbBeats = dbData.beats;
              dbAvailable = true;
              console.log(`📖 BD disponible: ${dbData.beats.length} beats encontrados`);
            }
          }
        } catch (dbError) {
          console.warn('⚠️ BD no disponible:', dbError.message);
        }
        
        // PASO 2: Si BD tiene datos, usarlos (BD es fuente de verdad)
        if (dbBeats && dbBeats.length > 0) {
          setBeats(dbBeats);
          setDbSynced(true);
          console.log(`✅ Usando ${dbBeats.length} beats de BD (fuente de verdad)`);
          
          // Actualizar localStorage para consistency
          try { 
            localStorage.setItem(storageKey, JSON.stringify(dbBeats)); 
          } catch (e) { /* noop */ }
          
          setLoaded(true);
          return;
        }
        
        // PASO 3: Si BD está vacía, usar archivo → localStorage → defaults (en ese orden)
        console.log(`📄 BD vacía, usando estrategia de fallback...`);
        
        // Primero intentar localStorage
        const raw = localStorage.getItem(storageKey);
        let localBeats = null;
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr) && arr.length) localBeats = arr;
        }
        
        // Decidir qué datos usar
        let finalBeats;
        if (localBeats) {
          finalBeats = localBeats;
          console.log(`💾 Usando ${localBeats.length} beats de localStorage`);
        } else {
          finalBeats = defaults;
          console.log(`🏠 Usando ${defaults.length} beats por defecto del archivo`);
        }
        
        setBeats(finalBeats);
        setDbSynced(dbAvailable); // false si BD no estaba disponible
        
        // Si BD está disponible pero vacía, sincronizar estos datos iniciales
        if (dbAvailable) {
          console.log(`🔄 Sincronizando datos iniciales con BD...`);
          syncToDatabase(finalBeats);
        }
        
      } catch (e) { 
        console.error('Error cargando datos:', e);
        setBeats(defaults);
        setDbSynced(false);
      }
      setLoaded(true);
    };
    
    loadData();
  }, [storageKey, defaults]);

  // Función para sincronizar con base de datos (con fallback a API)
  const syncToDatabase = useCallback(async (beatsData) => {
    // PRIORIDAD 1: Intentar guardar en base de datos
    try {
      const response = await fetch('/api/sync-beats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          beats: beatsData, 
          storageKey: storageKey,
          action: 'update' // Siempre usar update (es inteligente y evita duplicados)
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.ok) {
          setDbSynced(true);
          console.log(`💾 ${result.count} beats guardados en BD (${result.action})`);
          return; // Éxito en BD, no necesitamos fallback
        }
      }
      
      throw new Error(`BD no disponible (status: ${response.status})`);
    } catch (dbError) {
      console.warn('⚠️ BD no disponible, usando API fallback:', dbError.message);
      setDbSynced(false);
      
      // FALLBACK: Usar la API existente si BD no está disponible
      try {
        const fallbackResponse = await fetch('/api/update-welcome-beats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ beats: beatsData }),
        });
        
        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json();
          if (fallbackResult.ok) {
            console.log(`📄 ${beatsData.length} beats guardados en archivo (fallback)`);
          }
        }
      } catch (fallbackError) {
        console.error('❌ Error en ambos sistemas (BD + API):', fallbackError.message);
      }
    }
  }, [storageKey, dbSynced]);

  const persist = useCallback((next) => {
    setBeats(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch (e) { /* noop */ }
    // Sincronizar con BD en background
    syncToDatabase(next);
  }, [storageKey, syncToDatabase]);

  const triggerAutoSave = useCallback((nextBeats) => {
    if (!enableFileSave || !autoSave) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      // evitar enviar si no hay cambios reales vs último payload
      const payload = JSON.stringify(nextBeats);
      if (payload === lastSent.current) return;
      lastSent.current = payload;
      
      // Usar lógica unificada: BD primero, API como fallback
      syncToDatabase(nextBeats);
    }, autoSaveDelay);
  }, [autoSave, autoSaveDelay, enableFileSave, syncToDatabase]);

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
    
    // Usar lógica unificada: BD primero, API como fallback
    try {
      await syncToDatabase(outgoing);
      setSaveMsg(`Guardado exitoso (${outgoing.length} beats) - ${dbSynced ? 'BD' : 'Archivo'}`);
    } catch (e) {
      setSaveMsg('Error al guardar: ' + e.message);
    } finally { 
      setSaving(false); 
    }
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
        {loaded && (
          <span className={`text-[10px] opacity-50 ${dbSynced ? 'text-green-400' : 'text-yellow-400'}`}>
            {dbSynced ? '🔄 BD ↔ Archivo' : '📄 Solo archivo'}
          </span>
        )}
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
      {enableFileSave && (
        <div className="mt-2 text-[10px] opacity-50 space-y-1">
          <p>� Estrategia híbrida: BD es fuente de verdad, archivo se auto-actualiza.</p>
          {autoSave && <p>⚡ Auto-save tras {autoSaveDelay}ms después de UPDATE/Evaluate.</p>}
        </div>
      )}
    </>
  );
}
