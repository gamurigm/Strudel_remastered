import { useEffect, useState, useCallback, useRef } from 'react';
import { getViewingPatternData, setViewingPatternData } from '../../user_pattern_utils.mjs';
import { defaultTune } from '../defaultTune.mjs';

// Simple ID generator (avoids extra deps)
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const LS_KEY = 'strudelBuffersV1';
const MAX_BUFFERS = 9; // mimic Sonic Pi style (1..9)

/*
 BufferTabs - Simple multi-buffer system
 --------------------------------------
 Provides numbered buffers similar to Sonic Pi. Each buffer stores code
 and can be switched between. Uses single editor instance.
 Keyboard shortcuts: Alt + [1-9], Alt + ←/→
*/
export default function BufferTabs({ context }) {
  const { editorRef } = context || {};
  const [buffers, setBuffers] = useState([]); // [{id,name,code}]
  const [activeId, setActiveId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);

  // Load persisted buffers
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          setBuffers(parsed);
          setActiveId(parsed[0].id);
        }
      }
    } catch (_) {}
  }, []);

  // Ensure we have an initial buffer once the editor is ready & no buffers exist
  useEffect(() => {
    if (!buffers.length && editorRef?.current) {
      const first = { id: genId(), name: '1', code: defaultTune };
      setBuffers([first]);
      setActiveId(first.id);
      // Load defaultTune into editor if different
      try {
        const current = editorRef.current.getCode?.() || '';
        if (current !== defaultTune) {
          editorRef.current.setCode(defaultTune);
          updatePatternStore(defaultTune);
        }
      } catch (_) {}
    }
  }, [buffers.length, editorRef]);

  // Persist buffers
  useEffect(() => {
    if (buffers.length) {
      try { localStorage.setItem(LS_KEY, JSON.stringify(buffers)); } catch (_) {}
    }
  }, [buffers]);

  const updatePatternStore = useCallback((code) => {
    try {
      const currentPattern = getViewingPatternData?.();
      if (currentPattern) setViewingPatternData?.({ ...currentPattern, code });
    } catch (_) {}
  }, []);

  const saveCurrentBuffer = useCallback(() => {
    if (!activeId || !editorRef?.current) return;
    const codeNow = editorRef.current.getCode?.() || '';
    setBuffers((prev) => prev.map((b) => (b.id === activeId ? { ...b, code: codeNow } : b)));
  }, [activeId, editorRef]);

  const selectBuffer = (id) => {
    if (id === activeId) return;
    saveCurrentBuffer();
    const next = buffers.find((b) => b.id === id);
    if (next && editorRef?.current) {
      editorRef.current.setCode(next.code || '');
      updatePatternStore(next.code || '');
      setActiveId(id);
    }
  };

  const addBuffer = () => {
    if (buffers.length >= MAX_BUFFERS) return;
    saveCurrentBuffer();
    const nextIndex = buffers.length + 1;
    const buf = { id: genId(), name: String(nextIndex), code: '' };
    setBuffers((prev) => [...prev, buf]);
    setActiveId(buf.id);
    // clear editor for new buffer
    if (editorRef?.current) {
      editorRef.current.setCode('');
      updatePatternStore('');
    }
  };

  const removeBuffer = (id) => {
    if (buffers.length === 1) return; // keep at least one
    const idx = buffers.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const newBuffers = buffers.filter((b) => b.id !== id);
    setBuffers(newBuffers);
    // choose next active (previous buffer or first)
    const next = newBuffers[Math.max(0, idx - 1)];
    setActiveId(next.id);
    if (editorRef?.current) {
      editorRef.current.setCode(next.code || '');
      updatePatternStore(next.code || '');
    }
  };

  const renameBuffer = (id, name) => {
    setBuffers((prev) => prev.map((b) => (b.id === id ? { ...b, name: name.trim() || b.name } : b)));
  };

  // Autosave current buffer code periodically
  useEffect(() => {
    if (!editorRef?.current || !activeId) return;
    const interval = setInterval(() => {
      try {
        const live = editorRef.current.getCode?.() ?? '';
        setBuffers((prev) => prev.map((b) => (b.id === activeId && b.code !== live ? { ...b, code: live } : b)));
      } catch (_) {}
    }, 1000);
    return () => clearInterval(interval);
  }, [activeId, editorRef]);

  // Keyboard shortcuts Alt+1..9 and Alt+ArrowLeft/Right for cycling
  useEffect(() => {
    const handler = (e) => {
      if (!e.altKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= buffers.length) {
        e.preventDefault();
        selectBuffer(buffers[n - 1].id);
        return;
      }
      if (['ArrowLeft', 'ArrowRight'].includes(e.key) && buffers.length > 1) {
        e.preventDefault();
        const idx = buffers.findIndex((b) => b.id === activeId);
        if (idx === -1) return;
        const nextIdx = e.key === 'ArrowRight' ? (idx + 1) % buffers.length : (idx - 1 + buffers.length) % buffers.length;
        selectBuffer(buffers[nextIdx].id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [buffers, activeId]);

  if (!buffers.length) return null;

  return (
    <div
      className={[
        'fixed bottom-2 left-1/2 -translate-x-1/2 z-[95]',
        'flex items-center gap-1 px-2 py-1 rounded-xl',
        'backdrop-blur-sm bg-black/50 border border-white/10 shadow-lg',
        'text-[11px] font-mono text-white/80 select-none'
      ].join(' ')}
    >
      {buffers.map((b, i) => {
        const active = b.id === activeId;
        return (
          <div key={b.id} className={['relative group'].join(' ')}>
            {renamingId === b.id ? (
              <input
                autoFocus
                defaultValue={b.name}
                onBlur={(e) => { renameBuffer(b.id, e.target.value); setRenamingId(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { renameBuffer(b.id, e.currentTarget.value); setRenamingId(null); } }}
                className="w-12 px-1 py-0.5 rounded bg-white/10 border border-white/20 text-white text-[11px] outline-none"
              />
            ) : (
              <button
                title={`Buffer ${i+1} (Alt+${i+1})`}
                onClick={() => selectBuffer(b.id)}
                onDoubleClick={() => setRenamingId(b.id)}
                className={[
                  'px-2 py-1 rounded-md transition-colors',
                  active ? 'bg-lime-500/80 text-black shadow' : 'bg-white/10 hover:bg-white/20'
                ].join(' ')}
              >
                {b.name}
              </button>
            )}
            {buffers.length > 1 && (
              <button
                aria-label="close buffer"
                onClick={(e) => { e.stopPropagation(); removeBuffer(b.id); }}
                className={[
                  'absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full text-[10px]',
                  'bg-black/70 text-white/70 hover:text-white hover:bg-black/90 border border-white/20',
                  active ? 'opacity-70' : 'opacity-0 group-hover:opacity-70'
                ].join(' ')}
              >×</button>
            )}
          </div>
        );
      })}
      {buffers.length < MAX_BUFFERS && (
        <button
          aria-label="add buffer"
          title="Añadir buffer"
          onClick={addBuffer}
          className="ml-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition"
        >+
        </button>
      )}
      <div className="ml-2 flex gap-2 text-[10px] opacity-60">
        <span>Alt+1..9</span>
        <span>Alt+←/→</span>
      </div>
    </div>
  );
}
