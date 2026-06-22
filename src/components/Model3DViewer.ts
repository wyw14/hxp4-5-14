import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { themeManager, type Theme, type ThreeColorConfig } from '../theme/ThemeManager';

export class Model3DViewer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private currentModel: THREE.Group | null = null;
  private animationId: number | null = null;
  private modelId: string = '';
  private resizeObserver: ResizeObserver;
  private disposed = false;

  private ambientLight: THREE.AmbientLight | null = null;
  private directionalLight: THREE.DirectionalLight | null = null;
  private pointLight: THREE.PointLight | null = null;
  private gridHelper: THREE.GridHelper | null = null;

  private isSelected = false;
  private isCorrect = false;
  private unsubscribeTheme: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;

    this.scene = new THREE.Scene();

    const width = container.clientWidth || 200;
    const height = container.clientHeight || 200;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(3, 3, 5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 10;

    this.addLights();
    this.addGridHelper();
    this.applyThemeColors(themeManager.getThreeColors());

    this.animate();

    this.resizeObserver = new ResizeObserver(() => {
      this.onResize();
    });
    this.resizeObserver.observe(container);

    this.unsubscribeTheme = themeManager.subscribe((theme: Theme) => {
      this.applyThemeColors(theme.threeColors);
      this.refreshHighlightState();
    });
  }

  private addLights(): void {
    this.ambientLight = new THREE.AmbientLight();
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight();
    this.directionalLight.position.set(5, 10, 7);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 1024;
    this.directionalLight.shadow.mapSize.height = 1024;
    this.scene.add(this.directionalLight);

    this.pointLight = new THREE.PointLight();
    this.pointLight.position.set(-3, 2, -3);
    this.scene.add(this.pointLight);
  }

  private addGridHelper(): void {
    this.gridHelper = new THREE.GridHelper(10, 10);
    this.gridHelper.position.y = -1.5;
    this.scene.add(this.gridHelper);
  }

  private applyThemeColors(colors: ThreeColorConfig): void {
    this.scene.background = new THREE.Color(colors.sceneBackground);

    if (this.ambientLight) {
      this.ambientLight.color.setHex(colors.ambientLight);
      this.ambientLight.intensity = colors.ambientIntensity;
    }
    if (this.directionalLight) {
      this.directionalLight.color.setHex(colors.directionalLight);
      this.directionalLight.intensity = colors.directionalIntensity;
    }
    if (this.pointLight) {
      this.pointLight.color.setHex(colors.pointLight);
      this.pointLight.intensity = colors.pointIntensity;
    }

    if (this.gridHelper) {
      const gridMat = this.gridHelper.material as unknown as THREE.LineBasicMaterial[];
      if (gridMat[0]) {
        gridMat[0].color.setHex(colors.gridLineColor);
      }
      if (gridMat[1]) {
        gridMat[1].color.setHex(colors.gridFadeColor);
      }
    }

    if (this.currentModel) {
      this.updateModelColors(colors);
    }
  }

  private updateModelColors(colors: ThreeColorConfig): void {
    if (!this.currentModel) return;

    this.currentModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.color.setHex(colors.paperColor);
        mat.roughness = colors.paperRoughness;
        mat.metalness = colors.paperMetalness;
        if (!this.isSelected && !this.isCorrect) {
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        }
      } else if (child instanceof THREE.LineSegments) {
        const mat = child.material as THREE.LineBasicMaterial;
        mat.color.setHex(colors.paperEdgeColor);
      }
    });
  }

  loadModel(modelId: string): void {
    this.modelId = modelId;
    this.isSelected = false;
    this.isCorrect = false;

    if (this.currentModel) {
      this.scene.remove(this.currentModel);
      this.disposeModel(this.currentModel);
    }

    const colors = themeManager.getThreeColors();
    this.currentModel = this.createModel(modelId, colors);
    if (this.currentModel) {
      this.scene.add(this.currentModel);
    }

    this.camera.position.set(3, 3, 5);
    this.controls.reset();
  }

  private createModel(modelId: string, colors: ThreeColorConfig): THREE.Group {
    const group = new THREE.Group();
    const paperMaterial = new THREE.MeshStandardMaterial({
      color: colors.paperColor,
      side: THREE.DoubleSide,
      flatShading: false,
      roughness: colors.paperRoughness,
      metalness: colors.paperMetalness,
      emissive: 0x000000,
      emissiveIntensity: 0,
    });

    const edgeMaterial = new THREE.LineBasicMaterial({ color: colors.paperEdgeColor });

    switch (modelId) {
      case 'rectangle-fold':
        this.createRectangleFold(group, paperMaterial, edgeMaterial);
        break;
      case 'triangle-fold':
        this.createTriangleFold(group, paperMaterial, edgeMaterial);
        break;
      case 'small-triangle':
        this.createSmallTriangle(group, paperMaterial, edgeMaterial);
        break;
      case 'square-twist':
        this.createSquareTwist(group, paperMaterial, edgeMaterial);
        break;
      case 'crane-base':
        this.createCraneBase(group, paperMaterial, edgeMaterial);
        break;
      default:
        this.createRectangleFold(group, paperMaterial, edgeMaterial);
    }

    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return group;
  }

  private createRectangleFold(group: THREE.Group, material: THREE.MeshStandardMaterial, edgeMat: THREE.LineBasicMaterial): void {
    const shape = new THREE.Shape();
    shape.moveTo(-1, -1);
    shape.lineTo(1, -1);
    shape.lineTo(1, 1);
    shape.lineTo(-1, 1);
    shape.lineTo(-1, -1);

    const geometry = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.01;
    group.add(mesh);

    const foldedShape = new THREE.Shape();
    foldedShape.moveTo(-1, -1);
    foldedShape.lineTo(0, -1);
    foldedShape.lineTo(0, 1);
    foldedShape.lineTo(-1, 1);
    foldedShape.lineTo(-1, -1);

    const foldedGeo = new THREE.ShapeGeometry(foldedShape);
    const foldedMesh = new THREE.Mesh(foldedGeo, material);
    foldedMesh.rotation.x = -Math.PI / 3;
    foldedMesh.position.set(0.5, 0.5, 0);
    group.add(foldedMesh);

    this.addEdges(geometry, edgeMat, group);
  }

  private createTriangleFold(group: THREE.Group, material: THREE.MeshStandardMaterial, edgeMat: THREE.LineBasicMaterial): void {
    const shape = new THREE.Shape();
    shape.moveTo(-1.2, -1);
    shape.lineTo(1.2, -1);
    shape.lineTo(0, 1.2);
    shape.lineTo(-1.2, -1);

    const geometry = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 4;
    mesh.rotation.z = 0.2;
    mesh.position.y = 0.3;
    group.add(mesh);

    const shape2 = new THREE.Shape();
    shape2.moveTo(-1.2, -1);
    shape2.lineTo(0, -1);
    shape2.lineTo(0, 1.2);
    shape2.lineTo(-1.2, -1);

    const geo2 = new THREE.ShapeGeometry(shape2);
    const mesh2 = new THREE.Mesh(geo2, material);
    mesh2.rotation.x = -Math.PI / 6;
    mesh2.rotation.y = Math.PI / 4;
    mesh2.position.set(0.3, 0.5, 0.2);
    group.add(mesh2);

    this.addEdges(geometry, edgeMat, group);
  }

  private createSmallTriangle(group: THREE.Group, material: THREE.MeshStandardMaterial, edgeMat: THREE.LineBasicMaterial): void {
    for (let i = 0; i < 4; i++) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.8, 0.8);
      shape.lineTo(-0.8, 0.8);
      shape.lineTo(0, 0);

      const geometry = new THREE.ShapeGeometry(shape);
      const mesh = new THREE.Mesh(geometry, material);

      const angle = (i * Math.PI) / 2;
      mesh.rotation.x = -Math.PI / 3 - i * 0.15;
      mesh.rotation.y = angle;
      mesh.position.y = i * 0.15;
      group.add(mesh);
    }
    void edgeMat;
  }

  private createSquareTwist(group: THREE.Group, material: THREE.MeshStandardMaterial, edgeMat: THREE.LineBasicMaterial): void {
    const centerSize = 0.6;

    const centerShape = new THREE.Shape();
    centerShape.moveTo(-centerSize, -centerSize);
    centerShape.lineTo(centerSize, -centerSize);
    centerShape.lineTo(centerSize, centerSize);
    centerShape.lineTo(-centerSize, centerSize);
    centerShape.lineTo(-centerSize, -centerSize);

    const centerGeo = new THREE.ShapeGeometry(centerShape);
    const centerMesh = new THREE.Mesh(centerGeo, material);
    centerMesh.rotation.x = -Math.PI / 2;
    centerMesh.position.y = 0.02;
    group.add(centerMesh);

    const corners = [
      { x: -1, y: -1, rotZ: Math.PI / 4 },
      { x: 1, y: -1, rotZ: -Math.PI / 4 },
      { x: 1, y: 1, rotZ: Math.PI + Math.PI / 4 },
      { x: -1, y: 1, rotZ: Math.PI - Math.PI / 4 }
    ];

    corners.forEach((corner, i) => {
      const triShape = new THREE.Shape();
      triShape.moveTo(0, 0);
      triShape.lineTo(0.6, 0);
      triShape.lineTo(0, 0.6);
      triShape.lineTo(0, 0);

      const triGeo = new THREE.ShapeGeometry(triShape);
      const triMesh = new THREE.Mesh(triGeo, material);
      triMesh.position.set(corner.x, 0.3 + i * 0.05, corner.y);
      triMesh.rotation.x = -Math.PI / 3;
      triMesh.rotation.z = corner.rotZ;
      group.add(triMesh);
    });
    void edgeMat;
  }

  private createCraneBase(group: THREE.Group, material: THREE.MeshStandardMaterial, edgeMat: THREE.LineBasicMaterial): void {
    const baseShape = new THREE.Shape();
    baseShape.moveTo(0, -1);
    baseShape.lineTo(1, 0);
    baseShape.lineTo(0, 1);
    baseShape.lineTo(-1, 0);
    baseShape.lineTo(0, -1);

    const baseGeo = new THREE.ShapeGeometry(baseShape);
    const baseMesh = new THREE.Mesh(baseGeo, material);
    baseMesh.rotation.x = -Math.PI / 2;
    baseMesh.position.y = 0.01;
    group.add(baseMesh);

    for (let i = 0; i < 2; i++) {
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.lineTo(0.8, -0.3);
      wingShape.lineTo(0.8, 0.3);
      wingShape.lineTo(0, 0);

      const wingGeo = new THREE.ShapeGeometry(wingShape);
      const wingMesh = new THREE.Mesh(wingGeo, material);
      wingMesh.position.set(i === 0 ? -0.3 : 0.3, 0.4 + i * 0.1, 0);
      wingMesh.rotation.y = i === 0 ? -Math.PI / 4 : Math.PI / 4;
      wingMesh.rotation.x = -Math.PI / 6;
      wingMesh.rotation.z = i === 0 ? 0.3 : -0.3;
      group.add(wingMesh);
    }

    const topShape = new THREE.Shape();
    topShape.moveTo(-0.3, 0);
    topShape.lineTo(0.3, 0);
    topShape.lineTo(0, 0.8);
    topShape.lineTo(-0.3, 0);

    const topGeo = new THREE.ShapeGeometry(topShape);
    const topMesh = new THREE.Mesh(topGeo, material);
    topMesh.position.set(0, 0.6, -0.2);
    topMesh.rotation.x = -Math.PI / 3;
    group.add(topMesh);
    void edgeMat;
  }

  private addEdges(geometry: THREE.BufferGeometry, material: THREE.LineBasicMaterial, group: THREE.Group): void {
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, material);
    group.add(line);
  }

  private disposeModel(model: THREE.Group): void {
    const disposedMaterials = new Set<THREE.Material>();
    model.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
        child.geometry.dispose();
        const material = child.material;
        if (Array.isArray(material)) {
          material.forEach(m => {
            if (!disposedMaterials.has(m)) {
              m.dispose();
              disposedMaterials.add(m);
            }
          });
        } else if (!disposedMaterials.has(material)) {
          material.dispose();
          disposedMaterials.add(material);
        }
      }
    });
  }

  private animate = (): void => {
    if (this.disposed) return;

    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private onResize(): void {
    if (this.disposed) return;

    const width = this.container.clientWidth || 200;
    const height = this.container.clientHeight || 200;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  private refreshHighlightState(): void {
    const colors = themeManager.getThreeColors();
    if (!this.currentModel) return;

    let emissiveColor = 0x000000;
    let emissiveIntensity = 0;

    if (this.isCorrect) {
      emissiveColor = colors.correctHighlight;
      emissiveIntensity = colors.correctEmissiveIntensity;
    } else if (this.isSelected) {
      emissiveColor = colors.selectedHighlight;
      emissiveIntensity = colors.selectedEmissiveIntensity;
    }

    this.currentModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.emissive.setHex(emissiveColor);
        mat.emissiveIntensity = emissiveIntensity;
      }
    });
  }

  setSelected(selected: boolean): void {
    if (this.isCorrect) return;
    this.isSelected = selected;
    this.refreshHighlightState();
  }

  setCorrect(correct: boolean): void {
    this.isCorrect = correct;
    if (correct) {
      this.isSelected = false;
    }
    this.refreshHighlightState();
  }

  getModelId(): string {
    return this.modelId;
  }

  destroy(): void {
    this.disposed = true;
    this.resizeObserver.disconnect();
    if (this.unsubscribeTheme) {
      this.unsubscribeTheme();
      this.unsubscribeTheme = null;
    }

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.currentModel) {
      this.scene.remove(this.currentModel);
      this.disposeModel(this.currentModel);
    }
    this.renderer.dispose();
    this.controls.dispose();
    this.renderer.domElement.remove();
  }
}
