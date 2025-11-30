// js/lib/image-zoom.js
let currentZoom = 1;
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let translateX = 0, translateY = 0;
let imgElement = null;
let root = null;
let containerElement = null;

// Handlers
function onWheel(e) {
  if (!imgElement) return;
  e.preventDefault();
  
  const delta = Math.sign(e.deltaY) * -0.25;
  const newZoom = Math.max(1, Math.min(8, currentZoom + delta));
  
  // Lógica para hacer zoom hacia el puntero del mouse con la rueda (opcional, pero recomendada)
  // Si prefieres solo el comportamiento anterior (zoom al centro), comenta las siguientes 4 líneas:
  const rect = imgElement.getBoundingClientRect();
  const offsetX = e.clientX - (rect.left + rect.width / 2);
  const offsetY = e.clientY - (rect.top + rect.height / 2);
  const factor = newZoom / currentZoom;
  
  if (newZoom !== currentZoom && newZoom > 1) {
    translateX -= offsetX * (factor - 1);
    translateY -= offsetY * (factor - 1);
  }

  currentZoom = newZoom;
  
  if (currentZoom === 1) {
    translateX = 0;
    translateY = 0;
  }
  
  updateTransform();
}

function onDoubleClick(e) {
  if (!imgElement) return;
  e.preventDefault();

  // Configuración: Si está lejos (< 3x), hacemos zoom a 3x. 
  // Si ya está cerca (>= 3x), reseteamos a 1x.
  const targetZoom = currentZoom < 3 ? 3 : 1;

  if (targetZoom === 1) {
    // Resetear al centro
    currentZoom = 1;
    translateX = 0;
    translateY = 0;
  } else {
    // --- MATEMÁTICA DEL ZOOM PUNTUAL ---
    const rect = imgElement.getBoundingClientRect();
    
    // 1. Calculamos el centro visual actual de la imagen
    const centerVisualX = rect.left + rect.width / 2;
    const centerVisualY = rect.top + rect.height / 2;

    // 2. Calculamos la distancia del click respecto a ese centro
    const distClickX = e.clientX - centerVisualX;
    const distClickY = e.clientY - centerVisualY;

    // 3. Calculamos cuánto va a crecer la imagen (factor de escala)
    const factor = targetZoom / currentZoom;

    // 4. Ajustamos la traslación para compensar el desplazamiento
    // Movemos la imagen en dirección opuesta al click para mantener el punto bajo el mouse
    translateX -= distClickX * (factor - 1);
    translateY -= distClickY * (factor - 1);
    
    currentZoom = targetZoom;
  }

  updateTransform();
}

function onMouseDown(e) {
  if (!imgElement || currentZoom <= 1) return;
  
  isDragging = true;
  dragStartX = e.clientX - translateX;
  dragStartY = e.clientY - translateY;
  
  imgElement.style.cursor = 'grabbing';
  e.preventDefault(); 
}

function onMouseMove(e) {
  if (!imgElement || !isDragging) return;
  e.preventDefault();
  
  translateX = e.clientX - dragStartX;
  translateY = e.clientY - dragStartY;
  
  updateTransform();
}

function onMouseUp() {
  if (!imgElement) return;
  isDragging = false;
  imgElement.style.cursor = currentZoom > 1 ? 'grab' : 'default';
}

function updateTransform() {
  if (!imgElement) return;
  imgElement.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
  
  if (!isDragging) {
      imgElement.style.cursor = currentZoom > 1 ? 'grab' : 'default';
  }
}

// --- Controles Externos ---

export function zoomIn() {
  if (!imgElement) return;
  currentZoom = Math.min(8, currentZoom + 0.5);
  updateTransform();
}

export function zoomOut() {
  if (!imgElement) return;
  currentZoom = Math.max(1, currentZoom - 0.5);
  if (currentZoom === 1) { 
    translateX = 0; 
    translateY = 0; 
  }
  updateTransform();
}

export function resetZoom() {
  if (!imgElement) return;
  currentZoom = 1; 
  translateX = 0; 
  translateY = 0; 
  isDragging = false;
  imgElement.style.transform = 'none';
  imgElement.style.cursor = 'default';
}

// --- Inicialización y Limpieza ---

export function enableImageZoom() {
  root = document.getElementById('obra-modal-root');
  if (!root) return;
  
  containerElement = root.querySelector('#image-view > div:first-child');
  imgElement = root.querySelector('#obra-img');
  
  if (!imgElement || !containerElement) return;
  
  // Resetear variables
  currentZoom = 1;
  translateX = 0;
  translateY = 0;
  isDragging = false;
  imgElement.style.transform = '';
  imgElement.style.cursor = 'default';
  imgElement.style.transformOrigin = 'center center'; // Crucial para que la matemática funcione

  // Referencias a botones
  const zoomInBtn = root.querySelector('#zoom-in');
  const zoomOutBtn = root.querySelector('#zoom-out');
  const zoomResetBtn = root.querySelector('#zoom-reset');

  // Limpiar listeners previos
  cleanupListeners(zoomInBtn, zoomOutBtn, zoomResetBtn);

  // Agregar listeners
  // "dblclick" es el evento nativo para doble click
  imgElement.addEventListener('dblclick', onDoubleClick); 
  imgElement.addEventListener('wheel', onWheel, { passive: false });
  imgElement.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  
  if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
  if (zoomResetBtn) zoomResetBtn.addEventListener('click', resetZoom);
}

export function disableImageZoom() {
  if (!root) { imgElement = null; return; }
  
  const zoomInBtn = root.querySelector('#zoom-in');
  const zoomOutBtn = root.querySelector('#zoom-out');
  const zoomResetBtn = root.querySelector('#zoom-reset');

  cleanupListeners(zoomInBtn, zoomOutBtn, zoomResetBtn);

  if (imgElement) {
    imgElement.style.transform = 'none';
    imgElement.style.cursor = 'default';
  }

  currentZoom = 1;
  translateX = 0; 
  translateY = 0;
  isDragging = false;
  imgElement = null;
  root = null;
  containerElement = null;
}

function cleanupListeners(btnIn, btnOut, btnReset) {
  if (imgElement) {
    imgElement.removeEventListener('dblclick', onDoubleClick);
    imgElement.removeEventListener('wheel', onWheel);
    imgElement.removeEventListener('mousedown', onMouseDown);
  }
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  
  if (btnIn) btnIn.removeEventListener('click', zoomIn);
  if (btnOut) btnOut.removeEventListener('click', zoomOut);
  if (btnReset) btnReset.removeEventListener('click', resetZoom);
}

