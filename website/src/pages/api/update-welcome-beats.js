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
    const indent = '  ';
    const newLines = beats.map(b => `${indent}\`${escapeTemplate(b)}\``).join('\n');
    // Reemplazar sólo el bloque entre marcadores conservando lo demás
    const regex = /const DEFAULT_BEATS = \[([\s\S]*?)\];/m;
    content = content.replace(regex, (match) => {
      return `const DEFAULT_BEATS = [\n${start}\n${newLines}\n${end}\n];`;
    });
    try {
      await fs.writeFile(targetPath, content, 'utf8');
    } catch(e) {
      return json({ ok:false, error:'No se pudo escribir archivo', debug:{ targetPath, message:e.message } }, 500);
    }
    return json({ ok: true, path: targetPath });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}

function escapeTemplate(str) {
  return str.replace(/`/g, '\\`');
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
