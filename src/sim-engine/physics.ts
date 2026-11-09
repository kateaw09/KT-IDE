import { GridTile, RobotConfig, RobotState } from '../types/simulator';

export const FIELD_COLS = 8;
export const FIELD_ROWS = 4;
export const TILE_SIZE_CM = 30;
export const FIELD_WIDTH_CM = FIELD_COLS * TILE_SIZE_CM; // 240 cm
export const FIELD_HEIGHT_CM = FIELD_ROWS * TILE_SIZE_CM; // 120 cm

export const DEFAULT_ROBOT_CONFIG: RobotConfig = {
  widthCm: 16,
  lengthCm: 18,
  wheelBaseCm: 14,
  maxSpeedCmS: 40,
};

/**
 * Get robot 4 bounding box corner points in world coordinates (cm)
 */
export function getRobotCorners(x: number, y: number, theta: number, config: RobotConfig = DEFAULT_ROBOT_CONFIG) {
  const halfL = config.lengthCm / 2;
  const halfW = config.widthCm / 2;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  // 4 local corners relative to center: front-left, front-right, rear-right, rear-left
  const localCorners = [
    { x: halfL, y: -halfW },
    { x: halfL, y: halfW },
    { x: -halfL, y: halfW },
    { x: -halfL, y: -halfW },
  ];

  return localCorners.map(pt => ({
    x: x + (pt.x * cosT - pt.y * sinT),
    y: y + (pt.x * sinT + pt.y * cosT),
  }));
}

/**
 * Check if a point (px, py) is inside tile cell (row, col)
 */
function isPointInTile(px: number, py: number, row: number, col: number): boolean {
  const minX = col * TILE_SIZE_CM;
  const maxX = (col + 1) * TILE_SIZE_CM;
  const minY = row * TILE_SIZE_CM;
  const maxY = (row + 1) * TILE_SIZE_CM;
  return px >= minX && px <= maxX && py >= minY && py <= maxY;
}

/**
 * Check collision between robot bounding box and any hazard / barrier tile
 */
export function checkNoGoCollision(
  x: number,
  y: number,
  theta: number,
  tiles: GridTile[],
  config: RobotConfig = DEFAULT_ROBOT_CONFIG
): { collided: boolean; foulPoint?: { x: number; y: number }; tile?: GridTile; reason?: string } {
  const corners = getRobotCorners(x, y, theta, config);
  const hazardTiles = tiles.filter(t => t.type === 'nogo' || t.type === 'black_pit' || t.type === 'barrier_bomb');

  for (const tile of hazardTiles) {
    const minX = tile.col * TILE_SIZE_CM;
    const maxX = (tile.col + 1) * TILE_SIZE_CM;
    const minY = tile.row * TILE_SIZE_CM;
    const maxY = (tile.row + 1) * TILE_SIZE_CM;

    const reason = tile.type === 'black_pit' 
      ? 'ตกหลุมดำ (Fell into Black Hole Pit)' 
      : tile.type === 'barrier_bomb'
      ? 'ชนสิ่งกีดขวาง / จุดลูกระเบิด (Hit Bomb / Barrier)'
      : 'ออกนอกพื้นที่สนาม (Entered No-Go Zone)';

    // Check if any robot corner is inside tile
    for (const corner of corners) {
      if (corner.x >= minX && corner.x <= maxX && corner.y >= minY && corner.y <= maxY) {
        return { collided: true, foulPoint: { x: corner.x, y: corner.y }, tile, reason };
      }
    }

    // Also check center of robot
    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
      return { collided: true, foulPoint: { x, y }, tile, reason };
    }
  }

  return { collided: false };
}

/**
 * Computes terrain effects on current robot position
 */
