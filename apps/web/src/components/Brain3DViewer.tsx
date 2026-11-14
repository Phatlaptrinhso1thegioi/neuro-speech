import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Zap,
  Activity,
  Radio,
  Layers,
  Sparkles,
  Info,
  Eye,
  EyeOff,
  Sliders
} from 'lucide-react';

interface Brain3DViewerProps {
  channelData?: Record<string, number[]>;
  activeFlashGroup?: number | null;
  currentTime?: number;
  isPlaying?: boolean;
  className?: string;
  onEmitPulse?: () => void;
}

// 10-20 Electrode coordinates mapped onto procedural 3D brain
interface ElectrodeDef {
  id: string;
  name: string;
  region: string;
  pos: [number, number, number]; // x, y, z
  baseColor: number;
  highlightColor: number;
  description: string;
}

const ELECTRODES: ElectrodeDef[] = [
  { id: 'Fz', name: 'Fz', region: 'Vỏ não trán (Frontal Midline)', pos: [0, 0.65, 1.25], baseColor: 0x38bdf8, highlightColor: 0x67e8f9, description: 'Định hướng chú ý & chức năng điều hành' },
  { id: 'Cz', name: 'Cz', region: 'Đỉnh đầu (Vertex / Central)', pos: [0, 1.35, 0.0], baseColor: 0x14b8a6, highlightColor: 0x5eead4, description: 'Điểm trung tâm vận động - cảm giác' },
  { id: 'Pz', name: 'Pz', region: 'Vỏ não đỉnh (Parietal Midline)', pos: [0, 1.05, -1.05], baseColor: 0xf59e0b, highlightColor: 0xfde047, description: 'Tâm điểm sóng P300 (Biên độ đỉnh 300-400ms)' },
  { id: 'Oz', name: 'Oz', region: 'Vỏ não thị giác (Occipital)', pos: [0, 0.25, -1.45], baseColor: 0xa855f7, highlightColor: 0xe879f9, description: 'Đáp ứng kích thích thị giác nhấp nháy ma trận' },
  { id: 'C3', name: 'C3', region: 'Bán cầu trái (Central Left)', pos: [-1.15, 0.95, 0.0], baseColor: 0x0ea5e9, highlightColor: 0x7dd3fc, description: 'Cảm giác vận động tay phải' },
  { id: 'C4', name: 'C4', region: 'Bán cầu phải (Central Right)', pos: [1.15, 0.95, 0.0], baseColor: 0x0ea5e9, highlightColor: 0x7dd3fc, description: 'Cảm giác vận động tay trái' },
  { id: 'P3', name: 'P3', region: 'Đỉnh trái (Parietal Left)', pos: [-1.0, 0.75, -0.9], baseColor: 0x10b981, highlightColor: 0x6ee7b7, description: 'Xử lý không gian & nhận diện mục tiêu' },
  { id: 'P4', name: 'P4', region: 'Đỉnh phải (Parietal Right)', pos: [1.0, 0.75, -0.9], baseColor: 0x10b981, highlightColor: 0x6ee7b7, description: 'Xử lý không gian & nhận diện mục tiêu' },
];

