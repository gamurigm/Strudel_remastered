// Simple loader: import session file as raw text and export a cleaned defaultTune string
// This strips `export` lines and, if present, extracts the inner body of `export function applySession() { ... }`
import sessionRaw from "./live-sessions/omalley.mjs?raw";

function stripExports(src) {
  if (!src) return src;
  // remove common markdown fences
  src = src.replace(/^\s*```(?:javascript)?\n/, '');
  src = src.replace(/\n```\s*$/, '');

  // If the file exports an applySession function, extract its inner body
  const fnRegex = /export\s+function\s+applySession\s*\([^)]*\)\s*\{/m;
  const fnMatch = src.match(fnRegex);
  if (fnMatch) {
    const start = fnMatch.index;
    const braceIndex = src.indexOf('{', start + fnMatch[0].length - 1);
    if (braceIndex !== -1) {
      // find matching closing brace
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

  // Otherwise, remove any lines that start with `export ` and return the rest
  const lines = src.split('\n').filter((l) => !/^\s*export\s+/.test(l));
  return lines.join('\n').trim();
}

const cleaned = stripExports(sessionRaw);

export const defaultTune = cleaned || `// fallback: simple tune\nsetcps(1); n(\"0\").s(\"sine\").gain(.1).out();`;
