import {
  GridTile,
  TileType,
  TileRotation,
  ArenaDifficulty,
  ArenaCompetitionMode,
  GeneratedArenaResult,
  TileUsageSummary,
} from '../types/simulator';

export const FIELD_ROWS = 4;
export const FIELD_COLS = 8;

export const TILE_METADATA: Record<string, { name: string; category: string; badge?: string; desc: string }> = {
  start: { name: 'START ปล่อยตัว', category: 'จุดสำคัญ', badge: 'START', desc: 'พื้นที่ปล่อยตัวสีแดง 300x300mm' },
  finish: { name: 'FINISH เส้นชัย', category: 'จุดสำคัญ', badge: 'FINISH', desc: 'พื้นที่เข้าเส้นชัยสีฟ้า 300x300mm' },
  checkpoint: { name: 'Check Point กลาง', category: 'จุดตรวจ', badge: 'Ø50mm', desc: 'วงกลมสีเหลือง Ø 50mm บนพื้นขาว' },
  checkpoint_line: { name: 'Check Point + เส้นตรง', category: 'จุดตรวจ', badge: 'เส้นขอบ', desc: 'วงกลมเหลือง + เส้นตรง 1 ด้าน' },
  checkpoint_corner: { name: 'Check Point + มุมเลี้ยว', category: 'จุดตรวจ', badge: 'มุม L', desc: 'วงกลมเหลือง + มุมเลี้ยว' },
  checkpoint_parallel: { name: 'Check Point + เส้นคู่', category: 'จุดตรวจ', badge: 'เส้นคู่', desc: 'วงกลมเหลือง + เส้นคู่บนล่าง' },
  line_straight: { name: 'เส้นตรง / ขอบทาง', category: 'เส้นทาง', badge: 'ทางตรง', desc: 'เส้นตรงสีดำหนา 1 ด้าน (พื้นขาว)' },
  line_corner: { name: 'มุมเลี้ยว L-Corner', category: 'เส้นทาง', badge: 'เลี้ยว 90°', desc: 'มุมหักเลี้ยว 90 องศา (พื้นขาว)' },
  line_parallel: { name: 'เส้นคู่ขนาน (Parallel)', category: 'เส้นทาง', badge: 'เส้นคู่', desc: 'เส้นขอบทางคู่สองฝั่ง (พื้นขาว)' },
  line_u: { name: 'เส้นกลับตัว U-Shape', category: 'เส้นทาง', badge: 'กลับตัว', desc: 'เส้นขอบ 3 ด้านสำหรับกลับตัว' },
  line_box: { name: 'กรอบสี่เหลี่ยม Box', category: 'เส้นทาง', badge: 'กล่องปิด', desc: 'กรอบสี่เหลี่ยมปิดล้อม 4 ด้าน' },
  bridge_up: { name: 'สะพาน ทางขึ้น (เขียว)', category: 'ความชัน', badge: 'ชันขึ้น 50mm', desc: 'ทางลาดขึ้นสะพานสีเขียว 300x300mm' },
  bridge_deck: { name: 'สะพาน ช่วงกลาง (เทา)', category: 'ความชัน', badge: 'สูง 50mm', desc: 'สะพานช่วงกลางระดับ 50mm 300x300mm' },
  bridge_down: { name: 'สะพาน ทางลง (เหลือง)', category: 'ความชัน', badge: 'ชันลง 50mm', desc: 'ทางลาดลงสะพานสีเหลือง 300x300mm' },
  seesaw: { name: 'ไม้กระดก (Seesaw 30x30)', category: 'ความชัน', badge: '300x300mm', desc: 'กระดานไม้กระดกขนาด 300x300mm สูง 40mm' },
  hill_drop: { name: 'เนินปล่อยถุงยังชีพ', category: 'ความชัน', badge: 'ทางลาด', desc: 'ทางลาดขึ้นเนินปล่อยถุงยังชีพ' },
  tunnel: { name: 'อุโมงค์ทางตรง', category: 'อุโมงค์', badge: 'สูง 300mm', desc: 'อุโมงค์ทึบแสง 600x300mm' },
  tunnel_corner: { name: 'อุโมงค์มุมเลี้ยว L', category: 'อุโมงค์', badge: 'มุม 90°', desc: 'อุโมงค์ทึบแสงมุมเลี้ยว' },
  drop_red: { name: 'จุดปล่อยกล่อง (สีแดง)', category: 'ภารกิจ', badge: 'RED', desc: 'จุดปล่อยถุงยังชีพสีแดง' },
  drop_green: { name: 'จุดปล่อยกล่อง (สีเขียว)', category: 'ภารกิจ', badge: 'GREEN', desc: 'จุดปล่อยถุงยังชีพสีเขียว' },
  drop_blue: { name: 'จุดปล่อยกล่อง (สีน้ำเงิน)', category: 'ภารกิจ', badge: 'BLUE', desc: 'จุดปล่อยถุงยังชีพสีน้ำเงิน' },
  drop_yellow: { name: 'จุดปล่อยกล่อง (สีเหลือง)', category: 'ภารกิจ', badge: 'YELLOW', desc: 'จุดปล่อยถุงยังชีพสีเหลือง' },
  speed_bumps: { name: 'ลูกระนาด (Speed Bumps)', category: 'อุปสรรค', badge: '7 อัน', desc: 'ลูกระนาดไม้ตะเกียบ 7 อัน' },
  black_pit: { name: 'หลุมดำ (Black Pit)', category: 'อุปสรรค', badge: 'ห้ามตก', desc: 'หลุมดำจุดห้ามผ่าน' },
  barrier_bomb: { name: 'จุดลูกระเบิด (Barrier)', category: 'อุปสรรค', badge: 'ห้ามชน', desc: 'ลูกระเบิด 20x20mm' },
  pt_robotics: { name: 'แผ่น PT ROBOTICS', category: 'พิเศษ', badge: 'LOGO', desc: 'แผ่นป้ายสัญลักษณ์' },
  normal: { name: 'พื้นไวนิลขาวทั่วไป (Normal)', category: 'พื้นฐาน', badge: 'พื้นขาว', desc: 'แผ่นโมดูลาร์สีขาวไม่มีลาย' },
};

export const DIFFICULTY_CONFIG: Record<
  ArenaDifficulty,
  {
    name: string;
    enName: string;
    color: string;
    description: string;
  }
