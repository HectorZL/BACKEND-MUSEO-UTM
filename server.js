// Carga las variables de entorno de .env al inicio
import 'dotenv/config';

// Importaciones de módulos
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js'; // Nuestro módulo de conexión a la BD

// --- Configuración Inicial ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// --- Middlewares Globales ---
app.use(cors()); // Habilita CORS para el admin
app.use(express.json()); // Permite entender JSON en el body
app.use(express.urlencoded({ extended: true })); // Permite entender datos de formularios

// Cabeceras de seguridad
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// --- Middleware de Autenticación (JWT) ---
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acceso denegado. No se proveyó token.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Token inválido.' });
  }
};

// ===========================================
// RUTAS DE AUTENTICACIÓN (Públicas)
// ===========================================

// POST /api/auth/register (Crear admin inicial)
app.post('/api/auth/register', async (req, res) => {
  try {
    // NOTA: En producción, deberías proteger esta ruta para que nadie más pueda crear admins.
    const { nombre, apellido, cedula, email, password, rol } = req.body;
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await db.query(
      'INSERT INTO usuarios_admin (nombre, apellido, cedula, email, password_hash, rol) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, rol',
      [nombre, apellido, cedula, email, password_hash, rol]
    );
    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al registrar usuario', details: err.message });
  }
});

// POST /api/auth/login (Iniciar sesión)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userResult = await db.query('SELECT * FROM usuarios_admin WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// ===========================================
// RUTAS PÚBLICAS (Para la Galería 3D)
// ===========================================

// GET /api/obras
app.get('/api/obras', async (req, res) => {
  try {
    // Usamos LEFT JOIN para traer datos del autor y colección si existen
    const query = `
      SELECT 
        o.*, 
        a.nombre AS autor_nombre, 
        a.apellido AS autor_apellido,
        a.rol_academico AS autor_rol,
        c.nombre AS coleccion_nombre
      FROM obras o
      LEFT JOIN autores a ON o.autor_id = a.id
      LEFT JOIN colecciones c ON o.coleccion_id = c.id
      ORDER BY o.id ASC
    `;
    const allObras = await db.query(query);
    res.json(allObras.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// GET /api/obras/:id
app.get('/api/obras/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        o.*, 
        a.nombre AS autor_nombre, 
        a.apellido AS autor_apellido,
        c.nombre AS coleccion_nombre
      FROM obras o
      LEFT JOIN autores a ON o.autor_id = a.id
      LEFT JOIN colecciones c ON o.coleccion_id = c.id
      WHERE o.id = $1
    `;
    const obra = await db.query(query, [id]);
    if (obra.rows.length === 0) return res.status(404).json('Obra no encontrada');
    res.json(obra.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// GET /api/autores, colecciones, exhibiciones (Públicos si se necesitan)
app.get('/api/autores', async (req, res) => {
  const resDb = await db.query('SELECT * FROM autores ORDER BY nombre');
  res.json(resDb.rows);
});
app.get('/api/colecciones', async (req, res) => {
  const resDb = await db.query('SELECT * FROM colecciones ORDER BY nombre');
  res.json(resDb.rows);
});
app.get('/api/exhibiciones', async (req, res) => {
  const resDb = await db.query('SELECT * FROM exhibiciones ORDER BY fecha_inicio DESC');
  res.json(resDb.rows);
});

// ===========================================
// RUTAS DE ADMINISTRACIÓN (Protegidas)
// ===========================================

// --- OBRAS ---
app.post('/api/admin/obras', authMiddleware, async (req, res) => {
  try {
    // AHORA: Recibimos 'imagen_url' como texto directamente del body
    const { titulo, slug, descripcion, tecnica, tamano, fecha_creacion, autor_id, coleccion_id, imagen_url } = req.body;
    
    const newObra = await db.query(
      `INSERT INTO obras (titulo, slug, descripcion, tecnica, tamano, fecha_creacion, imagen_url, autor_id, coleccion_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [titulo, slug, descripcion, tecnica, tamano, fecha_creacion, imagen_url, autor_id, coleccion_id]
    );
    res.status(201).json(newObra.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/obras/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, slug, descripcion, tecnica, tamano, fecha_creacion, autor_id, coleccion_id, imagen_url } = req.body;
    
    const updatedObra = await db.query(
      `UPDATE obras SET titulo=$1, slug=$2, descripcion=$3, tecnica=$4, tamano=$5, fecha_creacion=$6, autor_id=$7, coleccion_id=$8, imagen_url=$9 
       WHERE id=$10 RETURNING *`,
      [titulo, slug, descripcion, tecnica, tamano, fecha_creacion, autor_id, coleccion_id, imagen_url, id]
    );
    
    if (updatedObra.rows.length === 0) return res.status(404).json('Obra no encontrada');
    res.json(updatedObra.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

app.delete('/api/admin/obras/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM obras WHERE id = $1', [id]);
    res.json({ message: 'Obra eliminada' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// --- AUTORES ---
app.post('/api/admin/autores', authMiddleware, async (req, res) => {
  try {
    const { nombre, apellido, rol_academico, foto_url } = req.body;
    const newAutor = await db.query(
      'INSERT INTO autores (nombre, apellido, rol_academico, foto_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, apellido, rol_academico, foto_url]
    );
    res.status(201).json(newAutor.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

app.put('/api/admin/autores/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, rol_academico, foto_url } = req.body;
    const updatedAutor = await db.query(
      'UPDATE autores SET nombre=$1, apellido=$2, rol_academico=$3, foto_url=$4 WHERE id=$5 RETURNING *',
      [nombre, apellido, rol_academico, foto_url, id]
    );
    res.json(updatedAutor.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

app.delete('/api/admin/autores/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM autores WHERE id = $1', [id]);
    res.json({ message: 'Autor eliminado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// --- COLECCIONES & EXHIBICIONES (Igual que antes, son solo texto) ---
app.post('/api/admin/colecciones', authMiddleware, async (req, res) => {
  const { nombre, descripcion } = req.body;
  const r = await db.query('INSERT INTO colecciones (nombre, descripcion) VALUES ($1, $2) RETURNING *', [nombre, descripcion]);
  res.status(201).json(r.rows[0]);
});
// ... (Resto de CRUD colecciones y exhibiciones igual que antes) ...

// ===========================================
// SERVIDOR DE ARCHIVOS ESTÁTICOS
// ===========================================
app.use(express.static(__dirname));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

if (process.env.VERCEL !== '1') {
  app.listen(port, () => console.log(`Servidor en http://localhost:${port}`));
}

export default app;