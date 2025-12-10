# Dependencias del Proyecto BACKEND-MUSEO-UTM

## Archivo `package.json`

El proyecto utiliza Node.js con módulos ES (`"type": "module"`).

---

## Dependencias de Producción

### Backend / Servidor
- **`express`** `^4.21.2` - Framework web para Node.js, maneja rutas HTTP y middleware
- **`cors`** `^2.8.5` - Middleware para habilitar CORS (Cross-Origin Resource Sharing)
- **`dotenv`** `^17.2.3` - Carga variables de entorno desde archivo `.env`

### Base de Datos
- **`pg`** `^8.16.3` - Cliente PostgreSQL para Node.js

### Autenticación y Seguridad
- **`bcryptjs`** `^3.0.3` - Encriptación de contraseñas con bcrypt
- **`jsonwebtoken`** `^9.0.2` - Generación y verificación de tokens JWT

### Manejo de Archivos
- **`multer`** `^2.0.2` - Middleware para subida de archivos multipart/form-data

### Utilidades
- **`node-fetch`** `^3.3.2` - Implementación de Fetch API para Node.js (necesario para Node < 18)

### Frontend
- **`three`** `^0.180.0` - Biblioteca JavaScript para gráficos 3D (Three.js)

---

## Dependencias de Desarrollo

- **`nodemon`** `^3.0.1` - Monitor automático de cambios que reinicia el servidor

---

## Requisitos del Sistema

- **Node.js**: `>= 16.0.0`

---

## Scripts Disponibles

```json
{
  "start": "node server.js",      // Inicia el servidor en modo producción
  "dev": "nodemon server.js",     // Inicia en modo desarrollo con auto-reload
  "build": "echo 'No build step required'"
}
```

---

## Instalación

Para instalar todas las dependencias, ejecuta:

```bash
npm install
```

### Instalar solo dependencias de producción:
```bash
npm install --production
```

### Instalar una dependencia específica:
```bash
# Producción
npm install nombre-paquete

# Desarrollo
npm install --save-dev nombre-paquete
```

---

## Archivo `package.json` Completo

```json
{
  "name": "museo-3d",
  "version": "1.0.0",
  "description": "3D Museum Corridor",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "echo 'No build step required'"
  },
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^2.0.2",
    "node-fetch": "^3.3.2",
    "pg": "^8.16.3",
    "three": "^0.180.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "browserslist": [
    "defaults"
  ]
}
```

---

## Notas Importantes

1. **El símbolo `^` en las versiones** significa que se instalarán actualizaciones compatibles (parches y menores, pero no mayores)
2. **Módulos ES**: El proyecto usa `"type": "module"`, por lo que usa `import/export` en lugar de `require`
3. **Variables de entorno**: Asegúrate de tener configurado el archivo `.env` con las credenciales necesarias
