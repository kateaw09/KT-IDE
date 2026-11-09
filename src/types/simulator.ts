export type TileType =
  | 'normal'
  | 'line_straight'
  | 'line_corner'
  | 'line_u'
  | 'line_box'
  | 'line_parallel'
  | 'checkpoint'
  | 'checkpoint_line'
  | 'checkpoint_corner'
  | 'checkpoint_parallel'
  | 'start'
  | 'finish'
  | 'tunnel'
  | 'tunnel_corner'
  | 'seesaw'
  | 'bridge'
  | 'bridge_up'
  | 'bridge_deck'
  | 'bridge_down'
  | 'hill_drop'
  | 'drop_red'
  | 'drop_green'
  | 'drop_yellow'
  | 'drop_blue'
  | 'speed_bumps'
  | 'black_pit'
  | 'barrier_bomb'
  | 'pt_robotics'
  // Legacy compatibility
  | 'bump'
  | 'nogo';

export type BridgeDirection = 'east' | 'west' | 'north' | 'south';
export type TileRotation = 0 | 90 | 180 | 270;

export interface GridTile {
  row: number; // 0 to 3
  col: number; // 0 to 7
  type: TileType;
  rotation?: TileRotation; // 0, 90, 180, 270 degrees
  bridgeDir?: BridgeDirection; // For bridge: direction of travel
  label?: string;
  customData?: Record<string, any>;
}

export interface RobotConfig {
  widthCm: number;       // Robot body width (e.g. 16 cm)
  lengthCm: number;      // Robot body length (e.g. 18 cm)
  wheelBaseCm: number;   // Distance between left & right wheels (e.g. 14 cm)
  maxSpeedCmS: number;   // Max speed at 100% PWM in cm/s (e.g. 40 cm/s)
}

export interface RobotState {
  x: number;             // X position in cm (0 to 240)
  y: number;             // Y position in cm (0 to 120)
  theta: number;         // Heading in radians (0 = pointing +X / East)
  pitch: number;         // Incline pitch in degrees (+15 uphill, -15 downhill)
  roll: number;          // Roll / vibration angle
  vLeft: number;         // Current left motor speed (-100 to 100%)
  vRight: number;        // Current right motor speed (-100 to 100%)
  simTimeSec: number;    // Elapsed simulation time
  isFoul: boolean;       // Fouled by entering No-Go Zone
  foulReason?: string;
  foulLocation?: { x: number; y: number };
  reliefCubeDropped?: boolean;
}

export type SimStatus = 'idle' | 'running' | 'paused' | 'foul' | 'finished';

export interface MotionStep {
  type: 'motor' | 'delay' | 'grid_forward' | 'turn' | 'servo_drop' | 'gripper' | 'custom_call';
  vLeft?: number;
  vRight?: number;
  durationMs?: number;
  grids?: number;
  speed?: number;
  direction?: 'left' | 'right';
  degrees?: number;
  turnMode?: 'spin' | 'curve'; // 'spin' = rotate in place (L, R), 'curve' = swing/turn with position shift (l, r)
  isBackward?: boolean;
  servoAngle?: number;
  gripperState?: 'open' | 'close';
  fnName?: string;

  // Real-time Execution Tracking & Code Line Highlighting
  fileId?: string;
  fileName?: string;
  lineNumber?: number;
  codeSnippet?: string;
}

export type ArenaDifficulty = 'very_easy' | 'easy' | 'medium' | 'hard' | 'very_hard';

export type ArenaCompetitionMode = 'pt_version' | 'obec_junior' | 'obec_senior';

export interface TileUsageSummary {
  type: TileType;
  name: string;
  count: number;
  badge?: string;
  category: string;
}

export interface GeneratedArenaResult {
  id: string;
  name: string;
  seed: number;
  competitionMode: ArenaCompetitionMode;
  competitionModeLabel: string;
  difficulty: ArenaDifficulty;
  difficultyLabel: string;
  tiles: GridTile[];
  createdAt: string;
  summary: TileUsageSummary[];
  totalTiles: number;
  description: string;
  missionRules: string[];
  scoringBreakdown: Array<{ item: string; points: number }>;
}
