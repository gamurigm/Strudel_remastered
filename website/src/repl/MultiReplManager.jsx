import { useState, useEffect, useRef, useCallback } from 'react';
import ReplEditor from './components/ReplEditor';
import { useReplContext } from './useReplContext';
import PlusIcon from '@heroicons/react/20/solid/PlusIcon';
import XMarkIcon from '@heroicons/react/20/solid/XMarkIcon';

const LS_KEY = 'strudelMultiReplsV1';

function createSession(channel, code = '') {
  return { id: crypto.randomUUID(), name: `Canal ${channel}`, code, channel };
}

function Session({ session, active, registerContext, initialCode }) {
  const ctx = useReplContext();
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
        if (live && live !== s.code) return { ...s, code: live };
        return s;
      }));
    }, 1500);
    return () => clearInterval(handle);
  }, []);

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

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center gap-1 px-2 py-1 text-xs font-mono bg-neutral-900/70 border-b border-neutral-700">
        {sessions.map((s) => {
          const active = s.id === activeId;
          return (
            <div key={s.id} className="relative group">
              <button
                onClick={() => setActiveId(s.id)}
                onDoubleClick={() => {
                  const newName = prompt('Nombre canal', s.name);
                  if (newName) renameSession(s.id, newName);
                }}
                className={[
                  'px-3 py-1 rounded-md transition-colors flex items-center gap-2',
                  active ? 'bg-neutral-700 text-white' : 'bg-neutral-800/40 text-neutral-300 hover:bg-neutral-700'
                ].join(' ')}
              >
                <span>{s.name}</span>
                {contextsRef.current.get(s.id)?.started && (
                  <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                )}
              </button>
              {sessions.length > 1 && (
                <button
                  onClick={() => removeSession(s.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/80 text-neutral-400 hover:text-white flex items-center justify-center text-[10px]"
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
        <div className="ml-auto text-[10px] text-neutral-500 flex gap-3 pr-2">
          <span>Múltiples canales</span>
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
