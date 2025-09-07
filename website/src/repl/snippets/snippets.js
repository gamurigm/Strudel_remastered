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
  try {
    // Try primary getter
    let current = typeof ed.getCode === 'function' ? ed.getCode() : '';
    // Fallback to CodeMirror view
    if ((!current || current === '// LOADING') && ed.view?.state?.doc) {
      current = ed.view.state.doc.toString();
    }
    const snippetBlock = code;
    const next = !current || current === '// LOADING'
      ? snippetBlock
      : current.endsWith('\n')
        ? current + '\n' + snippetBlock
        : current + '\n\n' + snippetBlock;
    if (typeof ed.setCode === 'function') {
      ed.setCode(next);
    } else if (ed.view) {
      // Append via transaction
      const docLen = ed.view.state.doc.length;
      ed.view.dispatch({ changes: { from: docLen, to: docLen, insert: '\n' + snippetBlock } });
    }
    // If currently playing, re-evaluate automatically so user hears change
    try {
      if (ed.repl?.playing) {
        ed.evaluate?.();
      }
    } catch {}
  } catch (e) {
    // swallow
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
