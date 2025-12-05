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
            <!-- Wrapper relativo para posicionar botón sobre la imagen -->
            <div class="relative inline-block"> 
               <img id="obra-img" alt="Obra" class="max-w-full max-h-[80vh] w-auto h-auto object-contain shadow-2xl drop-shadow-2xl transition-transform duration-200 ease-out origin-center"/>
               
               <!-- Bottom Bar (Centered Info Button) -->
               <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto z-20">
                  <button id="show-details" class="group px-6 py-3 rounded-full bg-white/90 hover:bg-white text-green-900 backdrop-blur-md border border-white/20 shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2" title="Información">
                     <span class="text-lg font-bold italic group-hover:not-italic transition-all">+</span>
                     <span class="text-sm font-bold uppercase tracking-wider">Detalles</span>
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>

        <!-- Details View (CEDULA - Split Layout) -->
        <div id="details-view" class="hidden w-full max-w-5xl h-[85vh] bg-white overflow-hidden rounded-xl shadow-2xl flex flex-col md:flex-row pointer-events-auto">
          
          <!-- LEFT COLUMN: Artist Info (1/4 width) -->
          <div class="w-full md:w-1/4 bg-green-50/80 border-b md:border-b-0 md:border-r border-green-100 p-6 flex flex-col items-center justify-start text-center shrink-0 overflow-y-auto max-h-[30vh] md:max-h-full">
             <div class="w-24 h-24 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4 shrink-0 mx-auto">
               <img id="autor-detail-img" alt="Autor" class="w-full h-full object-cover"/>
             </div>
             
             <div class="w-full">
                <h3 id="obra-detail-autor" class="text-lg md:text-xl font-bold text-gray-800 leading-tight mb-2"></h3>
                <p id="obra-detail-rol" class="text-xs text-white bg-green-700 px-3 py-1 rounded-full inline-block font-medium uppercase tracking-wider"></p>
             </div>
          </div>

          <!-- RIGHT COLUMN: Artwork Info (Rest of width) -->
          <div class="flex-1 flex flex-col min-w-0 bg-white relative h-full overflow-hidden">
            
            <!-- Fixed Header (Title) - Optional, but keeps title detailed always visible if preferred. 
                 User didn't explicitly ask for fixed title, only buttons. 
                 Let's keep title in scrollable area but buttons fixed. 
            -->

            <!-- Scrollable Content -->
            <div class="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
               <h2 id="obra-detail-titulo" class="text-2xl md:text-4xl font-serif font-bold text-green-900 mb-6 border-b border-green-100 pb-4 leading-tight"></h2>

               <div class="grid grid-cols-2 gap-4 md:gap-8 mb-8 bg-gray-50 p-4 md:p-6 rounded-lg border border-gray-100">
                 <div>
                   <p class="text-xs text-green-600 uppercase tracking-wider font-bold mb-1">Técnica</p>
                   <p id="obra-detail-tecnica" class="text-gray-900 font-medium text-base md:text-lg"></p>
                 </div>
                 <div>
                   <p class="text-xs text-green-600 uppercase tracking-wider font-bold mb-1">Tamaño</p>
                   <p id="obra-detail-tamano" class="text-gray-900 font-medium text-base md:text-lg"></p>
                 </div>
               </div>
               
               <div class="mb-8">
                 <h3 class="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 opacity-70" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                    Sobre la obra
                 </h3>
                 <p id="obra-detail-descripcion" class="text-gray-600 leading-relaxed text-base md:text-lg text-justify font-light"></p>
               </div>
            </div>
            
            <!-- Footer Buttons (Fixed at bottom) -->
            <div class="p-4 md:p-6 border-t border-gray-100 bg-white flex justify-between items-center z-20 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <button id="back-to-image" class="text-gray-500 hover:text-green-900 font-medium flex items-center gap-2 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50 text-sm md:text-base">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                <span class="hidden md:inline">Volver a la imagen</span>
                <span class="md:hidden">Volver</span>
              </button>
              <button data-close class="bg-green-900 hover:bg-green-800 text-white px-6 py-2.5 md:px-8 md:py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-green-900/30 flex items-center gap-2 transform hover:-translate-y-0.5 text-sm md:text-base">
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

  // NOTE: photo of painting removed from cedula as requested
  // root.querySelector('#obra-detail-img').src = imageUrl;

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