> = {
  very_easy: {
    name: 'ง่ายมาก',
    enName: 'Very Easy',
    color: '#10b981',
    description: 'เส้นทางเดินตามเส้นชัดเจน ทางเลี้ยว 90 องศาเป็นระเบียบ ไม่มีหลุมดำหรือสิ่งกีดขวางชัน เหมาะสำหรับเริ่มต้น',
  },
  easy: {
    name: 'ง่าย',
    enName: 'Easy',
    color: '#3b82f6',
    description: 'เส้นทางเลี้ยวเข้าจุด Checkpoint และจุดปล่อยกล่อง มีลูกระนาด 1 จุด สำหรับฝึกระบบล้อและเซนเซอร์',
  },
  medium: {
    name: 'ปานกลาง',
    enName: 'Medium',
    color: '#f59e0b',
    description: 'เส้นทางสมจริง มีสะพานความชัน (ทางขึ้น-ช่วงกลาง-ทางลง) หรือลูกระนาด พร้อมหลุมดำที่ต้องวางแผนเลี้ยวหลบ',
  },
  hard: {
    name: 'ยาก',
    enName: 'Hard',
    color: '#f97316',
    description: 'ทางเดินคดเคี้ยว มีทั้งสะพานลาดชัน ไม้กระดก หรืออุโมงค์ทึบแสง พร้อมหลุมดำและระเบิดกีดขวาง',
  },
  very_hard: {
    name: 'ยากมาก',
    enName: 'Very Hard',
    color: '#ef4444',
    description: 'ระดับแข่งขันชิงแชมป์ครบเครื่อง: อุโมงค์ทึบแสง, สะพานความชัน, ไม้กระดก, เนินสูง, หลุมดำและลูกระเบิด',
  },
};

/**
 * Seeded Pseudo-Random Number Generator (Mulberry32)
 */
function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Direction = 'N' | 'S' | 'E' | 'W';

function getDir(r1: number, c1: number, r2: number, c2: number): Direction {
  if (r2 < r1) return 'N';
  if (r2 > r1) return 'S';
  if (c2 > c1) return 'E';
  return 'W';
}

function getOpposite(d: Direction): Direction {
  switch (d) {
    case 'N': return 'S';
    case 'S': return 'N';
    case 'E': return 'W';
    case 'W': return 'E';
  }
}

/**
 * Procedural generator for 4x8 Robotics Competition Arenas
 * Fully realistic, connected, 100% playable with correct tile rotations and zero dead ends.
 */
