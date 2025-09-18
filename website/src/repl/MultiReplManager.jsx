/* @refresh skip */
import { useState, useEffect, useRef, useCallback } from 'react';
import ReplEditor from './components/ReplEditor';
import { useReplContext } from './useReplContext';
import PlusIcon from '@heroicons/react/20/solid/PlusIcon';
import XMarkIcon from '@heroicons/react/20/solid/XMarkIcon';
import PlayIcon from '@heroicons/react/20/solid/PlayIcon';
import PauseIcon from '@heroicons/react/20/solid/PauseIcon';
import { StrudelMPClient } from './multiplayer/client.mjs';
import { defaultTune } from './defaultTune.mjs';

const LS_KEY = 'strudelMultiReplsV1';
const CHANNEL_COLORS = [
  '#a3e635', // lime
  '#38bdf8', // sky
  '#f472b6', // pink
  '#fb923c', // orange
  '#c084fc', // violet
  '#4ade80', // green
  '#facc15', // amber
  '#94a3b8', // slate
];

function createSession(channel, code = '') {
  const color = CHANNEL_COLORS[(channel - 1) % CHANNEL_COLORS.length];
  return { id: crypto.randomUUID(), name: `Canal ${channel}`, code, channel, color };
}

function Session({ session, active, registerContext, initialCode, updateCode }) {
  // solo:false permite que múltiples sesiones reproduzcan simultáneamente
  const ctx = useReplContext({ solo: false, sessionId: session.id });
  const injectedRef = useRef(false);

  // After editor init, inject stored code (once)
  useEffect(() => {
    const ed = ctx.editorRef.current;
    if (ed && !injectedRef.current) {
      try {
        const current = ed.getCode?.() || '';
        // Channel 1: always defaultTune
        if (session.channel === 1) {
          ed.setCode(defaultTune);
        } else if (!active && !session.code) {
          // In multi-repl, avoid auto-loading defaultTune in inactive/empty sessions.
          // Force them to start silent to prevent cacophony on "Play all".
          // Use a small delay to win any race against async defaultTune load in useReplContext.
          setTimeout(() => {
            try { ed.setCode(''); } catch {}
          }, 30);
        } else if (active) {
          // For active sessions 2+, use saved code if present; otherwise keep empty
          if (!current || current === '// LOADING') {
            ed.setCode(session.code || initialCode || '');
          }
        } else if (!current || current === '// LOADING') {
          // Non-active session with existing saved code
          ed.setCode(session.code || initialCode || '');
        }
      } catch {}
      injectedRef.current = true;
    }
  }, [ctx.editorRef.current, session.code, active, initialCode]);

  // expose context upward
  useEffect(() => {
    registerContext(session.id, ctx);
  }, [ctx, session.id, registerContext]);

  // Propagate live code changes upward for immediate persistence
  useEffect(() => {
    // Avoid propagating before initial injection completes
    if (!injectedRef.current) return;
    const code = ctx?.activeCode;
    if (typeof code !== 'string') return;
    const trimmed = code.trim();
    // Ignore empty or placeholder content
    if (!trimmed || trimmed === '// LOADING') return;
    updateCode?.(session.id, code);
  }, [ctx?.activeCode, session.id, updateCode]);

  return (
    <div
      className={[
        'absolute inset-0 transition-opacity',
        active ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      ].join(' ')}
    >
  <ReplEditor context={ctx} sessionId={session.id} />
    </div>
  );
}

