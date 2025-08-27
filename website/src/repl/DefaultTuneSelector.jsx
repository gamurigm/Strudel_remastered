import React, { useEffect, useState } from 'react';
import './Repl.css';

// A small selector UI that lists available .mjs files discovered by import.meta.glob
// and allows choosing one to set as default via location.search ?default=<name>

const sessionGlobs = import.meta.glob('../**/*.mjs', { query: '?raw', import: 'default' });

export default function DefaultTuneSelector({ onSelect }) {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState('');

  const [keyMap, setKeyMap] = useState({});
  useEffect(() => {
    const orig = Object.keys(sessionGlobs);
    const labels = orig.map((k) => k.replace(/^\.\./, ''));
    const map = {};
    labels.forEach((label, i) => (map[label] = orig[i]));
    setKeyMap(map);
    setList(labels.sort());
    console.debug('DefaultTuneSelector: found sessions', labels.sort());
  }, []);

  const stripExports = (src) => {
    if (!src) return src;
    src = src.replace(/^\s*```(?:javascript)?\n/, '');
    src = src.replace(/\n```\s*$/, '');
    const fnRegex = /export\s+function\s+applySession\s*\([^)]*\)\s*\{/m;
    const fnMatch = src.match(fnRegex);
    if (fnMatch) {
      const start = fnMatch.index;
      const braceIndex = src.indexOf('{', start + fnMatch[0].length - 1);
      if (braceIndex !== -1) {
        let depth = 1;
        let i = braceIndex + 1;
        for (; i < src.length; i++) {
          const ch = src[i];
          if (ch === '{') depth++;
          else if (ch === '}') {
            depth--;
            if (depth === 0) break;
          }
        }
        if (i < src.length) {
          const inner = src.slice(braceIndex + 1, i);
          return inner.trim();
        }
      }
    }
    const lines = src.split('\n').filter((l) => !/^\s*export\s+/.test(l));
    return lines.join('\n').trim();
  };

  const apply = async () => {
    if (!selected) return;
    try {
      const key = keyMap[selected];
      if (!key) {
        console.warn('DefaultTuneSelector: no loader key for selected', selected);
        return;
      }
      const loader = sessionGlobs[key];
      if (!loader) {
        console.warn('DefaultTuneSelector: loader not found for key', key);
        return;
      }
      const raw = await loader();
      const cleaned = stripExports(raw);
      // update URL for persistence, but don't reload
      const name = selected.replace(/^\//, '').split('/').pop();
      const params = new URLSearchParams(window.location.search);
      params.set('default', name);
      const newUrl = window.location.pathname + '?' + params.toString();
      window.history.replaceState({}, '', newUrl);
      if (onSelect) onSelect(cleaned, name);
    } catch (e) {
      console.error('failed to load session', e);
    }
  };

  return (
    <div className="default-tune-selector" style={{ padding: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
      <label style={{ fontSize: 12 }}>Default tune:</label>
      <select value={selected} onChange={(e) => setSelected(e.target.value)} style={{ minWidth: 240 }}>
        <option value="">-- choose --</option>
        {list.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <button onClick={apply} disabled={!selected}>Set</button>
    </div>
  );
}
