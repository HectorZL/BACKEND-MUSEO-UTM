import * as THREE from 'three';
import { GalleryScene } from './scenes/gallery/GalleryScene.js';
import { loadObras } from '../../js/lib/obras.js';
import { mountObraModal, showObraModal } from '../../js/lib/modal-obra.js';

export class App {
  constructor() {
    this._ready = false;
    this.modalOpen = false;
    this.currentIndex = 0; 
    this.targets = []; 
    
    // Estado de navegación
    this.navLocked = false; 

    this.animate = this.animate.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);

    this.init();
  }

  async init() {
    try {
      console.log("Iniciando Galería Interactiva...");
      
      this.initRenderer();
      this.initModal();

      await this.loadArtworks();

      this.gallery = new GalleryScene(this.obras.length);
      this.scene = this.gallery.getScene();
      
      this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      // AJUSTE: Empezar a la altura de los ojos de los cuadros (Z=3.5, Y=2.2)
      this.camera.position.set(0, 2.2, 3.5);

      this.setupNavigation();
      this.setupInputs();
      this.setupModalStateSync();
      
      this._ready = true;
      this.animate();

    } catch (error) {
      console.error('Error crítico:', error);
    }
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);
  }

  async loadArtworks() {
    try {
      const obrasData = await loadObras();
      this.obras = obrasData.list;
    } catch (error) {
      console.warn('Usando respaldo:', error);
      this.obras = [];
    }
  }

  setupNavigation() {
    this.introObject = this.gallery.createIntroPlaceholder();
    this.targets = [];

    // --- TARGET 0: INTRO ---
    // Ajustado a Y=2.2 para consistencia
    const introTargetPos = new THREE.Vector3(0, 2.2, 3.5); 
    const dummyIntro = new THREE.Object3D();
    dummyIntro.position.copy(introTargetPos);
    dummyIntro.lookAt(this.introObject.position.x, 2.2, this.introObject.position.z); 
    dummyIntro.rotateY(Math.PI); 
    
    this.targets.push({
      position: introTargetPos,
      quaternion: dummyIntro.quaternion.clone()
    });

    // --- DISTRIBUCIÓN INTELIGENTE ---
    const roomL = this.gallery.roomLength;
    const roomW = this.gallery.roomWidth;
    const halfL = this.gallery.halfL;
    const halfW = this.gallery.halfW;
    const wallOffset = 0.2;

    // CONFIGURACIÓN VISUAL "SIEMPRE A LA DERECHA"
    const wallsConfig = [
        // 1. PARED DERECHA (Este)
        { 
            id: 2, 
            length: roomL, 
            fixedCoord: halfW - wallOffset, 
            isXFixed: true, 
            startCoord: -halfL, 
            dir: 1, 
            rotY: -Math.PI/2, 
            normal: new THREE.Vector3(-1, 0, 0) 
        },
        // 2. PARED ATRÁS (Sur)
        { 
            id: 3, 
            length: roomW, 
            fixedCoord: halfL - wallOffset, 
            isXFixed: false,
            startCoord: halfW, 
            dir: -1, 
            rotY: Math.PI,    
            normal: new THREE.Vector3(0, 0, -1) 
        },
        // 3. PARED IZQUIERDA (Oeste)
        { 
            id: 0, 
            length: roomL, 
            fixedCoord: -halfW + wallOffset, 
            isXFixed: true, 
            startCoord: halfL, 
            dir: -1, 
            rotY: Math.PI/2, 
            normal: new THREE.Vector3(1, 0, 0) 
        },
        // 4. PARED FRONTAL (Norte)
        { 
            id: 1, 
            length: roomW, 
            fixedCoord: -halfL + wallOffset, 
            isXFixed: false,
            startCoord: -halfW, 
            dir: 1, 
            rotY: 0,           
            normal: new THREE.Vector3(0, 0, 1) 
        }
    ];

    const totalArtworks = this.obras.length;
    const perimeter = (2 * roomL) + (2 * roomW);
    
    let wallDistribution = wallsConfig.map(wall => {
        const idealCount = totalArtworks * (wall.length / perimeter);
        return { ...wall, count: Math.floor(idealCount), remainder: idealCount - Math.floor(idealCount) };
    });

    const assignedCount = wallDistribution.reduce((acc, w) => acc + w.count, 0);
    let missing = totalArtworks - assignedCount;

    const sortedIndices = wallDistribution
        .map((w, i) => ({ index: i, rem: w.remainder }))
        .sort((a, b) => b.rem - a.rem); 

    for (let i = 0; i < missing; i++) {
        wallDistribution[sortedIndices[i].index].count++;
    }

    this.artworksInstances = [];
    let currentArtIndex = 0;

    wallDistribution.forEach(wall => {
        if (wall.count <= 0) return;

        const cornerPadding = 2.0; 
        const effectiveLength = wall.length - (2 * cornerPadding);
        let segmentSize, startOffset;
        
        if (effectiveLength > 0) {
            segmentSize = effectiveLength / (wall.count + 1);
            startOffset = cornerPadding;
        } else {
            segmentSize = wall.length / (wall.count + 1);
            startOffset = 0;
        }

        for (let i = 0; i < wall.count; i++) {
            if (currentArtIndex >= this.obras.length) break;
            
            const obra = this.obras[currentArtIndex];
            const offset = startOffset + ((i + 1) * segmentSize);
            const varyingPos = wall.startCoord + (offset * wall.dir);

            let x, z;
            if (wall.isXFixed) { x = wall.fixedCoord; z = varyingPos; } 
            else { x = varyingPos; z = wall.fixedCoord; }

            const artGroup = this.gallery.addArtwork({
                titulo: obra.titulo, x, z,
                imgSrc: obra.imagen, descripcion: obra.descripcion, obraData: obra
            });
            artGroup.mesh.rotation.y = wall.rotY;
            this.artworksInstances.push(artGroup);

            const camDistance = 2.5; 
            
            // --- CORRECCIÓN DE PERSPECTIVA ---
            // Cambiamos la altura Y de 1.7 a 2.2 para que coincida con la altura de los cuadros.
            const camPos = new THREE.Vector3(
                x + (wall.normal.x * camDistance),
                2.2, // <--- CAMBIO AQUÍ (Antes 1.7)
                z + (wall.normal.z * camDistance)
            );

            const dummy = new THREE.Object3D();
            dummy.position.copy(camPos);
            // La cámara mira exactamente al centro del cuadro (Y=2.2)
            dummy.lookAt(x, 2.2, z); 
            dummy.rotateY(Math.PI);

            this.targets.push({
                position: camPos,
                quaternion: dummy.quaternion.clone(),
                artworkRef: artGroup
            });

            currentArtIndex++;
        }
    });

    this.updateCameraPosition(true);
  }

  initModal() { mountObraModal(); }
  
  setupInputs() {
    window.addEventListener('resize', this.onWindowResize);
    document.addEventListener('keydown', this.onKeyDown);
    
    const navLeft = document.getElementById('navLeft');
    const navRight = document.getElementById('navRight');

    if (navLeft) {
        navLeft.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this.navLocked) this.prevSlide(); 
        });
    }
    
    if (navRight) {
        navRight.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this.navLocked) this.nextSlide(); 
        });
    }

    this.renderer.domElement.addEventListener('click', () => {
      if (this.currentIndex > 0 && !this.modalOpen) {
        const target = this.targets[this.currentIndex];
        if (target?.artworkRef) showObraModal(target.artworkRef.obraData, {
          onOpen: () => {
              this.modalOpen = true;
              this.setNavigationLocked(true); 
          },
          onClose: () => {
              this.modalOpen = false;
              this.setNavigationLocked(false); 
          }
        });
      }
    });
  }

  setNavigationLocked(locked) {
      this.navLocked = locked;
      const navLeft = document.getElementById('navLeft');
      const navRight = document.getElementById('navRight');
      
      if (navLeft) navLeft.style.display = locked ? 'none' : 'flex';
      if (navRight) navRight.style.display = locked ? 'none' : 'flex';
  }

  setupModalStateSync() {
    this.modalOpen = !!window.__modalOpen;
    window.addEventListener('obra-modal-open', () => { 
        this.modalOpen = true; 
        this.setNavigationLocked(true);
    });
    window.addEventListener('obra-modal-close', () => { 
        this.modalOpen = false; 
        this.setNavigationLocked(false);
    });
  }

  onKeyDown(event) {
    if (this.navLocked) return; 
    
    if (['ArrowRight', 'd', 'D'].includes(event.key)) this.nextSlide();
    if (['ArrowLeft', 'a', 'A'].includes(event.key)) this.prevSlide();
  }

  nextSlide() {
    if (this.navLocked) return; 
    if (this.currentIndex < this.targets.length - 1) {
      this.currentIndex++;
      this.updateCameraPosition();
    }
  }

  prevSlide() {
    if (this.navLocked) return; 
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateCameraPosition();
    }
  }

  updateCameraPosition(immediate = false) {
    const target = this.targets[this.currentIndex];
    if (!target) return;
    if (target.artworkRef?.loadHighResTexture) target.artworkRef.loadHighResTexture();
    if (immediate) {
      this.camera.position.copy(target.position);
      this.camera.quaternion.copy(target.quaternion);
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate);
    if (!this._ready) return;
    const target = this.targets[this.currentIndex];
    
    if (target && !this.modalOpen) {
      const distPos = this.camera.position.distanceTo(target.position);
      const angleDiff = this.camera.quaternion.angleTo(target.quaternion);
      if (distPos < 0.05 && angleDiff < 0.01) {
        this.camera.position.copy(target.position);
        this.camera.quaternion.copy(target.quaternion);
      } else {
        this.camera.position.lerp(target.position, 0.05);
        this.camera.quaternion.slerp(target.quaternion, 0.05);
      }
    }
    this.renderer.render(this.scene, this.camera);
  }
}
