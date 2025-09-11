// Script para migrar los scripts actuales de WelcomeBeats a la base de datos
import { syncDefaultBeatsToDatabase } from './src/utils/scriptsDB.js';

// Scripts actuales en DEFAULT_BEATS
const CURRENT_DEFAULT_BEATS = [
  `666lol`,
  `sound("hh bd")`,
  `.`,
  `hola ptu puto`
];

async function migrateCurrentBeats() {
  console.log('🚀 Iniciando migración de beats actuales a BD...');
  console.log(`📝 Scripts a migrar:`, CURRENT_DEFAULT_BEATS);
  
  try {
    const results = await syncDefaultBeatsToDatabase(CURRENT_DEFAULT_BEATS, 'welcomeBeatsV1');
    
    console.log('✅ Migración completada!');
    console.log(`📊 ${results.length} scripts guardados en BD:`);
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. ID: ${result.id} - "${CURRENT_DEFAULT_BEATS[index]}"`);
    });
    
    console.log('\n🎉 Ahora tus scripts se sincronizarán automáticamente con la base de datos!');
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrateCurrentBeats().then(() => {
  console.log('🏁 Proceso completado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
