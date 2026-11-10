import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GridTile, TileType, TileRotation } from '../../types/simulator';
import {
  FIELD_COLS,
  FIELD_HEIGHT_CM,
  FIELD_ROWS,
  FIELD_WIDTH_CM,
  TILE_SIZE_CM,
} from '../../sim-engine/physics';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { useIDEStore } from '../../store/useIDEStore';
import {
  Compass,
  Eye,
  Maximize2,
  Minimize2,
  AlertTriangle,
  MapPin,
  RotateCw,
  Undo2,
} from 'lucide-react';

export const FieldSimulator3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const {
    tiles,
    setTileType,
    rotateTile,
    activeTool,
    activeRotation,
    robotConfig,
    robotState,
    setRobotPose,
    setRobotCell,
    rotateRobot,
    customStartPose,
    resetRobotToStartTile,
    placementMode,
    setPlacementMode,
    simStatus,
    trail,
    stepEngine,
  } = useSimulatorStore();

  const { isBuilderSplitMode, toggleBuilderSplitMode } = useIDEStore();

  const [cameraMode, setCameraMode] = useState<'iso' | 'top' | 'follow'>('iso');
  const [lightingMode, setLightingMode] = useState<'studio' | 'cyber'>('studio');
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [showCenterSplit, setShowCenterSplit] = useState<boolean>(true);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const centerLineRef = useRef<THREE.Mesh | null>(null);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const robotGroupRef = useRef<THREE.Group | null>(null);
  const leftWheelRef = useRef<THREE.Mesh | null>(null);
  const rightWheelRef = useRef<THREE.Mesh | null>(null);
  const seesawMeshRef = useRef<THREE.Group | null>(null);
  const droppedCubeRef = useRef<THREE.Mesh | null>(null);
  const trailLineRef = useRef<THREE.Line | null>(null);
  const tilesGroupRef = useRef<THREE.Group | null>(null);
  const hoverBoxRef = useRef<THREE.Mesh | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 360;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(lightingMode === 'studio' ? 0x0b0f19 : 0x05070f);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 2000);
    camera.position.set(0, 240, 260);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls (Support Scroll/Middle-click and Ctrl+Right-click camera orbit)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05; // Prevent flipping below floor
    controls.minDistance = 40;
    controls.maxDistance = 600;
    controls.target.set(0, 0, 0);
    // Configure buttons: Middle click (scroll button) = Rotate, Right click + Ctrl = Rotate
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.ROTATE, // Scroll wheel click & drag orbits camera view
      RIGHT: THREE.MOUSE.PAN,     // Right drag = Pan; Ctrl + Right drag = Orbit
    };
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.5);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(120, 260, 160);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 600;
    const d = 160;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // 6. Arena Table Base & Aluminum Outer Rim (240x120cm)
    const tableGeo = new THREE.BoxGeometry(FIELD_WIDTH_CM + 16, 8, FIELD_HEIGHT_CM + 16);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.8,
      metalness: 0.2,
    });
    const tableMesh = new THREE.Mesh(tableGeo, tableMat);
    tableMesh.position.set(0, -4.1, 0);
    tableMesh.receiveShadow = true;
    scene.add(tableMesh);

    // Outer Rim Guardrails (Aluminum border walls)
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
    const rimH = 4.0;
    const rimT = 2.0;

    // Top & Bottom rails
    const railXGeo = new THREE.BoxGeometry(FIELD_WIDTH_CM + rimT * 2, rimH, rimT);
    const railTop = new THREE.Mesh(railXGeo, rimMat);
    railTop.position.set(0, rimH / 2, -FIELD_HEIGHT_CM / 2 - rimT / 2);
    railTop.castShadow = true;
    scene.add(railTop);

    const railBottom = new THREE.Mesh(railXGeo, rimMat);
    railBottom.position.set(0, rimH / 2, FIELD_HEIGHT_CM / 2 + rimT / 2);
    railBottom.castShadow = true;
    scene.add(railBottom);

    // Left & Right rails
    const railZGeo = new THREE.BoxGeometry(rimT, rimH, FIELD_HEIGHT_CM);
    const railLeft = new THREE.Mesh(railZGeo, rimMat);
    railLeft.position.set(-FIELD_WIDTH_CM / 2 - rimT / 2, rimH / 2, 0);
    railLeft.castShadow = true;
    scene.add(railLeft);

    const railRight = new THREE.Mesh(railZGeo, rimMat);
    railRight.position.set(FIELD_WIDTH_CM / 2 + rimT / 2, rimH / 2, 0);
    railRight.castShadow = true;
    scene.add(railRight);

    // 7. Tiles Group
    const tilesGroup = new THREE.Group();
    scene.add(tilesGroup);
    tilesGroupRef.current = tilesGroup;

    // Center Field Dividing Line (X=0, divides Left 120cm & Right 120cm)
    const centerLineGeo = new THREE.PlaneGeometry(1.2, FIELD_HEIGHT_CM);
    centerLineGeo.rotateX(-Math.PI / 2);
    const centerLineMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    const centerLine = new THREE.Mesh(centerLineGeo, centerLineMat);
    centerLine.position.set(0, 0.22, 0);
    scene.add(centerLine);
    centerLineRef.current = centerLine;

    // 8. Hover Highlight Box
    const hoverGeo = new THREE.BoxGeometry(TILE_SIZE_CM - 0.4, 0.8, TILE_SIZE_CM - 0.4);
    const hoverMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.5,
      roughness: 0.2,
      metalness: 0.2,
      emissive: 0x0891b2,
      emissiveIntensity: 0.5,
    });
    const hoverBox = new THREE.Mesh(hoverGeo, hoverMat);
    hoverBox.visible = false;
    scene.add(hoverBox);
    hoverBoxRef.current = hoverBox;

    // 9. 3D Robot Assembly
    const robotGroup = new THREE.Group();
    scene.add(robotGroup);
    robotGroupRef.current = robotGroup;

    // Robot Main Chassis (18x16x6 cm)
    const chassisGeo = new THREE.BoxGeometry(18, 4.5, 15);
    const chassisMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.6 });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    chassisMesh.position.y = 3.5;
    chassisMesh.castShadow = true;
    robotGroup.add(chassisMesh);

    // Top Plate (PTBOT Atom VX ESP32)
    const plateGeo = new THREE.BoxGeometry(14, 0.6, 12);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.5 });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.y = 6.0;
    plateMesh.castShadow = true;
    robotGroup.add(plateMesh);

    // ESP32 Chip & Status LED
    const chipGeo = new THREE.BoxGeometry(5, 0.8, 5);
    const chipMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const chipMesh = new THREE.Mesh(chipGeo, chipMat);
    chipMesh.position.set(0, 6.5, 0);
    robotGroup.add(chipMesh);

    const ledGeo = new THREE.SphereGeometry(0.5, 8, 8);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.set(4, 6.5, -4);
    robotGroup.add(ledMesh);

    // Left & Right Wheels
    const wheelGeo = new THREE.CylinderGeometry(3.2, 3.2, 1.6, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });

    const leftWheel = new THREE.Mesh(wheelGeo, wheelMat);
    leftWheel.position.set(0, 3.2, -8.2);
    leftWheel.castShadow = true;
    robotGroup.add(leftWheel);
    leftWheelRef.current = leftWheel;

    const rightWheel = new THREE.Mesh(wheelGeo, wheelMat);
    rightWheel.position.set(0, 3.2, 8.2);
    rightWheel.castShadow = true;
    robotGroup.add(rightWheel);
    rightWheelRef.current = rightWheel;

    // Front Caster & Sensor Eyes (Ultrasonic)
    const eyeGeo = new THREE.CylinderGeometry(0.9, 0.9, 1.2, 12);
    eyeGeo.rotateX(Math.PI / 2);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(9.2, 4.0, -2.5);
    robotGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(9.2, 4.0, 2.5);
    robotGroup.add(rightEye);

    // Forward Direction Pointer Arrow
    const arrowGeo = new THREE.ConeGeometry(1.4, 3.0, 8);
    arrowGeo.rotateZ(-Math.PI / 2);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    arrowMesh.position.set(10.5, 4.0, 0);
    robotGroup.add(arrowMesh);

    // 10. Dropped Relief Cube
    const cubeGeo = new THREE.BoxGeometry(2.0, 2.0, 2.0);
    const cubeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.1 });
    const droppedCube = new THREE.Mesh(cubeGeo, cubeMat);
    droppedCube.position.set(0, 1.0, 0);
    droppedCube.castShadow = true;
    droppedCube.visible = false;
    scene.add(droppedCube);
    droppedCubeRef.current = droppedCube;

    // 11. 3D Trail Line
    const trailMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2, transparent: true, opacity: 0.8 });
    const trailGeo = new THREE.BufferGeometry();
    const trailLine = new THREE.Line(trailGeo, trailMat);
    scene.add(trailLine);
    trailLineRef.current = trailLine;

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // 12. Animation Loop
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const simState = useSimulatorStore.getState();
      if (simState.simStatus === 'running') {
        simState.stepEngine(dt);
      }

      // Update Controls
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 1.2;
      controls.update();

      // Camera Follow Mode
      if (cameraMode === 'follow' && robotGroupRef.current) {
        const rob = robotGroupRef.current.position;
        const targetPos = new THREE.Vector3(
          rob.x - 60 * Math.cos(robotGroupRef.current.rotation.y),
          rob.y + 35,
          rob.z - 60 * Math.sin(robotGroupRef.current.rotation.y)
        );
        camera.position.lerp(targetPos, 0.08);
        controls.target.lerp(rob, 0.1);
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
      container.innerHTML = '';
    };
  }, []);

  // Update Scene Theme / Lighting
  useEffect(() => {
    if (!sceneRef.current || !dirLightRef.current || !hemiLightRef.current) return;
    if (lightingMode === 'cyber') {
      sceneRef.current.background = new THREE.Color(0x05070f);
      dirLightRef.current.color = new THREE.Color(0x38bdf8);
      dirLightRef.current.intensity = 1.0;
      hemiLightRef.current.color = new THREE.Color(0xa855f7);
    } else {
      sceneRef.current.background = new THREE.Color(0x0b0f19);
      dirLightRef.current.color = new THREE.Color(0xffffff);
      dirLightRef.current.intensity = 1.4;
      hemiLightRef.current.color = new THREE.Color(0x38bdf8);
    }
  }, [lightingMode]);

  // Re-build 3D Field Tiles whenever `tiles` change
  useEffect(() => {
    const tilesGroup = tilesGroupRef.current;
    if (!tilesGroup) return;

    // Clear previous tiles
    while (tilesGroup.children.length > 0) {
      const obj = tilesGroup.children[0];
      tilesGroup.remove(obj);
    }

    // Shared materials
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
    const darkLineMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.3, roughness: 0.4 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
    const cyanMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.4 });
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.5 });
    const grayDeckMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });
    const guardrailMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.7 });

    tiles.forEach((tile) => {
      // Cell center in world 3D coordinates (cm)
      const cx = -FIELD_WIDTH_CM / 2 + tile.col * TILE_SIZE_CM + TILE_SIZE_CM / 2;
      const cz = -FIELD_HEIGHT_CM / 2 + tile.row * TILE_SIZE_CM + TILE_SIZE_CM / 2;
      const rot = ((tile.rotation || 0) * Math.PI) / 180;

      const tileRoot = new THREE.Group();
      tileRoot.position.set(cx, 0, cz);
      tileRoot.rotation.y = -rot; // Invert for Three.js Y-rotation
      tileRoot.userData = { row: tile.row, col: tile.col };

      // Base Floor Slab
      const slabGeo = new THREE.BoxGeometry(TILE_SIZE_CM - 0.2, 0.4, TILE_SIZE_CM - 0.2);
      const baseSlab = new THREE.Mesh(slabGeo, floorMat);
      baseSlab.position.y = 0.2;
      baseSlab.receiveShadow = true;
      tileRoot.add(baseSlab);

      const LINE_W = 2.0; // Line width in cm
      const LINE_H = 0.25; // Line height in cm

      if (tile.type === 'start') {
        const startGeo = new THREE.BoxGeometry(TILE_SIZE_CM - 1, 0.5, TILE_SIZE_CM - 1);
        const startMesh = new THREE.Mesh(startGeo, redMat);
        startMesh.position.y = 0.35;
        startMesh.receiveShadow = true;
        tileRoot.add(startMesh);
      } else if (tile.type === 'finish') {
        const finGeo = new THREE.BoxGeometry(TILE_SIZE_CM - 1, 0.5, TILE_SIZE_CM - 1);
        const finMesh = new THREE.Mesh(finGeo, cyanMat);
        finMesh.position.y = 0.35;
        finMesh.receiveShadow = true;
        tileRoot.add(finMesh);
      } else if (tile.type === 'checkpoint') {
        // Yellow cylindrical checkpoint disk
        const cpGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 24);
        const cpMesh = new THREE.Mesh(cpGeo, yellowMat);
        cpMesh.position.y = 0.45;
        cpMesh.castShadow = true;
        tileRoot.add(cpMesh);
      } else if (tile.type === 'checkpoint_line') {
        // Yellow checkpoint + Bottom single line
        const cpGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 24);
        const cpMesh = new THREE.Mesh(cpGeo, yellowMat);
        cpMesh.position.y = 0.45;
        cpMesh.castShadow = true;
        tileRoot.add(cpMesh);

        const lineGeo = new THREE.BoxGeometry(TILE_SIZE_CM, LINE_H, LINE_W);
        const lineMesh = new THREE.Mesh(lineGeo, darkLineMat);
        lineMesh.position.set(0, 0.4 + LINE_H / 2, TILE_SIZE_CM / 2 - LINE_W / 2);
        tileRoot.add(lineMesh);
      } else if (tile.type === 'checkpoint_corner') {
        // Yellow checkpoint + Corner L border
        const cpGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 24);
        const cpMesh = new THREE.Mesh(cpGeo, yellowMat);
        cpMesh.position.y = 0.45;
        cpMesh.castShadow = true;
        tileRoot.add(cpMesh);

        const line1 = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE_CM, LINE_H, LINE_W), darkLineMat);
        line1.position.set(0, 0.4 + LINE_H / 2, -TILE_SIZE_CM / 2 + LINE_W / 2);
        tileRoot.add(line1);

        const line2 = new THREE.Mesh(new THREE.BoxGeometry(LINE_W, LINE_H, TILE_SIZE_CM), darkLineMat);
        line2.position.set(-TILE_SIZE_CM / 2 + LINE_W / 2, 0.4 + LINE_H / 2, 0);
        tileRoot.add(line2);
      } else if (tile.type === 'checkpoint_parallel') {
        // Yellow checkpoint + Parallel lines
        const cpGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 24);
        const cpMesh = new THREE.Mesh(cpGeo, yellowMat);
        cpMesh.position.y = 0.45;
        cpMesh.castShadow = true;
        tileRoot.add(cpMesh);

        const line1 = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE_CM, LINE_H, LINE_W), darkLineMat);
        line1.position.set(0, 0.4 + LINE_H / 2, -TILE_SIZE_CM / 2 + LINE_W / 2);
        tileRoot.add(line1);

        const line2 = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE_CM, LINE_H, LINE_W), darkLineMat);
        line2.position.set(0, 0.4 + LINE_H / 2, TILE_SIZE_CM / 2 - LINE_W / 2);
        tileRoot.add(line2);
      } else if (tile.type === 'line_straight') {
        const lineGeo = new THREE.BoxGeometry(TILE_SIZE_CM, LINE_H, LINE_W);
        const lineMesh = new THREE.Mesh(lineGeo, darkLineMat);
        lineMesh.position.set(0, 0.4 + LINE_H / 2, TILE_SIZE_CM / 2 - LINE_W / 2);
        tileRoot.add(lineMesh);
      } else if (tile.type === 'line_corner') {
        const line1 = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE_CM, LINE_H, LINE_W), darkLineMat);
        line1.position.set(0, 0.4 + LINE_H / 2, TILE_SIZE_CM / 2 - LINE_W / 2);
        tileRoot.add(line1);

        const line2 = new THREE.Mesh(new THREE.BoxGeometry(LINE_W, LINE_H, TILE_SIZE_CM), darkLineMat);
        line2.position.set(-TILE_SIZE_CM / 2 + LINE_W / 2, 0.4 + LINE_H / 2, 0);
        tileRoot.add(line2);
      } else if (tile.type === 'line_parallel') {
        const line1 = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE_CM, LINE_H, LINE_W), darkLineMat);
        line1.position.set(0, 0.4 + LINE_H / 2, -TILE_SIZE_CM / 2 + LINE_W / 2);
        tileRoot.add(line1);

        const line2 = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE_CM, LINE_H, LINE_W), darkLineMat);
        line2.position.set(0, 0.4 + LINE_H / 2, TILE_SIZE_CM / 2 - LINE_W / 2);
        tileRoot.add(line2);
      } else if (tile.type === 'line_u') {
        const line1 = new THREE.Mesh(new THREE.BoxGeometry(LINE_W, LINE_H, TILE_SIZE_CM), darkLineMat);
        line1.position.set(-TILE_SIZE_CM / 2 + LINE_W / 2, 0.4 + LINE_H / 2, 0);
        tileRoot.add(line1);

        const line2 = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE_CM, LINE_H, LINE_W), darkLineMat);
        line2.position.set(0, 0.4 + LINE_H / 2, TILE_SIZE_CM / 2 - LINE_W / 2);
        tileRoot.add(line2);

        const line3 = new THREE.Mesh(new THREE.BoxGeometry(LINE_W, LINE_H, TILE_SIZE_CM), darkLineMat);
        line3.position.set(TILE_SIZE_CM / 2 - LINE_W / 2, 0.4 + LINE_H / 2, 0);
        tileRoot.add(line3);
      } else if (tile.type === 'line_box' || tile.type === 'pt_robotics') {
        const boxRimGeo = new THREE.BoxGeometry(TILE_SIZE_CM - 2, LINE_H, TILE_SIZE_CM - 2);
        const boxRim = new THREE.Mesh(boxRimGeo, darkLineMat);
        boxRim.position.y = 0.4 + LINE_H / 2;
        tileRoot.add(boxRim);

        const innerGeo = new THREE.BoxGeometry(TILE_SIZE_CM - 6, LINE_H + 0.1, TILE_SIZE_CM - 6);
        const innerMesh = new THREE.Mesh(innerGeo, floorMat);
        innerMesh.position.y = 0.4 + LINE_H / 2;
        tileRoot.add(innerMesh);
      } else if (tile.type === 'bridge_up' || tile.type === 'bridge') {
        // Green 3D Wedge Ramp (0 -> 5.0 cm elevation)
        const rampShape = new THREE.Shape();
        rampShape.moveTo(-TILE_SIZE_CM / 2, 0);
        rampShape.lineTo(TILE_SIZE_CM / 2, 5.0);
        rampShape.lineTo(TILE_SIZE_CM / 2, 0);
        rampShape.closePath();

        const extrudeSettings = { depth: TILE_SIZE_CM - 0.4, bevelEnabled: false };
        const rampGeo = new THREE.ExtrudeGeometry(rampShape, extrudeSettings);
        rampGeo.center();
        const rampMesh = new THREE.Mesh(rampGeo, greenMat);
        rampMesh.position.set(0, 2.5, 0);
        rampMesh.castShadow = true;
        rampMesh.receiveShadow = true;
        tileRoot.add(rampMesh);
      } else if (tile.type === 'bridge_deck') {
        // Gray Flat Deck at 5.0 cm height
        const deckGeo = new THREE.BoxGeometry(TILE_SIZE_CM, 5.0, TILE_SIZE_CM - 0.4);
        const deckMesh = new THREE.Mesh(deckGeo, grayDeckMat);
        deckMesh.position.y = 2.5;
        deckMesh.castShadow = true;
        deckMesh.receiveShadow = true;
        tileRoot.add(deckMesh);

        // Yellow Side Safety Rails
        const railGeo = new THREE.BoxGeometry(TILE_SIZE_CM, 1.2, 0.8);
        const railTop = new THREE.Mesh(railGeo, yellowMat);
        railTop.position.set(0, 5.6, -TILE_SIZE_CM / 2 + 0.6);
        tileRoot.add(railTop);

        const railBottom = new THREE.Mesh(railGeo, yellowMat);
        railBottom.position.set(0, 5.6, TILE_SIZE_CM / 2 - 0.6);
        tileRoot.add(railBottom);
      } else if (tile.type === 'bridge_down') {
        // Yellow 3D Wedge Ramp (5.0 -> 0 cm slope)
        const rampShape = new THREE.Shape();
        rampShape.moveTo(-TILE_SIZE_CM / 2, 5.0);
        rampShape.lineTo(TILE_SIZE_CM / 2, 0);
        rampShape.lineTo(-TILE_SIZE_CM / 2, 0);
        rampShape.closePath();

        const extrudeSettings = { depth: TILE_SIZE_CM - 0.4, bevelEnabled: false };
        const rampGeo = new THREE.ExtrudeGeometry(rampShape, extrudeSettings);
        rampGeo.center();
        const rampMesh = new THREE.Mesh(rampGeo, yellowMat);
        rampMesh.position.set(0, 2.5, 0);
        rampMesh.castShadow = true;
        rampMesh.receiveShadow = true;
        tileRoot.add(rampMesh);
      } else if (tile.type === 'seesaw') {
        // 3D Seesaw Tilting Platform (Strictly 300x300mm = 1 Modular Tile, Height 40mm, ~12 deg tilt)
        const seesawGroup = new THREE.Group();
        seesawMeshRef.current = seesawGroup;

        // Metallic/Orange Center Fulcrum Cylinder (หมุนบนแกนทรงกระบอก สูง 40mm)
        const fulcrumRadius = 1.6;
        const fulcrumLength = TILE_SIZE_CM - 1.0;
        const fulcrumGeo = new THREE.CylinderGeometry(fulcrumRadius, fulcrumRadius, fulcrumLength, 20);
        fulcrumGeo.rotateX(Math.PI / 2); // Lay horizontal across travel lane
        const fulcrumMat = new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.6, roughness: 0.3 });
        const fulcrum = new THREE.Mesh(fulcrumGeo, fulcrumMat);
        fulcrum.position.set(0, fulcrumRadius, 0);
        tileRoot.add(fulcrum);

        // Seesaw Tilting Board (Standard 300x300mm: 29.6 x 29.6 cm)
        seesawGroup.position.set(0, 3.4, 0);
        const plankGeo = new THREE.BoxGeometry(TILE_SIZE_CM - 0.4, 0.6, TILE_SIZE_CM - 0.4);
        const plankMesh = new THREE.Mesh(plankGeo, floorMat);
        plankMesh.position.set(0, 0.3, 0);
        plankMesh.castShadow = true;
        plankMesh.receiveShadow = true;
        seesawGroup.add(plankMesh);

        // Blue Side Safety Rails (ความสูงขอบ 20mm = 2.0cm ตามสเปก)
        const railH = 2.0;
        const railT = 0.6;
        const sRailGeo = new THREE.BoxGeometry(TILE_SIZE_CM - 0.4, railH, railT);
        const sRail1 = new THREE.Mesh(sRailGeo, guardrailMat);
        sRail1.position.set(0, railH / 2 + 0.3, -TILE_SIZE_CM / 2 + railT / 2 + 0.2);
        seesawGroup.add(sRail1);

        const sRail2 = new THREE.Mesh(sRailGeo, guardrailMat);
        sRail2.position.set(0, railH / 2 + 0.3, TILE_SIZE_CM / 2 - railT / 2 - 0.2);
        seesawGroup.add(sRail2);

        // Initial resting tilt (~12 deg = ~0.21 rad)
        seesawGroup.rotation.z = 0.20;
        tileRoot.add(seesawGroup);
      } else if (tile.type === 'tunnel') {
        // 3D Straight Tunnel Roof (Fits 300x300mm tile, clear height 14cm)
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.4 });
        const wallH = 14.0;
        const wallT = 1.2;
        const tLen = TILE_SIZE_CM - 0.4;

        // Left & Right Tunnel Walls (along travel direction)
        const wallGeo = new THREE.BoxGeometry(tLen, wallH, wallT);
        const wall1 = new THREE.Mesh(wallGeo, wallMat);
        wall1.position.set(0, wallH / 2, -TILE_SIZE_CM / 2 + wallT / 2 + 0.2);
        wall1.castShadow = true;
        tileRoot.add(wall1);

        const wall2 = new THREE.Mesh(wallGeo, wallMat);
        wall2.position.set(0, wallH / 2, TILE_SIZE_CM / 2 - wallT / 2 - 0.2);
        wall2.castShadow = true;
        tileRoot.add(wall2);

        // Tunnel Roof
        const roofGeo = new THREE.BoxGeometry(tLen, 0.8, TILE_SIZE_CM - 0.4);
        const roof = new THREE.Mesh(roofGeo, wallMat);
        roof.position.set(0, wallH, 0);
        roof.castShadow = true;
        tileRoot.add(roof);
      } else if (tile.type === 'tunnel_corner') {
        // 3D Corner Tunnel (90-deg turn, Height 30.0 cm)
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.4 });
        const wallH = 28.0;
        const wallT = 1.5;

        // Outer corner walls: Back and Left
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE_CM, wallH, wallT), wallMat);
        backWall.position.set(0, wallH / 2, -TILE_SIZE_CM / 2 + wallT / 2);
        backWall.castShadow = true;
        tileRoot.add(backWall);

        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, TILE_SIZE_CM), wallMat);
        leftWall.position.set(-TILE_SIZE_CM / 2 + wallT / 2, wallH / 2, 0);
        leftWall.castShadow = true;
        tileRoot.add(leftWall);

        // Roof
        const roof = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE_CM, 1.0, TILE_SIZE_CM), wallMat);
        roof.position.set(0, wallH, 0);
        roof.castShadow = true;
        tileRoot.add(roof);
      } else if (tile.type === 'hill_drop') {
        // Hill Drop Ramp (600x300mm ramp incline to 50mm, 100mm side/back walls, green drop zone)
        const rampShape = new THREE.Shape();
        rampShape.moveTo(-TILE_SIZE_CM / 2, 0);
        rampShape.lineTo(0, 5.0);
        rampShape.lineTo(TILE_SIZE_CM / 2, 5.0);
        rampShape.lineTo(TILE_SIZE_CM / 2, 0);
        rampShape.closePath();

        const extrudeSettings = { depth: TILE_SIZE_CM - 0.4, bevelEnabled: false };
        const hillGeo = new THREE.ExtrudeGeometry(rampShape, extrudeSettings);
        hillGeo.center();
        const hillMesh = new THREE.Mesh(hillGeo, floorMat);
        hillMesh.position.set(0, 2.5, 0);
        hillMesh.castShadow = true;
        hillMesh.receiveShadow = true;
        tileRoot.add(hillMesh);

        // Green payload drop target zone on elevated flat top
        const greenDrop = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE_CM / 2, 0.2, TILE_SIZE_CM - 2), greenMat);
        greenDrop.position.set(TILE_SIZE_CM / 4, 5.1, 0);
        tileRoot.add(greenDrop);

        // Side safety guardrails (100mm min)
        const railGeo = new THREE.BoxGeometry(TILE_SIZE_CM / 2, 5.0, 1.0);
        const r1 = new THREE.Mesh(railGeo, grayDeckMat);
        r1.position.set(TILE_SIZE_CM / 4, 7.5, -TILE_SIZE_CM / 2 + 0.7);
        tileRoot.add(r1);

        const r2 = new THREE.Mesh(railGeo, grayDeckMat);
        r2.position.set(TILE_SIZE_CM / 4, 7.5, TILE_SIZE_CM / 2 - 0.7);
        tileRoot.add(r2);

        const rBack = new THREE.Mesh(new THREE.BoxGeometry(1.0, 5.0, TILE_SIZE_CM), grayDeckMat);
        rBack.position.set(TILE_SIZE_CM / 2 - 0.5, 7.5, 0);
        tileRoot.add(rBack);
      } else if (tile.type === 'speed_bumps' || tile.type === 'bump') {
        // 7 3D Cylindrical Rumble Strips
        const stripCount = 7;
        const stripR = 1.5;
        const spacing = TILE_SIZE_CM / (stripCount + 1);

        for (let s = 1; s <= stripCount; s++) {
          const sx = -TILE_SIZE_CM / 2 + s * spacing;
          const stripGeo = new THREE.CylinderGeometry(stripR, stripR, TILE_SIZE_CM - 2, 12);
          stripGeo.rotateX(Math.PI / 2);
          const stripMat = s % 2 === 0 ? darkLineMat : yellowMat;
          const strip = new THREE.Mesh(stripGeo, stripMat);
          strip.position.set(sx, stripR, 0);
          strip.castShadow = true;
          tileRoot.add(strip);
        }
      } else if (tile.type === 'black_pit') {
        // Recessed Black Pit
        const pitGeo = new THREE.BoxGeometry(20, 0.1, 28);
        const pitMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const pitMesh = new THREE.Mesh(pitGeo, pitMat);
        pitMesh.position.y = 0.42;
        tileRoot.add(pitMesh);

        // Hazard Border Stripes
        const borderGeo = new THREE.BoxGeometry(22, 0.4, 30);
        const borderMat = new THREE.MeshBasicMaterial({ color: 0xef4444, wireframe: true });
        const borderMesh = new THREE.Mesh(borderGeo, borderMat);
        borderMesh.position.y = 0.43;
        tileRoot.add(borderMesh);
      } else if (tile.type === 'barrier_bomb') {
        // 3D Barrier Bar with Posts
        const postGeo = new THREE.CylinderGeometry(0.8, 0.8, 6, 12);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });

        const post1 = new THREE.Mesh(postGeo, postMat);
        post1.position.set(-8, 3, 0);
        post1.castShadow = true;
        tileRoot.add(post1);

        const post2 = new THREE.Mesh(postGeo, postMat);
        post2.position.set(8, 3, 0);
        post2.castShadow = true;
        tileRoot.add(post2);

        // Horizontal Caution Bar
        const barGeo = new THREE.BoxGeometry(22, 1.8, 1.2);
        const barMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
        const bar = new THREE.Mesh(barGeo, barMat);
        bar.position.set(0, 5, 0);
        bar.castShadow = true;
        tileRoot.add(bar);
      } else if (tile.type === 'drop_red' || tile.type === 'drop_green' || tile.type === 'drop_yellow' || tile.type === 'drop_blue') {
        // Relief Payload Drop Zone: 300x150mm colored pad on floor (unobstructed through-lane)
        const colMat = tile.type === 'drop_red' ? redMat : tile.type === 'drop_green' ? greenMat : tile.type === 'drop_yellow' ? yellowMat : guardrailMat;

        // 300x140mm colored pad on the side
        const padGeo = new THREE.BoxGeometry(TILE_SIZE_CM - 1, 0.2, TILE_SIZE_CM / 2 - 1);
        const pad = new THREE.Mesh(padGeo, colMat);
        pad.position.set(0, 0.35, TILE_SIZE_CM / 4);
        pad.receiveShadow = true;
        tileRoot.add(pad);

        // Outer back boundary line (leaving travel corridor through the tile completely open)
        const botW = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE_CM, LINE_H, LINE_W), darkLineMat);
        botW.position.set(0, 0.4 + LINE_H / 2, TILE_SIZE_CM / 2 - LINE_W / 2);
        botW.castShadow = true;
        tileRoot.add(botW);
      }

      tilesGroup.add(tileRoot);
    });
  }, [tiles]);

  // Synchronize 3D Robot Position, Pitch, Wheels & Dropped Cube
  useEffect(() => {
    const rob = robotGroupRef.current;
    if (!rob) return;

    // Convert 2D simulator coordinates (0..240, 0..120) to 3D world units centered at (0, 0)
    const wx = -FIELD_WIDTH_CM / 2 + robotState.x;
    const wz = -FIELD_HEIGHT_CM / 2 + robotState.y;

    // Robot Y elevation based on pitch / bridge ramp
    const elev = robotState.pitch > 0 ? (robotState.pitch / 15) * 4.0 : 0;
    rob.position.set(wx, elev, wz);
    rob.rotation.y = -robotState.theta;
    rob.rotation.z = (robotState.pitch * Math.PI) / 180;
    rob.rotation.x = (robotState.roll * Math.PI) / 180;

    // Rotate wheels as robot moves
    if (leftWheelRef.current && rightWheelRef.current) {
      const wheelRot = robotState.simTimeSec * 15;
      leftWheelRef.current.rotation.x = wheelRot;
      rightWheelRef.current.rotation.x = wheelRot;
    }

    // Dynamic 3D Seesaw Tilt
    if (seesawMeshRef.current) {
      const seesawTile = tiles.find((t) => t.type === 'seesaw');
      if (seesawTile) {
        const sx = -FIELD_WIDTH_CM / 2 + seesawTile.col * TILE_SIZE_CM + TILE_SIZE_CM / 2;
        const sz = -FIELD_HEIGHT_CM / 2 + seesawTile.row * TILE_SIZE_CM + TILE_SIZE_CM / 2;
        const dist = Math.hypot(wx - sx, wz - sz);
        if (dist < 18) {
          // Robot is on the seesaw: tilts forward (-0.21) or backward (+0.21) based on center
          const isForward = (seesawTile.rotation === 90 || seesawTile.rotation === 270)
            ? wz > sz
            : wx > sx;
          seesawMeshRef.current.rotation.z = isForward ? -0.21 : 0.21;
        } else {
          // Resting tilt angle (~12 deg)
          seesawMeshRef.current.rotation.z = 0.20;
        }
      }
    }

    // Dropped Relief Cube
    if (droppedCubeRef.current) {
      droppedCubeRef.current.visible = !!robotState.reliefCubeDropped;
      if (robotState.reliefCubeDropped) {
        droppedCubeRef.current.position.set(wx - 5, 1.0, wz);
      }
    }

    // Update 3D Trail
    if (trailLineRef.current && trail.length > 1) {
      const points: THREE.Vector3[] = trail.map(
        (pt) => new THREE.Vector3(-FIELD_WIDTH_CM / 2 + pt.x, 0.4, -FIELD_HEIGHT_CM / 2 + pt.y)
      );
      trailLineRef.current.geometry.setFromPoints(points);
    }
  }, [robotState, trail, tiles]);

  // Toggle Center Field Dividing Line
  useEffect(() => {
    if (centerLineRef.current) {
      centerLineRef.current.visible = showCenterSplit;
    }
  }, [showCenterSplit]);

  // Calculate Grid Tile from Screen Pointer (X, Y)
  const getTileFromScreenPos = useCallback((clientX: number, clientY: number) => {
    const container = mountRef.current;
    const camera = cameraRef.current;
    if (!container || !camera) return null;

    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPt = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPt);

    if (!intersectPt) return null;

    const cmX = intersectPt.x + FIELD_WIDTH_CM / 2;
    const cmY = intersectPt.z + FIELD_HEIGHT_CM / 2;

    if (cmX < 0 || cmX > FIELD_WIDTH_CM || cmY < 0 || cmY > FIELD_HEIGHT_CM) {
      return null;
    }

    const col = Math.floor(cmX / TILE_SIZE_CM);
    const row = Math.floor(cmY / TILE_SIZE_CM);

    if (col < 0 || col >= FIELD_COLS || row < 0 || row >= FIELD_ROWS) {
      return null;
    }

    return { row, col, cmX, cmY };
  }, []);

  const updateHoverBox = useCallback((cell: { row: number; col: number } | null) => {
    if (!hoverBoxRef.current) return;
    if (cell) {
      setHoveredCell(cell);
      hoverBoxRef.current.position.set(
        -FIELD_WIDTH_CM / 2 + cell.col * TILE_SIZE_CM + TILE_SIZE_CM / 2,
        0.5,
        -FIELD_HEIGHT_CM / 2 + cell.row * TILE_SIZE_CM + TILE_SIZE_CM / 2
      );
      const isRobot = useSimulatorStore.getState().placementMode === 'robot';
      const mat = hoverBoxRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.color.setHex(isRobot ? 0xf59e0b : 0x06b6d4);
        mat.emissive.setHex(isRobot ? 0xd97706 : 0x0891b2);
      }
      hoverBoxRef.current.visible = true;
    } else {
      setHoveredCell(null);
      hoverBoxRef.current.visible = false;
    }
  }, []);

  // Pointer & Drag-and-Drop Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const cell = getTileFromScreenPos(e.clientX, e.clientY);
    updateHoverBox(cell);
  };

  const handlePointerLeave = () => {
    updateHoverBox(null);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerDownPos.current) return;
    const dist = Math.hypot(e.clientX - pointerDownPos.current.x, e.clientY - pointerDownPos.current.y);
    pointerDownPos.current = null;
    // If user dragged more than 6px, they were orbiting the 3D camera
    if (dist > 6) return;

    // Middle click (scroll button) and Ctrl+Right-click are reserved for camera orbit
    if (e.button === 1) return;
    if (e.button === 2 && (e.ctrlKey || e.metaKey)) return;

    const cell = getTileFromScreenPos(e.clientX, e.clientY);
    if (!cell) return;

    if (e.button === 2) {
      // Normal Right Click: Rotate robot if in robot placement mode, otherwise rotate tile 90°
      if (placementMode === 'robot') {
        rotateRobot(90);
      } else {
        rotateTile(cell.row, cell.col);
      }
    } else if (e.button === 0) {
      // Left Click: Place robot centered in selected tile if in robot mode, otherwise place selected tile
      if (placementMode === 'robot') {
        setRobotCell(cell.row, cell.col);
      } else {
        setTileType(cell.row, cell.col, activeTool, activeRotation);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const cell = getTileFromScreenPos(e.clientX, e.clientY);
    updateHoverBox(cell);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const cell = getTileFromScreenPos(e.clientX, e.clientY);
    if (!cell) return;

    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        if (parsed && parsed.type) {
          setTileType(cell.row, cell.col, parsed.type, parsed.rotation ?? activeRotation);
          return;
        }
      }
    } catch (err) {}

    setTileType(cell.row, cell.col, activeTool, activeRotation);
  };

  // Camera Presets
  const setCameraView = (view: 'iso' | 'top' | 'follow') => {
    setCameraMode(view);
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;

    if (view === 'iso') {
      cam.position.set(130, 210, 230);
      ctrl.target.set(0, 0, 0);
    } else if (view === 'top') {
      cam.position.set(0, 310, 1);
      ctrl.target.set(0, 0, 0);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col h-full bg-[#0b0f19] select-none overflow-hidden group">
      {/* 3D WebGL Canvas Container with Drag-Drop & Direct Click Placement */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerUp={handlePointerUp}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onContextMenu={(e) => e.preventDefault()}
        className="flex-1 w-full h-full cursor-pointer active:cursor-grabbing outline-none"
      />

      {/* Top Floating HUD Controls */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none gap-2 select-none overflow-x-auto">
        {/* Left: View Mode Pills (Only essential 3D Orbit and Top-Down) + Robot Mode */}
        <div className="flex items-center gap-1 bg-surface-darker/90 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-xl pointer-events-auto text-xs shrink-0 whitespace-nowrap">
          <button
            onClick={() => setCameraView('iso')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition ${
              cameraMode === 'iso' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="มุมมอง 3 มิติ หมุนอิสระ (กดปุ่ม Scroll กลางเม้าส์ค้าง หรือ Ctrl + คลิกขวา แล้วลากเม้าส์)"
          >
            <Compass size={12} />
            <span>3D Orbit</span>
          </button>

          <button
            onClick={() => setCameraView('top')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition ${
              cameraMode === 'top' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="มุมมอง 2 มิติ จากด้านบน"
          >
            <Eye size={12} />
            <span>Top-Down</span>
          </button>

          <div className="w-[1px] h-3.5 bg-white/10 mx-0.5" />

          {/* Placement Mode Toggle in HUD */}
          <button
            onClick={() => setPlacementMode(placementMode === 'robot' ? 'tile' : 'robot')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition ${
              placementMode === 'robot'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25 animate-pulse'
                : 'text-slate-400 hover:text-white'
            }`}
            title={placementMode === 'robot' ? 'โหมดย้ายหุ่นยนต์กำลังทำงาน (คลิกสนามเพื่อวาง)' : 'คลิกเพื่อเปิดโหมดย้ายตำแหน่งหุ่นยนต์'}
          >
            <MapPin size={12} />
            <span>{placementMode === 'robot' ? 'วางหุ่น...' : 'ย้ายหุ่น'}</span>
          </button>
        </div>

        {/* Center: Selected Tile Name & Rotation OR Robot Placement Hint */}
        {placementMode === 'robot' ? (
          <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-500/40 shadow-xl pointer-events-auto text-xs text-amber-200 shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span className="font-semibold text-amber-300">คลิกที่ช่องเพื่อวางหุ่น</span>
            <button
              onClick={() => rotateRobot(90)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/30 hover:bg-amber-500/50 text-white font-medium text-[11px] border border-amber-400/30 transition"
              title="หมุนหุ่นยนต์ 90° (หรือคลิกขวาที่ช่องสนาม)"
            >
              <RotateCw size={11} />
              <span>หมุน 90° ({Math.round((((robotState.theta * 180) / Math.PI) % 360 + 360) % 360)}°)</span>
            </button>
            <button
              onClick={() => setPlacementMode('tile')}
              className="px-2 py-0.5 rounded-lg bg-surface-dark hover:bg-surface-card text-slate-300 text-[11px] border border-white/20 transition"
            >
              เสร็จสิ้น
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-surface-darker/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-xl pointer-events-auto text-xs text-slate-200 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-brand-300 font-mono text-xs">{activeTool}</span>
            <span className="text-amber-400 font-mono text-xs">({activeRotation}°)</span>
          </div>
        )}

        {/* Right: Prominent "เต็มจอ" (Full Screen Builder) Button */}
        <div className="flex items-center pointer-events-auto shrink-0 whitespace-nowrap">
          <button
            onClick={toggleBuilderSplitMode}
            title={
              isBuilderSplitMode
                ? "ย่อหน้าต่างกลับสู่หน้าเขียนโค้ดปกติ"
                : "ขยายโหมดจัดสนามเต็มจอ (ปิดหน้าโค้ด แล้วย้ายเครื่องมือจัดสนามไปไว้ฝั่งซ้าย)"
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-xl border ${
              isBuilderSplitMode
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/50 shadow-emerald-950'
                : 'bg-brand-500 hover:bg-brand-400 text-white border-brand-400/50 shadow-brand-950'
            }`}
          >
            {isBuilderSplitMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{isBuilderSplitMode ? 'ย่อจอ (กลับหน้าโค้ด)' : 'เต็มจอ'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Floating Telemetry Mini-Overlay */}
      <div className="absolute bottom-3 left-3 bg-surface-darker/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] font-mono text-slate-300 shadow-xl pointer-events-none flex items-center gap-3">
        <div>
          <span className="text-slate-500">POS: </span>
          <span className="text-brand-300 font-bold">X:{robotState.x.toFixed(0)} Y:{robotState.y.toFixed(0)} cm</span>
        </div>
        <div className="text-slate-600">|</div>
        <div>
          <span className="text-slate-500">PITCH: </span>
          <span className={`font-bold ${robotState.pitch !== 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {robotState.pitch > 0 ? `+${robotState.pitch.toFixed(1)}°` : `${robotState.pitch.toFixed(1)}°`}
          </span>
        </div>
        <div className="text-slate-600">|</div>
        <div>
          <span className="text-slate-500">HEADING: </span>
          <span className="text-teal-300 font-bold">{((robotState.theta * 180) / Math.PI).toFixed(0)}°</span>
        </div>
      </div>

      {/* Disqualification Foul Banner */}
      {robotState.isFoul && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-red-950/90 border border-red-500 text-red-200 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-bounce z-30">
          <AlertTriangle size={24} className="text-red-400 shrink-0" />
          <div>
            <div className="font-bold text-xs uppercase tracking-wider text-red-400">Simulation Disqualified</div>
            <div className="text-xs font-medium">{robotState.foulReason}</div>
          </div>
          <button
            onClick={() => useSimulatorStore.getState().resetRobot()}
            className="ml-2 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition shadow"
          >
            รีเซ็ตหุ่น
          </button>
        </div>
      )}
    </div>
  );
};
