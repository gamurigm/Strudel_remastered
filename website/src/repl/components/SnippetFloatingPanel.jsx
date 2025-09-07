import { useEffect, useRef, useState } from 'react';
import Squares2X2Icon from '@heroicons/react/20/solid/Squares2X2Icon';
import XMarkIcon from '@heroicons/react/20/solid/XMarkIcon';
import cx from '@src/cx.mjs';
import { DEFAULT_SNIPPETS, insertSnippet } from '../snippets/snippets.js';

// Draggable floating snippet palette per session
export default function SnippetFloatingPanel({ context, sessionId }) {
  const storageKeyPos = `snippetPanelPos_${sessionId}`;
  const storageKeyOpen = `snippetPanelOpen_${sessionId}`;
  const [open, setOpen] = useState(true); // panel visible vs icon only
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState({ x: 12, y: 140 });
  const dragRef = useRef(null);
  const dragState = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [overrides, setOverrides] = useState({}); // { id: {label, code} }
  const [editingDraft, setEditingDraft] = useState({ label: '', code: '' });
  const OVERRIDES_KEY = 'snippetOverridesV1';

  // load overrides once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(OVERRIDES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') setOverrides(parsed);
      }
    } catch {}
  }, []);

  const saveOverrides = (next) => {
    setOverrides(next);
    try { localStorage.setItem(OVERRIDES_KEY, JSON.stringify(next)); } catch {}
  };
  // simpler panel (rollback to earlier style)

  // load saved state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKeyPos);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p?.x === 'number' && typeof p?.y === 'number') setPosition(p);
      }
    } catch {}
    try {
      const o = localStorage.getItem(storageKeyOpen);
      if (o != null) setOpen(o === '1');
    } catch {}
  // no collapsed state in simplified version
  }, [storageKeyPos, storageKeyOpen]);

  // persist
  useEffect(() => {
    try { localStorage.setItem(storageKeyPos, JSON.stringify(position)); } catch {}
  }, [position, storageKeyPos]);
  useEffect(() => {
    try { localStorage.setItem(storageKeyOpen, open ? '1' : '0'); } catch {}
  }, [open, storageKeyOpen]);
  // removed collapsed persistence

  // drag handlers
  useEffect(() => {
    const move = (e) => {
      if (!dragState.current) return;
      e.preventDefault();
      const { startX, startY, origX, origY } = dragState.current;
      const nx = origX + (e.clientX - startX);
      const ny = origY + (e.clientY - startY);
      const margin = 4;
      const el = dragRef.current;
      const rect = el?.getBoundingClientRect();
      const maxX = window.innerWidth - (rect?.width || 240) - margin;
      const maxY = window.innerHeight - (rect?.height || (open ? 320 : 48)) - margin;
      setPosition({ x: Math.min(Math.max(margin, nx), maxX), y: Math.min(Math.max(margin, ny), maxY) });
    };
    const up = () => { dragState.current = null; };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [open]);

  const startDrag = (e) => {
    const tag = e.target.tagName;
    if (['INPUT', 'BUTTON', 'TEXTAREA'].includes(tag) && open) return; // allow controls
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: position.x, origY: position.y };
  };

  const effective = DEFAULT_SNIPPETS.map(s => overrides[s.id] ? { ...s, ...overrides[s.id] } : s);
  const filtered = effective.filter(s => s.label.toLowerCase().includes(query.toLowerCase()));

  const startEdit = (id) => {
    const base = DEFAULT_SNIPPETS.find(s => s.id === id);
    const current = overrides[id];
    setEditingDraft({ label: current?.label || base?.label || '', code: current?.code || base?.code || '' });
    setEditingId(id);
  };
  const cancelEdit = () => { setEditingId(null); };
  const commitEdit = (id, draft) => {
    const base = DEFAULT_SNIPPETS.find(s => s.id === id);
    if (!base) return cancelEdit();
    const cleaned = {
      label: (draft.label || base.label || '').trim() || base.label,
      code: draft.code || base.code,
    };
    const next = { ...overrides, [id]: cleaned };
    // if identical to default remove override
    if (cleaned.label === base.label && cleaned.code === base.code) {
      delete next[id];
    }
    saveOverrides(next);
    setEditingId(null);
  };

  return (
    <div
      ref={dragRef}
      onPointerDown={startDrag}
      className={cx('fixed z-[95] font-mono text-[11px] select-none', open ? 'w-64' : 'w-auto')}
      style={{ left: 0, top: 0, transform: `translate3d(${position.x}px, ${position.y}px,0)` }}
    >
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Snippets"
          className="group rounded-xl bg-neutral-900/70 border border-neutral-700/40 hover:border-lime-400/50 backdrop-blur px-3 py-2 flex items-center gap-2 text-neutral-300 hover:text-white shadow-lg"
        >
          <Squares2X2Icon className="w-5 h-5" />
          <span className="tracking-tight">snippets</span>
        </button>
      )}
      {open && (
        <div className="rounded-2xl border border-neutral-700/40 bg-neutral-900/80 backdrop-blur-md shadow-2xl flex flex-col h-[320px] overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-700/40 cursor-move select-none">
            <Squares2X2Icon className="w-4 h-4 text-lime-300" />
            <span className="uppercase tracking-wide text-[10px] text-neutral-300 flex-1">snippets</span>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-md hover:bg-white/10 text-neutral-400 hover:text-white"
              title="Cerrar"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="buscar…"
              className="w-full bg-neutral-800/60 border border-neutral-600/50 focus:border-lime-400 focus:ring-1 focus:ring-lime-400 rounded px-2 py-1 text-[11px] outline-none"
            />
          </div>
          <ul className="flex-1 overflow-y-auto px-2 space-y-1 pr-1 custom-scrollbar">
            {filtered.map(s => {
              const isEditing = editingId === s.id;
              if (isEditing) {
                return (
                  <li key={s.id} className="rounded-lg bg-neutral-800/60 border border-neutral-700/40 p-2 flex flex-col gap-2">
                    <input
                      value={editingDraft.label}
                      onChange={e => setEditingDraft(d => ({ ...d, label: e.target.value }))}
                      className="bg-neutral-900/60 border border-neutral-600/40 rounded px-2 py-1 text-[11px] outline-none focus:border-lime-400"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.ctrlKey) {
                          e.preventDefault();
                          commitEdit(s.id, editingDraft);
                        }
                      }}
                    />
                    <textarea
                      value={editingDraft.code}
                      onChange={e => setEditingDraft(d => ({ ...d, code: e.target.value }))}
                      rows={4}
                      className="bg-neutral-900/60 border border-neutral-600/40 rounded px-2 py-1 text-[11px] outline-none focus:border-lime-400 resize-vertical"
                      onKeyDown={(e) => {
                        // Allow normal Enter to create newline; use Ctrl/Cmd+Enter to save
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          commitEdit(s.id, editingDraft);
                        }
                      }}
                    />
                    <div className="flex justify-end gap-2 text-[11px]">
                      <button
                        onClick={() => commitEdit(s.id, editingDraft)}
                        className="px-2 py-1 rounded bg-lime-600/60 hover:bg-lime-500/70 text-white"
                      >OK</button>
                      <button
                        onClick={cancelEdit}
                        className="px-2 py-1 rounded bg-neutral-700/60 hover:bg-neutral-600/70 text-neutral-200"
                      >Cancelar</button>
                    </div>
                  </li>
                );
              }
              return (
                <li key={s.id}>
                  <button
                    onClick={() => insertSnippet(context.editorRef, s.code)}
                    onDoubleClick={() => startEdit(s.id)}
                    className="group w-full text-left rounded-lg bg-neutral-800/40 hover:bg-neutral-700/60 border border-neutral-700/30 px-2 py-1.5 transition-colors flex flex-col gap-1"
                    title="Doble click para editar"
                  >
                    <span className="text-neutral-200 font-semibold tracking-tight flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-lime-400 group-hover:scale-125 transition-transform" />
                      {s.label}
                    </span>
                    <code className="text-[10px] text-neutral-400 whitespace-pre-line leading-snug line-clamp-4">{s.code}</code>
                  </button>
                </li>
              );
            })}
            {!filtered.length && <li className="text-neutral-500 italic px-1 py-2">Sin resultados…</li>}
          </ul>
          <div className="px-3 py-1.5 text-[10px] text-neutral-500 border-t border-neutral-700/40 flex justify-between">
            <span>{filtered.length}/{DEFAULT_SNIPPETS.length}</span>
            <span>click = insertar</span>
          </div>
        </div>
      )}
    </div>
  );
}
