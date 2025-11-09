// js/lib/obras.js
let _cache = null;

export async function loadObras() {
  if (_cache) return _cache;

  try {
    // Hacemos la petición a nuestro nuevo endpoint de API
    const res = await fetch('/api/obras');
    
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    
    const dataRaw = await res.json();

    // IMPORTANTE: Mapeamos los datos de la BD al formato que espera tu frontend.
    // Tu frontend espera 'imagen', 'autor', 'rol', pero la BD devuelve 'imagen_url', 'autor_nombre', etc.
    const data = dataRaw.map(obra => ({
      id: obra.id,
      slug: obra.slug,
      titulo: obra.titulo,
      descripcion: obra.descripcion,
      tecnica: obra.tecnica,
      tamano: obra.tamano,
      // Combinamos nombre y apellido si existen, o usamos un valor por defecto
      autor: (obra.autor_nombre && obra.autor_apellido) 
              ? `${obra.autor_nombre} ${obra.autor_apellido}` 
              : (obra.autor_nombre || 'Autor desconocido'),
      rol: obra.autor_rol || '',
      // Aseguramos que la ruta de la imagen sea correcta
      imagen: obra.imagen_url.startsWith('http') || obra.imagen_url.startsWith('/') 
              ? obra.imagen_url 
              : `/${obra.imagen_url}`
    }));

    const byId = new Map(data.map(o => [String(o.id), o]));
    const bySlug = new Map(data.map(o => [o.slug, o]));
    _cache = { list: data, byId, bySlug };
    
    return _cache;

  } catch (error) {
    console.error("Fallo al cargar obras desde la API:", error);
    // Opcional: Podrías intentar cargar el JSON local como respaldo si la API falla
    throw error;
  }
}