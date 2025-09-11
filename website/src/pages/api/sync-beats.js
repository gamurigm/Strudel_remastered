// API endpoint para sincronizar WelcomeBeats con la base de datos
export const prerender = false;

// Importación dinámica para evitar errores de import
async function importDB() {
  try {
    const { saveScript, listScripts, updateScript } = await import('../../server/db.js');
    return { saveScript, listScripts, updateScript };
  } catch (error) {
    console.error('❌ Error importando funciones de BD:', error);
    throw new Error('BD no disponible: ' + error.message);
  }
}

// Función para sincronizar scripts con la BD (SIMPLIFICADA)
async function syncDefaultBeatsToDatabase(beats, storageKey = 'welcomeBeatsV1') {
  const { saveScript, listScripts } = await importDB();
  
  try {
    console.log(`📊 Sincronizando ${beats.length} beats con BD...`);
    
    const results = [];
    for (let index = 0; index < beats.length; index++) {
      const code = beats[index];
      const created = await saveScript({
        title: `Beat ${index + 1}`,
        code: code,
        description: `Script auto-generado desde WelcomeBeats`,
        tags: [storageKey, 'beat', 'auto-sync']
      });
      results.push(created);
    }
    
    console.log(`✅ Creados ${results.length} scripts en BD`);
    return results;
  } catch (error) {
    console.error('❌ Error sincronizando con BD:', error);
    throw error;
  }
}

// Función que REALMENTE actualiza o crea beats (SIN duplicados)
async function updateAllBeatsInDatabase(beats, storageKey = 'welcomeBeatsV1') {
  const { saveScript, updateScript, listScripts } = await importDB();
  
  try {
    console.log(`🔄 Sincronizando ${beats.length} beats en BD...`);
    
    // 1. Buscar registros existentes para este storageKey
    const existingScripts = await listScripts(500);
    const existingForKey = existingScripts.filter(s => 
      s.tags && s.tags.includes(storageKey)
    );
    
    // 2. Agrupar existentes por índice
    const existingByIndex = {};
    existingForKey.forEach(script => {
      const indexTag = script.tags ? script.tags.find(tag => tag.startsWith('index_')) : null;
      if (indexTag) {
        const index = parseInt(indexTag.split('_')[1]);
        if (!existingByIndex[index] || new Date(script.created_at) > new Date(existingByIndex[index].created_at)) {
          existingByIndex[index] = script;
        }
      }
    });
    
    console.log(`📊 Encontrados ${Object.keys(existingByIndex).length} beats existentes`);
    
    // 3. Para cada beat, decidir si UPDATE o INSERT
    const results = [];
    for (let index = 0; index < beats.length; index++) {
      const code = beats[index];
      const existing = existingByIndex[index];
      
      if (existing && existing.code === code) {
        // El código no cambió, no hacer nada
        console.log(`⏭️ Beat ${index}: sin cambios`);
        results.push(existing);
        continue;
      }
      
      if (existing) {
        // Actualizar registro existente
        console.log(`🔄 Beat ${index}: actualizando existente (ID: ${existing.id})`);
        const updated = await updateScript(existing.id, {
          code: code,
          description: `Beat ${index + 1} - Actualizado ${new Date().toLocaleString()}`,
          tags: [storageKey, 'beat', `index_${index}`]
        });
        results.push(updated);
      } else {
        // Crear nuevo registro
        console.log(`➕ Beat ${index}: creando nuevo`);
        const created = await saveScript({
          title: `${storageKey}_beat_${index}`,
          code: code,
          description: `Beat ${index + 1} - Creado ${new Date().toLocaleString()}`,
          tags: [storageKey, 'beat', `index_${index}`]
        });
        results.push(created);
      }
    }
    
    console.log(`✅ Procesados ${results.length} beats (sin duplicados)`);
    return results;
  } catch (error) {
    console.error('❌ Error sincronizando beats en BD:', error);
    throw error;
  }
}

// Función para cargar beats desde BD (busca los más recientes por índice)
async function loadBeatsFromDatabase(storageKey = 'welcomeBeatsV1') {
  const { listScripts } = await importDB();
  
  try {
    const scripts = await listScripts(200); // Más registros para encontrar los últimos
    const scriptsForKey = scripts.filter(s => s.tags && s.tags.includes(storageKey));
    
    if (scriptsForKey.length === 0) {
      console.log(`📖 No hay beats guardados para ${storageKey}`);
      return null;
    }
    
    // Agrupar por índice y tomar el más reciente de cada grupo
    const byIndex = {};
    scriptsForKey.forEach(script => {
      const indexTag = script.tags ? script.tags.find(tag => tag.startsWith('index_')) : null;
      if (indexTag) {
        const index = parseInt(indexTag.split('_')[1]);
        if (!byIndex[index] || new Date(script.created_at) > new Date(byIndex[index].created_at)) {
          byIndex[index] = script;
        }
      }
    });
    
    // Convertir a array ordenado por índice
    const beats = [];
    Object.keys(byIndex)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach(index => {
        beats.push(byIndex[index].code);
      });
    
    console.log(`📖 Cargados ${beats.length} beats únicos desde BD`);
    return beats.length > 0 ? beats : null;
  } catch (error) {
    console.error('❌ Error cargando beats desde BD:', error);
    return null;
  }
}

export async function GET({ url }) {
  const storageKey = url.searchParams.get('storageKey') || 'welcomeBeatsV1';
  
  try {
    const beats = await loadBeatsFromDatabase(storageKey);
    return new Response(JSON.stringify({
      ok: true,
      beats: beats,
      count: beats?.length || 0,
      source: 'database'
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST({ request }) {
  console.log('🔧 POST /api/sync-beats iniciado...');
  
  try {
    const body = await request.json();
    console.log('📨 Request body:', body);
    
    const { beats, storageKey = 'welcomeBeatsV1', action = 'sync' } = body;
    
    if (!beats || !Array.isArray(beats)) {
      console.error('❌ Datos inválidos:', { beats, type: typeof beats });
      return new Response(JSON.stringify({
        ok: false,
        error: 'Se requiere array de beats'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`💾 Intentando guardar ${beats.length} beats para ${storageKey}...`);
    
    // SIEMPRE usar la función inteligente que evita duplicados
    const results = await updateAllBeatsInDatabase(beats, storageKey);
    
    console.log(`✅ Éxito: ${results.length} beats guardados`);
    
    return new Response(JSON.stringify({
      ok: true,
      action: action,
      count: results.length,
      beats: beats,
      results: results.map(r => ({ id: r.id, title: r.title }))
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('💥 Error en POST /api/sync-beats:', error);
    
    return new Response(JSON.stringify({
      ok: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
