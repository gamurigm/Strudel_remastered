import { Pool } from 'pg';

const pool = new Pool({
  host: '127.0.0.1',
  port: 5433,
  database: 'strudel',
  user: 'postgres',
  password: 'pass',
  max: 5,
});

export async function query(text, params) {
  return pool.query(text, params);
}

export async function saveScript({ title, code, description, tags }) {
  const res = await query(
    'INSERT INTO scripts(title, code, description, tags) VALUES ($1,$2,$3,$4) RETURNING *',
    [title || null, code, description || null, tags || null]
  );
  return res.rows[0];
}

export async function listScripts(limit = 20) {
  const res = await query('SELECT * FROM scripts ORDER BY created_at DESC LIMIT $1', [limit]);
  return res.rows;
}

export async function getScript(id) {
  const res = await query('SELECT * FROM scripts WHERE id=$1', [id]);
  return res.rows[0] || null;
}

export async function updateScript(id, { title, code, description, tags }) {
  const res = await query(
    'UPDATE scripts SET title=COALESCE($2,title), code=COALESCE($3,code), description=COALESCE($4,description), tags=COALESCE($5,tags) WHERE id=$1 RETURNING *',
    [id, title || null, code || null, description || null, tags || null]
  );
  return res.rows[0];
}

export async function deleteScript(id) {
  await query('DELETE FROM scripts WHERE id=$1', [id]);
  return true;
}
