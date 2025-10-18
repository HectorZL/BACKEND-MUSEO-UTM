// js/lib/image-zoom.js — robusto y sin NPEs
let currentZoom = 1;
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let translateX = 0, translateY = 0;
let imgElement = null;
let root = null;
let containerElement = null;
let maxTranslateX = 0;
let maxTranslateY = 0;

// Handlers nombrados para poder removerlos
function onWheel(e) {
  if (!imgElement) return;
  e.preventDefault();
  const delta = Math.sign(e.deltaY) * -0.1;
  currentZoom = Math.max(1, Math.min(6, currentZoom + delta));
  updateTransform();
}

function onMouseDown(e) {
  if (!imgElement || currentZoom === 1) return;
  isDragging = true;
  dragStartX = e.clientX - translateX;
  dragStartY = e.clientY - translateY;
  imgElement.style.cursor = 'grabbing';
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

function calculateMaxTranslate() {
  if (!imgElement || !containerElement) return { maxX: 0, maxY: 0 };
  
  const containerRect = containerElement.getBoundingClientRect();
  const imgRect = imgElement.getBoundingClientRect();
  
  // Calculate maximum allowed translation to keep image within view
  const scale = currentZoom;
  const scaledWidth = imgRect.width * scale;
  const scaledHeight = imgRect.height * scale;
  
  maxTranslateX = Math.max(0, (scaledWidth - containerRect.width) / 2);
  maxTranslateY = Math.max(0, (scaledHeight - containerRect.height) / 2);
  
  return { maxX: maxTranslateX, maxY: maxTranslateY };
}

function updateTransform() {
  if (!imgElement || !containerElement) return;
  
  // Calculate max translation based on current zoom
  const { maxX, maxY } = calculateMaxTranslate();
  
  // Clamp translation values to keep image within bounds
  translateX = Math.max(-maxX, Math.min(maxX, translateX));
  translateY = Math.max(-maxY, Math.min(maxY, translateY));
  
  // Apply transform
  imgElement.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
  
  // Update cursor
  const canDrag = currentZoom > 1.1; // Slight threshold before enabling drag
  imgElement.style.cursor = canDrag 
    ? (isDragging ? 'grabbing' : 'grab')
    : 'default';
}

export function zoomIn() {
  if (!imgElement) return;
  currentZoom = Math.min(6, currentZoom + 0.25);
  updateTransform();
}

export function zoomOut() {
  if (!imgElement) return;
  currentZoom = Math.max(1, currentZoom - 0.25);
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

export function enableImageZoom() {
  root = document.getElementById('obra-modal-root');
  if (!root) return;
  containerElement = root.querySelector('#image-view > div:first-child');
  imgElement = root.querySelector('#obra-img');
  if (!imgElement || !containerElement) return;
  
  // Reset zoom and position
  currentZoom = 1;
  translateX = 0;
  translateY = 0;
  imgElement.style.transform = '';

  // Add event listeners for zoom controls
  const zoomInBtn = root.querySelector('#zoom-in');
  const zoomOutBtn = root.querySelector('#zoom-out');
  const zoomResetBtn = root.querySelector('#zoom-reset');

  // Remove existing event listeners to prevent duplicates
  imgElement.removeEventListener('wheel', onWheel);
  imgElement.removeEventListener('mousedown', onMouseDown);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  if (zoomInBtn) zoomInBtn.removeEventListener('click', zoomIn);
  if (zoomOutBtn) zoomOutBtn.removeEventListener('click', zoomOut);
  if (zoomResetBtn) zoomResetBtn.removeEventListener('click', resetZoom);

  // Add event listeners
  imgElement.addEventListener('wheel', onWheel, { passive: false });
  imgElement.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
  if (zoomResetBtn) zoomResetBtn.addEventListener('click', resetZoom);

  // Set initial cursor
  imgElement.style.cursor = 'default';
}

export function disableImageZoom() {
  if (!root) { imgElement = null; return; }
  const ui = root.querySelector('[data-zoom-ui]');

  // Quitar listeners si el elemento aún existe
  if (imgElement) {
    imgElement.removeEventListener('wheel', onWheel);
    imgElement.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    imgElement.style.transform = 'none';
    imgElement.style.cursor = 'default';
  }
  ui?.querySelector('#zoom-in')?.removeEventListener('click', zoomIn);
  ui?.querySelector('#zoom-out')?.removeEventListener('click', zoomOut);
  ui?.querySelector('#zoom-reset')?.removeEventListener('click', zoomReset);

  // Reset de estado
  currentZoom = 1;
  translateX = 0; translateY = 0;
  isDragging = false;
  imgElement = null;
  root = null;
}
