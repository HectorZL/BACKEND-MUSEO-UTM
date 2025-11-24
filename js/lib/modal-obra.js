import { enableImageZoom, disableImageZoom, resetZoom } from './image-zoom.js';

export function mountObraModal() {
  const root = document.createElement('div');
  root.id = 'obra-modal-root';
  root.className = 'fixed inset-0 hidden z-50 w-screen h-screen overflow-hidden bg-transparent';
  root.innerHTML = `
    <div class="absolute inset-0 bg-transparent" data-close></div>
    <div class="absolute inset-0 grid place-items-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/95 -z-10 backdrop-blur-md" data-close></div>
      
      <!-- Image View -->
      <div id="image-view" class="w-full h-full flex flex-col bg-transparent relative pointer-events-none">
        
        <!-- Botón Salir -->
        <div class="absolute top-4 left-4 z-20 pointer-events-auto">
          <button id="modal-back-btn" class="p-3 rounded-full bg-black/60 text-white hover:bg-green-900 w-12 h-12 flex items-center justify-center shadow-lg backdrop-blur-md border border-white/10 transition-all transform hover:scale-110" title="Volver a la galería">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>

        <!-- Zoom Controls -->
        <div class="absolute top-4 right-4 flex gap-3 z-20 pointer-events-auto">
          <button id="zoom-in" class="p-3 rounded-full bg-black/60 text-white hover:bg-green-900 w-10 h-10 flex items-center justify-center backdrop-blur-md border border-white/10 transition-all" title="Acercar">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg>
          </button>
          <button id="zoom-out" class="p-3 rounded-full bg-black/60 text-white hover:bg-green-900 w-10 h-10 flex items-center justify-center backdrop-blur-md border border-white/10 transition-all" title="Alejar">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" /></svg>
          </button>
          <button id="zoom-reset" class="p-3 rounded-full bg-black/60 text-white hover:bg-green-900 w-10 h-10 flex items-center justify-center backdrop-blur-md border border-white/10 transition-all" title="Restablecer">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
        
        <!-- Image Container -->
        <div class="flex-1 relative flex items-center justify-center p-4 sm:p-8 pointer-events-auto">
          <div class="relative w-full h-full flex items-center justify-center">
            <!-- AJUSTE: max-h-80vh -->
            <img id="obra-img" alt="Obra" class="max-w-full max-h-[80vh] w-auto h-auto object-contain shadow-2xl drop-shadow-2xl transition-transform duration-200 ease-out origin-center"/>
          </div>
        </div>
        
        <!-- Bottom Bar (VERDE OSCURO) -->
        <div class="absolute bottom-4 left-0 right-0 flex flex-col items-center pointer-events-auto z-20">
          <button id="show-details" class="group px-8 py-3 rounded-full bg-green-900/80 hover:bg-green-950/90 backdrop-blur-md border border-white/20 text-white transition-all flex items-center gap-3 shadow-lg hover:scale-105">
            <span class="bg-white text-green-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold group-hover:rotate-90 transition-transform">+</span>
            <span class="text-base font-medium tracking-wide">Ver Información</span>
          </button>
        </div>
      </div>

      <!-- Details View (PALETA VERDE) -->
      <div id="details-view" class="hidden w-full max-w-5xl h-[85vh] bg-white overflow-hidden rounded-xl shadow-2xl flex flex-col md:flex-row pointer-events-auto">
        
        <!-- Left: Images Column -->
        <div class="w-full md:w-5/12 bg-gray-50 border-r border-gray-100 flex flex-col h-full">
          <div class="h-1/2 p-6 flex items-center justify-center bg-gray-100/50">
            <img id="obra-detail-img" alt="Obra" class="max-h-full max-w-full object-contain shadow-md"/>
          </div>
          <div class="h-1/2 p-6 flex flex-col items-center justify-center text-center border-t border-gray-200">
            <div class="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-white shadow-lg ring-1 ring-gray-100">
              <img id="autor-detail-img" alt="Autor" class="w-full h-full object-cover"/>
            </div>
            <h3 id="obra-detail-autor" class="text-xl font-bold text-gray-900 mb-1"></h3>
            <p id="obra-detail-rol" class="text-sm text-green-700 font-medium uppercase tracking-wider"></p>
          </div>
        </div>
        
        <!-- Right: Info Column -->
        <div class="w-full md:w-7/12 flex flex-col h-full bg-white relative">
          <div class="p-8 pb-4">
            <h2 id="obra-detail-titulo" class="text-3xl font-serif font-bold text-green-900 mb-2 leading-tight"></h2>
            <div class="w-16 h-1 bg-green-700 rounded-full"></div>
          </div>
          
          <div class="flex-1 overflow-y-auto px-8 py-2 space-y-6 custom-scrollbar">
            <div class="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg border border-green-100">
              <div>
                <p class="text-xs text-green-600 uppercase tracking-wider font-semibold mb-1">Técnica</p>
                <p id="obra-detail-tecnica" class="text-gray-900 font-medium"></p>
              </div>
              <div>
                <p class="text-xs text-green-600 uppercase tracking-wider font-semibold mb-1">Tamaño</p>
                <p id="obra-detail-tamano" class="text-gray-900 font-medium"></p>
              </div>
            </div>
            
            <div>
              <h3 class="text-lg font-bold text-green-900 mb-2">Sobre la obra</h3>
              <p id="obra-detail-descripcion" class="text-gray-700 leading-relaxed text-justify"></p>
            </div>
          </div>
          
          <div class="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center mt-auto">
            <button id="back-to-image" class="text-gray-600 hover:text-green-900 font-medium flex items-center gap-2 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Volver a la imagen
            </button>
            <button data-close class="bg-green-900 hover:bg-green-800 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-md flex items-center gap-2">
              Cerrar
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  // Estado inicial
  window.__modalOpen = false;

  const close = () => hideObraModal();

  root.addEventListener('click', (e) => {
    if (e.target.matches('[data-close]')) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  const backBtn = root.querySelector('#modal-back-btn');
  if (backBtn) backBtn.addEventListener('click', close);

  const showDetailsBtn = root.querySelector('#show-details');
  const backToImageBtn = root.querySelector('#back-to-image');
  const imageView = root.querySelector('#image-view');
  const detailsView = root.querySelector('#details-view');

  if (showDetailsBtn) {
    showDetailsBtn.addEventListener('click', () => {
      imageView.classList.add('hidden');
      detailsView.classList.remove('hidden');
      detailsView.classList.add('flex'); 
      disableImageZoom();
    });
  }
  
  if (backToImageBtn) {
    backToImageBtn.addEventListener('click', () => {
      detailsView.classList.add('hidden');
      detailsView.classList.remove('flex');
      imageView.classList.remove('hidden');
      enableImageZoom();
    });
  }
}

export function showObraModal(obra, callbacks = {}) {
  const root = document.getElementById('obra-modal-root');
  if (!root) return;

  const imageUrl = obra.imagen.startsWith('http') ? obra.imagen : (obra.imagen.startsWith('/') ? obra.imagen : `/${obra.imagen}`);
  
  const imgElement = root.querySelector('#obra-img');
  imgElement.src = imageUrl;
  imgElement.alt = obra.titulo;
  
  root.querySelector('#obra-detail-img').src = imageUrl;
  
  const obraNumber = obra.imagen.match(/\d+/)?.[0] || '01';
  const autorImageUrl = `images/${obraNumber.padStart(2, '0')}_autor.jpg`;
  const autorImg = root.querySelector('#autor-detail-img');
  autorImg.src = autorImageUrl;
  autorImg.onerror = () => { autorImg.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(obra.autor || 'A') + '&background=random'; };

  root.querySelector('#obra-detail-titulo').textContent = obra.titulo;
  root.querySelector('#obra-detail-autor').textContent = obra.autor || 'Autor desconocido';
  root.querySelector('#obra-detail-rol').textContent = obra.rol || 'Artista';
  root.querySelector('#obra-detail-tecnica').textContent = obra.tecnica || '—';
  root.querySelector('#obra-detail-tamano').textContent = obra.tamano || '—';
  root.querySelector('#obra-detail-descripcion').textContent = obra.descripcion || 'Sin descripción disponible.';

  root.querySelector('#image-view').classList.remove('hidden');
  const detailsView = root.querySelector('#details-view');
  detailsView.classList.add('hidden');
  detailsView.classList.remove('flex');
  
  root.classList.remove('hidden');
  window.__modalOpen = true;
  window.dispatchEvent(new CustomEvent('obra-modal-open'));
  
  resetZoom();
  enableImageZoom();

  if (callbacks.onOpen) callbacks.onOpen();
}

export function hideObraModal(callbacks = {}) {
  const root = document.getElementById('obra-modal-root');
  if (!root) return;
  
  root.classList.add('hidden');
  window.__modalOpen = false;
  window.dispatchEvent(new CustomEvent('obra-modal-close'));

  disableImageZoom();

  if (callbacks.onClose) callbacks.onClose();
}