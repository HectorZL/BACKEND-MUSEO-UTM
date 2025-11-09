// ======================================================
// Carga las variables de entorno de .env al inicio
// ======================================================
import 'dotenv/config';

// ======================================================
// Importaciones de módulos
// ======================================================
import express from 'express';
import path, { dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fetch from 'node-fetch'; // <-- Necesario para Node < 18
import db from './db.js'; // Tu módulo de conexión PostgreSQL

// ======================================================
// Configuración inicial
// ======================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// ======================================================
// Configurar Multer para recibir archivos
// ======================================================
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ======================================================
// Configurar variables de Sirv
// ======================================================
const sirvAccount = process.env.SIRV_ACCOUNT_NAME;
const sirvClientId = process.env.SIRV_CLIENT_ID;
const sirvClientSecret = process.env.SIRV_CLIENT_SECRET;

// ======================================================
// Middleware global
// ======================================================
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

// ======================================================
// Middleware de autenticación JWT
// ======================================================
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
    res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

// ======================================================
// Helper: Subir archivo a Sirv (API oficial)
// ======================================================
const uploadToSirv = async (fileBuffer, originalname, folder) => {
  const safeFilename = basename(originalname).replace(/[^a-zA-Z0-9._-]/g, '');
  const sirvPath = `/${folder}/${Date.now()}-${safeFilename}`;

  try {
    // 1️⃣ Autenticar con la API de Sirv
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

    // 2️⃣ Subir el archivo
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

    // 3️⃣ Retornar URL pública
    return `https://${sirvAccount}.sirv.com${sirvPath}`;
  } catch (error) {
    console.error('Error subiendo a Sirv:', error.message);
    throw new Error('Fallo la subida de archivo a Sirv.');
  }
};

// ======================================================
// RUTAS DE AUTENTICACIÓN
// ======================================================
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

// ======================================================
// RUTAS PÚBLICAS
// ======================================================
app.get('/api/ping', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Servidor activo',
    timestamp: new Date().toISOString(),
  });
});

// Ejemplo de ruta pública: obtener obras
app.get('/api/obras', async (req, res) => {
  try {
    const query = `
      SELECT 
        o.*, 
        a.nombre AS autor_nombre, 
        a.apellido AS autor_apellido,
        c.nombre AS coleccion_nombre
      FROM obras o
      LEFT JOIN autores a ON o.autor_id = a.id
      LEFT JOIN colecciones c ON o.coleccion_id = c.id
      ORDER BY o.id ASC
    `;
    const obras = await db.query(query);
    res.json(obras.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// ======================================================
// RUTA ADMIN: subir obra con imagen a Sirv
// ======================================================
app.post(
  '/api/admin/obras',
  authMiddleware,
  upload.single('imagen_file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'El archivo de imagen es requerido' });
      }

      const imageUrl = await uploadToSirv(
        req.file.buffer,
        req.file.originalname,
        'galeria-museo-obras'
      );

      const { titulo, descripcion, tecnica, tamano, fecha_creacion, autor_id, coleccion_id } =
        req.body;

      const newObra = await db.query(
        `INSERT INTO obras (titulo, descripcion, tecnica, tamano, fecha_creacion, imagen_url, autor_id, coleccion_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [titulo, descripcion, tecnica, tamano, fecha_creacion, imageUrl, autor_id, coleccion_id]
      );

      res.status(201).json(newObra.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// ======================================================
// SERVIR ARCHIVOS ESTÁTICOS DEL FRONTEND
// ======================================================
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ======================================================
// Keep-alive (para Render)
// ======================================================
function startKeepAlive() {
  const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
  const minutes = 10;
  const interval = minutes * 60 * 1000;

  console.log(`Keep-Alive activo para: ${RENDER_EXTERNAL_URL} cada ${minutes} min.`);

  setInterval(async () => {
    try {
      const response = await fetch(`${RENDER_EXTERNAL_URL}/api/ping`);
      if (response.ok) {
        console.log(`[KeepAlive] OK ${new Date().toLocaleTimeString()}`);
      } else {
        console.error(`[KeepAlive] Falló: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`[KeepAlive] Error: ${error.message}`);
    }
  }, interval);
}

// ======================================================
// Iniciar servidor
// ======================================================
if (process.env.VERCEL !== '1') {
  app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
    startKeepAlive();
  });
}

export default app;
