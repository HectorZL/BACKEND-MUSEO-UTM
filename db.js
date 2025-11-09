import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Configuración para conectar a Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
  },
});

export default {
  query: (text, params) => pool.query(text, params),
};