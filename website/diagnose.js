// Script de diagnóstico para ver por qué siempre usa API fallback
console.log('🔍 Diagnosticando problema de API fallback...\n');

async function diagnose() {
  try {
    console.log('1️⃣ Probando conexión a BD directamente...');
    
    // Importar directamente las funciones de BD
    const { saveScript, listScripts } = await import('./src/server/db.js');
    
    console.log('✅ Funciones de BD importadas correctamente');
    
    // Probar listScripts
    const scripts = await listScripts(5);
    console.log(`📊 Scripts en BD: ${scripts.length}`);
    scripts.forEach(s => console.log(`   - ${s.id}: ${s.title}`));
    
    console.log('\n2️⃣ Probando saveScript...');
    const testScript = {
      title: 'Test Diagnóstico',
      code: 'sound("bd")',
      description: 'Test desde diagnóstico',
      tags: ['test', 'diagnostic']
    };
    
    const saved = await saveScript(testScript);
    console.log(`✅ Script guardado: ${saved.id}`);
    
    console.log('\n3️⃣ Probando endpoint sync-beats...');
    const response = await fetch('http://localhost:4321/api/sync-beats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        beats: ['test beat diagnostic'],
        storageKey: 'diagnostic_test'
      })
    });
    
    console.log(`📡 Respuesta del endpoint: ${response.status}`);
    const result = await response.json();
    console.log('📄 Contenido:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔧 Solución: El servidor no está corriendo. Ejecuta: pnpm dev');
    } else if (error.message.includes('fetch')) {
      console.log('🔧 Solución: Problema de red. Verifica que el servidor esté en http://localhost:4321');
    } else {
      console.log('🔧 Problema en BD. Verifica que Docker esté corriendo: docker-compose up -d');
    }
  }
}

diagnose().then(() => {
  console.log('\n🏁 Diagnóstico completado');
}).catch(error => {
  console.error('💥 Error fatal en diagnóstico:', error);
});
