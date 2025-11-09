// Carga las variables de entorno de .env al inicio
import 'dotenv/config';

// Importaciones de módulos
import express from 'express';
import path, { dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch'; // <-- Necesario para Node < 18
import db from './db.js'; // Nuestro módulo de conexión a la BD
import multer from 'multer';

// --- Configuración Inicial ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// --- Configurar Sirv y Multer ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// El cliente de Sirv se autentica al iniciarse
const sirvAccount = process.env.SIRV_ACCOUNT_NAME;
const sirvClientId = process.env.SIRV_CLIENT_ID;
const sirvClientSecret = process.env.SIRV_CLIENT_SECRET;

// --- Middlewares Globales ---
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acceso denegado. No se proveyó token.' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido.' });
  }
};



const uploadToSirv = async (fileBuffer, originalname, folder) => {
  const safeFilename = basename(originalname).replace(/[^a-zA-Z0-9._-]/g, '');
  const sirvPath = `/${folder}/${Date.now()}-${safeFilename}`;

  try {
    // Autenticar el cliente de Sirv (obtiene un token)
    const tokenRes = await fetch('https://api.sirv.com/v2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: sirvClientId,
        clientSecret: sirvClientSecret,
      }),
    });
    const { token } = await tokenRes.json();
    if (!token) throw new Error('Error al obtener token de Sirv.');
    const uploadRes = await fetch(
      `https://api.sirv.com/v2/files/upload?filename=${sirvPath}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fileBuffer,
      }
    );
    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Error al subir archivo a Sirv: ${errText}`);
    }

    return `https://${sirvAccount}.sirv.com${sirvPath}`;
  } catch (error) {
    console.error('Error subiendo a Sirv:', error.message);
    throw new Error('Fallo la subida de archivo a Sirv.');
  }

};



// ===========================================
// RUTAS DE AUTENTICACIÓN (Públicas)
// ===========================================

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre, apellido, email, password, rol } = req.body;
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await db.query(
      'INSERT INTO usuarios_admin (nombre, apellido, email, password_hash, rol) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, rol',
      [nombre, apellido, email, password_hash, rol]
    );
    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al registrar usuario', details: err.message });
  }
});

// POST /api/auth/login
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
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// ===========================================
// RUTAS PÚBLICAS (Para la Galería 3D)
// ===========================================

// GET /api/ping
app.get('/api/ping', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Servidor activo',
    timestamp: new Date().toISOString()
  });
});