export function generateRandomArena(
  mode: ArenaCompetitionMode = 'pt_version',
  difficulty: ArenaDifficulty = 'medium',
  customName?: string,
  providedSeed?: number
): GeneratedArenaResult {
  const seed = providedSeed !== undefined ? providedSeed : Math.floor(100000 + Math.random() * 900000);
  const rand = createPRNG(seed);
  const cfg = DIFFICULTY_CONFIG[difficulty];

  // 1. Initialize all 32 grid cells as clean white modular tiles
  const grid: GridTile[][] = [];
  for (let r = 0; r < FIELD_ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < FIELD_COLS; c++) {
      grid[r][c] = {
        row: r,
        col: c,
        type: 'normal',
        rotation: 0,
      };
    }
  }

  // 2. Generate Navigable Route based on Mode, Difficulty, and Seed
  // Every path is mathematically verified: strictly adjacent steps, ZERO self-intersections, 100% passable.
  let path: Array<{ r: number; c: number }> = [];

  const requiresOffTrack =
    (mode === 'pt_version' && (difficulty === 'medium' || difficulty === 'hard' || difficulty === 'very_hard')) ||
    mode === 'obec_junior' ||
    mode === 'obec_senior';

  if (mode === 'pt_version') {
    // Mode 1: PT-Version (START at (3, 0) -> FINISH at opposite/central goal)
    // If black_pit/bomb required, select variants that leave 3-4 off-track cells
    const variantChoices = requiresOffTrack ? [1, 3] : [0, 1, 2, 3];
    const variant = variantChoices[Math.floor(rand() * variantChoices.length)];

    if (variant === 0) {
      // Variant 0: Full 32-cell S-Snake (Row 3 East -> Row 2 West -> Row 1 East -> Row 0 West)
      for (let c = 0; c <= 7; c++) path.push({ r: 3, c });
      for (let c = 7; c >= 0; c--) path.push({ r: 2, c });
      for (let c = 0; c <= 7; c++) path.push({ r: 1, c });
      for (let c = 7; c >= 0; c--) path.push({ r: 0, c }); // FINISH at (0, 0)
    } else if (variant === 1) {
      // Variant 1: Perimeter into Central Chicane (29 cells, leaves 3 off-track cells)
      for (let c = 0; c <= 7; c++) path.push({ r: 3, c });
      path.push({ r: 2, c: 7 });
      path.push({ r: 1, c: 7 });
      for (let c = 7; c >= 0; c--) path.push({ r: 0, c });
      path.push({ r: 1, c: 0 });
      path.push({ r: 2, c: 0 });
      for (let c = 1; c <= 5; c++) path.push({ r: 2, c });
      for (let c = 5; c >= 2; c--) path.push({ r: 1, c }); // FINISH at (1, 2)
    } else if (variant === 2) {
      // Variant 2: Vertical Column Weave (32 cells)
      path.push({ r: 3, c: 0 }); path.push({ r: 2, c: 0 }); path.push({ r: 1, c: 0 }); path.push({ r: 0, c: 0 });
      path.push({ r: 0, c: 1 }); path.push({ r: 1, c: 1 }); path.push({ r: 2, c: 1 }); path.push({ r: 3, c: 1 });
      path.push({ r: 3, c: 2 }); path.push({ r: 2, c: 2 }); path.push({ r: 1, c: 2 }); path.push({ r: 0, c: 2 });
      path.push({ r: 0, c: 3 }); path.push({ r: 1, c: 3 }); path.push({ r: 2, c: 3 }); path.push({ r: 3, c: 3 });
      path.push({ r: 3, c: 4 }); path.push({ r: 2, c: 4 }); path.push({ r: 1, c: 4 }); path.push({ r: 0, c: 4 });
      path.push({ r: 0, c: 5 }); path.push({ r: 1, c: 5 }); path.push({ r: 2, c: 5 }); path.push({ r: 3, c: 5 });
      path.push({ r: 3, c: 6 }); path.push({ r: 2, c: 6 }); path.push({ r: 1, c: 6 }); path.push({ r: 0, c: 6 });
      path.push({ r: 0, c: 7 }); path.push({ r: 1, c: 7 }); path.push({ r: 2, c: 7 }); path.push({ r: 3, c: 7 }); // FINISH at (3, 7)
    } else {
      // Variant 3: 28-cell Meander (leaves (0,0)..(0,3) for Pit/Bomb/Decoys)
      for (let c = 0; c <= 7; c++) path.push({ r: 3, c });
      for (let c = 7; c >= 0; c--) path.push({ r: 2, c });
      for (let c = 0; c <= 7; c++) path.push({ r: 1, c });
      for (let c = 7; c >= 4; c--) path.push({ r: 0, c }); // FINISH at (0, 4)
    }
  } else {
    // Mode 2 & 3: OBEC (สพฐ.) - Closed Loop Circuit returning to START at (3, 0)!
    const variant = Math.floor(rand() * 3);

    if (variant === 0) {
      // Loop Variant 0: Full Perimeter Circuit (20 cells, leaves 12 central off-track cells)
      for (let c = 0; c <= 7; c++) path.push({ r: 3, c });
      path.push({ r: 2, c: 7 }); path.push({ r: 1, c: 7 }); path.push({ r: 0, c: 7 });
      for (let c = 6; c >= 0; c--) path.push({ r: 0, c });
      path.push({ r: 1, c: 0 }); path.push({ r: 2, c: 0 });
      // Loops back to (3, 0)
    } else if (variant === 1) {
      // Loop Variant 1: Figure Crossover Circuit (20 cells)
      for (let c = 0; c <= 7; c++) path.push({ r: 3, c });
      path.push({ r: 2, c: 7 }); path.push({ r: 1, c: 7 });
      for (let c = 6; c >= 3; c--) path.push({ r: 1, c });
      path.push({ r: 0, c: 3 });
      for (let c = 2; c >= 0; c--) path.push({ r: 0, c });
      path.push({ r: 1, c: 0 }); path.push({ r: 2, c: 0 });
      // Loops back to (3, 0)
    } else {
      // Loop Variant 2: Inside Track Loop (20 cells)
      path.push({ r: 3, c: 0 }); path.push({ r: 2, c: 0 }); path.push({ r: 1, c: 0 }); path.push({ r: 0, c: 0 });
      for (let c = 1; c <= 7; c++) path.push({ r: 0, c });
      path.push({ r: 1, c: 7 }); path.push({ r: 2, c: 7 });
      for (let c = 6; c >= 2; c--) path.push({ r: 2, c });
      path.push({ r: 3, c: 2 });
      path.push({ r: 3, c: 1 });
      // Loops back to (3, 0)
    }
  }

  // 3. Set START tile
  const startPt = path[0];
  grid[startPt.r][startPt.c] = {
    row: startPt.r,
    col: startPt.c,
    type: 'start',
    rotation: 0,
    label: 'START',
  };

  // Set FINISH tile (for PT-Version)
  if (mode === 'pt_version') {
    const endPt = path[path.length - 1];
    grid[endPt.r][endPt.c] = {
      row: endPt.r,
      col: endPt.c,
      type: 'finish',
      rotation: 0,
      label: 'FINISH',
    };
  }

  // 4. Fill track tiles with mathematically verified rotations
  const endIndex = mode === 'pt_version' ? path.length - 1 : path.length;

  for (let i = 1; i < endIndex; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const next = i + 1 < path.length ? path[i + 1] : path[0];

    const inDir = getDir(prev.r, prev.c, curr.r, curr.c);
    const outDir = getDir(curr.r, curr.c, next.r, next.c);

    if (inDir === outDir) {
      // Straight corridor
      const rot: TileRotation = inDir === 'E' || inDir === 'W' ? 0 : 90;
      grid[curr.r][curr.c] = {
        row: curr.r,
        col: curr.c,
        type: 'line_straight',
        rotation: rot,
      };
    } else {
      // 90° Corner
      const open1 = getOpposite(inDir);
      const open2 = outDir;
      const opens = new Set([open1, open2]);

      let rot: TileRotation = 0;
      if (opens.has('N') && opens.has('E')) rot = 0;
      else if (opens.has('S') && opens.has('E')) rot = 90;
      else if (opens.has('S') && opens.has('W')) rot = 180;
      else if (opens.has('N') && opens.has('W')) rot = 270;

      grid[curr.r][curr.c] = {
        row: curr.r,
        col: curr.c,
        type: 'line_corner',
        rotation: rot,
      };
    }
  }

  // 5. Place Bridge (3 consecutive straight cells) along travel direction
  // Allowed in: PT-Version (medium/hard/very_hard) and OBEC ม.ปลาย (obec_senior)
  const isBridgeAllowed =
    (mode === 'pt_version' && (difficulty === 'medium' || difficulty === 'hard' || difficulty === 'very_hard')) ||
    mode === 'obec_senior';

  if (isBridgeAllowed) {
    const bridgeCandidates: number[] = [];
    for (let i = 1; i < endIndex - 3; i++) {
      const c1 = path[i];
      const c2 = path[i + 1];
      const c3 = path[i + 2];
      const p1 = grid[c1.r][c1.c];
      const p2 = grid[c2.r][c2.c];
      const p3 = grid[c3.r][c3.c];

      if (p1.type === 'line_straight' && p2.type === 'line_straight' && p3.type === 'line_straight') {
        const d1 = getDir(c1.r, c1.c, c2.r, c2.c);
        const d2 = getDir(c2.r, c2.c, c3.r, c3.c);
        if (d1 === d2) {
          bridgeCandidates.push(i);
        }
      }
    }

    if (bridgeCandidates.length > 0) {
      const chosenIdx = bridgeCandidates[Math.floor(rand() * bridgeCandidates.length)];
      const c1 = path[chosenIdx];
      const c2 = path[chosenIdx + 1];
      const c3 = path[chosenIdx + 2];
      const travelDir = getDir(c1.r, c1.c, c2.r, c2.c);

      let bridgeRot: TileRotation = 0;
      if (travelDir === 'E') bridgeRot = 0;
      else if (travelDir === 'W') bridgeRot = 180;
      else if (travelDir === 'S') bridgeRot = 90;
      else if (travelDir === 'N') bridgeRot = 270;

      grid[c1.r][c1.c] = { row: c1.r, col: c1.c, type: 'bridge_up', rotation: bridgeRot, label: 'สะพาน (ขึ้น)' };
      grid[c2.r][c2.c] = { row: c2.r, col: c2.c, type: 'bridge_deck', rotation: bridgeRot, label: 'สะพาน 50mm' };
      grid[c3.r][c3.c] = { row: c3.r, col: c3.c, type: 'bridge_down', rotation: bridgeRot, label: 'สะพาน (ลง)' };
    }
  }

  // 6. Place Tunnel (2 consecutive straight cells) - PT-Version (hard / very_hard)
  if (mode === 'pt_version' && (difficulty === 'hard' || difficulty === 'very_hard')) {
    for (let i = 1; i < endIndex - 2; i++) {
      const c1 = path[i];
      const c2 = path[i + 1];
      const p1 = grid[c1.r][c1.c];
      const p2 = grid[c2.r][c2.c];
      if (p1.type === 'line_straight' && p2.type === 'line_straight') {
        const d = getDir(c1.r, c1.c, c2.r, c2.c);
        const rot: TileRotation = d === 'E' || d === 'W' ? 0 : 90;
        grid[c1.r][c1.c] = { row: c1.r, col: c1.c, type: 'tunnel', rotation: rot, label: 'อุโมงค์ (เข้า)' };
        grid[c2.r][c2.c] = { row: c2.r, col: c2.c, type: 'tunnel', rotation: rot, label: 'อุโมงค์ (ออก)' };
        break;
      }
    }
  }

  // 7. Place Seesaw (1 straight cell, strictly 30x30cm) - PT-Version (hard / very_hard)
  if (mode === 'pt_version' && (difficulty === 'hard' || difficulty === 'very_hard')) {
    const sIdx = path.findIndex((p, idx) => idx > 1 && idx < endIndex - 2 && grid[p.r][p.c].type === 'line_straight');
    if (sIdx !== -1) {
      const pt = path[sIdx];
      const rot = grid[pt.r][pt.c].rotation;
      grid[pt.r][pt.c] = { row: pt.r, col: pt.c, type: 'seesaw', rotation: rot, label: 'ไม้กระดก 30x30' };
    }
  }

  // 8. Place Hill Drop (PT-Version very_hard)
  if (mode === 'pt_version' && difficulty === 'very_hard') {
    const hIdx = path.findIndex((p, idx) => idx > 1 && idx < endIndex - 2 && grid[p.r][p.c].type === 'line_straight');
    if (hIdx !== -1) {
      const pt = path[hIdx];
      grid[pt.r][pt.c] = { row: pt.r, col: pt.c, type: 'hill_drop', rotation: 0, label: 'ทางลาดขึ้นเนิน' };
    }
  }

  // 9. Place Checkpoints (Mandatory 2 Points)
  // Evenly spaced along the path
  const validCpIndices = path
    .map((p, idx) => ({ p, idx }))
    .filter(({ idx }) => idx > 1 && idx < endIndex - 2)
    .filter(({ p }) => {
      const t = grid[p.r][p.c].type;
      return t === 'line_straight' || t === 'line_corner';
    });

  if (validCpIndices.length >= 2) {
    const cp1 = validCpIndices[Math.floor(validCpIndices.length * 0.28)];
    const cp2 = validCpIndices[Math.floor(validCpIndices.length * 0.72)];

    const applyCp = (item: { p: { r: number; c: number } }, label: string) => {
      const cell = grid[item.p.r][item.p.c];
      if (cell.type === 'line_corner') {
        cell.type = 'checkpoint_corner';
      } else {
        cell.type = 'checkpoint';
      }
      cell.label = label;
    };

    applyCp(cp1, 'Check Point 1');
    applyCp(cp2, 'Check Point 2');
  }

  // 10. Place 4 Drop Zones
  // PT-Version: 4 distinct colors (Red, Green, Blue, Yellow)
  // OBEC: 4 Green zones (พื้นที่สีเขียว 4 จุด ตามกติกา สพฐ.)
  const dropTileTypes: TileType[] =
    mode === 'pt_version'
      ? ['drop_red', 'drop_green', 'drop_blue', 'drop_yellow']
      : ['drop_green', 'drop_green', 'drop_green', 'drop_green'];

  // Find 4 path positions where robot drives through to drop
  const availableTrackSlots = path
    .map((p, idx) => ({ p, idx }))
    .filter(({ idx }) => idx > 0 && idx < endIndex - 1)
    .filter(({ p }) => {
      const t = grid[p.r][p.c].type;
      return t === 'line_straight' || t === 'line_corner';
    });

  if (availableTrackSlots.length >= 4) {
    const step = Math.floor(availableTrackSlots.length / 4);
    for (let i = 0; i < 4; i++) {
      const slot = availableTrackSlots[Math.min(i * step, availableTrackSlots.length - 1)];
      const pt = slot.p;
      const existingRot = grid[pt.r][pt.c].rotation || 0;

      const colorName =
        mode === 'pt_version'
          ? i === 0 ? 'แดง' : i === 1 ? 'เขียว' : i === 2 ? 'น้ำเงิน' : 'เหลือง'
          : `โซน ${i + 1} (เขียว)`;

      grid[pt.r][pt.c] = {
        row: pt.r,
        col: pt.c,
        type: dropTileTypes[i],
        rotation: existingRot,
        label: `ปล่อยถุง: ${colorName}`,
      };
    }
  }

  // 11. Place Speed Bumps (7 Rumble Strips)
  // Allowed in: PT (easy/med/hard/very_hard), OBEC ม.ต้น, OBEC ม.ปลาย
  const isSpeedBumpsAllowed =
    (mode === 'pt_version' && difficulty !== 'very_easy') ||
    mode === 'obec_junior' ||
    mode === 'obec_senior';

  if (isSpeedBumpsAllowed) {
    const sbSlot = path.find((p, idx) => idx > 1 && idx < endIndex - 2 && grid[p.r][p.c].type === 'line_straight');
    if (sbSlot) {
      grid[sbSlot.r][sbSlot.c] = {
        row: sbSlot.r,
        col: sbSlot.c,
        type: 'speed_bumps',
        rotation: grid[sbSlot.r][sbSlot.c].rotation,
        label: 'ลูกระนาด 7 อัน',
      };
    }
  }

  // 12. Place Black Pit & Barrier Bomb ONLY in OFF-TRACK Cells (Decoy/Trap Hazard)
  // Guaranteed NEVER to intersect or block the required path!
  const pathSet = new Set(path.map((p) => `${p.r},${p.c}`));
  const offTrackCells: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < FIELD_ROWS; r++) {
    for (let c = 0; c < FIELD_COLS; c++) {
      if (!pathSet.has(`${r},${c}`) && grid[r][c].type === 'normal') {
        offTrackCells.push({ r, c });
      }
    }
  }

  // Black Pit (ห้ามลึกเกิน 50% - decoy trap off-path)
  const isBlackPitAllowed =
    (mode === 'pt_version' && (difficulty === 'medium' || difficulty === 'hard' || difficulty === 'very_hard')) ||
    mode === 'obec_junior' ||
    mode === 'obec_senior';

  if (isBlackPitAllowed && offTrackCells.length > 0) {
    const pitCell = offTrackCells.shift()!;
    grid[pitCell.r][pitCell.c] = {
      row: pitCell.r,
      col: pitCell.c,
      type: 'black_pit',
      rotation: 0,
      label: 'หลุมดำ (ห้ามลึกเกิน 50%)',
    };
  }

  // Barrier Bomb (PT-Version hard/very_hard only)
  if (mode === 'pt_version' && (difficulty === 'hard' || difficulty === 'very_hard') && offTrackCells.length > 0) {
    const bombCell = offTrackCells.pop()!;
    grid[bombCell.r][bombCell.c] = {
      row: bombCell.r,
      col: bombCell.c,
      type: 'barrier_bomb',
      rotation: 0,
      label: 'จุดลูกระเบิด (ห้ามค้าง > 3s)',
    };
  }

  // 13. Ensure ALL 32 cells are completely filled with real physical tiles
  const tiles: GridTile[] = [];
  for (let r = 0; r < FIELD_ROWS; r++) {
    for (let c = 0; c < FIELD_COLS; c++) {
      tiles.push(grid[r][c]);
    }
  }

  // Compute Summary of Tiles Used
  const countMap = new Map<TileType, number>();
  for (const t of tiles) {
    countMap.set(t.type, (countMap.get(t.type) || 0) + 1);
  }

  const summary: TileUsageSummary[] = [];
  countMap.forEach((count, type) => {
    const meta = TILE_METADATA[type] || { name: type, category: 'อื่นๆ', desc: '' };
    summary.push({
      type,
      name: meta.name,
      count,
      badge: meta.badge,
      category: meta.category,
    });
  });

  summary.sort((a, b) => {
    if (a.type === 'start') return -1;
    if (b.type === 'start') return 1;
    if (a.type === 'finish') return -1;
    if (b.type === 'finish') return 1;
    if (a.type.startsWith('drop_')) return -1;
    if (b.type.startsWith('drop_')) return 1;
    if (a.type === 'normal') return 1;
    if (b.type === 'normal') return -1;
    return b.count - a.count;
  });

  const modeName =
    mode === 'pt_version'
      ? 'หุ่นยนต์ขนส่งถุงยังชีพ (PT-Version)'
      : mode === 'obec_junior'
      ? 'หุ่นยนต์ขนส่งถุงยังชีพ (สพฐ. มัธยมศึกษาตอนต้น)'
      : 'หุ่นยนต์ขนส่งถุงยังชีพ (สพฐ. มัธยมศึกษาตอนปลาย)';

  const arenaId = `arena_${mode}_${difficulty}_seed${seed}`;
  const arenaName =
    customName ||
    `${modeName} - ระดับ${cfg.name} (Seed #${seed})`;

  const missionRules =
    mode === 'pt_version'
      ? [
          'หุ่นยนต์ทำงานแบบอัตโนมัติ 100% (Autonomous) ห้ามใช้รีโมทหรือการควบคุมระยะไกลทุกชนิด',
          'ปล่อยตัวจากจุด START วิ่งบนพื้นสีขาว ล้อห้ามสัมผัสหรือเหยียบเส้นสีดำของสนาม',
          'ผ่านจุด Check Point ทั้ง 2 จุด (จุดละ 10 คะแนน = 20 คะแนน)',
          'ปล่อยถุงยังชีพ 4 จุด 4 สี (แดง, เขียว, น้ำเงิน, เหลือง) ลงในพื้นที่เป้าหมาย (จุดละ 15 คะแนน = 60 คะแนน)',
          'วิ่งเข้าจุด FINISH และหยุดนิ่งสนิท (20 คะแนน) รวมคะแนนเต็ม 100 คะแนน',
          'เวลาแข่งขันรอบละ 3 นาที | หลุมดำเข้าได้ไม่เกิน 50% | จุดลูกระเบิดห้ามหยุดนิ่งเกิน 3 วินาที',
        ]
      : mode === 'obec_junior'
      ? [
          'หุ่นยนต์ทำงานแบบอัตโนมัติ 100% (Autonomous) ห้ามใช้รีโมตคอนโทรลทุกชนิด',
          'บรรจุถุงยังชีพได้ไม่เกิน 10 ชิ้น ก่อนปล่อยตัวจากจุด START (บรรจุเสร็จสิ้นในครั้งเดียว)',
          'วิ่งบนเส้นทางเดินสีขาว (Safe Zone) เท่านั้น ห้ามสัมผัสเส้นสีดำนานเกิน 5 วินาที',
          'ผ่านจุด Check Point สติกเกอร์สีเหลือง 2 จุด (จุดละ 15 คะแนน = 30 คะแนน)',
          'ปล่อยถุงยังชีพในพื้นที่สีเขียวทั้ง 4 จุด (จุดละ 15 คะแนน = 60 คะแนน)',
          'เมื่อทำภารกิจครบ ต้องวิ่งกลับมา "หยุดนิ่ง" ณ ช่อง START เดิม (10 คะแนน) รวมเต็ม 100 คะแนน',
          'อุปสรรคระดับ ม.ต้น: หลุมดำ 1 แผ่น (ห้ามลึกเกิน 50%) + ลูกระนาด 1 แผ่น (7 แถบ)',
        ]
      : [
          'หุ่นยนต์ทำงานแบบอัตโนมัติ 100% (Autonomous) ห้ามใช้รีโมตคอนโทรลทุกชนิด',
          'บรรจุถุงยังชีพได้ไม่เกิน 10 ชิ้น ก่อนปล่อยตัวจากจุด START (บรรจุเสร็จสิ้นในครั้งเดียว)',
          'วิ่งบนเส้นทางเดินสีขาว (Safe Zone) เท่านั้น ห้ามสัมผัสเส้นสีดำนานเกิน 5 วินาที',
          'ผ่านจุด Check Point สติกเกอร์สีเหลือง 2 จุด (จุดละ 15 คะแนน = 30 คะแนน)',
          'ปล่อยถุงยังชีพในพื้นที่สีเขียวทั้ง 4 จุด (จุดละ 15 คะแนน = 60 คะแนน)',
          'เมื่อทำภารกิจครบ ต้องวิ่งกลับมา "หยุดนิ่ง" ณ ช่อง START เดิม (10 คะแนน) รวมเต็ม 100 คะแนน',
          'อุปสรรคระดับ ม.ปลาย (ครบ 3 ชนิด): หลุมดำ 1 แผ่น + ลูกระนาด 1 แผ่น + สะพานลาดชัน 1 ชุด (3 แผ่น สูง 5 ซม.)',
        ];

  const scoringBreakdown =
    mode === 'pt_version'
      ? [
          { item: 'ผ่านจุด Check Point (2 จุด x 10 คะแนน)', points: 20 },
          { item: 'ปล่อยถุงยังชีพ 4 จุด 4 สี (4 จุด x 15 คะแนน)', points: 60 },
          { item: 'วิ่งเข้าจุด FINISH และหยุดนิ่ง', points: 20 },
        ]
      : [
          { item: 'ผ่านจุด Check Point สีเหลือง (2 จุด x 15 คะแนน)', points: 30 },
          { item: 'ปล่อยถุงยังชีพพื้นที่สีเขียว 4 จุด (4 จุด x 15 คะแนน)', points: 60 },
          { item: 'วิ่งกลับเข้าจุด START และหยุดนิ่ง', points: 10 },
        ];

  return {
    id: arenaId,
    name: arenaName,
    seed,
    competitionMode: mode,
    competitionModeLabel: modeName,
    difficulty,
    difficultyLabel: `${cfg.name} (${cfg.enName})`,
    tiles,
    createdAt: new Date().toLocaleString('th-TH'),
    summary,
    totalTiles: tiles.length,
    description: cfg.description,
    missionRules,
    scoringBreakdown,
  };
}