export const Brain3DViewer: React.FC<Brain3DViewerProps> = ({
  channelData = {},
  activeFlashGroup = null,
  currentTime = 0,
  isPlaying = false,
  className = '',
  onEmitPulse,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // UI States
  const [autoRotate, setAutoRotate] = useState(true);
  const [showOverlayControls, setShowOverlayControls] = useState(false);
  const [selectedElectrode, setSelectedElectrode] = useState<ElectrodeDef>(ELECTRODES[2]); // Default Pz
  const [activePreset, setActivePreset] = useState<'anterior' | 'posterior' | 'left' | 'right' | 'superior' | 'iso'>('anterior');
  const [p300PulseCount, setP300PulseCount] = useState(0);
  const [lastPulseTime, setLastPulseTime] = useState<string>('Chưa kích hoạt');
  const [showConnectome, setShowConnectome] = useState(true);
  const [showWaveRings, setShowWaveRings] = useState(true);
  const [isWebGLError, setIsWebGLError] = useState(false);

  // Synchronized refs to avoid React stale closures inside requestAnimationFrame
  const autoRotateRef = useRef(true);
  const showConnectomeRef = useRef(true);
  const showWaveRingsRef = useRef(true);
  const activeFlashGroupRef = useRef(activeFlashGroup);
  const channelDataRef = useRef(channelData);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    showConnectomeRef.current = showConnectome;
    if (arborLinesRef.current) {
      arborLinesRef.current.visible = showConnectome;
    }
  }, [showConnectome]);

  useEffect(() => {
    showWaveRingsRef.current = showWaveRings;
  }, [showWaveRings]);

  useEffect(() => {
    activeFlashGroupRef.current = activeFlashGroup;
  }, [activeFlashGroup]);

  useEffect(() => {
    channelDataRef.current = channelData;
  }, [channelData]);

  const handleToggleAutoRotate = () => {
    setAutoRotate((prev) => {
      const next = !prev;
      autoRotateRef.current = next;
      return next;
    });
  };

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const brainGroupRef = useRef<THREE.Group | null>(null);
  const electrodeMeshesRef = useRef<Map<string, { mesh: THREE.Mesh; halo: THREE.Mesh; def: ElectrodeDef }>>(new Map());
  const waveRingsRef = useRef<THREE.Mesh[]>([]);
  const arborLinesRef = useRef<THREE.LineSegments | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Interaction tracking
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0.15, y: -0.2 });
  const currentRotationRef = useRef({ x: 0.15, y: -0.2 });
  const targetDistanceRef = useRef(4.5);
  const currentDistanceRef = useRef(4.5);

  // Trigger pulse animation
  const triggerP300Wave = () => {
    setP300PulseCount((c) => c + 1);
    setLastPulseTime(`${currentTime > 0 ? currentTime.toFixed(2) : '340ms'} (+16.33 µV)`);
    if (onEmitPulse) onEmitPulse();

    // Reset wave rings to start expanding from Pz
    waveRingsRef.current.forEach((ring, idx) => {
      ring.scale.set(0.1, 0.1, 0.1);
      ring.position.set(0, 1.05, -1.05); // Pz position
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.95 - idx * 0.15;
      ring.userData = {
        progress: -idx * 0.14,
        active: true,
      };
    });
  };

  // Auto trigger wave when visual stimulus / flash group is active
  useEffect(() => {
    if (activeFlashGroup !== null && activeFlashGroup > 0) {
      waveRingsRef.current.forEach((ring, idx) => {
        if (!ring.userData?.active || ring.userData.progress > 0.6) {
          ring.scale.set(0.15, 0.15, 0.15);
          ring.position.set(0, 1.05, -1.05);
          (ring.material as THREE.MeshBasicMaterial).opacity = 0.85 - idx * 0.2;
          ring.userData = { progress: 0, active: true };
        }
      });
    }
  }, [activeFlashGroup]);

  // Camera presets matching clinical medical viewer: [Trước] [Sau] [Trái] [Phải] [Trên]
  const applyViewPreset = (preset: 'anterior' | 'posterior' | 'left' | 'right' | 'superior' | 'iso') => {
    setActivePreset(preset);
    // Pause auto-rotation when user clicks a specific anatomical angle so it stays on that view
    setAutoRotate(false);
    autoRotateRef.current = false;

    if (preset === 'anterior') {
      // Trước (Anterior / Front)
      targetRotationRef.current = { x: 0.1, y: 0.0 };
      targetDistanceRef.current = 4.4;
    } else if (preset === 'posterior') {
      // Sau (Posterior / Occipital & Pz)
      targetRotationRef.current = { x: 0.18, y: Math.PI };
      targetDistanceRef.current = 4.4;
    } else if (preset === 'left') {
      // Trái (Left Sagittal)
      targetRotationRef.current = { x: 0.05, y: -Math.PI / 2 };
      targetDistanceRef.current = 4.5;
    } else if (preset === 'right') {
      // Phải (Right Sagittal)
      targetRotationRef.current = { x: 0.05, y: Math.PI / 2 };
      targetDistanceRef.current = 4.5;
    } else if (preset === 'superior') {
      // Trên (Superior / Top Vertex Cz)
      targetRotationRef.current = { x: Math.PI / 2.05, y: 0.0 };
      targetDistanceRef.current = 4.3;
    } else if (preset === 'iso') {
      targetRotationRef.current = { x: 0.35, y: -0.65 };
      targetDistanceRef.current = 4.6;
    }
  };

  // Main Three.js Scene Setup
  useEffect(() => {
    if (!canvasRef.current || !viewportRef.current) return;

    let renderer: THREE.WebGLRenderer;
    try {
      const width = viewportRef.current.clientWidth || 600;
      const height = viewportRef.current.clientHeight || 450;

      // 1. Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // 2. Camera
      const camera = new THREE.PerspectiveCamera(45, width / Math.max(1, height), 0.1, 100);
      camera.position.set(0, 0, currentDistanceRef.current);
      cameraRef.current = camera;

      // 3. Renderer
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererRef.current = renderer;

      // 4. Clinical Medical Lighting (Teal & Cool White Ambience)
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
      scene.add(ambientLight);

      const dirLight1 = new THREE.DirectionalLight(0x5eead4, 2.4); // Mint teal
      dirLight1.position.set(5, 8, 6);
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 2.0); // Sky blue
      dirLight2.position.set(-5, -4, -6);
      scene.add(dirLight2);

      const dirLight3 = new THREE.DirectionalLight(0xffffff, 1.6);
      dirLight3.position.set(0, 6, -5);
      scene.add(dirLight3);

      const pointLightPz = new THREE.PointLight(0xf59e0b, 3.5, 8);
      pointLightPz.position.set(0, 1.05, -1.05);
      scene.add(pointLightPz);

      // 5. Brain Container Group
      const brainGroup = new THREE.Group();
      scene.add(brainGroup);
      brainGroupRef.current = brainGroup;

      // 6. Translucent Glassmorphic Cortex Shell (Soft Mint-Teal Glass)
      const createHemisphere = (isLeft: boolean) => {
        const geo = new THREE.SphereGeometry(1.2, 48, 48);
        const pos = geo.attributes.position;
        const xOffset = isLeft ? -0.16 : 0.16;

        for (let i = 0; i < pos.count; i++) {
          let x = pos.getX(i);
          let y = pos.getY(i);
          let z = pos.getZ(i);

          // Anatomical shaping
          if (isLeft && x > 0) x *= 0.14;
          if (!isLeft && x < 0) x *= 0.14;

          z *= 1.25;
          if (y < 0) y *= 0.75;
          if (z > 0.8) {
            x *= 0.85;
            y *= 0.9;
          }
          if (z < -0.8) {
            y *= 0.85;
          }

          // Gentle organic convolutions
          const sulci =
            Math.sin(x * 6) * Math.cos(y * 6) * Math.sin(z * 6) * 0.045 +
            Math.sin(x * 12) * Math.cos(y * 12) * 0.02;

          x += (x / Math.max(0.1, Math.abs(x))) * sulci * 0.5 + xOffset;
          y += sulci;
          z += sulci;

          pos.setXYZ(i, x, y, z);
        }
        geo.computeVertexNormals();

        // Translucent Glass Membrane Material (Identical to LungAI reference aesthetic)
        const cortexMat = new THREE.MeshPhongMaterial({
          color: 0x14b8a6,        // Medical teal
          emissive: 0x0f766e,     // Gentle inner teal glow
          emissiveIntensity: 0.35,
          specular: 0x99f6e4,     // Crisp glass sheen
          shininess: 85,
          transparent: true,
          opacity: 0.28,          // High translucency to reveal internal arbor tree
          depthWrite: false,
          side: THREE.DoubleSide,
        });

        const hemiMesh = new THREE.Mesh(geo, cortexMat);

        // Soft wireframe lattice contour
        const wireMat = new THREE.MeshBasicMaterial({
          color: isLeft ? 0x2dd4bf : 0x5eead4,
          wireframe: true,
          transparent: true,
          opacity: 0.22,
          blending: THREE.AdditiveBlending,
        });
        const wireMesh = new THREE.Mesh(geo, wireMat);
        wireMesh.scale.set(1.001, 1.001, 1.001);
        hemiMesh.add(wireMesh);

        return hemiMesh;
      };

      const leftHemi = createHemisphere(true);
      const rightHemi = createHemisphere(false);
      brainGroup.add(leftHemi);
      brainGroup.add(rightHemi);

      // Cerebellum (inferior posterior)
      const cerebellumGeo = new THREE.SphereGeometry(0.55, 32, 24);
      cerebellumGeo.scale(1.1, 0.6, 0.7);
      const cerebellumMat = new THREE.MeshPhongMaterial({
        color: 0x0f766e,
        emissive: 0x115e59,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.35,
        wireframe: true,
      });
      const cerebellum = new THREE.Mesh(cerebellumGeo, cerebellumMat);
      cerebellum.position.set(0, -0.45, -1.05);
      brainGroup.add(cerebellum);

      // 7. Dendritic Neural Arbor Tree (Branching Internal Connectome Structure)
      // Generates branching neural arborization that fills the interior, just like the bronchial tree in the reference!
      const generateArborTree = () => {
        const segments: number[] = [];
        const tipPoints: number[] = [];

        const branch = (
          x: number, y: number, z: number,
          dx: number, dy: number, dz: number,
          length: number, depth: number, maxDepth: number
        ) => {
          if (depth > maxDepth) {
            tipPoints.push(x, y, z);
            return;
          }
          const endX = x + dx * length;
          const endY = y + dy * length;
          const endZ = z + dz * length;
          segments.push(x, y, z, endX, endY, endZ);

          const numChildren = depth === 0 ? 3 : (depth < 3 ? 2 : 1);
          for (let c = 0; c < numChildren; c++) {
            const spread = 0.42;
            const angle = (c - (numChildren - 1) / 2) * spread;
            const angle2 = (c % 2 === 0 ? 1 : -1) * spread * 0.6;

            let ndx = dx * Math.cos(angle) - dz * Math.sin(angle);
            let ndz = dx * Math.sin(angle) + dz * Math.cos(angle);
            let ndy = dy + angle2 * 0.45;

            const mag = Math.sqrt(ndx * ndx + ndy * ndy + ndz * ndz) || 1;
            ndx /= mag; ndy /= mag; ndz /= mag;

            branch(endX, endY, endZ, ndx, ndy, ndz, length * 0.74, depth + 1, maxDepth);
          }
        };

        // Left & Right Hemispheric Trunks
        [-1, 1].forEach((sign) => {
          const rootX = sign * 0.16;
          const rootY = 0.05;
          const rootZ = 0.0;

          // 5 Major Anatomical Lobar Trunks
          const trunks = [
            { dir: [sign * 0.6, 0.35, 0.7], len: 0.36 },   // Frontal Lobe
            { dir: [sign * 0.35, 0.8, -0.3], len: 0.38 },  // Parietal Lobe (toward Pz)
            { dir: [sign * 0.3, 0.2, -0.85], len: 0.35 },  // Occipital Lobe (toward Oz)
            { dir: [sign * 0.8, -0.1, -0.15], len: 0.32 }, // Temporal Lobe
            { dir: [sign * 0.7, 0.6, 0.1], len: 0.34 },    // Central / Motor Lobe
          ];

          trunks.forEach((t) => {
            branch(rootX, rootY, rootZ, t.dir[0], t.dir[1], t.dir[2], t.len, 0, 4);
          });
        });

        // Cerebellar Arbor Vitae
        branch(0, -0.3, -0.6, 0, -0.2, -0.8, 0.28, 0, 3);
        branch(-0.2, -0.35, -0.7, -0.4, -0.1, -0.6, 0.24, 0, 3);
        branch(0.2, -0.35, -0.7, 0.4, -0.1, -0.6, 0.24, 0, 3);

        return { segments, tipPoints };
      };

      const arborData = generateArborTree();

      // Glowing Arbor Lines (Luminous Mint-White Branches)
      const arborGeo = new THREE.BufferGeometry();
      arborGeo.setAttribute('position', new THREE.Float32BufferAttribute(arborData.segments, 3));
      const arborMat = new THREE.LineBasicMaterial({
        color: 0xccfbf1, // Bright luminous mint-white
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
      });
      const arborLines = new THREE.LineSegments(arborGeo, arborMat);
      brainGroup.add(arborLines);
      arborLinesRef.current = arborLines;

      // Synaptic Terminal Clusters (Sparkling nodes at branch tips)
      const tipsGeo = new THREE.BufferGeometry();
      tipsGeo.setAttribute('position', new THREE.Float32BufferAttribute(arborData.tipPoints, 3));
      const tipsMat = new THREE.PointsMaterial({
        color: 0x5eead4, // Electric teal
        size: 0.05,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
      });
      const tipsPoints = new THREE.Points(tipsGeo, tipsMat);
      brainGroup.add(tipsPoints);

      // 8. 10-20 Electrodes Placement
      electrodeMeshesRef.current.clear();
      ELECTRODES.forEach((def) => {
        const isPz = def.id === 'Pz';
        const sphereGeo = new THREE.SphereGeometry(isPz ? 0.095 : 0.075, 24, 24);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: def.baseColor,
          emissive: def.baseColor,
          emissiveIntensity: isPz ? 2.0 : 1.2,
          roughness: 0.15,
          metalness: 0.85,
        });
        const electrodeMesh = new THREE.Mesh(sphereGeo, sphereMat);
        electrodeMesh.position.set(...def.pos);

        // Glowing outer corona ring
        const haloGeo = new THREE.RingGeometry(isPz ? 0.12 : 0.09, isPz ? 0.18 : 0.14, 24);
        const haloMat = new THREE.MeshBasicMaterial({
          color: def.highlightColor,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        haloMesh.rotation.x = Math.PI / 2;
        electrodeMesh.add(haloMesh);

        brainGroup.add(electrodeMesh);
        electrodeMeshesRef.current.set(def.id, { mesh: electrodeMesh, halo: haloMesh, def });
      });

      // 9. P300 Radiating Wave Rings (Expanding Shockwaves from Pz)
      waveRingsRef.current = [];
      const ringCount = 4;
      for (let r = 0; r < ringCount; r++) {
        const ringGeo = new THREE.TorusGeometry(0.4, 0.035, 16, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xfbbf24,
          transparent: true,
          opacity: 0.0,
          blending: THREE.AdditiveBlending,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(0, 1.05, -1.05); // Centered at Pz
        ringMesh.rotation.x = Math.PI / 2.8;
        ringMesh.userData = { progress: 1.0, active: false };
        brainGroup.add(ringMesh);
        waveRingsRef.current.push(ringMesh);
      }

      // 10. Medical Perspective Floor Grid & Target Ring (Matching reference image)
      const gridHelper = new THREE.GridHelper(5, 12, 0x14b8a6, 0x091c28);
      gridHelper.position.y = -1.65;
      scene.add(gridHelper);

      const floorRingGeo = new THREE.RingGeometry(0.35, 0.38, 32);
      const floorRingMat = new THREE.MeshBasicMaterial({
        color: 0x14b8a6,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      });
      const floorRing = new THREE.Mesh(floorRingGeo, floorRingMat);
      floorRing.rotation.x = Math.PI / 2;
      floorRing.position.y = -1.64;
      scene.add(floorRing);

      // Initial welcome pulse
      setTimeout(() => {
        triggerP300Wave();
      }, 500);

      // 11. Animation Loop
      let clock = new THREE.Clock();

      const animate = () => {
        animFrameIdRef.current = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();

        // Auto rotation controlled by dynamic autoRotateRef
        if (autoRotateRef.current && !isDraggingRef.current) {
          targetRotationRef.current.y += delta * 0.22;
        }

        // Smooth damping interpolation
        currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.08;
        currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.08;
        currentDistanceRef.current += (targetDistanceRef.current - currentDistanceRef.current) * 0.08;

        if (brainGroupRef.current) {
          brainGroupRef.current.rotation.x = currentRotationRef.current.x;
          brainGroupRef.current.rotation.y = currentRotationRef.current.y;
        }

        if (cameraRef.current) {
          cameraRef.current.position.z = currentDistanceRef.current;
        }

        // Arbor tree breathing / neural activity pulse
        if (arborLinesRef.current) {
          arborLinesRef.current.visible = showConnectomeRef.current;
          const breath = Math.sin(elapsed * 3.5) * 0.15 + 0.85;
          (arborLinesRef.current.material as THREE.LineBasicMaterial).opacity = breath;
        }

        // Animate P300 Expanding Wave Rings
        if (showWaveRingsRef.current) {
          waveRingsRef.current.forEach((ring) => {
            if (ring.userData?.active) {
              ring.userData.progress += delta * 1.35;
              const prog = ring.userData.progress;

              if (prog >= 0 && prog <= 1.0) {
                const radiusScale = 0.2 + prog * 4.0;
                ring.scale.set(radiusScale, radiusScale, radiusScale);
                const mat = ring.material as THREE.MeshBasicMaterial;
                mat.opacity = (1.0 - prog) * 0.95;
                if (prog > 0.5) {
                  mat.color.setHex(0x5eead4); // Mint cyan transition
                } else {
                  mat.color.setHex(0xfbbf24); // Royal gold start
                }
              } else if (prog > 1.0) {
                ring.userData.active = false;
                (ring.material as THREE.MeshBasicMaterial).opacity = 0.0;
              }
            }
          });
        }

        // Animate Electrodes based on real-time channelData
        const currentChannelData = channelDataRef.current || {};
        const currentActiveFlash = activeFlashGroupRef.current;

        electrodeMeshesRef.current.forEach((item, id) => {
          const { mesh, halo, def } = item;
          const pulse = Math.sin(elapsed * 5 + def.pos[0] * 3) * 0.15;
          let scale = 1.0 + pulse;

          if (id === 'Pz') {
            scale = 1.3 + Math.sin(elapsed * 8) * 0.3;
            if (currentActiveFlash !== null && currentActiveFlash > 0) {
              scale = 1.7;
            }
          } else if (id === 'Oz' && currentActiveFlash !== null && currentActiveFlash > 0) {
            scale = 1.5;
          }

          mesh.scale.set(scale, scale, scale);
          halo.scale.set(scale * 1.3, scale * 1.3, scale * 1.3);
        });

        renderer.render(scene, camera);
      };

      animate();

      // Resize Observer (Observing viewportRef ONLY)
      const handleResize = () => {
        if (!viewportRef.current || !rendererRef.current || !cameraRef.current) return;
        const w = viewportRef.current.clientWidth;
        const h = viewportRef.current.clientHeight;
        if (w <= 0 || h <= 0) return;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h, false);
      };

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(viewportRef.current);

      return () => {
        resizeObserver.disconnect();
        if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
        renderer.dispose();
      };
    } catch (err) {
      console.error('Failed to initialize Three.js WebGL in Brain3DViewer:', err);
      setIsWebGLError(true);
    }
  }, []);

  // Update dynamic visibility without re-initializing
  useEffect(() => {
    if (arborLinesRef.current) {
      arborLinesRef.current.visible = showConnectome;
    }
  }, [showConnectome]);

  // Pointer Drag Controls
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMousePosRef.current.x;
    const deltaY = e.clientY - prevMousePosRef.current.y;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };

    targetRotationRef.current.y += deltaX * 0.008;
    targetRotationRef.current.x = Math.max(
      -1.4,
      Math.min(1.4, targetRotationRef.current.x + deltaY * 0.008)
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    targetDistanceRef.current = Math.max(
      2.6,
      Math.min(7.5, targetDistanceRef.current + e.deltaY * 0.003)
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl bg-gradient-to-b from-[#050B12] via-[#07131D] to-[#040910] border border-teal-900/40 shadow-2xl overflow-hidden flex flex-col font-sans ${className}`}
      style={{ height: '540px' }}
    >
      {/* Top Header & Telemetry HUD */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 p-3.5 bg-gray-950/75 backdrop-blur-md border-b border-teal-950/80 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-950/80 border border-teal-500/30 rounded-xl text-teal-400 shadow-md shadow-teal-950/50">
            <Radio className="w-4 h-4 animate-pulse text-teal-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center space-x-2">
                <span>Mô Hình Não Bộ 3D & Lan Truyền Sóng P300</span>
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-950/90 text-teal-300 border border-teal-700/60 font-mono font-bold">
                10-20 MONTAGE (8 CHANNELS)
              </span>
            </div>
            <p className="text-[11px] text-gray-400 flex items-center space-x-2 mt-0.5">
              <span>Cây dẫn truyền thần kinh & trường sóng điện não 3D</span>
              <span>•</span>
              <span className="text-amber-400 font-mono font-semibold">Pz Peak: +16.33 µV @ 340ms</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Presets */}
        <div className="flex items-center space-x-2">
          {/* HUD Overlay Toggle */}
          <button
            onClick={() => setShowOverlayControls(!showOverlayControls)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all flex items-center space-x-1.5 ${
              showOverlayControls
                ? 'bg-teal-950/80 border-teal-500 text-teal-300 shadow-sm shadow-teal-950/40'
                : 'bg-gray-900/90 border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white'
            }`}
            title={showOverlayControls ? 'Bấm để ẩn các nút đạo trình (Xem não toàn cảnh)' : 'Bấm để hiển thị các nút chọn đạo trình và thông số'}
          >
            {showOverlayControls ? <EyeOff className="w-3.5 h-3.5 text-teal-400" /> : <Sliders className="w-3.5 h-3.5 text-teal-400" />}
            <span>{showOverlayControls ? 'Ẩn Đạo Trình' : 'Hiện Đạo Trình'}</span>
          </button>

          {/* Auto Rotate Toggle */}
          <button
            onClick={handleToggleAutoRotate}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all flex items-center space-x-1.5 ${
              autoRotate
                ? 'bg-teal-950/80 border-teal-500 text-teal-300 shadow-sm shadow-teal-950/40'
                : 'bg-gray-900/90 border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white'
            }`}
            title={autoRotate ? 'Mô hình đang tự xoay. Bấm để đứng yên ngay lập tức.' : 'Mô hình đang đứng yên. Bấm để tự động xoay 360 độ.'}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span>{autoRotate ? 'Đang Xoay (Bấm: Đứng Yên)' : 'Đang Đứng Yên (Bấm: Xoay 360°)'}</span>
          </button>

          {/* Connectome Arbor Tree Toggle */}
          <button
            onClick={() => setShowConnectome(!showConnectome)}
            className={`p-1.5 rounded-lg border text-xs transition-all ${
              showConnectome
                ? 'bg-teal-950/80 border-teal-600 text-teal-300'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
            }`}
            title="Bật/Tắt mạng nhánh dẫn truyền thần kinh (Neural Arbor Tree)"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* "Phát Xung Sóng P300" Interactive WOW Button */}
          <button
            onClick={triggerP300Wave}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold font-mono text-xs shadow-lg shadow-amber-500/30 transition-all active:scale-95 flex items-center space-x-1.5"
            title="Kích hoạt xung sóng não P300 lan tỏa trong không gian 3 chiều"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Phát Xung P300</span>
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={viewportRef}
        className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

        {/* Fallback Display if WebGL context failed */}
        {isWebGLError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gray-950/90 z-20">
            <Radio className="w-12 h-12 text-teal-400 mb-3 animate-pulse" />
            <h3 className="text-base font-bold text-white mb-1">Mô Phỏng Trường Điện Não 3D</h3>
            <p className="text-xs text-gray-400 max-w-md mb-4">
              Trình duyệt chưa hỗ trợ bộ tăng tốc phần cứng WebGL. Bạn có thể sử dụng chế độ Dải Sóng 2D hoặc cập nhật trình duyệt để hiển thị 3D đầy đủ.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold"
            >
              Tải lại trang
            </button>
          </div>
        )}

        {/* CLINICAL VIEW PRESET BAR (Bottom-Left Pills matching LungAI reference screenshot) */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center space-x-1 bg-gray-950/85 backdrop-blur-md border border-gray-800 rounded-lg p-1 text-[11px] font-mono shadow-xl">
          <button
            onClick={() => applyViewPreset('anterior')}
            className={`px-2.5 py-1 rounded transition-all ${
              activePreset === 'anterior' ? 'bg-teal-600 text-white font-bold shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-900/60'
            }`}
            title="Góc nhìn phía Trước (Anterior / Frontal)"
          >
            Trước
          </button>
          <button
            onClick={() => applyViewPreset('posterior')}
            className={`px-2.5 py-1 rounded transition-all ${
              activePreset === 'posterior' ? 'bg-teal-600 text-white font-bold shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-900/60'
            }`}
            title="Góc nhìn phía Sau (Posterior / Pz Peak & Oz)"
          >
            Sau
          </button>
          <button
            onClick={() => applyViewPreset('left')}
            className={`px-2.5 py-1 rounded transition-all ${
              activePreset === 'left' ? 'bg-teal-600 text-white font-bold shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-900/60'
            }`}
            title="Góc nhìn mặt Bên Trái (Left Sagittal)"
          >
            Trái
          </button>
          <button
            onClick={() => applyViewPreset('right')}
            className={`px-2.5 py-1 rounded transition-all ${
              activePreset === 'right' ? 'bg-teal-600 text-white font-bold shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-900/60'
            }`}
            title="Góc nhìn mặt Bên Phải (Right Sagittal)"
          >
            Phải
          </button>
          <button
            onClick={() => applyViewPreset('superior')}
            className={`px-2.5 py-1 rounded transition-all ${
              activePreset === 'superior' ? 'bg-teal-600 text-white font-bold shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-900/60'
            }`}
            title="Góc nhìn từ Trên xuống (Superior / Vertex Cz)"
          >
            Trên
          </button>

          <span className="w-px h-3.5 bg-gray-800 mx-0.5" />

          {/* Toggle button to reveal / hide electrode overlay chips & telemetry cards */}
          <button
            onClick={() => setShowOverlayControls(!showOverlayControls)}
            className={`px-2 py-1 rounded transition-all flex items-center space-x-1 ${
              showOverlayControls
                ? 'bg-teal-950 border border-teal-500 text-teal-300 font-bold'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900/60'
            }`}
            title={showOverlayControls ? 'Ẩn các nút đạo trình & bảng đo (Xem não toàn cảnh)' : 'Hiện các nút chọn đạo trình & bảng đo điện thế'}
          >
            {showOverlayControls ? <EyeOff className="w-3 h-3 text-teal-400" /> : <Sliders className="w-3 h-3 text-teal-400" />}
            <span>{showOverlayControls ? 'Ẩn Đạo Trình' : 'Đạo Trình'}</span>
          </button>
        </div>

        {/* OVERLAYS: RENDERED ONLY ON DEMAND WHEN showOverlayControls === true */}
        {showOverlayControls && (
          <>

            {/* Interactive Electrode Selector Overlay Chips */}
            <div className="absolute top-3 right-4 flex flex-col items-end space-y-1.5 max-w-[220px]">
              <span className="text-[10px] font-mono uppercase text-gray-400 font-bold px-1">
                Đạo Trình Đang Theo Dõi:
              </span>
              <div className="flex flex-wrap justify-end gap-1">
                {ELECTRODES.map((el) => {
                  const isSelected = selectedElectrode.id === el.id;
                  const isP300Peak = el.id === 'Pz';
                  return (
                    <button
                      key={el.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElectrode(el);
                        if (el.id === 'Pz') triggerP300Wave();
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                        isSelected
                          ? isP300Peak
                            ? 'bg-amber-500 text-gray-950 shadow-md shadow-amber-500/40'
                            : 'bg-teal-500 text-gray-950 shadow-md shadow-teal-500/40'
                          : isP300Peak
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-700/80 hover:bg-amber-900/80'
                          : 'bg-gray-900/90 text-gray-300 border border-gray-800 hover:border-teal-700'
                      }`}
                    >
                      {el.name}
                      {isP300Peak && ' ⚡'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Electrode Floating Inspection Card */}
            {selectedElectrode && (
              <div className="absolute bottom-24 left-4 bg-gray-950/90 backdrop-blur-md border border-teal-900/70 rounded-xl p-3 max-w-sm text-xs shadow-xl pointer-events-auto">
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-800">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-sm"
                      style={{
                        backgroundColor: selectedElectrode.id === 'Pz' ? '#f59e0b' : '#14b8a6',
                      }}
                    />
                    <span className="font-mono font-bold text-white text-sm">
                      Đạo Trình {selectedElectrode.name}
                    </span>
                    {selectedElectrode.id === 'Pz' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-600 font-bold">
                        P300 PEAK TARGET
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Trở kháng &lt; 5kΩ</span>
                </div>

                <div className="mt-2 space-y-1 text-gray-300 text-[11px]">
                  <div>
                    <span className="text-gray-500">Vị trí:</span>{' '}
                    <span className="text-teal-200 font-medium">{selectedElectrode.region}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Đặc tính sinh lý:</span>{' '}
                    <span className="text-gray-300">{selectedElectrode.description}</span>
                  </div>
                  <div className="pt-1 flex items-center justify-between font-mono text-[10px]">
                    <span className="text-gray-500">Điện thế tức thời:</span>
                    <span className="text-amber-400 font-bold">
                      {channelData[selectedElectrode.id]?.length
                        ? `${channelData[selectedElectrode.id][channelData[selectedElectrode.id].length - 1].toFixed(2)} µV`
                        : selectedElectrode.id === 'Pz'
                        ? '+16.33 µV (ERP Peak)'
                        : '+2.14 µV'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Legend Indicator */}
            <div className="absolute bottom-3.5 right-4 bg-gray-950/90 backdrop-blur-md border border-gray-800 rounded-xl px-3 py-2 text-[10px] font-mono text-gray-400 hidden sm:flex items-center space-x-3">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
                <span className="text-gray-200">Sóng P300 (Pz Đỉnh)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 shadow-sm shadow-purple-400" />
                <span className="text-gray-200">Thị Giác (Oz Chớp)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400 shadow-sm shadow-teal-400" />
                <span className="text-gray-200">Đạo Trình 10-20</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
