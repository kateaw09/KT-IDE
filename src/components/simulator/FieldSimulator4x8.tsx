import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  BridgeDirection,
  GridTile,
  TileType,
  TileRotation,
} from '../../types/simulator';
import {
  FIELD_COLS,
  FIELD_HEIGHT_CM,
  FIELD_ROWS,
  FIELD_WIDTH_CM,
  getRobotCorners,
  TILE_SIZE_CM,
} from '../../sim-engine/physics';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { RotateCw, RefreshCw, Layers, Sparkles, AlertTriangle, MapPin, Undo2 } from 'lucide-react';

export const FieldSimulator4x8: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
    loadPreset,
  } = useSimulatorStore();

  const [isMouseDown, setIsMouseDown] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  // Animation Frame Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      if (simStatus === 'running') {
        stepEngine(dt);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [simStatus, stepEngine]);

  // Convert mouse event coordinates to grid cell
  const getCellFromMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const RULER_THICKNESS = 28;
    const mouseX = (e.clientX - rect.left) * scaleX - RULER_THICKNESS;
    const mouseY = (e.clientY - rect.top) * scaleY - RULER_THICKNESS;

    const gridW = canvas.width - RULER_THICKNESS;
    const gridH = canvas.height - RULER_THICKNESS;

    if (mouseX < 0 || mouseX > gridW || mouseY < 0 || mouseY > gridH) return null;

    const cmPerPxX = FIELD_WIDTH_CM / gridW;
    const cmPerPxY = FIELD_HEIGHT_CM / gridH;

    const cmX = mouseX * cmPerPxX;
    const cmY = mouseY * cmPerPxY;

    const col = Math.floor(cmX / TILE_SIZE_CM);
    const row = Math.floor(cmY / TILE_SIZE_CM);

    return { row, col, cmX, cmY };
  };

  // Handle cell click / drag for tile placement
  const handleCanvasInteraction = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const cellInfo = getCellFromMouse(e);
      if (!cellInfo) return;

      const { row, col, cmX, cmY } = cellInfo;

      if (placementMode === 'robot') {
        setRobotCell(row, col);
        return;
      }

      if (col >= 0 && col < FIELD_COLS && row >= 0 && row < FIELD_ROWS) {
        setTileType(row, col, activeTool, activeRotation);
      }
    },
    [placementMode, setRobotCell, activeTool, activeRotation, setTileType]
  );

  // Right-click: rotates robot if in robot mode, else rotates cell by 90 deg
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (placementMode === 'robot') {
      rotateRobot(90);
      return;
    }
    const cellInfo = getCellFromMouse(e);
    if (!cellInfo) return;
    const { row, col } = cellInfo;
    if (col >= 0 && col < FIELD_COLS && row >= 0 && row < FIELD_ROWS) {
      rotateTile(row, col);
    }
  };

  // HTML5 Drag and Drop support
  const handleDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const RULER_THICKNESS = 28;
      const mouseX = (e.clientX - rect.left) * scaleX - RULER_THICKNESS;
      const mouseY = (e.clientY - rect.top) * scaleY - RULER_THICKNESS;

      const col = Math.floor(mouseX / ((canvas.width - RULER_THICKNESS) / FIELD_COLS));
      const row = Math.floor(mouseY / ((canvas.height - RULER_THICKNESS) / FIELD_ROWS));

      if (col >= 0 && col < FIELD_COLS && row >= 0 && row < FIELD_ROWS) {
        setTileType(row, col, data.type || activeTool, data.rotation ?? activeRotation);
      }
    } catch (err) {}
  };

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const RULER_T = 28;
    const W = canvas.width;
    const H = canvas.height;
    const gridW = W - RULER_T;
    const gridH = H - RULER_T;

    const cellW = gridW / FIELD_COLS;
    const cellH = gridH / FIELD_ROWS;

    // Clear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // 1. Draw Rulers (Top & Left)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, W, RULER_T);
    ctx.fillRect(0, 0, RULER_T, H);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(RULER_T, 0);
    ctx.lineTo(RULER_T, H);
    ctx.moveTo(0, RULER_T);
    ctx.lineTo(W, RULER_T);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Top Ruler Ticks (cm)
    for (let c = 0; c <= FIELD_COLS; c++) {
      const px = RULER_T + c * cellW;
      const cm = c * TILE_SIZE_CM;
      ctx.beginPath();
      ctx.moveTo(px, RULER_T - 8);
      ctx.lineTo(px, RULER_T);
      ctx.stroke();
      if (c < FIELD_COLS) {
        ctx.fillText(`${cm}cm`, px + cellW / 2, RULER_T / 2);
      }
    }

    // Left Ruler Ticks (cm)
    for (let r = 0; r <= FIELD_ROWS; r++) {
      const py = RULER_T + r * cellH;
      const cm = r * TILE_SIZE_CM;
      ctx.beginPath();
      ctx.moveTo(RULER_T - 8, py);
      ctx.lineTo(RULER_T, py);
      ctx.stroke();
      if (r < FIELD_ROWS) {
        ctx.save();
        ctx.translate(RULER_T / 2, py + cellH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${cm}cm`, 0, 0);
        ctx.restore();
      }
    }

    // Helper: Draw rotated tile content
    const withRotation = (tx: number, ty: number, rotDeg: number, drawFn: () => void) => {
      ctx.save();
      const cx = tx + cellW / 2;
      const cy = ty + cellH / 2;
      ctx.translate(cx, cy);
      ctx.rotate((rotDeg * Math.PI) / 180);
      ctx.translate(-cellW / 2, -cellH / 2);
      drawFn();
      ctx.restore();
    };

    // 2. Draw 4x8 Grid Tiles (Competition Specification Fidelity)
    tiles.forEach((tile) => {
      const tx = RULER_T + tile.col * cellW;
      const ty = RULER_T + tile.row * cellH;
      const rot = tile.rotation || 0;

      ctx.save();
      ctx.beginPath();
      ctx.rect(tx, ty, cellW, cellH);
      ctx.clip();

      // Base background: white/cream competition matte
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(tx, ty, cellW, cellH);

      // Tile Borders
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx, ty, cellW, cellH);

      const LINE_W = 12; // Standard ~20mm line scaled to cell

      if (tile.type === 'normal') {
        // Clear Floor tile with subtle grid coordinate
        ctx.fillStyle = (tile.row + tile.col) % 2 === 0 ? '#ffffff' : '#f8fafc';
        ctx.fillRect(tx, ty, cellW, cellH);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`[${tile.row},${tile.col}]`, tx + cellW / 2, ty + cellH / 2);
      } else if (tile.type === 'start') {
        // START Zone: Bright Red box with bold text
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(tx + 4, ty + 4, cellW - 8, cellH - 8);
        ctx.strokeStyle = '#b91c1c';
        ctx.lineWidth = 3;
        ctx.strokeRect(tx + 4, ty + 4, cellW - 8, cellH - 8);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('START', tx + cellW / 2, ty + cellH / 2 - 4);
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText('จุดเริ่มต้น', tx + cellW / 2, ty + cellH / 2 + 12);
      } else if (tile.type === 'finish') {
        // FINISH Zone: Bright Cyan Box
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(tx + 4, ty + 4, cellW - 8, cellH - 8);
        ctx.strokeStyle = '#0e7490';
        ctx.lineWidth = 3;
        ctx.strokeRect(tx + 4, ty + 4, cellW - 8, cellH - 8);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('FINISH', tx + cellW / 2, ty + cellH / 2 - 4);
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText('จุดสิ้นสุด', tx + cellW / 2, ty + cellH / 2 + 12);
      } else if (tile.type === 'checkpoint') {
        // Check Point: Yellow circle (d=50mm) in center
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tx, ty, cellW, cellH);

        // Center yellow circle
        const circleR = cellW * (50 / 300) * 0.9;
        ctx.beginPath();
        ctx.arc(tx + cellW / 2, ty + cellH / 2, circleR, 0, Math.PI * 2);
        ctx.fillStyle = '#facc15';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ca8a04';
        ctx.stroke();

        ctx.fillStyle = '#854d0e';
        ctx.font = 'bold 8px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CP', tx + cellW / 2, ty + cellH / 2);
      } else if (tile.type === 'line_straight') {
        withRotation(tx, ty, rot, () => {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, cellH - LINE_W, cellW, LINE_W);
        });
      } else if (tile.type === 'line_corner') {
        withRotation(tx, ty, rot, () => {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, LINE_W, cellH);
          ctx.fillRect(0, cellH - LINE_W, cellW, LINE_W);
        });
      } else if (tile.type === 'line_parallel') {
        withRotation(tx, ty, rot, () => {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, cellW, LINE_W);
          ctx.fillRect(0, cellH - LINE_W, cellW, LINE_W);
        });
      } else if (tile.type === 'line_u') {
        withRotation(tx, ty, rot, () => {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, LINE_W, cellH);
          ctx.fillRect(0, cellH - LINE_W, cellW, LINE_W);
          ctx.fillRect(cellW - LINE_W, 0, LINE_W, cellH);
        });
      } else if (tile.type === 'line_box') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(tx, ty, cellW, LINE_W);
        ctx.fillRect(tx, ty + cellH - LINE_W, cellW, LINE_W);
        ctx.fillRect(tx, ty, LINE_W, cellH);
        ctx.fillRect(tx + cellW - LINE_W, ty, LINE_W, cellH);
      } else if (tile.type === 'pt_robotics') {
        // PT ROBOTICS official logo tile
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tx, ty, cellW, cellH);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 4;
        ctx.strokeRect(tx + 6, ty + 6, cellW - 12, cellH - 12);

        // Logo glyph
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PT', tx + cellW / 2, ty + cellH / 2 - 8);

        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillText('PT ROBOTICS', tx + cellW / 2, ty + cellH / 2 + 14);
      } else if (tile.type === 'tunnel') {
        // Tunnel 600x300mm: 3D perspective shading + entrance arrows
        const grad = ctx.createLinearGradient(tx, ty, tx + cellW, ty + cellH);
        grad.addColorStop(0, '#e2e8f0');
        grad.addColorStop(0.5, '#94a3b8');
        grad.addColorStop(1, '#64748b');
        ctx.fillStyle = grad;
        ctx.fillRect(tx + 4, ty + 2, cellW - 8, cellH - 4);

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(tx + 4, ty + 2, cellW - 8, cellH - 4);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('อุโมงค์ (Tunnel)', tx + cellW / 2, ty + cellH / 2 - 4);
        ctx.font = '8px Inter, sans-serif';
        ctx.fillStyle = '#b91c1c';
        ctx.fillText('◄ ทางเข้า-ออก ►', tx + cellW / 2, ty + cellH / 2 + 10);
      } else if (tile.type === 'seesaw') {
        // Seesaw (ไม้กระดก 30x30cm): White tile base, tilting board, blue side rails, center fulcrum
        withRotation(tx, ty, rot, () => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, cellW, cellH);

          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(2, 2, cellW - 4, cellH - 4);

          // Blue side rails (ขอบข้าง 20mm)
          ctx.fillStyle = '#2563eb';
          ctx.fillRect(2, 2, cellW - 4, 4);
          ctx.fillRect(2, cellH - 6, cellW - 4, 4);

          // Metallic/orange center fulcrum cylinder
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(cellW / 2 - 3, 2, 6, cellH - 4);

          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 8.5px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('ไม้กระดก 30x30', cellW / 2, cellH / 2);
        });
      } else if (tile.type === 'bridge_up' || tile.type === 'bridge') {
        // Bridge Ramp Up (Green)
        const grad = ctx.createLinearGradient(tx, ty, tx + cellW, ty);
        grad.addColorStop(0, '#10b981');
        grad.addColorStop(1, '#059669');
        ctx.fillStyle = grad;
        ctx.fillRect(tx + 2, ty + 2, cellW - 4, cellH - 4);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('▲ สะพานขึ้น (+50mm)', tx + cellW / 2, ty + cellH / 2);
      } else if (tile.type === 'bridge_deck') {
        // Bridge Flat Elevated Deck (Grey 50mm)
        ctx.fillStyle = '#64748b';
        ctx.fillRect(tx + 2, ty + 2, cellW - 4, cellH - 4);

        // Guardrails yellow/black stripes
        ctx.fillStyle = '#eab308';
        ctx.fillRect(tx + 2, ty + 2, cellW - 4, 4);
        ctx.fillRect(tx + 2, ty + cellH - 6, cellW - 4, 4);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('สะพานกลาง (50mm)', tx + cellW / 2, ty + cellH / 2);
      } else if (tile.type === 'bridge_down') {
        // Bridge Ramp Down (Yellow)
        const grad = ctx.createLinearGradient(tx, ty, tx + cellW, ty);
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(1, '#d97706');
        ctx.fillStyle = grad;
        ctx.fillRect(tx + 2, ty + 2, cellW - 4, cellH - 4);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('▼ สะพานลง (0mm)', tx + cellW / 2, ty + cellH / 2);
      } else if (tile.type === 'drop_red' || tile.type === 'drop_green' || tile.type === 'drop_yellow' || tile.type === 'drop_blue') {
        const col =
          tile.type === 'drop_red'
            ? '#ef4444'
            : tile.type === 'drop_green'
            ? '#10b981'
            : tile.type === 'drop_yellow'
            ? '#facc15'
            : '#2563eb';
        const label =
          tile.type === 'drop_red'
            ? 'เป้าหมาย แดง'
            : tile.type === 'drop_green'
            ? 'เป้าหมาย เขียว'
            : tile.type === 'drop_yellow'
            ? 'เป้าหมาย เหลือง'
            : 'เป้าหมาย น้ำเงิน';
        const textColor = tile.type === 'drop_yellow' ? '#854d0e' : '#ffffff';

        withRotation(tx, ty, rot, () => {
          // White vinyl tile base
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, cellW, cellH);

          // Colored drop target pad on one side (safe path through lane is open)
          ctx.fillStyle = col;
          ctx.fillRect(4, cellH / 2, cellW - 8, cellH / 2 - 4);

          // Back boundary line only
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, cellH - 3, cellW, 3);

          ctx.fillStyle = textColor;
          ctx.font = 'bold 8.5px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, cellW / 2, cellH * 0.72);
        });
      } else if (tile.type === 'hill_drop') {
        // Hill Ramp to Relief area
        const grad = ctx.createLinearGradient(tx, ty, tx, ty + cellH);
        grad.addColorStop(0, '#e0f2fe');
        grad.addColorStop(1, '#bae6fd');
        ctx.fillStyle = grad;
        ctx.fillRect(tx + 2, ty + 2, cellW - 4, cellH - 4);

        ctx.fillStyle = '#0369a1';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('เนินปล่อยถุงยังชีพ', tx + cellW / 2, ty + cellH / 2);
      } else if (tile.type === 'speed_bumps' || tile.type === 'bump') {
        // Speed bumps: 7 cylindrical rumble strips
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(tx, ty, cellW, cellH);

        const stripCount = 7;
        const spacing = cellW / (stripCount + 1);
        for (let s = 1; s <= stripCount; s++) {
          const sx = tx + s * spacing;
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.roundRect(sx - 3, ty + 6, 6, cellH - 12, 3);
          ctx.fill();
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ลูกระนาด (7 แท่ง)', tx + cellW / 2, ty + cellH - 8);
      } else if (tile.type === 'black_pit') {
        // Black Pit Hazard: Deep pit 200x300mm with hazard border
        ctx.fillStyle = '#09090b';
        ctx.fillRect(tx + 4, ty + 2, cellW - 8, cellH - 4);

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(tx + 4, ty + 2, cellW - 8, cellH - 4);

        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('หลุมดำ (Hazard)', tx + cellW / 2, ty + cellH / 2);
      } else if (tile.type === 'barrier_bomb') {
        // Barrier / Bomb obstacle bar
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tx, ty, cellW, cellH);

        // Obstacle bar across center
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(tx + 6, ty + cellH / 2 - 6, cellW - 12, 12);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(tx + 6, ty + cellH / 2 - 6, 8, 12);
        ctx.fillRect(tx + cellW - 14, ty + cellH / 2 - 6, 8, 12);

        ctx.fillStyle = '#ea580c';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ไม้กั้น / จุดลูกระเบิด', tx + cellW / 2, ty + cellH / 2 + 18);
      }

      ctx.restore();
    });

    // 3. Draw Hover Indicator on active grid cell
    if (hoveredCell && hoveredCell.col >= 0 && hoveredCell.col < FIELD_COLS && hoveredCell.row >= 0 && hoveredCell.row < FIELD_ROWS) {
      const hx = RULER_T + hoveredCell.col * cellW;
      const hy = RULER_T + hoveredCell.row * cellH;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(hx + 1, hy + 1, cellW - 2, cellH - 2);
    }

    // 4. Draw Trail
    if (trail.length > 1) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      trail.forEach((pt, index) => {
        const px = RULER_T + (pt.x / FIELD_WIDTH_CM) * gridW;
        const py = RULER_T + (pt.y / FIELD_HEIGHT_CM) * gridH;
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    // 5. Draw Dropped Relief Cube (1.5-2.0cm red cube) if dropped
    if (robotState.reliefCubeDropped) {
      const cubePx = RULER_T + (robotState.x / FIELD_WIDTH_CM) * gridW;
      const cubePy = RULER_T + (robotState.y / FIELD_HEIGHT_CM) * gridH;
      const cubeSize = 14;

      ctx.save();
      ctx.fillStyle = '#dc2626';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 6;
      ctx.fillRect(cubePx - cubeSize / 2, cubePy - cubeSize / 2, cubeSize, cubeSize);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cubePx - cubeSize / 2, cubePy - cubeSize / 2, cubeSize, cubeSize);
      ctx.restore();
    }

    // 6. Draw Robot
    const rx = RULER_T + (robotState.x / FIELD_WIDTH_CM) * gridW;
    const ry = RULER_T + (robotState.y / FIELD_HEIGHT_CM) * gridH;
    const rw = (robotConfig.lengthCm / FIELD_WIDTH_CM) * gridW;
    const rh = (robotConfig.widthCm / FIELD_HEIGHT_CM) * gridH;

    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(robotState.theta);

    // Robot Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(-rw / 2 + 3, -rh / 2 + 3, rw, rh, 4);
    ctx.fill();

    // Robot Main Chassis (PTBOT Style)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-rw / 2, -rh / 2, rw, rh, 4);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Accent Plate (Atom VX Orange/Teal stripe)
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-rw / 2 + 4, -rh / 2 + 4, rw - 8, rh - 8);

    // ESP32 Chip representation on chassis
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-rw / 6, -rh / 4, rw / 3, rh / 2);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 7px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PTBOT', 0, 0);

    // Left and Right Wheels
    const wheelW = rw * 0.45;
    const wheelH = 4;
    ctx.fillStyle = '#020617';
    ctx.fillRect(-wheelW / 2, -rh / 2 - 3, wheelW, wheelH);
    ctx.fillRect(-wheelW / 2, rh / 2 - 1, wheelW, wheelH);

    // Heading Arrow
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(rw / 2 + 2, 0);
    ctx.lineTo(rw / 2 - 7, -6);
    ctx.lineTo(rw / 2 - 4, 0);
    ctx.lineTo(rw / 2 - 7, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // 7. Foul Marker
    if (robotState.isFoul && robotState.foulLocation) {
      const fx = RULER_T + (robotState.foulLocation.x / FIELD_WIDTH_CM) * gridW;
      const fy = RULER_T + (robotState.foulLocation.y / FIELD_HEIGHT_CM) * gridH;

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fx, fy, 16, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.fillRect(fx - 110, fy - 36, 220, 24);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`FOUL: ${robotState.foulReason || 'FOUL!'}`, fx, fy - 20);
    }
  }, [tiles, robotState, robotConfig, trail, hoveredCell]);

  return (
    <div className="flex flex-col h-full bg-surface-dark border-l border-surface-border select-none">
      {/* Simulator Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-darker border-b border-surface-border text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-200">4x8 Competition Field</span>
          <span className="px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 font-mono text-[10px] border border-brand-500/20">
            120x240 cm (PTBOT)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick preset selector */}
          <button
            onClick={() => loadPreset('competition_official')}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-card hover:bg-slate-700 text-slate-200 border border-surface-border text-[11px] font-medium transition"
            title="รีเซ็ตกลับเป็นสนามแข่งตาม PDF"
          >
            <Sparkles size={11} className="text-amber-400" />
            <span>สนามทางการ</span>
          </button>

          {/* Rotate Robot button */}
          <button
            onClick={() => rotateRobot(90)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-card hover:bg-slate-700 text-slate-200 border border-surface-border text-[11px] font-medium transition"
            title="หมุนตัวหุ่นยนต์ 90 องศา (หรือคลิกขวาที่สนามในโหมดย้ายหุ่น)"
          >
            <RotateCw size={11} className="text-teal-400" />
            <span>หมุนหุ่น ({Math.round((((robotState.theta * 180) / Math.PI) % 360 + 360) % 360)}°)</span>
          </button>

          {/* Place Bot Mode Toggle */}
          <button
            onClick={() => setPlacementMode(placementMode === 'robot' ? 'tile' : 'robot')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition ${
              placementMode === 'robot'
                ? 'bg-amber-500 text-slate-950 font-bold animate-pulse'
                : 'bg-surface-card hover:bg-slate-700 text-slate-300 border border-surface-border'
            }`}
            title="คลิกวางตำแหน่งหุ่นยนต์บนช่องใดก็ได้ในสนาม"
          >
            <MapPin size={11} />
            <span>{placementMode === 'robot' ? 'คลิกสนามเพื่อวาง' : 'ย้ายหุ่น'}</span>
          </button>

          {customStartPose && (
            <button
              onClick={resetRobotToStartTile}
              className="flex items-center gap-1 px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-medium transition"
              title="คืนค่าตำแหน่งและทิศทางหุ่นยนต์กลับไปที่แผ่น START ของสนาม"
            >
              <Undo2 size={11} />
              <span>จุด START เดิม</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Container */}
      <div className="relative flex-1 flex items-center justify-center p-3 bg-surface-darker overflow-hidden">
        <canvas
          ref={canvasRef}
          width={828} // (8 * 100) + 28 px
          height={428} // (4 * 100) + 28 px
          onMouseDown={(e) => {
            setIsMouseDown(true);
            handleCanvasInteraction(e);
          }}
          onMouseMove={(e) => {
            const cell = getCellFromMouse(e);
            setHoveredCell(cell ? { row: cell.row, col: cell.col } : null);
            if (isMouseDown && placementMode === 'tile') {
              handleCanvasInteraction(e);
            }
          }}
          onMouseLeave={() => setHoveredCell(null)}
          onMouseUp={() => setIsMouseDown(false)}
          onContextMenu={handleContextMenu}
          onDragOver={(e) => {
            e.preventDefault();
            const cell = getCellFromMouse(e as any);
            setHoveredCell(cell ? { row: cell.row, col: cell.col } : null);
          }}
          onDrop={handleDrop}
          className="rounded border border-surface-border shadow-2xl cursor-crosshair max-w-full max-h-full object-contain"
        />

        {/* Foul Alert Modal overlay */}
        {robotState.isFoul && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-950/90 border border-red-500 text-red-200 px-4 py-2 rounded-lg shadow-xl backdrop-blur flex items-center gap-3 animate-bounce">
            <AlertTriangle size={20} className="text-red-400 shrink-0" />
            <div>
              <div className="font-bold text-xs uppercase tracking-wide text-red-400">
                Simulation Disqualified
              </div>
              <div className="text-xs font-medium">{robotState.foulReason}</div>
            </div>
            <button
              onClick={() => useSimulatorStore.getState().resetRobot()}
              className="ml-2 px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
