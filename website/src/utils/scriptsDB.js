// Utilidades para manejo de scripts en base de datos
import { saveScript, listScripts, updateScript, deleteScript } from '../server/db.js';

// Función para migrar/sincronizar scripts de DEFAULT_BEATS a la BD
export async function syncDefaultBeatsToDatabase(beats, storageKey = 'welcomeBeatsV1') {
  try {
    // Verificar si ya existen scripts para esta clave
    const existing = await listScripts(10);
    const existingForKey = existing.filter(s => s.tags && s.tags.includes(storageKey));
    
    console.log(`📊 Sincronizando ${beats.length} beats con BD...`);
    
    // Si no hay scripts existentes para esta clave, crear todos
    if (existingForKey.length === 0) {
      const promises = beats.map((code, index) => 
        saveScript({
          title: `Beat ${index + 1}`,
          code: code,
          description: `Script auto-generado desde WelcomeBeats`,
          tags: [storageKey, 'beat', 'auto-sync'],
          metadata: { index, source: 'DEFAULT_BEATS' }
        })
      );
      
      const results = await Promise.all(promises);
      console.log(`✅ Creados ${results.length} scripts en BD`);
      return results;
    } else {
      console.log(`ℹ️ Ya existen ${existingForKey.length} scripts para ${storageKey}`);
      return existingForKey;
    }
  } catch (error) {
    console.error('❌ Error sincronizando con BD:', error);
    throw error;
  }
}

// Función para guardar un beat específico
export async function saveBeatToDatabase(code, index, storageKey = 'welcomeBeatsV1') {
  try {
    const result = await saveScript({
      title: `Beat ${index + 1}`,
      code: code,
      description: `Script actualizado desde WelcomeBeats - ${new Date().toLocaleString()}`,
      tags: [storageKey, 'beat', 'live-update'],
      metadata: { index, source: 'LIVE_EDIT', updated: new Date().toISOString() }
    });
    
    console.log(`💾 Beat ${index + 1} guardado en BD:`, result.id);
    return result;
  } catch (error) {
    console.error(`❌ Error guardando beat ${index + 1}:`, error);
    throw error;
  }
}

// Función para actualizar todos los beats en BD
export async function updateAllBeatsInDatabase(beats, storageKey = 'welcomeBeatsV1') {
  try {
    console.log(`🔄 Actualizando ${beats.length} beats en BD...`);
    
    const promises = beats.map((code, index) => 
      saveBeatToDatabase(code, index, storageKey)
    );
    
    const results = await Promise.all(promises);
    console.log(`✅ Actualizados ${results.length} beats en BD`);
    return results;
  } catch (error) {
    console.error('❌ Error actualizando beats en BD:', error);
    throw error;
  }
}

// Función para cargar beats desde BD
export async function loadBeatsFromDatabase(storageKey = 'welcomeBeatsV1') {
  try {
    const scripts = await listScripts(50);
    const beats = scripts
      .filter(s => s.tags && s.tags.includes(storageKey))
      .sort((a, b) => (a.metadata?.index || 0) - (b.metadata?.index || 0))
      .map(s => s.code);
    
    console.log(`📖 Cargados ${beats.length} beats desde BD`);
    return beats.length > 0 ? beats : null;
  } catch (error) {
    console.error('❌ Error cargando beats desde BD:', error);
    return null;
  }
}