// GET /api/obras
app.get('/api/obras', async (req, res) => {
  try {
    const query = `
      SELECT 
        o.*, 
        a.nombre AS autor_nombre, 
        a.apellido AS autor_apellido,
        a.ocupacion AS autor_rol, 
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

// GET /api/autores, colecciones, exhibiciones
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

// POST /api/admin/obras
app.post('/api/admin/obras', authMiddleware, upload.single('imagen_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'El archivo de imagen es requerido' });
    }

    // --- ¡CAMBIO! Llamar a uploadToSirv ---
    const imageUrl = await uploadToSirv(
      req.file.buffer, 
      req.file.originalname, 
      'galeria-museo-obras'
    );

    const { titulo, descripcion, tecnica, tamano, fecha_creacion, autor_id, coleccion_id } = req.body;
    
    const newObra = await db.query(
      `INSERT INTO obras (titulo, descripcion, tecnica, tamano, fecha_creacion, imagen_url, autor_id, coleccion_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [titulo, descripcion, tecnica, tamano, fecha_creacion, imageUrl, autor_id, coleccion_id]
    );
    res.status(201).json(newObra.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/obras/:id
app.put('/api/admin/obras/:id', authMiddleware, upload.single('imagen_file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, tecnica, tamano, fecha_creacion, autor_id, coleccion_id } = req.body;
    
    let imageUrl;
    
    if (req.file) {
      // --- ¡CAMBIO! Llamar a uploadToSirv ---
      imageUrl = await uploadToSirv(
        req.file.buffer, 
        req.file.originalname, 
        'galeria-museo-obras'
      );
    }

    let updatedObra;
    if (imageUrl) {
      updatedObra = await db.query(
        `UPDATE obras SET titulo=$1, descripcion=$2, tecnica=$3, tamano=$4, fecha_creacion=$5, autor_id=$6, coleccion_id=$7, imagen_url=$8 
         WHERE id=$9 RETURNING *`,
        [titulo, descripcion, tecnica, tamano, fecha_creacion, autor_id, coleccion_id, imageUrl, id]
      );
    } else {
      updatedObra = await db.query(
        `UPDATE obras SET titulo=$1, descripcion=$2, tecnica=$3, tamano=$4, fecha_creacion=$5, autor_id=$6, coleccion_id=$7
         WHERE id=$8 RETURNING *`,
        [titulo, descripcion, tecnica, tamano, fecha_creacion, autor_id, coleccion_id, id]
      );
    }
    
    if (updatedObra.rows.length === 0) return res.status(404).json('Obra no encontrada');
    res.json(updatedObra.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// DELETE /api/admin/obras/:id
app.delete('/api/admin/obras/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM obras_exhibiciones WHERE obra_id = $1', [id]);
    const deleteOp = await db.query('DELETE FROM obras WHERE id = $1 RETURNING *', [id]);
    
    if (deleteOp.rows.length === 0) {
      return res.status(404).json('Obra no encontrada');
    }
    res.json({ message: 'Obra eliminada', obra: deleteOp.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// --- AUTORES ---

// POST /api/admin/autores
app.post('/api/admin/autores', authMiddleware, upload.single('foto_file'), async (req, res) => {
  try {
    const { nombre, apellido, ocupacion } = req.body;
    let fotoUrl = null; 

    if (req.file) {
      // --- ¡CAMBIO! Llamar a uploadToSirv ---
      fotoUrl = await uploadToSirv(
        req.file.buffer, 
        req.file.originalname, 
        'galeria-museo-autores'
      );
    }
    
    const newAutor = await db.query(
      'INSERT INTO autores (nombre, apellido, ocupacion, foto_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, apellido, ocupacion, fotoUrl]
    );
    res.status(201).json(newAutor.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// PUT /api/admin/autores/:id
app.put('/api/admin/autores/:id', authMiddleware, upload.single('foto_file'), async (req, res) => {
   try {
    const { id } = req.params;
    const { nombre, apellido, ocupacion } = req.body;
    let fotoUrl;
    
    if (req.file) {
      // --- ¡CAMBIO! Llamar a uploadToSirv ---
      fotoUrl = await uploadToSirv(
        req.file.buffer, 
        req.file.originalname, 
        'galeria-museo-autores'
      );
    }

    let updatedAutor;
    if (fotoUrl) {
      updatedAutor = await db.query(
        'UPDATE autores SET nombre=$1, apellido=$2, ocupacion=$3, foto_url=$4 WHERE id=$5 RETURNING *',
        [nombre, apellido, ocupacion, fotoUrl, id]
      );
    } else {
      updatedAutor = await db.query(
        'UPDATE autores SET nombre=$1, apellido=$2, ocupacion=$3 WHERE id=$4 RETURNING *',
        [nombre, apellido, ocupacion, id]
      );
    }
    res.json(updatedAutor.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// DELETE /api/admin/autores/:id
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

// --- COLECCIONES (Sin cambios, solo texto) ---
app.post('/api/admin/colecciones', authMiddleware, async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const r = await db.query('INSERT INTO colecciones (nombre, descripcion) VALUES ($1, $2) RETURNING *', [nombre, descripcion]);
    res.status(201).json(r.rows[0]);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

app.put('/api/admin/colecciones/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    const r = await db.query('UPDATE colecciones SET nombre=$1, descripcion=$2 WHERE id=$3 RETURNING *', [nombre, descripcion, id]);
    res.json(r.rows[0]);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

app.delete('/api/admin/colecciones/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM colecciones WHERE id = $1', [id]);
    res.json({ message: 'Colección eliminada' });
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

// --- EXHIBICIONES (Sin cambios, solo texto) ---
app.post('/api/admin/exhibiciones', authMiddleware, async (req, res) => {
  try {
    const { nombre, descripcion, fecha_inicio, fecha_fin } = req.body;
    const r = await db.query('INSERT INTO exhibiciones (nombre, descripcion, fecha_inicio, fecha_fin) VALUES ($1, $2, $3, $4) RETURNING *', [nombre, descripcion, fecha_inicio, fecha_fin]);
    res.status(201).json(r.rows[0]);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

app.put('/api/admin/exhibiciones/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, fecha_inicio, fecha_fin } = req.body;
    const r = await db.query('UPDATE exhibiciones SET nombre=$1, descripcion=$2, fecha_inicio=$3, fecha_fin=$4 WHERE id=$5 RETURNING *', [nombre, descripcion, fecha_inicio, fecha_fin, id]);
    res.json(r.rows[0]);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

app.delete('/api/admin/exhibiciones/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM exhibiciones WHERE id = $1', [id]);
    res.json({ message: 'Exhibición eliminada' });
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});


// --- RELACIONES Obras <-> Exhibiciones ---
app.post('/api/admin/exhibiciones/:id/add-obra', authMiddleware, async (req, res) => {
  try {
    const { id: exhibicion_id } = req.params;
    const { obra_id } = req.body;
    const r = await db.query('INSERT INTO obras_exhibiciones (obra_id, exhibicion_id) VALUES ($1, $2) RETURNING *', [obra_id, exhibicion_id]);
    res.status(201).json(r.rows[0]);
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});

app.delete('/api/admin/exhibiciones/:id/remove-obra/:obra_id', authMiddleware, async (req, res) => {
  try {
    const { id: exhibicion_id, obra_id } = req.params;
    await db.query('DELETE FROM obras_exhibiciones WHERE obra_id = $1 AND exhibicion_id = $2', [obra_id, exhibicion_id]);
    res.json({ message: 'Relación eliminada' });
  } catch (err) { console.error(err.message); res.status(500).send('Error del servidor'); }
});


// ===========================================
// SERVIDOR DE ARCHIVOS ESTÁTICOS (Frontend)
// ===========================================
app.use(express.static(__dirname));


// Ruta "catch-all" que sirve el index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Manejador de Errores Global ---
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err.stack);
  res.status(500).send('¡Algo salió mal en el servidor!');
});

// --- Iniciar el Servidor ---
function startKeepAlive() {
  const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
  const minutes = 10;
  const interval = minutes * 60 * 1000; 
  
  console.log(`Configurando Keep-Alive para URL: ${RENDER_EXTERNAL_URL} cada ${minutes} minutos.`);

  setInterval(async () => {
    try {
      const response = await fetch(`${RENDER_EXTERNAL_URL}/api/ping`); 
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[Keep-Alive] Ping exitoso (${new Date().toLocaleTimeString()}) - ${data.message}`);
      } else {
        console.error(`[Keep-Alive] Fallo en el ping: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`[Keep-Alive] Error al hacer fetch: ${error.message}`);
    }
  }, interval);
}

if (process.env.VERCEL !== '1') {
  app.listen(port, () => {
    console.log(`Servidor en http://localhost:${port}`);
    startKeepAlive();
  });
}

// Exportar 'app' para Vercel/Render
export default app;