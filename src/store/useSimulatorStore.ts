import { create } from 'zustand';
import {
  BridgeDirection,
  GridTile,
  MotionStep,
  RobotConfig,
  RobotState,
  SimStatus,
  TileType,
} from '../types/simulator';
import {
  DEFAULT_ROBOT_CONFIG,
  FIELD_COLS,
  FIELD_ROWS,
  stepPhysics,
  TILE_SIZE_CM,
  FIELD_WIDTH_CM,
  FIELD_HEIGHT_CM,
  evaluateTerrain,
  checkNoGoCollision,
} from '../sim-engine/physics';
import { parseCCodeToMotionSteps, parseProjectToMotionSteps } from '../sim-engine/cInterpreter';
import { SketchFile } from '../types/ide';

// Initial 4x8 Grid tiles - Official Competition Preset from PDF
export function createOfficialCompetitionTiles(): GridTile[] {
  const tiles: GridTile[] = [];
  for (let r = 0; r < FIELD_ROWS; r++) {
    for (let c = 0; c < FIELD_COLS; c++) {
      tiles.push({ row: r, col: c, type: 'normal', rotation: 0 });
    }
  }

  const setTile = (r: number, c: number, type: TileType, rotation: 0 | 90 | 180 | 270 = 0, label?: string) => {
    const t = tiles.find(item => item.row === r && item.col === c);
    if (t) {
      t.type = type;
      t.rotation = rotation;
      if (label) t.label = label;
    }
  };

  // Row 0
  setTile(0, 0, 'line_corner', 0);
  setTile(0, 1, 'checkpoint', 0, 'CP 1');
  setTile(0, 2, 'tunnel', 0, 'อุโมงค์ (บน)');
  setTile(0, 3, 'normal', 0);
  setTile(0, 4, 'normal', 0);
  setTile(0, 5, 'speed_bumps', 0, 'ลูกระนาด');
  setTile(0, 6, 'drop_red', 0, 'จุดปล่อยถุงยังชีพ');
  setTile(0, 7, 'finish', 0, 'FINISH');

  // Row 1
  setTile(1, 0, 'line_straight', 270);
  setTile(1, 1, 'line_straight', 180);
  setTile(1, 2, 'tunnel', 0, 'ทางเข้า-ออกอุโมงค์');
  setTile(1, 3, 'pt_robotics', 0, 'PT ROBOTICS');
  setTile(1, 4, 'checkpoint', 0, 'Check Point');
  setTile(1, 5, 'speed_bumps', 0, 'ลูกระนาด');
  setTile(1, 6, 'barrier_bomb', 0, 'จุดลูกระเบิด');
  setTile(1, 7, 'line_straight', 90);

  // Row 2
  setTile(2, 0, 'hill_drop', 0, 'เนินปล่อยถุงยังชีพ');
  setTile(2, 1, 'drop_blue', 0, 'ปล่อยบนเนิน (น้ำเงิน)');
  setTile(2, 2, 'line_straight', 270);
  setTile(2, 3, 'normal', 0);
  setTile(2, 4, 'seesaw', 0, 'ไม้กระดก (ทางขึ้น)');
  setTile(2, 5, 'seesaw', 180, 'ไม้กระดก (ทางลง)');
  setTile(2, 6, 'normal', 0);
  setTile(2, 7, 'line_straight', 90);

  // Row 3 (Bottom)
  setTile(3, 0, 'drop_green', 0, 'ปล่อยบนเนิน (เขียว)');
  setTile(3, 1, 'drop_yellow', 0, 'ปล่อยบนเนิน (เหลือง)');
  setTile(3, 2, 'normal', 0);
  setTile(3, 3, 'line_straight', 180);
  setTile(3, 4, 'normal', 0);
  setTile(3, 5, 'black_pit', 0, 'หลุมดำ');
  setTile(3, 6, 'normal', 0);
  setTile(3, 7, 'start', 0, 'START');

  return tiles;
}

export function createEmptyTiles(): GridTile[] {
  const tiles: GridTile[] = [];
  for (let r = 0; r < FIELD_ROWS; r++) {
    for (let c = 0; c < FIELD_COLS; c++) {
      tiles.push({ row: r, col: c, type: 'normal', rotation: 0 });
    }
  }
  return tiles;
}

export function createDefaultTiles(): GridTile[] {
  return createEmptyTiles();
}

