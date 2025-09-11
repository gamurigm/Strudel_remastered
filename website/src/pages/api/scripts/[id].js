import { getScript, updateScript, deleteScript } from '@src/server/db.js';
export const prerender = false;

export async function GET({ params }) {
  try {
    const row = await getScript(params.id);
    if (!row) return json({ ok:false, error:'not found'},404);
    return json({ ok:true, data:row });
  } catch(e) {
    return json({ ok:false, error:e.message }, 500);
  }
}

export async function PATCH({ params, request }) {
  try {
    const body = await request.json();
    const updated = await updateScript(params.id, body);
    if (!updated) return json({ ok:false, error:'not found'},404);
    return json({ ok:true, data:updated });
  } catch(e) {
    return json({ ok:false, error:e.message }, 500);
  }
}

export async function DELETE({ params }) {
  try {
    await deleteScript(params.id);
    return json({ ok:true });
  } catch(e) {
    return json({ ok:false, error:e.message }, 500);
  }
}

function json(obj, status=200){
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type':'application/json' }});
}
