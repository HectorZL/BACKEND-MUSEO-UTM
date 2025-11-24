import * as THREE from 'three';

export class Artwork {
  constructor({ titulo, x = 0, z = 0, imgSrc, descripcion = '', obraData = null }) {
    this.titulo = titulo;
    this.x = x;
    this.z = z;
    this.imgSrc = imgSrc;
    this.descripcion = descripcion;
    this.obraData = obraData; 
    this.highResLoaded = false;
    this.lowResLoaded = false;
    this.currentQuality = 'low'; 
    this.fadeProgress = 0; 
    
    this.mesh = new THREE.Group();
    this.mesh.position.set(this.x, 2.2, this.z);
    this.mesh.rotation.y = this.x < 0 ? Math.PI/2 : -Math.PI/2;
    
    const userData = {
      titulo: this.titulo,
      descripcion: this.descripcion,
      imgSrc: this.imgSrc,
      isArtwork: true,
      obraData: this.obraData
    };
    this.mesh.userData = userData;
    this.mesh.cursor = 'pointer';

    this.init();
  }

  async init() {
    const texture = await this.loadLowResTexture();
    const image = texture.image;

    const aspect = image.width / image.height;
    
    let frameWidth, frameHeight;

    if (aspect >= 1) {
      // --- HORIZONTAL ---
      frameHeight = 2.2; 
      frameWidth = frameHeight * aspect;
      
      if (frameWidth > 4.5) { 
        frameWidth = 4.5;
        frameHeight = frameWidth / aspect;
      }
    } else {
      // --- VERTICAL ---
      frameHeight = 2.8;
      frameWidth = frameHeight * aspect;
      
      if (frameHeight > 3.5) {
          frameHeight = 3.5;
          frameWidth = frameHeight * aspect;
      }
    }

    this.createArtworkGeometry(frameWidth, frameHeight, texture);
  }

  createArtworkGeometry(frameWidth, frameHeight, texture) {
    // --- MARCO ---
    const frameDepth = 0.1;
    const frameThickness = 0.15; 
    
    const frameGeometry = new THREE.BoxGeometry(frameWidth + frameThickness, frameHeight + frameThickness, frameDepth);
    const frameMaterial = new THREE.MeshPhongMaterial({
      color: 0x5c3a21, // Madera oscura
      side: THREE.DoubleSide
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    
    // --- IMAGEN ---
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide
    });

    const imageGeometry = new THREE.PlaneGeometry(frameWidth, frameHeight);
    const image = new THREE.Mesh(imageGeometry, material);
    image.position.z = 0.051; 
    
    // --- ETIQUETA (TITULO) ---
    // Aumentamos el tamaño físico de la placa
    const panelSize = 0.6; // Antes 0.4 -> Ahora 0.6 (Más grande)
    const panelGeometry = new THREE.PlaneGeometry(panelSize, panelSize);
    
    const panelMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.9,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    
    const infoPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    
    // Posicionar etiqueta a la derecha (Ajustamos offset por el nuevo tamaño)
    const panelOffset = (frameWidth / 2) + (panelSize / 2) + 0.2; 
    infoPanel.position.set(
      panelOffset, 
      -frameHeight/3, 
      0
    );
    
    // Crear texto más grande
    this.createTitlePanel(panelSize).then(titleMesh => {
      titleMesh.position.set(0, 0, 0.01); 
      infoPanel.add(titleMesh);
    });
    
    infoPanel.userData = { ...this.mesh.userData, isInfoPanel: true };
    
    this.mesh.add(frame);
    this.mesh.add(image);
    this.mesh.add(infoPanel);
    
    frame.userData = this.mesh.userData;
    image.userData = this.mesh.userData;
  }
  
  loadLowResTexture() {
    if (this.lowResLoaded) return Promise.resolve(this.lowResTexture);

    return new Promise((resolve) => {
      this.createLowResTexture().then(lowResTexture => {
        this.lowResTexture = lowResTexture;
        this.lowResLoaded = true;
        resolve(lowResTexture);
      });
    });
  }

  loadHighResTexture() {
    if (this.highResLoaded) return this.highResTexture; 

    const textureLoader = new THREE.TextureLoader();
    const highResTexture = textureLoader.load(this.imgSrc, (texture) => {
      texture.encoding = THREE.sRGBEncoding;
      this.highResLoaded = true;
      this.setHighResTexture(texture);
      
      if (this.mesh.children[1] && this.mesh.children[1].material) {
          this.mesh.children[1].material.map = texture;
          this.mesh.children[1].material.needsUpdate = true;
      }
    });
    this.setHighResTexture(highResTexture);
    return highResTexture;
  }

  createLowResTexture() {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const maxSize = 512;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
            if (width > maxSize) {
                height = Math.round(height * (maxSize / width));
                width = maxSize;
            }
        } else {
            if (height > maxSize) {
                width = Math.round(width * (maxSize / height));
                height = maxSize;
            }
        }
        
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        resolve(texture);
      };
      img.src = this.imgSrc;
    });
  }

  async createTitlePanel(panelSize) {
    const canvas = document.createElement('canvas');
    // Aumentamos resolución del canvas para texto más nítido
    const size = 512; 
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Fondo
    const cornerRadius = 30; 
    ctx.fillStyle = 'rgba(40, 40, 40, 0.8)'; // Un poco más oscuro para mejor contraste
    this.roundRect(ctx, 0, 0, size, size, cornerRadius);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const maxWidth = size * 0.9; 
    
    // TÍTULO GRANDE
    // Calculamos fuente mucho más grande
    let titleFontSize = 60; 
    ctx.font = `bold ${titleFontSize}px Arial`;
    
    const words = this.titulo.split(' ');
    const lines = [];
    let line = '';
    
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);
    
    // Centrar verticalmente el bloque de texto
    const lineHeight = titleFontSize * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    let startY = (size - totalTextHeight) / 2;
    
    // Si hay autor, subimos un poco el título
    if (this.obraData && this.obraData.autor) {
        startY -= 40;
    }

    // Dibujar Título
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], size / 2, startY + (i * lineHeight));
    }

    // Autor (más pequeño, debajo)
    if (this.obraData && this.obraData.autor) {
        ctx.font = 'italic 35px Arial'; // Autor también visible
        ctx.fillStyle = '#dddddd';
        ctx.fillText(this.obraData.autor, size / 2, startY + totalTextHeight + 40);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 1.0 // Totalmente opaco el texto
    });
    
    const geometry = new THREE.PlaneGeometry(panelSize, panelSize); 
    return new THREE.Mesh(geometry, material);
  }
  
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  createTitle() {
    return new THREE.Mesh(); 
  }

  getObjects() {
    return [this.mesh]; 
  }

  setLowResTexture(texture) {
    this.lowResTexture = texture;
  }

  setHighResTexture(texture) {
    this.highResTexture = texture;
  }
}
