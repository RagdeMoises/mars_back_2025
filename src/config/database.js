const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

// Configuración con valores por defecto
const config = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tienda',
  password: process.env.DB_PASSWORD || '123',
  port: process.env.DB_PORT || 5433,
  connectionTimeoutMillis: 5000,
};

// console.log('Intentando conectar con configuración:', {
//   ...config,
//   password: config.password ? '***' : '(vacía)'
// });

const pool = new Pool(config);

// Función para probar conexión
const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Conexión exitosa a PostgreSQL');
    return true;
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    console.log('ℹ️  Solución: Verifica que:');
    console.log('1. PostgreSQL esté corriendo');
    console.log('2. Las credenciales en .env sean correctas');
    console.log('3. El usuario tenga permisos');
    return false;
  } finally {
    if (client) client.release();
  }
};

// Crear base de datos y tabla si no existen
const initializeDatabase = async () => {
  if (!(await testConnection())) return;

  try {
    // Crear base de datos si no existe
    await pool.query(`CREATE DATABASE ${config.database};`);
    console.log(`Base de datos ${config.database} creada`);
  } catch (err) {
    console.log(`Base de datos ${config.database} ya existe o no se pudo crear`);
  }

  // Crear tabla productos
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(255),
        titulo VARCHAR(255),
        stock INTEGER,
        precio_costo DECIMAL(10, 2),
        precio_minorista DECIMAL(10, 2),
        precio_especial DECIMAL(10, 2),
        precio_mayorista DECIMAL(10, 2),
        categoria VARCHAR(255),
        proveedor VARCHAR(255),
        ubicacion VARCHAR(255),
        estatus INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_productos_search ON productos 
        (titulo, sku, categoria);
    `);
    console.log('✅ Tabla "productos" verificada');
  } catch (err) {
    console.error('❌ Error al crear tabla:', err.message);
  }
};

initializeDatabase();

module.exports = pool;
