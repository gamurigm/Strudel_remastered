// API endpoint para limpiar registros duplicados en la base de datos
import { listScripts, deleteScript } from '../../server/db.js';

export const prerender = false;

export async function POST({ request }) {
  try {
    const { storageKey = 'welcomeBeatsV1', dryRun = false } = await request.json();
    
    console.log(`🧹 ${dryRun ? 'SIMULANDO' : 'EJECUTANDO'} limpieza de duplicados para ${storageKey}...`);
    
    // Obtener todos los scripts para este storageKey
    const allScripts = await listScripts(500);
    const scriptsForKey = allScripts.filter(s => s.tags && s.tags.includes(storageKey));
    
    console.log(`📊 Encontrados ${scriptsForKey.length} scripts para ${storageKey}`);
    
    // Agrupar por índice
    const byIndex = {};
    scriptsForKey.forEach(script => {
      const index = script.metadata?.index ?? 'sin-index';
      if (!byIndex[index]) byIndex[index] = [];
      byIndex[index].push(script);
    });
    
    let toDelete = [];
    let toKeep = [];
    
    Object.entries(byIndex).forEach(([index, scripts]) => {
      if (scripts.length > 1) {
        // Hay duplicados, mantener el más reciente
        const sorted = scripts.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        toKeep.push(sorted[0]); // Mantener el más reciente
        toDelete.push(...sorted.slice(1)); // Eliminar el resto
        console.log(`🔍 Índice ${index}: ${scripts.length} duplicados, manteniendo ID ${sorted[0].id}`);
      } else {
        toKeep.push(scripts[0]);
      }
    });
    
    console.log(`📋 Resumen:`);
    console.log(`  - Scripts a mantener: ${toKeep.length}`);
    console.log(`  - Scripts a eliminar: ${toDelete.length}`);
    
    if (!dryRun && toDelete.length > 0) {
      console.log(`🗑️ Eliminando ${toDelete.length} registros duplicados...`);
      
      for (const script of toDelete) {
        try {
          await deleteScript(script.id);
          console.log(`✅ Eliminado: ${script.id} (${script.title})`);
        } catch (error) {
          console.error(`❌ Error eliminando ${script.id}:`, error.message);
        }
      }
    }
    
    return new Response(JSON.stringify({
      ok: true,
      action: dryRun ? 'simulation' : 'cleanup',
      total: scriptsForKey.length,
      toKeep: toKeep.length,
      toDelete: toDelete.length,
      deleted: dryRun ? 0 : toDelete.length,
      duplicateGroups: Object.keys(byIndex).length,
      details: Object.entries(byIndex).map(([index, scripts]) => ({
        index,
        count: scripts.length,
        isDuplicate: scripts.length > 1
      }))
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