/**
 * Generate Pure Inline SVG representation for any single Tile
 */
export function renderTileSvgString(type: TileType, rotation: TileRotation = 0, size = 60): string {
  let innerSvg = '';

  switch (type) {
    case 'start':
      innerSvg = `
        <rect width="${size}" height="${size}" fill="#dc2626" rx="2" />
        <text x="${size / 2}" y="${size / 2 + 5}" fill="#ffffff" font-size="${size * 0.22}" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle">START</text>
      `;
      break;

    case 'finish':
      innerSvg = `
        <rect width="${size}" height="${size}" fill="#0891b2" rx="2" />
        <text x="${size / 2}" y="${size / 2 + 5}" fill="#ffffff" font-size="${size * 0.2}" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle">FINISH</text>
      `;
      break;

    case 'checkpoint':
      innerSvg = `
        <rect width="${size}" height="${size}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
        <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.2}" fill="#facc15" stroke="#ca8a04" stroke-width="2.5" />
      `;
      break;

    case 'checkpoint_line':
      innerSvg = `
        <rect width="${size}" height="${size}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
        <circle cx="${size / 2}" cy="${size * 0.45}" r="${size * 0.18}" fill="#facc15" stroke="#ca8a04" stroke-width="2.5" />
        <rect x="0" y="${size * 0.8}" width="${size}" height="${size * 0.2}" fill="#0f172a" />
      `;
      break;

    case 'checkpoint_corner':
      innerSvg = `
        <rect width="${size}" height="${size}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
        <circle cx="${size * 0.55}" cy="${size * 0.55}" r="${size * 0.18}" fill="#facc15" stroke="#ca8a04" stroke-width="2.5" />
        <rect x="0" y="0" width="${size * 0.2}" height="${size}" fill="#0f172a" />
        <rect x="0" y="${size * 0.8}" width="${size}" height="${size * 0.2}" fill="#0f172a" />
      `;
      break;

    case 'line_straight':
      innerSvg = `
        <rect width="${size}" height="${size}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
        <rect x="0" y="${size * 0.8}" width="${size}" height="${size * 0.2}" fill="#0f172a" />
      `;
      break;

    case 'line_corner':
      innerSvg = `
        <rect width="${size}" height="${size}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
        <rect x="0" y="0" width="${size * 0.2}" height="${size}" fill="#0f172a" />
        <rect x="0" y="${size * 0.8}" width="${size}" height="${size * 0.2}" fill="#0f172a" />
      `;
      break;

    case 'line_parallel':
      innerSvg = `
        <rect width="${size}" height="${size}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
        <rect x="0" y="0" width="${size}" height="${size * 0.18}" fill="#0f172a" />
        <rect x="0" y="${size * 0.82}" width="${size}" height="${size * 0.18}" fill="#0f172a" />
      `;
      break;

    case 'bridge_up':
      innerSvg = `
        <rect width="${size}" height="${size}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
        <polygon points="4,${size - 6} ${size - 4},${size * 0.25} ${size - 4},${size - 6}" fill="#16a34a" />
        <rect x="0" y="${size - 6}" width="${size}" height="6" fill="#15803d" />
        <text x="${size / 2}" y="${size / 2 + 3}" fill="#ffffff" font-size="9" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle">ขึ้น</text>
      `;
      break;

    case 'bridge_deck':
      innerSvg = `
        <rect width="${size}" height="${size}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
        <rect x="4" y="${size * 0.25}" width="${size - 8}" height="${size * 0.5}" fill="#64748b" />
        <rect x="4" y="${size * 0.2}" width="${size - 8}" height="4" fill="#facc15" />
        <text x="${size / 2}" y="${size / 2 + 3}" fill="#ffffff" font-size="8" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">50mm</text>
      `;
      break;

    case 'bridge_down':
      innerSvg = `
        <rect width="${size}" height="${size}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
        <polygon points="4,${size * 0.25} ${size - 4},${size - 6} 4,${size - 6}" fill="#eab308" />
        <rect x="0" y="${size - 6}" width="${size}" height="6" fill="#ca8a04" />
        <text x="${size / 2}" y="${size / 2 + 3}" fill="#ffffff" font-size="9" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle">ลง</text>
      `;
      break;

    case 'seesaw':
      // 300x300mm Seesaw platform (Strictly 1 Modular Tile 30x30cm, Height 40mm)
      innerSvg = `
        <rect width="${size}" height="${size}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
        <rect x="2" y="2" width="${size - 4}" height="${size - 4}" fill="#f1f5f9" rx="2" />
        <rect x="4" y="4" width="${size - 8}" height="${size - 8}" fill="#cbd5e1" rx="1.5" />
        <rect x="4" y="4" width="${size - 8}" height="4.5" fill="#2563eb" rx="1" />
        <rect x="4" y="${size - 8.5}" width="${size - 8}" height="4.5" fill="#2563eb" rx="1" />
        <rect x="${size / 2 - 2.5}" y="3" width="5" height="${size - 6}" fill="#ea580c" rx="1.5" />
        <text x="${size / 2}" y="${size / 2 + 3}" fill="#0f172a" font-size="7.5" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle">30x30</text>
      `;
      break;

    case 'hill_drop':
      innerSvg = `
        <rect width="${size}" height="${size}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
        <polygon points="4,${size - 6} ${size * 0.6},${size * 0.4} ${size - 4},${size * 0.4} ${size - 4},${size - 6}" fill="#64748b" />
        <rect x="${size * 0.6}" y="${size * 0.35}" width="${size * 0.35}" height="5" fill="#16a34a" />
      `;
      break;

    case 'tunnel':
      innerSvg = `
        <rect width="${size}" height="${size}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
        <rect x="2" y="${size * 0.2}" width="${size - 4}" height="${size * 0.6}" rx="3" fill="#334155" stroke="#475569" stroke-width="1.5" />
        <rect x="${size * 0.15}" y="${size * 0.32}" width="${size * 0.7}" height="${size * 0.45}" rx="2" fill="#090d16" />
      `;
      break;

    case 'drop_red':
    case 'drop_green':
    case 'drop_blue':
    case 'drop_yellow':
      const colorHex =
        type === 'drop_red'
          ? '#ef4444'
          : type === 'drop_green'
          ? '#16a34a'
          : type === 'drop_blue'
          ? '#2563eb'
          : '#eab308';
      const colorLabel =
        type === 'drop_red' ? 'RED' : type === 'drop_green' ? 'GREEN' : type === 'drop_blue' ? 'BLUE' : 'YELLOW';
      innerSvg = `
        <rect width="${size}" height="${size}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
        <rect x="${size * 0.1}" y="${size * 0.42}" width="${size * 0.8}" height="${size * 0.46}" fill="${colorHex}" rx="2" />
        <rect x="0" y="${size * 0.9}" width="${size}" height="${size * 0.1}" fill="#0f172a" />
        <text x="${size / 2}" y="${size * 0.7}" fill="#ffffff" font-size="8.5" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle">${colorLabel}</text>
      `;
      break;

    case 'speed_bumps':
      innerSvg = `
        <rect width="${size}" height="${size}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
        ${[0.15, 0.27, 0.39, 0.5, 0.62, 0.74, 0.86]
          .map((x) => `<line x1="${size * x}" y1="4" x2="${size * x}" y2="${size - 4}" stroke="#ea580c" stroke-width="3" stroke-linecap="round" />`)
          .join('')}
      `;
      break;

    case 'black_pit':
      innerSvg = `
        <rect width="${size}" height="${size}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
        <rect x="${size * 0.15}" y="${size * 0.12}" width="${size * 0.7}" height="${size * 0.76}" fill="#090d16" rx="2" />
        <rect x="${size * 0.12}" y="${size * 0.09}" width="${size * 0.76}" height="${size * 0.82}" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3,2" />
      `;
      break;

    case 'barrier_bomb':
      innerSvg = `
        <rect width="${size}" height="${size}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
        <rect x="0" y="${size * 0.8}" width="${size}" height="${size * 0.2}" fill="#0f172a" />
        <circle cx="${size / 2}" cy="${size * 0.5}" r="${size * 0.18}" fill="#ef4444" stroke="#b91c1c" stroke-width="1.5" />
        <text x="${size / 2}" y="${size * 0.5 + 3}" fill="#ffffff" font-size="8" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">BOMB</text>
      `;
      break;

    case 'normal':
    default:
      innerSvg = `
        <rect width="${size}" height="${size}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
        <rect x="2" y="2" width="${size - 4}" height="${size - 4}" fill="#f8fafc" stroke="#f1f5f9" stroke-width="1" />
      `;
      break;
  }

  const transform = rotation !== 0 ? `transform="rotate(${rotation} ${size / 2} ${size / 2})"` : '';

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <g ${transform}>${innerSvg}</g>
  </svg>`;
}

/**
 * Render Complete Standalone SVG Arena Map (4x8 Grid)
 */
export function generateFullArenaSvg(tiles: GridTile[], cellSize = 68): string {
  const width = FIELD_COLS * cellSize;
  const height = FIELD_ROWS * cellSize;
  const margin = 26;
  const totalW = width + margin * 2;
  const totalH = height + margin * 2 + 10;

  let tilesSvg = '';

  for (const t of tiles) {
    const x = margin + t.col * cellSize;
    const y = margin + t.row * cellSize;
    const singleSvg = renderTileSvgString(t.type, t.rotation || 0, cellSize);
    const innerContent = singleSvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');

    tilesSvg += `
      <g transform="translate(${x}, ${y})">
        ${innerContent}
        <text x="3" y="10" fill="#64748b" font-size="7.5" font-family="monospace" font-weight="bold" opacity="0.8">[${t.row},${t.col}]</text>
        ${
          t.label
            ? `<rect x="2" y="${cellSize - 13}" width="${t.label.length * 6 + 6}" height="11" rx="2" fill="#0f172a" opacity="0.85" />
               <text x="5" y="${cellSize - 5}" fill="#facc15" font-size="7.5" font-family="system-ui, sans-serif" font-weight="bold">${t.label}</text>`
            : ''
        }
      </g>
    `;
  }

  let colHeaders = '';
  for (let c = 0; c < FIELD_COLS; c++) {
    colHeaders += `<text x="${margin + c * cellSize + cellSize / 2}" y="${margin - 8}" fill="#475569" font-size="10" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">Col ${c}</text>`;
  }

  let rowHeaders = '';
  for (let r = 0; r < FIELD_ROWS; r++) {
    rowHeaders += `<text x="${margin - 8}" y="${margin + r * cellSize + cellSize / 2 + 4}" fill="#475569" font-size="10" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="end">Row ${r}</text>`;
  }

  return `
    <svg width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border:2px solid #cbd5e1; border-radius:10px;">
      ${colHeaders}
      ${rowHeaders}
      <rect x="${margin - 1}" y="${margin - 1}" width="${width + 2}" height="${height + 2}" fill="none" stroke="#0f172a" stroke-width="2.5" rx="3" />
      ${tilesSvg}
      <text x="${totalW / 2}" y="${totalH - 6}" fill="#64748b" font-size="9" font-family="system-ui, sans-serif" text-anchor="middle">
        ขนาดสนามจริง: 120 x 240 ซม. (4 แถว x 8 คอลัมน์) | แผ่นละ 30 x 30 ซม. (รวม 32 แผ่น)
      </text>
    </svg>
  `;
}

