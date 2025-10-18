// /js/modal-obra.js
import { enableImageZoom, disableImageZoom, resetZoom } from './image-zoom.js';

export function mountObraModal() {
  const root = document.createElement('div');
  root.id = 'obra-modal-root';
  root.className = 'fixed inset-0 hidden z-50 w-screen h-screen overflow-hidden bg-transparent';
  root.innerHTML = `
    <div class="absolute inset-0 bg-transparent" data-close></div>
    <div class="absolute inset-0 grid place-items-center p-4">
      <!-- Image View -->
      <div id="image-view" class="w-full h-full flex flex-col bg-black/0 relative">
        <!-- Zoom Controls - Top Right -->
        <div class="absolute top-4 right-4 flex gap-2 z-10">
          <button id="zoom-in" class="p-3 rounded-full bg-black/60 text-white hover:bg-black/80 w-10 h-10 flex items-center justify-center" title="Acercar">+</button>
          <button id="zoom-out" class="p-3 rounded-full bg-black/60 text-white hover:bg-black/80 w-10 h-10 flex items-center justify-center" title="Alejar">−</button>
          <button id="zoom-reset" class="p-3 rounded-full bg-black/60 text-white hover:bg-black/80 w-10 h-10 flex items-center justify-center" title="Restablecer">○</button>
        </div>
        
        <!-- Image Container -->
        <div class="flex-1 relative flex items-center justify-center p-2 sm:p-4">
          <div class="relative w-auto h-auto max-w-[90vw] max-h-[80vh] md:max-h-[75vh]">
            <img id="obra-img" alt="Obra" class="max-w-full max-h-[70vh] w-auto h-auto object-contain"/>
          </div>
        </div>
        
        <!-- Bottom Bar with Title and Info Button -->
        <div class="p-4 flex flex-col items-center">
          <span id="obra-titulo" class="text-white text-base font-medium text-center mb-2 text-shadow-md"></span>
          <button id="show-details" class="px-6 py-2 rounded-full bg-black/20 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-black/30 transition-all text-sm font-medium flex items-center gap-1.5">
            <span class="text-lg leading-none">+</span> Información
          </button>
        </div>
      </div>

      <!-- Details View (initially hidden) -->
      <div id="details-view" class="hidden w-full h-full bg-white overflow-y-auto">
        <div class="flex flex-col h-full">
          <div class="relative w-full" style="height: 40vh; min-height: 300px;">
            <img id="obra-detail-img" alt="Obra" class="w-full h-full object-cover"/>
          </div>
          <div class="flex-1 p-4 overflow-y-auto">
            <header class="mb-4">
              <h2 id="obra-detail-titulo" class="text-xl font-bold"></h2>
              <p id="obra-detail-autor" class="text-sm text-neutral-600"></p>
            </header>
            <dl class="space-y-3 text-sm">
              <div class="border-b border-gray-100 pb-2">
                <dt class="font-medium text-neutral-700">Técnica</dt>
                <dd id="obra-detail-tecnica" class="text-neutral-800"></dd>
              </div>
              <div class="border-b border-gray-100 pb-2">
                <dt class="font-medium text-neutral-700">Tamaño</dt>
                <dd id="obra-detail-tamano" class="text-neutral-800"></dd>
              </div>
            </dl>
            <div class="mt-4">
              <h3 class="font-medium text-neutral-700 mb-2">Descripción</h3>
              <p id="obra-detail-descripcion" class="text-neutral-800 leading-relaxed"></p>
            </div>
          </div>
          <div class="p-4 border-t border-gray-200 bg-white flex justify-between sticky bottom-0">
            <button id="back-to-image" class="px-6 py-3 rounded-lg bg-neutral-100 text-neutral-800 hover:bg-neutral-200 transition-colors flex-1 max-w-[48%]">
              Regresar
            </button>
            <button data-close class="px-6 py-3 rounded-lg bg-black text-white hover:bg-neutral-800 transition-colors flex-1 max-w-[48%]">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  // Estado inicial
  window.__modalOpen = false;


// cerrar por capa oscura o botón
root.addEventListener('click', (e) => {
if (e.target.matches('[data-close]')) hideObraModal();
});


// ESC para cerrar
document.addEventListener('keydown', (e) => {
if (e.key === 'Escape') hideObraModal();
});


// Trap focus within modal for accessibility
root.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    const focusableElements = root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }
});

}


export function showObraModal(obra, callbacks = {}) {
  console.log('showObraModal called with:', obra);
  const root = document.getElementById('obra-modal-root');
  if (!root) {
    console.error('Modal root not found!');
    return;
  }
  console.log('Modal root found, showing modal...');

  // Fill modal content for both views
  const imageUrl = obra.imagen.startsWith('http') ? obra.imagen : (obra.imagen.startsWith('/') ? obra.imagen : `/${obra.imagen}`);
  
  // Image View
  const imgElement = root.querySelector('#obra-img');
  imgElement.src = imageUrl;
  imgElement.alt = obra.titulo;
  root.querySelector('#obra-titulo').textContent = obra.titulo;
  
  // Details View
  const detailImg = root.querySelector('#obra-detail-img');
  detailImg.src = imageUrl;
  detailImg.alt = obra.titulo;
  root.querySelector('#obra-detail-titulo').textContent = obra.titulo;
  root.querySelector('#obra-detail-autor').textContent = `${obra.autor} · ${obra.rol ?? ''}`.trim();
  root.querySelector('#obra-detail-tecnica').textContent = obra.tecnica || '—';
  root.querySelector('#obra-detail-tamano').textContent = obra.tamano || '—';
  root.querySelector('#obra-detail-descripcion').textContent = obra.descripcion || '';

  // Show image view by default
  root.querySelector('#image-view').classList.remove('hidden');
  root.querySelector('#details-view').classList.add('hidden');
  
  // Show modal by removing hidden class and block body scroll
  root.classList.remove('hidden');
  window.__modalOpen = true;
  window.dispatchEvent(new CustomEvent('obra-modal-open'));
  document.body.style.overflow = 'hidden';
  
  // Reset zoom when showing modal
  resetZoom();
  
  // Set up event listeners
  const showDetailsBtn = root.querySelector('#show-details');
  const backToImageBtn = root.querySelector('#back-to-image');
  
  showDetailsBtn.addEventListener('click', () => {
    root.querySelector('#image-view').classList.add('hidden');
    root.querySelector('#details-view').classList.remove('hidden');
    // Disable zoom when showing details
    disableImageZoom();
  });
  
  backToImageBtn.addEventListener('click', () => {
    root.querySelector('#details-view').classList.add('hidden');
    root.querySelector('#image-view').classList.remove('hidden');
    // Re-enable zoom when going back to image
    enableImageZoom();
  });
  
  // Enable zoom controls for the image view
  enableImageZoom();
  
  // Focus on the close button for accessibility
  const closeButton = root.querySelector('[data-close]');
  if (closeButton) {
    closeButton.focus();
  }

  // Enable image zoom
  enableImageZoom();

  // Execute onOpen callback if provided
  if (callbacks.onOpen) {
    callbacks.onOpen();
  }
}


export function hideObraModal(callbacks = {}) {
  const root = document.getElementById('obra-modal-root');
  if (!root) return;
  root.classList.add('hidden');
  window.__modalOpen = false;
  window.dispatchEvent(new CustomEvent('obra-modal-close'));

  // Restore body scroll
  document.body.style.overflow = 'auto';

  // Disable image zoom
  disableImageZoom();

  // Execute onClose callback if provided
  if (callbacks.onClose) {
    callbacks.onClose();
  }

  // Restore focus to the Three.js canvas for interaction
  const canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.focus();
  }
}