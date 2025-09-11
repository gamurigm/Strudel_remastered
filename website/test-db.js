import { Pool } from 'pg';

// Probar diferentes configuraciones de conexión
const configs = [
  {
    name: 'Config 1 (hardcoded)',
    host: '127.0.0.1',
    port: 5433,
    database: 'strudel',
    user: 'postgres',
    password: 'pass'
  },
  {
    name: 'Config 2 (sin password)',
    host: '127.0.0.1',
    port: 5433,
    database: 'strudel',
    user: 'postgres',
    password: ''
  },
  {
    name: 'Config 3 (postgres default)',
    host: '127.0.0.1',
    port: 5433,
    database: 'postgres',
    user: 'postgres',
    password: 'pass'
  }
];

async function testConnection(config) {
  console.log(`\n🔍 Probando ${config.name}:`);
  console.log(`   Host: ${config.host}:${config.port}`);
  console.log(`   DB: ${config.database}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Pass: ${config.password ? '***' : '(empty)'}`);
  
  const pool = new Pool({ ...config, max: 1 });
  
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    console.log('   ✅ Conexión exitosa!');
    console.log(`   📋 Versión: ${result.rows[0].version.split(' ').slice(0,3).join(' ')}`);
    
    // Probar si existe la tabla scripts
    try {
      const tableCheck = await client.query('SELECT COUNT(*) FROM scripts');
      console.log(`   📊 Tabla scripts: ${tableCheck.rows[0].count} registros`);
    } catch (e) {
      console.log(`   ⚠️  Tabla scripts: ${e.message}`);
    }
    
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    await pool.end();
    return false;
  }
}

async function main() {
  console.log('🔌 Probando conexiones a Postgres...\n');
  
  for (const config of configs) {
    const success = await testConnection(config);
    if (success) {
      console.log('\n🎉 Configuración correcta encontrada!');
      break;
    }
  }
}

main().catch(console.error);
