import * as THREE from 'three';
import { Artwork } from '../../models/Artwork.js';
import { Floor } from './components/Floor.js';
import { VaultCeiling } from './components/VaultCeiling.js';

export class GalleryScene {
  constructor(totalArtworks = 0) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xFFF8E1); 
    
    this.artworks = [];
    
    // --- CÁLCULO DE DIMENSIONES AMPLIADO (SEPARACIÓN) ---
    // AUMENTO AGRESIVO: 8.0 metros por cuadro (antes 6.0)
    const perimeterNeeded = (totalArtworks * 8.0) + 20; 
    const semiPerimeter = perimeterNeeded / 2;
    
    // AUMENTO: Sala más grande (mínimo 30m de ancho)
    this.roomWidth = Math.max(30, semiPerimeter * 0.5); 
    this.roomLength = Math.max(24, semiPerimeter * 0.6);
    this.wallHeight = 5.2; 
    
    this.halfW = this.roomWidth / 2;
    this.halfL = this.roomLength / 2;

    this.setupLights();
    this.createRoom();
  }

  setupLights() {
    this.scene.add(new THREE.AmbientLight(0xFFFFFE, 0.4)); 
    
    const centerLight = new THREE.PointLight(0xFFFFFF, 0.3, Math.max(this.roomWidth, this.roomLength) * 1.5);
    centerLight.position.set(0, this.wallHeight - 1, 0);
    this.scene.add(centerLight);
  }

  createRoom() {
    // 1. Suelo
    const floorGeo = new THREE.PlaneGeometry(this.roomWidth, this.roomLength);
    const textureLoader = new THREE.TextureLoader();
    const floorTex = textureLoader.load('textura/madera.jpg');
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    // Ajuste de repetición
    floorTex.repeat.set(this.roomWidth / 2, this.roomLength / 2);
    
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI/2;
    floor.receiveShadow = true; 
    this.scene.add(floor);

    // 2. Paredes
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
    
    const wallN = new THREE.Mesh(new THREE.PlaneGeometry(this.roomWidth, this.wallHeight), wallMat);
    wallN.position.set(0, this.wallHeight/2, -this.halfL);
    wallN.receiveShadow = true; 
    this.scene.add(wallN);

    const wallS = new THREE.Mesh(new THREE.PlaneGeometry(this.roomWidth, this.wallHeight), wallMat);
    wallS.position.set(0, this.wallHeight/2, this.halfL);
    wallS.rotation.y = Math.PI;
    wallS.receiveShadow = true;
    this.scene.add(wallS);

    const wallW = new THREE.Mesh(new THREE.PlaneGeometry(this.roomLength, this.wallHeight), wallMat);
    wallW.position.set(-this.halfW, this.wallHeight/2, 0);
    wallW.rotation.y = Math.PI/2;
    wallW.receiveShadow = true;
    this.scene.add(wallW);

    const wallE = new THREE.Mesh(new THREE.PlaneGeometry(this.roomLength, this.wallHeight), wallMat);
    wallE.position.set(this.halfW, this.wallHeight/2, 0);
    wallE.rotation.y = -Math.PI/2;
    wallE.receiveShadow = true;
    this.scene.add(wallE);

    // 3. Techo
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(this.roomWidth, this.roomLength), wallMat);
    ceiling.rotation.x = Math.PI/2;
    ceiling.position.y = this.wallHeight;
    this.scene.add(ceiling);
  }

  createIntroPlaceholder() {
    const wallWidth = 3.5; 
    const wallHeight = 4;
    const wallDepth = 0.4;
    
    const wallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF }); 
    const centralWall = new THREE.Mesh(wallGeometry, wallMaterial);
    centralWall.receiveShadow = true; 
    centralWall.castShadow = true;    
    
    centralWall.position.set(0, wallHeight / 2, 0);
    this.scene.add(centralWall);

    // Canvas de Bienvenida
    const imgWidth = 3.0; 
    const imgHeight = 2.0; 
    const imgGeometry = new THREE.PlaneGeometry(imgWidth, imgHeight);
    
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 682; 
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#cba135'; 
    ctx.lineWidth = 20;
    ctx.strokeRect(20, 20, canvas.width-40, canvas.height-40);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GALERÍA VIRTUAL', canvas.width/2, canvas.height/2 - 40);
    
    ctx.font = '30px Arial';
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText('Bienvenido a la exposición', canvas.width/2, canvas.height/2 + 50);
    
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#FFD700'; 
    ctx.fillText('Usa las flechas ⬅  ➡ para navegar', canvas.width/2, canvas.height/2 + 120);
    
    const texture = new THREE.CanvasTexture(canvas);
    const imgMaterial = new THREE.MeshBasicMaterial({ map: texture });
    
    const introMesh = new THREE.Mesh(imgGeometry, imgMaterial);
    introMesh.position.set(0, wallHeight / 2, wallDepth / 2 + 0.02);
    
    this.scene.add(introMesh);
    
    return introMesh;
  }

  addArtwork(artworkData) {
    const artwork = new Artwork(artworkData);
    const objects = artwork.getObjects();
    objects.forEach(obj => this.scene.add(obj));
    this.artworks.push(artwork);
    return artwork;
  }
  
  getScene() {
    return this.scene;
  }
}