export function evaluateTerrain(
  x: number,
  y: number,
  tiles: GridTile[]
): {
  terrainFactor: number;
  pitch: number;
  gravityDrift: number; // In cm/s (e.g. sliding backward)
  bumpVibration: number;
  isBump: boolean;
} {
  const col = Math.floor(x / TILE_SIZE_CM);
  const row = Math.floor(y / TILE_SIZE_CM);

  const tile = tiles.find(t => t.row === row && t.col === col);
  if (!tile) {
    return { terrainFactor: 1.0, pitch: 0, gravityDrift: 0, bumpVibration: 0, isBump: false };
  }

  // 1. Single Bridge tile
  if (tile.type === 'bridge') {
    const relX = (x % TILE_SIZE_CM) / TILE_SIZE_CM;
    if (relX < 0.35) {
      return { terrainFactor: 0.65, pitch: 15, gravityDrift: -8.0, bumpVibration: 0, isBump: false };
    } else if (relX > 0.65) {
      return { terrainFactor: 1.35, pitch: -15, gravityDrift: 10.0, bumpVibration: 0, isBump: false };
    } else {
      return { terrainFactor: 0.95, pitch: 0, gravityDrift: 0, bumpVibration: 0, isBump: false };
    }
  }

  // 2. Multi-tile bridge components (bridge_up, bridge_deck, bridge_down)
  if (tile.type === 'bridge_up') {
    return { terrainFactor: 0.6, pitch: 18, gravityDrift: -10.0, bumpVibration: 0, isBump: false };
  }
  if (tile.type === 'bridge_deck') {
    return { terrainFactor: 0.95, pitch: 0, gravityDrift: 0, bumpVibration: 0, isBump: false };
  }
  if (tile.type === 'bridge_down') {
    return { terrainFactor: 1.3, pitch: -18, gravityDrift: 12.0, bumpVibration: 0, isBump: false };
  }

  // 3. Seesaw (ไม้กระดก) - dynamic pitch depending on whether robot passed the center pivot
  if (tile.type === 'seesaw') {
    const relX = (x % TILE_SIZE_CM) / TILE_SIZE_CM;
    const seesawPitch = relX < 0.5 ? 12 : -14;
    return {
      terrainFactor: 0.75,
      pitch: seesawPitch,
      gravityDrift: relX < 0.5 ? -6.0 : 8.0,
      bumpVibration: 0.8,
      isBump: false,
    };
  }

  // 4. Hill drop (เนินปล่อยถุงยังชีพ)
  if (tile.type === 'hill_drop') {
    return { terrainFactor: 0.7, pitch: 12, gravityDrift: -5.0, bumpVibration: 0, isBump: false };
  }

  // 5. Speed bumps (ลูกระนาด)
  if (tile.type === 'bump' || tile.type === 'speed_bumps') {
    const bumpCycle = Math.sin((x / 4) * Math.PI);
    return {
      terrainFactor: 0.50,
      pitch: bumpCycle * 5,
      gravityDrift: 0,
      bumpVibration: (Math.random() - 0.5) * 8,
      isBump: true,
    };
  }

  return { terrainFactor: 1.0, pitch: 0, gravityDrift: 0, bumpVibration: 0, isBump: false };
}

/**
 * Step differential drive kinematics for dt seconds (typically 1/60s)
 */
export function stepPhysics(
  state: RobotState,
  tiles: GridTile[],
  dt: number,
  config: RobotConfig = DEFAULT_ROBOT_CONFIG
): RobotState {
  if (state.isFoul) {
    return state;
  }

  // 1. Terrain evaluation at current position
  const terrain = evaluateTerrain(state.x, state.y, tiles);

  // 2. Motor Speeds (-100 to 100%) to cm/s
  const rawVLeft = (state.vLeft / 100) * config.maxSpeedCmS;
  const rawVRight = (state.vRight / 100) * config.maxSpeedCmS;
  const avgMotorPercent = (Math.abs(state.vLeft) + Math.abs(state.vRight)) / 2;

  // Bridge physics check: if motor power < 35% on uphill ramp, robot slips backward
  let appliedVLeft = rawVLeft;
  let appliedVRight = rawVRight;
  let gravityPush = 0;

  if (terrain.pitch > 5) {
    if (avgMotorPercent < 35) {
      // Slips back down
      gravityPush = terrain.gravityDrift;
      appliedVLeft = 0;
      appliedVRight = 0;
    }
  } else if (terrain.pitch < -5) {
    gravityPush = terrain.gravityDrift;
  }

  // Linear speed with terrain factor and gravity
  const rawV = ((appliedVLeft + appliedVRight) / 2) * terrain.terrainFactor + gravityPush;

  // Bump drift noise: when hitting bump at speed > 70%, add random angle jitter
  let bumpNoise = 0;
  if (terrain.isBump && avgMotorPercent > 70) {
    // deflect by +/- 2 to 5 degrees in rad/s
    const jitterDeg = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 3);
    bumpNoise = (jitterDeg * Math.PI) / 180 * 4;
  }

  // Angular velocity omega (positive = clockwise / turn right in screen coordinates where +X is East, +Y is South)
  const omega = ((appliedVLeft - appliedVRight) / config.wheelBaseCm) + bumpNoise;

  // Update orientation
  let newTheta = state.theta + omega * dt;
  // Normalize theta to 0..2pi
  while (newTheta < 0) newTheta += Math.PI * 2;
  while (newTheta >= Math.PI * 2) newTheta -= Math.PI * 2;

  // Update position
  let newX = state.x + rawV * Math.cos(state.theta) * dt;
  let newY = state.y + rawV * Math.sin(state.theta) * dt;

  // Guard field borders (0 to 240, 0 to 120) with robot half-extents
  const halfExtent = Math.max(config.widthCm, config.lengthCm) / 2;
  newX = Math.max(halfExtent, Math.min(FIELD_WIDTH_CM - halfExtent, newX));
  newY = Math.max(halfExtent, Math.min(FIELD_HEIGHT_CM - halfExtent, newY));

  // 3. Collision check with No-Go zone
  const collision = checkNoGoCollision(newX, newY, newTheta, tiles, config);

  return {
    ...state,
    x: newX,
    y: newY,
    theta: newTheta,
    pitch: terrain.pitch,
    roll: terrain.bumpVibration,
    simTimeSec: state.simTimeSec + dt,
    isFoul: collision.collided,
    foulReason: collision.collided ? (collision.reason || 'ฟาวล์: ล้ำเขตห้ามผ่าน (No-Go Zone Violation)') : undefined,
    foulLocation: collision.foulPoint,
  };
}