/**
 * Generate 100% Offline Standalone HTML Document
 * Strictly formatted as Portrait (แนวตั้ง) A4 with embedded styles and SVGs.
 * Tile Inventory and Coordinates Table ALWAYS start on a new page when printed.
 */
export function exportArenaToOfflineHtml(arena: GeneratedArenaResult): string {
  const fullMapSvg = generateFullArenaSvg(arena.tiles, 68);

  const tileRowsHtml = arena.summary
    .map(
      (item, idx) => `
      <tr>
        <td style="text-align:center; font-weight:bold; color:#64748b;">${idx + 1}</td>
        <td style="text-align:center; width:50px; padding:4px;">
          ${renderTileSvgString(item.type, 0, 38)}
        </td>
        <td style="font-weight:600; color:#0f172a;">
          ${item.name}
          ${item.badge ? `<span class="badge">${item.badge}</span>` : ''}
        </td>
        <td style="color:#64748b; font-size:12px;">${item.category}</td>
        <td style="text-align:center; font-size:15px; font-weight:bold; color:#0284c7;">${item.count}</td>
      </tr>
    `
    )
    .join('');

  let gridMatrixHtml = '';
  for (let r = 0; r < FIELD_ROWS; r++) {
    gridMatrixHtml += `<tr><th style="background:#f1f5f9; color:#475569; padding:5px; font-size:10px;">Row ${r}</th>`;
    for (let c = 0; c < FIELD_COLS; c++) {
      const t = arena.tiles.find((tile) => tile.row === r && tile.col === c);
      const meta = t ? TILE_METADATA[t.type] || { name: t.type } : { name: 'Normal' };
      gridMatrixHtml += `
        <td style="padding:4px; text-align:center; background:#ffffff; border:1px solid #e2e8f0; font-size:10px;">
          <div style="font-weight:bold; color:#0f172a;">${t ? t.type.toUpperCase() : 'NORMAL'}</div>
          <div style="font-size:9px; color:#64748b;">${meta.name}</div>
          ${t && t.rotation ? `<div style="font-size:8.5px; color:#0284c7; font-family:monospace;">หมุน ${t.rotation}°</div>` : ''}
          ${t && t.label ? `<div style="font-size:8.5px; color:#ca8a04; font-weight:bold;">${t.label}</div>` : ''}
        </td>
      `;
    }
    gridMatrixHtml += `</tr>`;
  }

  const rulesListHtml = arena.missionRules
    .map((rule, idx) => `<li style="margin-bottom:4px;"><b>${idx + 1}.</b> ${rule}</li>`)
    .join('');

  const scoringCardsHtml = arena.scoringBreakdown
    .map(
      (s) => `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; flex:1; min-width:180px; text-align:center;">
        <div style="font-size:11px; color:#64748b; font-weight:600;">${s.item}</div>
        <div style="font-size:18px; color:#0284c7; font-weight:800; margin-top:2px;">${s.points} คะแนน</div>
      </div>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${arena.name} - KT-IDE Robotics Arena Map</title>
  <style>
    /* 100% Offline Embedded CSS - Zero External Dependencies */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #f1f5f9;
      color: #0f172a;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      padding: 24px;
      line-height: 1.5;
    }
    .container {
      max-width: 960px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 28px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.06);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .header-left h1 {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .meta-tag {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 700;
      background: #e0f2fe;
      color: #0284c7;
      margin-right: 6px;
    }
    .meta-mode {
      background: #fef3c7;
      color: #b45309;
    }
    .meta-seed {
      background: #f3e8ff;
      color: #7e22ce;
      font-family: monospace;
    }
    .print-btn {
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.2s;
    }
    .print-btn:hover { background: #0369a1; }
    .map-container {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
      overflow-x: auto;
    }
    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 22px;
    }
    th {
      background: #f8fafc;
      color: #475569;
      padding: 8px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid #e2e8f0;
    }
    td {
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      font-size: 12px;
    }
    tr:nth-child(even) td { background: #fafafa; }
    .badge {
      display: inline-block;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 9.5px;
      font-family: monospace;
      background: #e2e8f0;
      color: #334155;
      margin-left: 6px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
    }

    /* Print-Ready Styles: STRICTLY PORTRAIT A4 */
    @media print {
      body { background: #ffffff !important; color: #000000 !important; padding: 0 !important; }
      .container { box-shadow: none !important; border: none !important; max-width: 100% !important; padding: 0 !important; }
      .print-btn { display: none !important; }
      .map-container { background: #ffffff !important; border: 1px solid #cbd5e1 !important; padding: 8px !important; }
      th { background: #f1f5f9 !important; color: #000000 !important; }
      td { color: #000000 !important; border-color: #cbd5e1 !important; }

      /* Force page breaks for Tile Inventory and Grid Coordinates tables */
      .page-break-section {
        page-break-before: always !important;
        break-before: page !important;
      }

      @page {
        size: portrait;
        margin: 8mm;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- PAGE 1: Header, Scoring, Map, Rules -->
    <div class="header">
      <div class="header-left">
        <h1>${arena.name}</h1>
        <p>
          <span class="meta-tag meta-mode">โหมด: ${arena.competitionModeLabel}</span>
          <span class="meta-tag">ระดับ: ${arena.difficultyLabel}</span>
          <span class="meta-tag meta-seed">Seed #${arena.seed}</span>
          <span class="meta-tag">สร้างเมื่อ: ${arena.createdAt}</span>
          <span class="meta-tag">ขนาด: 4x8 ช่อง (120x240 ซม.)</span>
        </p>
      </div>
      <div>
        <button class="print-btn" onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF (แนวตั้ง)</button>
      </div>
    </div>

    <!-- Scoring Breakdown -->
    <div style="display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap;">
      ${scoringCardsHtml}
    </div>

    <!-- Top-Down Visual Arena Map -->
    <div class="section-title">🗺️ ผังสนามมุมสูง (Top-Down Arena Map 4x8 ช่อง = 32 แผ่น)</div>
    <div class="map-container">
      ${fullMapSvg}
    </div>

    <!-- Rules summary -->
    <div class="section-title">📋 สรุปภารกิจและกติกาสำคัญ</div>
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:20px; font-size:12px; color:#334155;">
      <ul style="padding-left:18px;">
        ${rulesListHtml}
      </ul>
    </div>

    <!-- PAGE 2: Tile Inventory (Always Starts on Fresh New Page in PDF) -->
    <div class="page-break-section" style="padding-top:16px;">
      <div class="section-title">📦 รายการและจำนวนแผ่นที่ใช้ (Tile Inventory)</div>
      <table>
        <thead>
          <tr>
            <th style="width:36px;">#</th>
            <th style="width:50px;">ตัวอย่าง</th>
            <th>ชื่อแผ่นกระเบื้อง (Tile Name)</th>
            <th style="width:110px;">หมวดหมู่</th>
            <th style="width:80px; text-align:center;">จำนวนที่ใช้</th>
          </tr>
        </thead>
        <tbody>
          ${tileRowsHtml}
        </tbody>
        <tfoot>
          <tr style="background:#f8fafc; font-weight:bold;">
            <td colspan="4" style="text-align:right; color:#334155;">รวมจำนวนแผ่นทั้งสนาม:</td>
            <td style="text-align:center; color:#0284c7; font-size:14px;">${arena.totalTiles} แผ่น (32 ช่อง)</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- PAGE 3: Coordinate Grid Placement Matrix (Always Starts on Fresh New Page in PDF) -->
    <div class="page-break-section" style="padding-top:16px;">
      <div class="section-title">📍 พิกัดการวางแผ่นแต่ละช่อง (Grid Coordinates Map 4x8)</div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th style="width:60px;">แถว / คอลัมน์</th>
              ${Array.from({ length: FIELD_COLS }, (_, i) => `<th>Col ${i}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${gridMatrixHtml}
          </tbody>
        </table>
      </div>
    </div>

    <div class="footer">
      ©KT-IDE | Develop By KATEAW
    </div>
  </div>
</body>
</html>`;
}

/**
 * Print or Save to PDF via Browser's Native Print Pipeline
 * Strictly formatted as Portrait (แนวตั้ง) A4
 */
export function printArenaMap(arena: GeneratedArenaResult) {
  const htmlContent = exportArenaToOfflineHtml(arena);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 350);
  }
}

/**
 * Download Standalone HTML file
 */
export function downloadArenaHtml(arena: GeneratedArenaResult) {
  const htmlContent = exportArenaToOfflineHtml(arena);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${arena.id}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
