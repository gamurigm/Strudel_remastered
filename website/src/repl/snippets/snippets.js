// Central snippet definitions reused by Header inline popover and panel tab.
// Keep labels in Spanish per earlier UI language.
export const DEFAULT_SNIPPETS = [
  { id: 'beat-basic', label: 'Beat básico', code: 'sound("bd*4, hh*8") | gain(0.9)' },
  { id: 'kick-caja', label: 'Kick + caja', code: 'sound("bd bd [~ cp] bd, hh(3,8)")' },
  { id: 'break-min', label: 'Break minimal', code: 'sound("bd*2 ~ [sd cp] ~ bd? cp").degradeBy(0.2)' },
  { id: 'poly-perc', label: 'Polirritmia perc', code: 'stack(\n  sound("bd(3,8)"),\n  sound("cp(5,8)"),\n  sound("hh(11,16)").fast(2)\n)' },
  { id: 'glitch-perc', label: 'Glitch perc', code: 'sound("[hh*4,~]*2 <sd ~ sd sd> [rim*2 ~]").degradeBy(0.35).sometimesBy(0.3, fast(2))' },
  { id: 'bass-minor', label: 'Bajo menor', code: 'note("0 0 3 5 7 5 3 0").scale("minor").sound("bass").slow(2)' },
  { id: 'pad-chords', label: 'Pad acordes', code: 'chord("i iv ii v").scale("dorian").slow(4)\n  .spread(0.15)\n  .sound("pad").gain(0.7)' },
  { id: 'arp', label: 'Arpegio', code: 'arp("i iii v vii").scale("aeolian").slow(2).sound("pluck")' },
  { id: 'mel-gen', label: 'Melodía gen', code: 'note("[0 2 4 7] <5 7 9>").scale("mixolydian")\n  .struct("x(3,5)")\n  .rand(0.2)\n  .sound("saw").gain(0.6)' },
  { id: 'ambient-choir', label: 'Choir ambient', code: 'sound("choir ~ choir ~").slow(4)\n  .room(0.9).size(0.95).shape(0.3)\n  .sometimes(rev)' },
  { id: 'hihat-filter', label: 'Hi-hat filtro', code: 'sound("hh*16").cutoff(range(400,4000).slow(8)).resonance(0.7)' },
  { id: 'prob-var', label: 'Prob variación', code: 'sound("bd cp? [cp ~] bd? <cp ~>").degradeBy(0.25).sometimesBy(0.2, ply(2))' },
  { id: 'sidechain', label: 'Sidechain', code: 'stack(\n  sound("pad*2").slow(2).gain(range(0.4,1).slow(4)),\n  sound("bd*4")\n)' },
  { id: 'euclid-multi', label: 'Euclídeo multi', code: 'stack(\n  sound("bd(3,8)"),\n  sound("sd(5,16)"),\n  sound("hh(11,16)").fast(2)\n)' },
  { id: 'seeded', label: 'Seed fijo', code: 'seed(42); sound("bd*4 cp*2 hh*8").rand(0.3)' },
];

export function insertSnippet(editorRef, code) {
  const ed = editorRef?.current;
  if (!ed) return;
  const snippetBlock = (code || '').replace(/\s+$/,'');

  // Si estamos en modo multi (MultiReplManager expone función global), usarla y salir.
  if (typeof window !== 'undefined' && typeof window.__strudelAppendActive === 'function') {
    const ok = window.__strudelAppendActive(snippetBlock, editorRef);
    if (ok) return;
    // si no logró localizar el editor correcto, seguimos con inserción local
  }

  // Modo CodeMirror directo: APPEND únicamente (no reescribir todo) para no perder contenido previo.
  const view = ed.view;
  const doc = view?.state?.doc;
  if (view && doc) {
    const before = doc.toString();
    const empty = !before.trim() || before.trim() === '// LOADING';
    let insertText;
    if (empty) insertText = snippetBlock;
    else if (before.endsWith('\n\n')) insertText = snippetBlock;
    else if (before.endsWith('\n')) insertText = '\n' + snippetBlock;
    else insertText = '\n\n' + snippetBlock;

    const fromPos = doc.length;
    view.dispatch({
      changes: { from: fromPos, to: fromPos, insert: insertText },
      selection: { anchor: fromPos + insertText.length }
    });

    // Actualizar cache interna (si existe) tras el tick de actualización del doc
    setTimeout(() => {
      try { if ('code' in ed) ed.code = view.state.doc.toString(); } catch {}
    }, 0);

    const sc = view.scrollDOM;
    if (sc) setTimeout(() => { sc.scrollTop = sc.scrollHeight; }, 25);
    return;
  }

  // Fallback: editor sin view -> usar get/setCode
  try {
    const base = ed.getCode?.() || '';
    const empty = !base.trim() || base.trim() === '// LOADING';
    let next;
    if (empty) next = snippetBlock;
    else if (base.endsWith('\n\n')) next = base + snippetBlock;
    else if (base.endsWith('\n')) next = base + '\n' + snippetBlock;
    else next = base + '\n\n' + snippetBlock;
    ed.setCode?.(next);
  } catch (e) {
    console.warn('insertSnippet fallback error:', e);
  }
}

// ---- User Snippets Persistence ----
const USER_SNIPPETS_KEY = 'userSnippetsV1';

export function loadUserSnippets() {
  try {
    const raw = localStorage.getItem(USER_SNIPPETS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.filter(s => s && s.id && typeof s.code === 'string');
  } catch {}
  return [];
}

export function saveUserSnippets(list) {
  try { localStorage.setItem(USER_SNIPPETS_KEY, JSON.stringify(list)); } catch {}
}

export function getAllSnippets(userSnips = []) {
  return [...userSnips, ...DEFAULT_SNIPPETS];
}
