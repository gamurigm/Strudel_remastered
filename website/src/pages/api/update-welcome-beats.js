// API endpoint para sobrescribir la sección DEFAULT_BEATS en WelcomeBeats.jsx
// SOLO USO DEV. En producción devolverá 403.
import fs from 'fs/promises';
import path from 'path';

// Necesario en Astro cuando el sitio está en modo estático para permitir requests dinámicos
export const prerender = false;

export async function POST({ request }) {
  if (process.env.NODE_ENV === 'production') {
    return json({ ok: false, error: 'Disabled in production' }, 403);
  }
  try {
  let payload = {};
  try { payload = await request.json(); } catch { /* cuerpo vacío o inválido */ }
    let { beats } = payload;
    // Normalizar / sanitizar
    if (Array.isArray(beats)) {
      beats = beats.map(b => (typeof b === 'string' ? b : (b==null? '' : String(b)))).map(s => s.trim()).filter(s => s.length);
    }
    if (!Array.isArray(beats) || beats.length === 0) {
      return json({ ok: false, error: 'Formato inválido', debug: { received: payload, hint: 'Debe enviar {beats:["patron1","patron2"]}' } }, 400);
    }
    // Resolver ruta del archivo fuente (evitar duplicar 'website')
    const cwd = process.cwd();
    const primary = path.resolve(cwd, 'src', 'repl', 'components', 'panel', 'WelcomeBeats.jsx');
    const alt = path.resolve(cwd, 'website', 'src', 'repl', 'components', 'panel', 'WelcomeBeats.jsx');
    let targetPath = primary;
    try { await fs.access(primary); } catch { targetPath = alt; }
    let content;
    try {
      content = await fs.readFile(targetPath, 'utf8');
    } catch (e) {
      return json({ ok: false, error: 'No se pudo leer archivo', debug: { tried: [primary, alt], cwd, message: e.message } }, 500);
    }
  const start = '// <AUTO-DEFAULTS-START>';
  const end = '// <AUTO-DEFAULTS-END>';
    const startIdx = content.indexOf(start);
    const endIdx = content.indexOf(end);
    if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
      return json({ ok: false, error: 'Marcadores no encontrados' }, 500);
    }
  // Construir bloque nuevo
  const indent = '  ';
  const stamp = `// updated ${new Date().toISOString()}`;
  const newLines = [stamp, ...beats.map((b,i) => `${indent}\`${escapeTemplate(b)}\`${i < beats.length-1 ? ',' : ''}`)].join('\n');
  // localizar posición exacta entre marcadores dentro del array
  const startLineIdx = content.indexOf(start);
  const endLineIdx = content.indexOf(end);
  const before = content.slice(0, startLineIdx + start.length);
  const after = content.slice(endLineIdx); // incluye marcador END en adelante
  // Extraer prefijo hasta START (antes del marcador), y sufijo desde END
  // Reemplazar el contenido intermedio (líneas previas entre marcadores)
  const betweenRegex = new RegExp(`${escapeReg(start)}([\r\n]|.)*?${escapeReg(end)}`);
  const beforeChange = content;
  if (betweenRegex.test(content)) {
    content = content.replace(betweenRegex, `${start}\n${newLines}\n${end}`);
  } else {
    // fallback: insertar de nuevo el bloque completo dentro del array
    const arrayRegex = /const DEFAULT_BEATS = \[([\s\S]*?)\];/m;
    if (arrayRegex.test(content)) {
      content = content.replace(arrayRegex, (m) => `const DEFAULT_BEATS = [\n${start}\n${newLines}\n${end}\n];`);
    }
  }
  const changed = beforeChange !== content;
    try {
      await fs.writeFile(targetPath, content, 'utf8');
    } catch(e) {
      return json({ ok:false, error:'No se pudo escribir archivo', debug:{ targetPath, message:e.message } }, 500);
    }
  // Releer bloque final para confirmar
  let finalBlock = null;
  try {
    const reread = await fs.readFile(targetPath, 'utf8');
    const m2 = reread.match(new RegExp(`${escapeReg(start)}([\s\S]*?)${escapeReg(end)}`));
    if (m2) finalBlock = m2[1];
  } catch {}
  return json({ ok: true, path: targetPath, count: beats.length, changed, preview: beats.slice(0,3), finalBlock });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}

// GET: devuelve el bloque actual entre marcadores para verificación
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return json({ ok: false, error: 'Disabled in production' }, 403);
  }
  try {
    const cwd = process.cwd();
    const primary = path.resolve(cwd, 'src', 'repl', 'components', 'panel', 'WelcomeBeats.jsx');
    const alt = path.resolve(cwd, 'website', 'src', 'repl', 'components', 'panel', 'WelcomeBeats.jsx');
    let targetPath = primary;
    try { await fs.access(primary); } catch { targetPath = alt; }
    const content = await fs.readFile(targetPath, 'utf8');
    const start = '// <AUTO-DEFAULTS-START>';
    const end = '// <AUTO-DEFAULTS-END>';
    const betweenRegex = new RegExp(`${escapeReg(start)}([\s\S]*?)${escapeReg(end)}`);
    const m = content.match(betweenRegex);
    if (!m) return json({ ok:false, error:'Marcadores no encontrados' }, 500);
    const rawBlock = m[1];
    const lines = rawBlock.split('\n')
      .map(l => l.trim())
      .filter(l => l.startsWith('`') && l.endsWith('`') || l.startsWith('`') && l.endsWith('`,'));
    const beats = lines.map(l => l.replace(/`,?$/,'').replace(/^`/,''));
    return json({ ok:true, path: targetPath, count: beats.length, beats });
  } catch (e) {
    return json({ ok:false, error: e.message }, 500);
  }
}

function escapeTemplate(str) {
  return str.replace(/`/g, '\\`');
}

function escapeReg(str){
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