export default function MultiReplManager() {
  const [sessions, setSessions] = useState([]); // {id,name,code,color}
  const [activeId, setActiveId] = useState(null);
  const contextsRef = useRef(new Map());
  const mpRef = useRef();
  const suppressIncoming = useRef(false); // avoid echo loops

  // Función para forzar el guardado del estado de todos los canales
  const forceSaveAllSessions = useCallback(() => {
    setSessions((prev) => {
      let hasChanged = false;
      const newSessions = prev.map((s) => {
        const ctx = contextsRef.current.get(s.id);
        const liveCode = ctx?.editorRef?.current?.getCode?.();
        if (liveCode && liveCode !== s.code) {
          hasChanged = true;
          return { ...s, code: liveCode };
        }
        return s;
      });
      if (hasChanged) {
        return newSessions;
      }
      return prev;
    });
  }, []);

  // Guardar al cambiar de canal (al cambiar activeId)
  useEffect(() => {
    forceSaveAllSessions();
    if (typeof window !== 'undefined') {
      window.__strudelActiveSessionId = activeId;
    }
  }, [activeId, forceSaveAllSessions]);

  // Guardar cuando la ventana pierde el foco (blur)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('blur', forceSaveAllSessions);
    return () => {
      window.removeEventListener('blur', forceSaveAllSessions);
    };
  }, [forceSaveAllSessions]);

  // Guardado final y síncrono antes de cerrar la ventana/app (desktop/web)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saveAllNow = () => {
      try {
        // Base: último snapshot persistido o estado actual
        const raw = localStorage.getItem(LS_KEY);
        const base = raw ? JSON.parse(raw) : sessions;
        const latest = (base || []).map((s) => {
          const ctx = contextsRef.current.get(s.id);
          const live = ctx?.editorRef?.current?.getCode?.();
          const liveStr = typeof live === 'string' ? live : '';
          const trimmed = liveStr.trim();
          // Channel 1 never persists code; keep empty to load defaultTune next time
          if (s.channel === 1) {
            return { ...s, code: '' };
          }
          // Only take live if it is non-empty and not a placeholder; otherwise keep saved
          const safe = trimmed && trimmed !== '// LOADING' ? liveStr : s.code;
          return { ...s, code: safe };
        });
        if (latest && latest.length) {
          localStorage.setItem(LS_KEY, JSON.stringify(latest));
        }
      } catch (e) {
        // no-op
      }
    };

    const handleBeforeUnload = () => {
      saveAllNow();
    };

    const handlePageHide = () => {
      saveAllNow();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [sessions]);

  // Snippet helper removed per user request

  // load sessions from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          // Ensure channel numbering starts at 1 and channel 1 has no persisted code
          const normalized = parsed.map((s, i) => ({
            ...s,
            channel: s.channel || (i + 1),
            code: (s.channel || (i + 1)) === 1 ? '' : (s.code || ''),
          }));
          setSessions(normalized);
          setActiveId(normalized[0].id);
          return;
        }
      }
    } catch {}
    const first = createSession(1);
    setSessions([first]);
    setActiveId(first.id);
  }, []);

  // persist sessions structural data & latest code snapshots
  useEffect(() => {
    try { 
      if (sessions.length > 0) {
        localStorage.setItem(LS_KEY, JSON.stringify(sessions)); 
      }
    } catch {}
  }, [sessions]);

  // periodic code snapshot (fallback)
  useEffect(() => {
    const handle = setInterval(() => {
      forceSaveAllSessions();
    }, 2500); // Aumentado a 2.5s para reducir frecuencia
    return () => clearInterval(handle);
  }, [forceSaveAllSessions]);

  // init multiplayer client
  useEffect(() => {
    if (mpRef.current) return;
    mpRef.current = new StrudelMPClient({ room: 'main' });
    const off = mpRef.current.on((msg) => {
      if (msg.type === 'code-update') {
        setSessions((prev) => prev.map((s) => {
          if (s.id === msg.channelId && msg.code && msg.code !== s.code) {
            const ctx = contextsRef.current.get(s.id);
            // apply remote code only if user not currently typing in that session
            if (ctx?.editorRef?.current && s.id !== activeId) {
              suppressIncoming.current = true;
              try { ctx.editorRef.current.setCode(msg.code); } catch {}
              suppressIncoming.current = false;
            }
            return { ...s, code: msg.code };
          }
          return s;
        }));
      }
    });
    return () => off?.();
  }, [activeId]);

  const registerContext = useCallback((id, ctx) => {
    contextsRef.current.set(id, ctx);
  }, []);

  const addSession = () => {
    setSessions((prev) => {
      const s = createSession(prev.length + 1);
      return [...prev, s];
    });
  };

  const updateSessionCode = useCallback((id, code) => {
  if (typeof code !== 'string') return;
  const trimmed = code.trim();
  if (!trimmed || trimmed === '// LOADING') return;
    setSessions((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      // Never persist defaultTune into channel 1 snapshot; keep it implicit
      if (s.channel === 1) return s;
      return s.code === code ? s : { ...s, code };
    }));
  }, []);
  const removeSession = (id) => {
    // Detener audio del canal antes de eliminarlo
    try {
      const ctx = contextsRef.current.get(id);
      if (ctx) {
        if (ctx.started && ctx.handleTogglePlay) {
          try { ctx.handleTogglePlay(); } catch {}
        }
        // Fallback extra por si el estado interno quedó inconsistente
        try { ctx.editorRef?.current?.repl?.stop?.(); } catch {}
      }
    } catch {}
    // Eliminar del mapa de contextos
    contextsRef.current.delete(id);
    // Actualizar sesiones y activeId en un solo paso
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (activeId === id) {
        setActiveId(remaining.length ? remaining[0].id : null);
      }
      return remaining;
    });
  };

  const renameSession = (id, name) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, name: name.trim() || s.name } : s)));
  };

  // Toggle play for a specific session (even if not active)
  const toggleSession = (id) => {
    const ctx = contextsRef.current.get(id);
    if (ctx?.handleTogglePlay) {
      ctx.handleTogglePlay();
      setSessions((p) => [...p]); // trigger refresh for indicators
    }
  };

  const playAll = () => {
    let anyStarted = false;
    sessions.forEach((s) => {
      const ctx = contextsRef.current.get(s.id);
      const mirror = ctx?.editorRef?.current;
      if (!ctx || !mirror) return;
      try {
        let current = mirror.getCode?.() || '';
        const hasSaved = typeof s.code === 'string' && s.code.trim().length > 0;
  // Si está vacío pero hay snapshot guardado, cargarlo (solo canales con snapshot propio)
        if (s.id !== activeId && (!current || current === '// LOADING') && hasSaved) {
          try { mirror.setCode(s.code); current = s.code; } catch {}
        }
        // Skip si sigue vacío
        if (!current || !current.trim()) return;
        // Si no está iniciado todavía, iniciar (toggle hace también la evaluación inicial interna)
        if (!ctx.started) {
          try { ctx.handleTogglePlay?.(); anyStarted = true; } catch (e) { console.warn('playAll toggle fail', e); }
        } else {
          // Ya estaba sonando: sólo reevaluar para refrescar cambios
          try { ctx.handleEvaluate?.(); } catch (e) { console.warn('playAll eval fail', e); }
          anyStarted = true;
        }
      } catch (e) {
        console.warn('playAll channel prep failed', e);
      }
    });
    // Si nada arrancó (p.ej. editores aún inicializándose), reintentar una vez tras un pequeño delay
    if (!anyStarted) {
      setTimeout(() => {
        sessions.forEach((s) => {
          const ctx = contextsRef.current.get(s.id);
          if (ctx && !ctx.started) {
            try { ctx.handleTogglePlay?.(); } catch {}
          }
        });
        setSessions((p) => [...p]);
      }, 180);
    }
    setSessions((p) => [...p]);
  };
  const stopAll = () => {
    sessions.forEach((s) => {
      const ctx = contextsRef.current.get(s.id);
      if (!ctx) return;
      // Usar el mismo camino (toggle) para garantizar que 'started' se sincroniza correctamente.
      if (ctx.started && ctx.handleTogglePlay) {
        try { ctx.handleTogglePlay(); } catch {}
      } else if (ctx.editorRef?.current?.repl?.stop) {
        // Fallback: si por alguna razón el estado dice que no está iniciado pero suena, detener directo.
        try { ctx.editorRef.current.repl.stop(); } catch {}
      }
    });
    setSessions((p) => [...p]);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center gap-3 px-3 py-2 text-[11px] font-mono bg-neutral-900/60 supports-[backdrop-filter]:backdrop-blur-md border-b border-neutral-800/60 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto flex-1 pr-2">
        {sessions.map((s) => {
          const active = s.id === activeId;
          const started = contextsRef.current.get(s.id)?.started;
          return (
            <div
              key={s.id}
              className={[
                'relative group flex items-center rounded-md ring-1 ring-inset transition-all border border-neutral-700/30',
                active ? 'ring-lime-400/40 bg-neutral-800/70 shadow-inner' : 'ring-neutral-700/40 bg-neutral-800/30 hover:bg-neutral-700/40'
              ].join(' ')}
            >
              <div className="w-1 h-7 rounded-l-md" style={{ background: s.color || '#666' }} />
              <button
                onClick={() => toggleSession(s.id)}
                disabled={!contextsRef.current.get(s.id)}
                className={[
                  'p-1 px-1.5 flex items-center justify-center transition-colors',
                  started
                    ? 'text-lime-300 hover:text-lime-200'
                    : 'text-neutral-400 hover:text-neutral-200',
                  !contextsRef.current.get(s.id) ? 'opacity-40 cursor-not-allowed' : ''
                ].join(' ')}
                title={started ? 'Detener canal' : 'Reproducir canal'}
              >
                {started ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setActiveId(s.id)}
                onDoubleClick={() => {
                  const newName = prompt('Nombre canal', s.name);
                  if (newName) renameSession(s.id, newName);
                }}
                className={[
                  'px-2 py-1 pr-3 rounded-r-md transition-colors flex items-center gap-2 select-none',
                  active
                    ? 'text-neutral-50'
                    : 'text-neutral-300 hover:text-white'
                ].join(' ')}
              >
                <span className="tracking-tight font-medium line-clamp-1 max-w-[90px] text-left">{s.name}</span>
                {started && (
                  <span className="w-2 h-2 rounded-full bg-lime-400 shadow-[0_0_6px_2px_rgba(163,230,53,0.6)] animate-pulse" />
                )}
              </button>
              {sessions.length > 1 && (
                <button
                  onClick={() => removeSession(s.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neutral-900/90 backdrop-blur text-neutral-400 hover:text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  title="Cerrar canal"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
        </div>
        <button
          onClick={addSession}
          className="ml-1 p-2 rounded-md bg-neutral-800/50 text-neutral-300 hover:text-white hover:bg-neutral-700/70 transition-colors ring-1 ring-neutral-700/40"
          title="Nuevo canal"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
        <div className="ml-auto flex gap-2 pr-1 items-center">
          <button
            onClick={playAll}
            disabled={contextsRef.current.size === 0}
            className={[
              'h-7 w-7 rounded-full flex items-center justify-center transition-all border',
              contextsRef.current.size === 0
                ? 'border-neutral-700/40 text-neutral-600 cursor-not-allowed'
                : 'border-lime-400/30 text-lime-300 hover:text-lime-100 hover:border-lime-300 hover:shadow-[0_0_0_2px_rgba(163,230,53,0.25)] bg-neutral-800/40'
            ].join(' ')}
            title="Reproducir todos"
          >
            <PlayIcon className="w-4 h-4" />
          </button>
          <button
            onClick={stopAll}
            disabled={contextsRef.current.size === 0}
            className={[
              'h-7 w-7 rounded-full flex items-center justify-center transition-all border',
              contextsRef.current.size === 0
                ? 'border-neutral-700/40 text-neutral-600 cursor-not-allowed'
                : 'border-red-400/30 text-red-300 hover:text-red-100 hover:border-red-300 hover:shadow-[0_0_0_2px_rgba(248,113,113,0.25)] bg-neutral-800/40'
            ].join(' ')}
            title="Detener todos"
          >
            <PauseIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden">
    {sessions.map((s) => (
          <Session
            key={s.id}
            session={s}
            active={s.id === activeId}
            registerContext={registerContext}
            initialCode={s.code}
      updateCode={updateSessionCode}
          />
        ))}
      </div>
    </div>
  );
}