export const INITIAL_ROBOT_STATE: RobotState = {
  x: 15,
  y: 105,
  theta: 0,
  pitch: 0,
  roll: 0,
  vLeft: 0,
  vRight: 0,
  simTimeSec: 0,
  isFoul: false,
  reliefCubeDropped: false,
};

export function getInitialRobotPose(tiles: GridTile[]): { x: number; y: number; theta: number } {
  const startTile = tiles.find((t) => t.type === 'start');
  if (startTile) {
    const x = startTile.col * TILE_SIZE_CM + TILE_SIZE_CM / 2;
    const y = startTile.row * TILE_SIZE_CM + TILE_SIZE_CM / 2;
    // Facing West (into the field) if on right half (col >= 4), else East (0)
    const theta = startTile.col >= 4 ? Math.PI : 0;
    return { x, y, theta };
  }
  return { x: INITIAL_ROBOT_STATE.x, y: INITIAL_ROBOT_STATE.y, theta: INITIAL_ROBOT_STATE.theta };
}

export interface SavedField {
  id: string;
  name: string;
  tiles: GridTile[];
  updatedAt: string;
}

function getInitialSavedFields(): SavedField[] {
  try {
    const raw = localStorage.getItem('kt_saved_fields');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

interface SimulatorStoreState {
  tiles: GridTile[];
  setTiles: (tiles: GridTile[], name?: string) => void;
  setTileType: (row: number, col: number, type: TileType, rotation?: 0 | 90 | 180 | 270, bridgeDir?: BridgeDirection) => void;
  rotateTile: (row: number, col: number) => void;
  clearTiles: () => void;
  loadPreset: (name: 'competition_official' | 'bridge_test' | 'obstacle_course' | 'empty') => void;

  activeTool: TileType;
  setActiveTool: (tool: TileType) => void;
  activeRotation: 0 | 90 | 180 | 270;
  setActiveRotation: (rot: 0 | 90 | 180 | 270) => void;

  robotConfig: RobotConfig;
  robotState: RobotState;
  resetRobot: () => void;
  setRobotPose: (x: number, y: number, thetaDeg?: number) => void;

  simStatus: SimStatus;
  setSimStatus: (status: SimStatus) => void;

  trail: Array<{ x: number; y: number }>;
  clearTrail: () => void;

  // Arena Import / Export & Field Management
  fieldName: string;
  setFieldName: (name: string) => void;
  savedFields: SavedField[];
  saveCurrentField: (customName?: string) => string;
  loadSavedField: (id: string) => boolean;
  deleteSavedField: (id: string) => void;
  saveArenaJson: () => string;
  loadArenaJson: (jsonStr: string) => boolean;

  // Code execution queue
  motionQueue: MotionStep[];
  currentStepIndex: number;
  stepRemainingSec: number;

  startSimulationWithCode: (cCode: string) => void;
  startSimulationWithFiles: (files: SketchFile[], activeFileId?: string) => void;
  teleportToLine: (fileId: string, targetLineNumber: number, overrideFiles?: SketchFile[]) => void;
  stepEngine: (dt: number) => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  stopSimulation: () => void;
}

export const useSimulatorStore = create<SimulatorStoreState>((set, get) => ({
  tiles: createDefaultTiles(),

  activeTool: 'line_straight',
  setActiveTool: (tool) => set({ activeTool: tool }),
  activeRotation: 0,
  setActiveRotation: (rot) => set({ activeRotation: rot }),

  setTileType: (row, col, type, rotation = get().activeRotation, bridgeDir = 'east') => {
    set((state) => ({
      tiles: state.tiles.map((t) =>
        t.row === row && t.col === col ? { ...t, type, rotation, bridgeDir } : t
      ),
    }));
  },

  rotateTile: (row, col) => {
    set((state) => ({
      tiles: state.tiles.map((t) => {
        if (t.row === row && t.col === col) {
          const curRot = t.rotation || 0;
          const nextRot = ((curRot + 90) % 360) as 0 | 90 | 180 | 270;
          return { ...t, rotation: nextRot };
        }
        return t;
      }),
    }));
  },

  clearTiles: () => {
    set((state) => ({
      tiles: state.tiles.map((t) => ({ ...t, type: 'normal', rotation: 0, label: undefined })),
    }));
  },

  setTiles: (newTiles, name) => {
    const initPose = getInitialRobotPose(newTiles);
    set({
      tiles: newTiles,
      fieldName: name || get().fieldName,
      trail: [],
      robotState: {
        ...INITIAL_ROBOT_STATE,
        x: initPose.x,
        y: initPose.y,
        theta: initPose.theta,
      },
    });
  },

  loadPreset: (name) => {
    if (name === 'competition_official') {
      set({ tiles: createOfficialCompetitionTiles() });
      get().setRobotPose(225, 105, 180);
    } else if (name === 'bridge_test') {
      const tiles: GridTile[] = createDefaultTiles().map((t) => ({ ...t, type: 'normal' as TileType, rotation: 0 as 0 | 90 | 180 | 270 }));
      const t1 = tiles.find((t) => t.row === 1 && t.col === 2);
      if (t1) { t1.type = 'bridge_up'; }
      const t2 = tiles.find((t) => t.row === 1 && t.col === 3);
      if (t2) { t2.type = 'bridge_deck'; }
      const t3 = tiles.find((t) => t.row === 1 && t.col === 4);
      if (t3) { t3.type = 'bridge_down'; }
      set({ tiles });
      get().setRobotPose(45, 45, 0);
    } else if (name === 'obstacle_course') {
      const tiles: GridTile[] = createDefaultTiles().map((t) => ({ ...t, type: 'normal' as TileType, rotation: 0 as 0 | 90 | 180 | 270 }));
      const tb = tiles.find((t) => t.row === 2 && t.col === 2);
      if (tb) tb.type = 'seesaw';
      const sb1 = tiles.find((t) => t.row === 1 && t.col === 4);
      if (sb1) sb1.type = 'speed_bumps';
      const ng1 = tiles.find((t) => t.row === 0 && t.col === 3);
      if (ng1) ng1.type = 'black_pit';
      const ng2 = tiles.find((t) => t.row === 3 && t.col === 5);
      if (ng2) ng2.type = 'barrier_bomb';
      set({ tiles });
      get().setRobotPose(15, 105, 0);
    } else if (name === 'empty') {
      get().clearTiles();
      get().setRobotPose(15, 15, 0);
    }
  },

  fieldName: 'สนามแข่งของฉัน',
  setFieldName: (name) => set({ fieldName: name }),
  savedFields: getInitialSavedFields(),

  saveCurrentField: (customName) => {
    const name = customName || get().fieldName || 'สนามแข่งของฉัน';
    const newField: SavedField = {
      id: 'field_' + Date.now(),
      name,
      tiles: get().tiles,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('th-TH'),
    };
    const updated = [newField, ...get().savedFields.filter(f => f.name !== name)];
    set({ savedFields: updated, fieldName: name });
    try {
      localStorage.setItem('kt_saved_fields', JSON.stringify(updated));
    } catch (e) {}
    return get().saveArenaJson();
  },

  loadSavedField: (id) => {
    const target = get().savedFields.find(f => f.id === id);
    if (target && Array.isArray(target.tiles)) {
      set({ tiles: target.tiles, fieldName: target.name });
      return true;
    }
    return false;
  },

  deleteSavedField: (id) => {
    const updated = get().savedFields.filter(f => f.id !== id);
    set({ savedFields: updated });
    try {
      localStorage.setItem('kt_saved_fields', JSON.stringify(updated));
    } catch (e) {}
  },

  saveArenaJson: () => {
    return JSON.stringify({
      version: '1.0',
      name: get().fieldName,
      createdAt: new Date().toISOString(),
      tiles: get().tiles,
    }, null, 2);
  },

  loadArenaJson: (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.tiles)) {
        const name = data.name || 'สนามที่นำเข้า';
        set({ tiles: data.tiles, fieldName: name });
        get().saveCurrentField(name);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  robotConfig: DEFAULT_ROBOT_CONFIG,
  robotState: INITIAL_ROBOT_STATE,

  resetRobot: () => {
    try {
      (window as any).__kt_useIDEStore?.getState?.()?.setExecutionStep?.(null);
    } catch (e) {}
    const initPose = getInitialRobotPose(get().tiles);
    set({
      robotState: {
        ...INITIAL_ROBOT_STATE,
        x: initPose.x,
        y: initPose.y,
        theta: initPose.theta,
      },
      simStatus: 'idle',
      motionQueue: [],
      currentStepIndex: 0,
      stepRemainingSec: 0,
      trail: [{ x: initPose.x, y: initPose.y }],
    });
  },

  setRobotPose: (x, y, thetaDeg) => {
    set((state) => ({
      robotState: {
        ...state.robotState,
        x,
        y,
        theta: thetaDeg !== undefined ? (thetaDeg * Math.PI) / 180 : state.robotState.theta,
        isFoul: false,
        foulReason: undefined,
        foulLocation: undefined,
      },
    }));
  },

  simStatus: 'idle',
  setSimStatus: (simStatus) => set({ simStatus }),

  trail: [{ x: INITIAL_ROBOT_STATE.x, y: INITIAL_ROBOT_STATE.y }],
  clearTrail: () => set((state) => ({ trail: [{ x: state.robotState.x, y: state.robotState.y }] })),

  motionQueue: [],
  currentStepIndex: 0,
  stepRemainingSec: 0,

  startSimulationWithCode: (cCode: string) => {
    const ideState = (window as any).__kt_useIDEStore?.getState?.() || null;
    let steps: MotionStep[] = [];
    if (ideState && Array.isArray(ideState.projectFiles) && ideState.projectFiles.length > 0) {
      steps = parseProjectToMotionSteps(ideState.projectFiles, ideState.activeFileId);
    } else {
      steps = parseCCodeToMotionSteps(cCode);
    }

    const initPose = getInitialRobotPose(get().tiles);
    set({
      robotState: {
        ...INITIAL_ROBOT_STATE,
        x: initPose.x,
        y: initPose.y,
        theta: initPose.theta,
        simTimeSec: 0,
        isFoul: false,
        foulReason: undefined,
        foulLocation: undefined,
      },
      trail: [{ x: initPose.x, y: initPose.y }],
      motionQueue: steps,
      currentStepIndex: 0,
      stepRemainingSec: 0,
      simStatus: steps.length > 0 ? 'running' : 'finished',
    });

    if (steps.length > 0 && steps[0].lineNumber) {
      try {
        ideState?.setExecutionStep?.({
          fileId: steps[0].fileId || '',
          fileName: steps[0].fileName || '',
          lineNumber: steps[0].lineNumber,
          codeSnippet: steps[0].codeSnippet,
        });
      } catch (e) {}
    }
  },

  startSimulationWithFiles: (files: SketchFile[], activeFileId?: string) => {
    const steps = parseProjectToMotionSteps(files, activeFileId);
    const initPose = getInitialRobotPose(get().tiles);
    set({
      robotState: {
        ...INITIAL_ROBOT_STATE,
        x: initPose.x,
        y: initPose.y,
        theta: initPose.theta,
        simTimeSec: 0,
        isFoul: false,
        foulReason: undefined,
        foulLocation: undefined,
      },
      trail: [{ x: initPose.x, y: initPose.y }],
      motionQueue: steps,
      currentStepIndex: 0,
      stepRemainingSec: 0,
      simStatus: steps.length > 0 ? 'running' : 'finished',
    });

    const ideState = (window as any).__kt_useIDEStore?.getState?.() || null;
    if (steps.length > 0 && steps[0].lineNumber) {
      try {
        ideState?.setExecutionStep?.({
          fileId: steps[0].fileId || '',
          fileName: steps[0].fileName || '',
          lineNumber: steps[0].lineNumber,
          codeSnippet: steps[0].codeSnippet,
        });
      } catch (e) {}
    }
  },

  /**
   * Simulation on Line (Instant Run-to-Cursor):
   * Instantly executes all statements from the start up to the specified line number,
   * teleports the robot directly to the resulting pose without slow animations from start.
   */
  teleportToLine: (fileId: string, targetLineNumber: number, overrideFiles?: SketchFile[]) => {
    const { tiles, robotConfig } = get();
    const ideState = (window as any).__kt_useIDEStore?.getState?.() || null;
    const files: SketchFile[] =
      overrideFiles ||
      (ideState && Array.isArray(ideState.projectFiles) ? ideState.projectFiles : []);

    let steps = parseProjectToMotionSteps(files, fileId);

    // If steps array does not contain any step matching fileId, parse the single file directly
    if (fileId && !steps.some((s) => s.fileId === fileId)) {
      const targetFile = files.find((f) => f.id === fileId);
      if (targetFile) {
        steps = parseCCodeToMotionSteps(targetFile.content);
        steps.forEach((s) => {
          s.fileId = targetFile.id;
          s.fileName = targetFile.name;
        });
      }
    }

    // Get starting coordinates
    const initialPose = getInitialRobotPose(tiles);
    let currX = initialPose.x;
    let currY = initialPose.y;
    let currTheta = initialPose.theta;
    let dropped = false;
    const trail: Array<{ x: number; y: number }> = [{ x: currX, y: currY }];

    // Find the last executed step that belongs to this file and is <= targetLineNumber
    let targetStepIdx = -1;
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      if ((!s.fileId || s.fileId === fileId) && s.lineNumber !== undefined) {
        if (s.lineNumber <= targetLineNumber) {
          targetStepIdx = i;
        } else if (s.fileId === fileId && s.lineNumber > targetLineNumber) {
          break;
        }
      }
    }

    // Simulate cumulative motion up to targetStepIdx instantly
    if (targetStepIdx >= 0) {
      for (let i = 0; i <= targetStepIdx; i++) {
        const step = steps[i];
        if (step.type === 'grid_forward') {
          const grids = step.grids ?? 1;
          const distCm = grids * TILE_SIZE_CM;

          // Add trajectory line segments to trail for visual path rendering
          const segments = Math.max(1, Math.round(Math.abs(grids) * 2));
          for (let seg = 1; seg <= segments; seg++) {
            const fraction = seg / segments;
            const px = currX + distCm * fraction * Math.cos(currTheta);
            const py = currY + distCm * fraction * Math.sin(currTheta);
            trail.push({ x: px, y: py });
          }

          currX += distCm * Math.cos(currTheta);
          currY += distCm * Math.sin(currTheta);

          // Bound within field boundaries
          const halfW = robotConfig.widthCm / 2;
          const halfL = robotConfig.lengthCm / 2;
          const bound = Math.max(halfW, halfL);
          currX = Math.max(bound, Math.min(FIELD_WIDTH_CM - bound, currX));
          currY = Math.max(bound, Math.min(FIELD_HEIGHT_CM - bound, currY));
        } else if (step.type === 'turn') {
          const deg = step.degrees ?? 90;
          const rad = (deg * Math.PI) / 180;
          const deltaTheta = step.direction === 'right' ? rad : -rad;

          if (step.turnMode === 'curve') {
            // Curve Turn (Swing turn for 'l'/'r'): One wheel fast, one wheel slow
            // Radius R = (W / 2) * (Vouter + Vinner) / (Vouter - Vinner) ~ (W/2) * 1.5
            const radius = (robotConfig.wheelBaseCm / 2) * 1.5;
            const sign = step.direction === 'right' ? 1 : -1;
            const dirMultiplier = step.isBackward ? -1 : 1;

            // Generate intermediate arc trail points
            const stepsCount = Math.max(3, Math.round(deg / 15));
            for (let s = 1; s <= stepsCount; s++) {
              const fraction = s / stepsCount;
              const subDeltaTheta = deltaTheta * fraction;
              const subTheta = currTheta + subDeltaTheta;
              const px = currX + sign * radius * (Math.sin(subTheta) - Math.sin(currTheta)) * dirMultiplier;
              const py = currY - sign * radius * (Math.cos(subTheta) - Math.cos(currTheta)) * dirMultiplier;
              trail.push({ x: px, y: py });
            }

            currX += sign * radius * (Math.sin(currTheta + deltaTheta) - Math.sin(currTheta)) * dirMultiplier;
            currY -= sign * radius * (Math.cos(currTheta + deltaTheta) - Math.cos(currTheta)) * dirMultiplier;
            currTheta += deltaTheta;

            // Clamp to field bounds
            const halfW = robotConfig.widthCm / 2;
            const halfL = robotConfig.lengthCm / 2;
            const bound = Math.max(halfW, halfL);
            currX = Math.max(bound, Math.min(FIELD_WIDTH_CM - bound, currX));
            currY = Math.max(bound, Math.min(FIELD_HEIGHT_CM - bound, currY));
          } else {
            // Spin Turn in place (L, R, spinDegree): Position stays fixed, only heading rotates
            currTheta += deltaTheta;
          }

          // Normalize angle to [0, 2π) and snap to straight orthogonal direction (0, 90, 180, 270)
          currTheta = ((currTheta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const snapInterval = Math.PI / 2;
          const snapped = Math.round(currTheta / snapInterval) * snapInterval;
          if (Math.abs(currTheta - snapped) < 0.1) {
            currTheta = ((snapped % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          }
        } else if (step.type === 'servo_drop') {
          dropped = true;
        }
      }
    }

    // Evaluate terrain factor and collisions at the final destination
    const terrain = evaluateTerrain(currX, currY, tiles);
    const collision = checkNoGoCollision(currX, currY, currTheta, tiles, robotConfig);
    const isFoul = collision.collided;
    const foulReason = collision.collided ? (collision.reason || 'ฟาวล์: ล้ำเขตห้ามผ่าน (No-Go Zone Violation)') : undefined;

    set({
      robotState: {
        ...get().robotState,
        x: currX,
        y: currY,
        theta: currTheta,
        pitch: terrain.pitch,
        roll: terrain.bumpVibration,
        vLeft: 0,
        vRight: 0,
        simTimeSec: 0,
        isFoul,
        foulReason,
        foulLocation: collision.foulPoint,
        reliefCubeDropped: dropped,
      },
      trail,
      simStatus: isFoul ? 'foul' : 'idle',
      motionQueue: steps,
      currentStepIndex: targetStepIdx >= 0 ? targetStepIdx : 0,
      stepRemainingSec: 0,
    });

    if (targetStepIdx >= 0 && steps[targetStepIdx]) {
      const activeStep = steps[targetStepIdx];
      try {
        ideState?.setExecutionStep?.({
          fileId: activeStep.fileId || fileId,
          fileName: activeStep.fileName || '',
          lineNumber: activeStep.lineNumber ?? targetLineNumber,
          codeSnippet: activeStep.codeSnippet,
        });
      } catch (e) {}
    } else {
      try {
        ideState?.setExecutionStep?.(null);
      } catch (e) {}
    }
  },

  stepEngine: (dt: number) => {
    const { simStatus, robotState, tiles, robotConfig, motionQueue, currentStepIndex } = get();

    if (simStatus !== 'running' || robotState.isFoul) {
      return;
    }

    let { stepRemainingSec } = get();
    let nextStepIndex = currentStepIndex;
    let nextVLeft = robotState.vLeft;
    let nextVRight = robotState.vRight;

    if (nextStepIndex < motionQueue.length) {
      const step = motionQueue[nextStepIndex];

      if (stepRemainingSec <= 0) {
        // Trigger live code highlighting in Monaco Editor!
        if (step && step.lineNumber) {
          try {
            (window as any).__kt_useIDEStore?.getState?.()?.setExecutionStep?.({
              fileId: step.fileId || '',
              fileName: step.fileName || '',
              lineNumber: step.lineNumber,
              codeSnippet: step.codeSnippet,
            });
          } catch (e) {}
        }

        // Initialize step duration and velocities
        if (step.type === 'grid_forward') {
          const grids = step.grids ?? 1;
          const speed = step.speed ?? 50;
          const distCm = Math.abs(grids) * TILE_SIZE_CM;
          const speedCmS = (Math.max(20, Math.abs(speed)) / 100) * robotConfig.maxSpeedCmS;
          stepRemainingSec = Math.max(0.01, distCm / speedCmS);
          nextVLeft = grids >= 0 ? speed : -speed;
          nextVRight = grids >= 0 ? speed : -speed;
        } else if (step.type === 'turn') {
          const deg = step.degrees ?? 90;
          const speed = step.speed ?? 50;
          const rad = (deg * Math.PI) / 180;
          const isCurve = step.turnMode === 'curve';
          const isBackward = step.isBackward;

          if (isCurve) {
            // Curve Turn (Swing turn for 'l' and 'r'): One side fast, one side slow
            // During curve turn, robot arcs forward, shifting its (x, y) position!
            const outerSpeed = isBackward ? -speed : speed;
            const innerSpeed = isBackward ? -Math.round(speed * 0.2) : Math.round(speed * 0.2);

            if (step.direction === 'right') {
              nextVLeft = outerSpeed;
              nextVRight = innerSpeed;
            } else {
              nextVLeft = innerSpeed;
              nextVRight = outerSpeed;
            }

            const outerCmS = (Math.max(20, Math.abs(speed)) / 100) * robotConfig.maxSpeedCmS;
            const innerCmS = (Math.abs(innerSpeed) / 100) * robotConfig.maxSpeedCmS;
            const omega = Math.abs(outerCmS - innerCmS) / robotConfig.wheelBaseCm;
            stepRemainingSec = Math.max(0.08, rad / Math.max(0.1, omega));
          } else {
            // Spin Turn in place (for 'L', 'R', spinDegree): Center stays fixed
            const speedCmS = (Math.max(20, Math.abs(speed)) / 100) * robotConfig.maxSpeedCmS;
            const omega = (2 * speedCmS) / robotConfig.wheelBaseCm;
            stepRemainingSec = Math.max(0.08, rad / omega);
            if (step.direction === 'right') {
              nextVLeft = speed;
              nextVRight = -speed;
            } else {
              nextVLeft = -speed;
              nextVRight = speed;
            }
          }
        } else if (step.type === 'delay') {
          stepRemainingSec = Math.max(0.05, (step.durationMs ?? 500) / 1000);
          nextVLeft = 0;
          nextVRight = 0;
        } else if (step.type === 'servo_drop') {
          stepRemainingSec = 0.4;
          set((s) => ({ robotState: { ...s.robotState, reliefCubeDropped: true } }));
        } else if (step.type === 'gripper') {
          stepRemainingSec = 0.3;
        } else if (step.type === 'custom_call') {
          stepRemainingSec = 0.05;
        }
      }

      stepRemainingSec -= dt;

      if (stepRemainingSec <= 0) {
        nextStepIndex++;
        stepRemainingSec = 0;
        if (nextStepIndex >= motionQueue.length) {
          // Finished all steps
          nextVLeft = 0;
          nextVRight = 0;
          try {
            (window as any).__kt_useIDEStore?.getState?.()?.setExecutionStep?.(null);
          } catch (e) {}
          set({ simStatus: 'finished' });
        }
      }
    } else {
      nextVLeft = 0;
      nextVRight = 0;
      try {
        (window as any).__kt_useIDEStore?.getState?.()?.setExecutionStep?.(null);
      } catch (e) {}
      set({ simStatus: 'finished' });
    }

    // Step physics
    const stateWithSpeeds: RobotState = {
      ...robotState,
      vLeft: nextVLeft,
      vRight: nextVRight,
    };

    const nextState = stepPhysics(stateWithSpeeds, tiles, dt, robotConfig);

    // If turn step finished on this tick, snap robot angle straight (0, 90, 180, 270)
    if (
      currentStepIndex < motionQueue.length &&
      motionQueue[currentStepIndex].type === 'turn' &&
      stepRemainingSec <= 0
    ) {
      const snapInterval = Math.PI / 2;
      const snapped = Math.round(nextState.theta / snapInterval) * snapInterval;
      if (Math.abs(nextState.theta - snapped) < 0.15) {
        nextState.theta = ((snapped % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      }
    }

    // Update trail
    const lastTrail = get().trail;
    const lastPoint = lastTrail[lastTrail.length - 1];
    const dist = Math.hypot(nextState.x - lastPoint.x, nextState.y - lastPoint.y);
    const newTrail = dist > 1.0 ? [...lastTrail, { x: nextState.x, y: nextState.y }] : lastTrail;

    if (nextState.isFoul) {
      try {
        (window as any).__kt_useIDEStore?.getState?.()?.setExecutionStep?.(null);
      } catch (e) {}
      set({
        robotState: nextState,
        simStatus: 'foul',
        trail: newTrail,
      });
      return;
    }

    set({
      robotState: nextState,
      trail: newTrail,
      currentStepIndex: nextStepIndex,
      stepRemainingSec,
    });
  },

  pauseSimulation: () => {
    if (get().simStatus === 'running') {
      set({ simStatus: 'paused' });
    }
  },

  resumeSimulation: () => {
    if (get().simStatus === 'paused') {
      set({ simStatus: 'running' });
    }
  },

  stopSimulation: () => {
    try {
      (window as any).__kt_useIDEStore?.getState?.()?.setExecutionStep?.(null);
    } catch (e) {}
    set((state) => ({
      simStatus: 'idle',
      robotState: {
        ...state.robotState,
        vLeft: 0,
        vRight: 0,
      },
    }));
  },
}));
