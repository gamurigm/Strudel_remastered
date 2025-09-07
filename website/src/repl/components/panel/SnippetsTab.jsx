import { useState } from 'react';
import { DEFAULT_SNIPPETS, insertSnippet } from '../../snippets/snippets.js';

export function SnippetsTab({ context }) {
  const [query, setQuery] = useState('');
  const snippets = DEFAULT_SNIPPETS.filter(s => s.label.toLowerCase().includes(query.toLowerCase()));

  const insert = (code) => insertSnippet(context.editorRef, code);

  return (
    <div className="p-3 space-y-3 text-[11px] font-mono">
      <div className="flex gap-2 items-center">
        <input
          placeholder="buscar…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-neutral-900/60 border border-neutral-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-lime-400"
        />
      </div>
      <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {snippets.map(s => (
          <li key={s.id} className="group relative">
            <button
              onClick={() => insert(s.code)}
              className="w-full text-left bg-neutral-800/50 hover:bg-neutral-700/60 border border-neutral-700/40 rounded px-2 py-2 flex flex-col gap-1 transition-colors"
              title="Insertar snippet"
            >
              <span className="text-neutral-200 font-semibold tracking-tight flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-lime-400 group-hover:scale-125 transition-transform" />
                {s.label}
              </span>
              <code className="text-[10px] text-neutral-400 whitespace-pre-line leading-snug line-clamp-5">
                {s.code}
              </code>
            </button>
          </li>
        ))}
        {!snippets.length && <li className="text-neutral-500 italic">Sin resultados…</li>}
      </ul>
      <p className="text-[10px] text-neutral-500 pt-2">Doble click en un canal para renombrarlo. Los snippets se añaden al final.</p>
    </div>
  );
}
