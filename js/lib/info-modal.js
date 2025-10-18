// /js/lib/info-modal.js
import { disableImageZoom } from './image-zoom.js';

class InfoModal {
  constructor() {
    this.modal = null;
    this.isOpen = false;
    this.init();
  }

  init() {
    this.createModal();
    this.setupEventListeners();
  }

  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'info-modal';
    this.modal.innerHTML = `
      <div class="info-modal__overlay" data-close></div>
      <div class="info-modal__content">
        <div class="info-modal__image-container">
          <img id="info-modal-img" alt="Obra" class="info-modal__image"/>
        </div>
        <div class="info-modal__body">
          <header class="info-modal__header">
            <h2 id="info-modal-title" class="info-modal__title"></h2>
            <p id="info-modal-author" class="info-modal__author"></p>
          </header>
          <dl class="info-modal__details">
            <div class="info-modal__detail">
              <dt class="info-modal__detail-label">Técnica</dt>
              <dd id="info-modal-technique" class="info-modal__detail-value"></dd>
            </div>
            <div class="info-modal__detail">
              <dt class="info-modal__detail-label">Tamaño</dt>
              <dd id="info-modal-size" class="info-modal__detail-value"></dd>
            </div>
          </dl>
          <div class="info-modal__description">
            <h3 class="info-modal__description-title">Descripción</h3>
            <p id="info-modal-description" class="info-modal__description-text"></p>
          </div>
          <div class="info-modal__actions">
            <button id="info-modal-back" class="info-modal__button info-modal__button--secondary">
              Regresar
            </button>
            <button data-close class="info-modal__button info-modal__button--primary">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.modal);
  }

  setupEventListeners() {
    this.modal.addEventListener('click', (e) => {
      if (e.target.matches('[data-close]')) {
        this.hide();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.hide();
      }
    });

    const backButton = this.modal.querySelector('#info-modal-back');
    backButton.addEventListener('click', () => this.hide());
  }

  show(obra) {
    if (!this.modal) return;

    // Set content
    const img = this.modal.querySelector('#info-modal-img');
    img.src = obra.imagen.startsWith('http') ? obra.imagen : (obra.imagen.startsWith('/') ? obra.imagen : `/${obra.imagen}`);
    img.alt = obra.titulo;
    
    this.modal.querySelector('#info-modal-title').textContent = obra.titulo;
    this.modal.querySelector('#info-modal-author').textContent = `${obra.autor} · ${obra.rol || ''}`.trim();
    this.modal.querySelector('#info-modal-technique').textContent = obra.tecnica || '—';
    this.modal.querySelector('#info-modal-size').textContent = obra.tamano || '—';
    this.modal.querySelector('#info-modal-description').textContent = obra.descripcion || '';

    // Show modal
    this.modal.classList.add('info-modal--visible');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
    
    // Disable zoom on main image
    disableImageZoom();
  }

  hide() {
    if (!this.modal) return;
    
    this.modal.classList.remove('info-modal--visible');
    this.isOpen = false;
    document.body.style.overflow = '';
  }
}

// Create and export a singleton instance
export const infoModal = new InfoModal();
