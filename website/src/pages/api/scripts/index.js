import { saveScript, listScripts } from '@src/server/db.js';
export const prerender = false;

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit')||'20',10),100);
    const data = await listScripts({ limit });
    return json({ ok:true, data });
  } catch(e) {
    return json({ ok:false, error:e.message }, 500);
  }
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    if (!body.code || typeof body.code !== 'string') return json({ ok:false, error:'code requerido'},400);
    const id = await saveScript({ title: body.title, code: body.code, description: body.description, tags: body.tags });
    return json({ ok:true, id });
  } catch(e) {
    return json({ ok:false, error:e.message }, 500);
  }
}

function json(obj, status=200){
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type':'application/json' }});
}
