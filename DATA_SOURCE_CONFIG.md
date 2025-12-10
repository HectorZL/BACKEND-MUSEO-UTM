# Configuración de Fuente de Datos

Este proyecto ahora soporta **dos fuentes de datos** para las obras:

1. **Base de datos PostgreSQL** (por defecto)
2. **Archivo JSON local** (`data/obras.json`)

## Cómo Cambiar la Fuente de Datos

### Opción 1: Editar el archivo `.env`

Abre el archivo `.env` en la raíz del proyecto y cambia el valor de `DATA_SOURCE`:

```env
# Para usar la base de datos PostgreSQL (por defecto)
DATA_SOURCE=database

# Para usar el archivo JSON
DATA_SOURCE=json
```

### Opción 2: Variable de entorno en tiempo de ejecución

Puedes establecer la variable al iniciar el servidor:

**Windows (PowerShell):**
```powershell
$env:DATA_SOURCE="json"; node server.js
```

**Linux/Mac:**
```bash
DATA_SOURCE=json node server.js
```

## Estructura del Archivo JSON

El archivo `data/obras.json` contiene un array de objetos con la siguiente estructura:

```json
[
  {
    "id": 1,
    "slug": "nombre-de-la-obra",
    "titulo": "Título de la Obra",
    "autor": "Nombre Completo del Autor",
    "rol": "Descripción del rol",
    "tecnica": "Técnica utilizada",
    "tamano": "Dimensiones",
    "descripcion": "Descripción detallada de la obra",
    "imagen": "ruta/a/la/imagen.jpg"
  }
]
```

## Funcionamiento

- **Modo Database**: Las obras se cargan desde PostgreSQL con información completa de autores y colecciones mediante JOINs
- **Modo JSON**: Las obras se cargan desde `data/obras.json` y se transforman al formato esperado por el frontend

## Ventajas de Cada Modo

### Base de Datos PostgreSQL
✅ Capacidad de administración completa (CRUD)  
✅ Relaciones entre tablas (autores, colecciones, exhibiciones)  
✅ Escalabilidad  
✅ Búsquedas avanzadas  

### Archivo JSON
✅ Desarrollo y pruebas rápidas  
✅ No requiere configuración de base de datos  
✅ Fácil de versionar y compartir  
✅ Ideal para demos y prototipos  

## Nota Importante

Las rutas administrativas (POST, PUT, DELETE) **solo funcionan con la base de datos**. El modo JSON es de solo lectura.
