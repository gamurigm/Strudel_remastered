import { useState, useEffect, useRef, useCallback } from 'react';
import ReplEditor from './components/ReplEditor';
import { useReplContext } from './useReplContext';
import PlusIcon from '@heroicons/react/20/solid/PlusIcon';
import XMarkIcon from '@heroicons/react/20/solid/XMarkIcon';
import PlayIcon from '@heroicons/react/20/solid/PlayIcon';
import PauseIcon from '@heroicons/react/20/solid/PauseIcon';
import { StrudelMPClient } from './multiplayer/client.mjs';

const LS_KEY = 'strudelMultiReplsV1';

function createSession(channel, code = '') {
  return { id: crypto.randomUUID(), name: `Canal ${channel}`, code, channel };
}

function Session({ session, active, registerContext, initialCode }) {
  // solo:false permite que múltiples sesiones reproduzcan simultáneamente
  const ctx = useReplContext({ solo: false });
  const injectedRef = useRef(false);

  // After editor init, inject stored code (once)
  useEffect(() => {
    if (!active && !session.code) return; // if inactive & empty skip
    const ed = ctx.editorRef.current;
    if (ed && !injectedRef.current) {
      try {
        const current = ed.getCode?.() || '';
        if (!current || current === '// LOADING') {
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

  return (
    <div
      className={[
        'absolute inset-0 transition-opacity',
        active ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      ].join(' ')}
    >
      <ReplEditor context={ctx} />
    </div>
  );
}

export default function MultiReplManager() {
  const [sessions, setSessions] = useState([]); // {id,name,code}
  const [activeId, setActiveId] = useState(null);
  const contextsRef = useRef(new Map());
  const mpRef = useRef();
  const suppressIncoming = useRef(false); // avoid echo loops

  // load sessions from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          setSessions(parsed);
          setActiveId(parsed[0].id);
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
    try { localStorage.setItem(LS_KEY, JSON.stringify(sessions)); } catch {}
  }, [sessions]);

  // periodic code snapshot
  useEffect(() => {
    const handle = setInterval(() => {
      setSessions((prev) => prev.map((s) => {
        const ctx = contextsRef.current.get(s.id);
        const live = ctx?.editorRef?.current?.getCode?.();
        if (live && live !== s.code) {
          // broadcast change (throttled by client)
          mpRef.current?.sendCode(s.id, live);
          return { ...s, code: live };
        }
        return s;
      }));
    }, 1500);
    return () => clearInterval(handle);
  }, []);

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
  const removeSession = (id) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) {
      setTimeout(() => {
        setActiveId((p) => {
          const remaining = sessions.filter((s) => s.id !== id);
            return remaining.length ? remaining[0].id : null;
        });
      }, 0);
    }
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
    sessions.forEach((s) => {
      const ctx = contextsRef.current.get(s.id);
      const mirror = ctx?.editorRef?.current;
      if (!ctx || !mirror) return;
      // asegurar que código persistido esté cargado si editor aún muestra placeholder
      try {
        if (mirror.code === '// LOADING' && s.code) {
          mirror.setCode(s.code);
        }
      } catch {}
      if (!ctx.started) {
        try { mirror.evaluate(); } catch (e) { console.warn('playAll evaluate fail', e); }
      }
    });
    setSessions((p) => [...p]); // refrescar indicadores
  };
  const stopAll = () => {
    sessions.forEach((s) => {
      const ctx = contextsRef.current.get(s.id);
      const mirror = ctx?.editorRef?.current;
      if (mirror?.repl?.stop) {
        try { mirror.repl.stop(); } catch {}
      }
    });
    setSessions((p) => [...p]); // refrescar indicadores
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center gap-1 px-2 py-1 text-xs font-mono bg-neutral-900/70 border-b border-neutral-700">
        {sessions.map((s) => {
          const active = s.id === activeId;
          const started = contextsRef.current.get(s.id)?.started;
          return (
            <div key={s.id} className="relative group flex items-center">
              <button
                onClick={() => toggleSession(s.id)}
                disabled={!contextsRef.current.get(s.id)}
                className={[
                  'p-1 rounded-l-md border-r flex items-center justify-center',
                  started ? 'bg-lime-600/70 text-white' : 'bg-neutral-800/40 text-neutral-300 hover:bg-neutral-600',
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
                  'px-2 py-1 rounded-r-md transition-colors flex items-center gap-2',
                  active ? 'bg-neutral-700 text-white' : 'bg-neutral-800/40 text-neutral-300 hover:bg-neutral-700'
                ].join(' ')}
              >
                <span>{s.name}</span>
                {started && (
                  <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                )}
              </button>
              {sessions.length > 1 && (
                <button
                  onClick={() => removeSession(s.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/80 text-neutral-400 hover:text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Cerrar canal"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
        <button
          onClick={addSession}
          className="ml-1 p-1 rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
          title="Nuevo canal"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
        <div className="ml-auto text-[10px] text-neutral-500 flex gap-2 pr-2 items-center">
          <button
            onClick={playAll}
            disabled={contextsRef.current.size === 0}
            className={[
              'px-2 py-1 rounded-md flex items-center gap-1',
              contextsRef.current.size === 0
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-neutral-700 text-white hover:bg-lime-600'
            ].join(' ')}
            title="Reproducir todos"
          >
            <PlayIcon className="w-3 h-3" /> Todos
          </button>
            <button
            onClick={stopAll}
            disabled={contextsRef.current.size === 0}
            className={[
              'px-2 py-1 rounded-md flex items-center gap-1',
              contextsRef.current.size === 0
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-neutral-800 text-neutral-300 hover:bg-red-600/80 hover:text-white'
            ].join(' ')}
            title="Detener todos"
          >
            <PauseIcon className="w-3 h-3" /> Todos
          </button>
          <span className="opacity-60">Canales simultáneos</span>
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
          />
        ))}
      </div>
    </div>
  );
}
