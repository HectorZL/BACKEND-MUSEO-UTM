// /js/modal-obra.js
import { enableImageZoom, disableImageZoom, resetZoom } from './image-zoom.js';

export function mountObraModal() {
  const root = document.createElement('div');
  root.id = 'obra-modal-root';
  root.className = 'fixed inset-0 hidden z-50 w-screen h-screen overflow-hidden bg-transparent';
  root.innerHTML = `
    <div class="absolute inset-0 bg-transparent" data-close></div>
    <div class="absolute inset-0 grid place-items-center p-4">
      <!-- Backdrop that closes the modal -->
      <div class="absolute inset-0 bg-black/50 -z-10" data-close></div>
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
      <div id="details-view" class="hidden w-[75vw] h-[75vh] bg-white overflow-y-auto rounded-lg shadow-xl">
        <div class="flex flex-col h-full">
          <div class="flex flex-col md:flex-row w-full" style="min-height: 30vh;">
            <!-- Artwork Image -->
            <div class="w-full md:w-1/2 p-3 flex items-center justify-center bg-gray-50">
              <div class="relative w-full h-full max-h-[40vh] flex items-center justify-center">
                <img id="obra-detail-img" alt="Obra" class="max-h-full w-auto object-contain"/>
              </div>
            </div>
            <!-- Author Image -->
            <div class="w-full md:w-1/2 p-3 flex items-center justify-center bg-gray-100 border-t md:border-t-0 md:border-l border-gray-200">
              <div class="text-center">
                <div class="w-40 h-40 md:w-60 md:h-60 rounded-full overflow-hidden mx-auto mb-2 border-2 border-white shadow">
                  <img id="autor-detail-img" alt="Autor" class="w-full h-full object-cover"/>
                </div>
                <h3 id="obra-detail-autor" class="text-base font-semibold text-gray-800"></h3>
                <p id="obra-detail-rol" class="text-xs text-gray-600"></p>
              </div>
            </div>
          </div>
          
          <div class="flex-1 p-4 overflow-y-auto">
            <header class="mb-4 text-center md:text-left">
              <h2 id="obra-detail-titulo" class="text-xl font-bold text-gray-900 mb-1"></h2>
              <div class="h-0.5 w-12 bg-amber-400 mx-auto md:mx-0 my-2"></div>
            </header>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div class="space-y-2">
                <div class="bg-gray-50 p-3 rounded">
                  <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Técnica</h3>
                  <p id="obra-detail-tecnica" class="text-sm text-gray-800"></p>
                </div>
                <div class="bg-gray-50 p-3 rounded">
                  <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Tamaño</h3>
                  <p id="obra-detail-tamano" class="text-sm text-gray-800"></p>
                </div>
              </div>
              
              <div class="bg-gray-50 p-3 rounded">
                <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Descripción</h3>
                <p id="obra-detail-descripcion" class="text-sm text-gray-700 leading-snug"></p>
              </div>
            </div>
            <div class="p-3 border-t border-gray-200 bg-white flex justify-between gap-2">
              <button id="back-to-image" class="px-4 py-2 text-sm rounded bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors flex-1 flex items-center justify-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Regresar
              </button>
              <button data-close class="px-4 py-2 text-sm rounded bg-black text-white hover:bg-gray-800 transition-colors flex-1 flex items-center justify-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cerrar
              </button>
            </div>
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
  
  // Set author image
  const autorImg = root.querySelector('#autor-detail-img');
  const obraNumber = obra.imagen.match(/\d+/)?.[0] || '01';
  const autorImageUrl = `images/${obraNumber.padStart(2, '0')}_autor.jpg`;
  autorImg.src = autorImageUrl;
  autorImg.alt = obra.autor || 'Autor';
  
  // Set text content
  root.querySelector('#obra-detail-titulo').textContent = obra.titulo;
  root.querySelector('#obra-detail-autor').textContent = obra.autor || '';
  root.querySelector('#obra-detail-rol').textContent = obra.rol || '';
  root.querySelector('#obra-detail-tecnica').textContent = obra.tecnica || 'No especificada';
  root.querySelector('#obra-detail-tamano').textContent = obra.tamano || 'No especificado';
  root.querySelector('#obra-detail-descripcion').textContent = obra.descripcion || 'Sin descripción disponible.';

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