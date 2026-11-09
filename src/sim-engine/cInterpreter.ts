import { MotionStep } from '../types/simulator';
import { SketchFile } from '../types/ide';

interface FunctionDefInfo {
  fnName: string;
  body: string;
  fileId: string;
  fileName: string;
  startLine: number;
}

/**
 * Parses user C / Arduino code across all project files and produces
 * a sequence of MotionSteps with line tracking for real-time debugger highlighting.
 */
export function parseProjectToMotionSteps(
  files: SketchFile[],
  activeFileId?: string,
  configuredDistancePerGrid?: number
): MotionStep[] {
  const steps: MotionStep[] = [];
  const functionDefs: Record<string, FunctionDefInfo> = {};

  // Resolve distance per grid tile (default: 400 pulses = 1 tile / 30cm)
  let distancePerGrid = configuredDistancePerGrid;
  if (!distancePerGrid || distancePerGrid <= 0) {
    try {
      distancePerGrid = (window as any).__kt_useIDEStore?.getState?.()?.robotDefaultDistance;
    } catch (e) {}
  }
  if (!distancePerGrid || distancePerGrid <= 0) {
    distancePerGrid = 400;
  }

  // 1. Index all functions across all files
  files.forEach((file) => {
    const lines = file.content.split('\n');
    let currentLine = 1;
    let inCommentBlock = false;

    // Scan lines for function definitions: void/int/bool funcName(...) {
    const fnStartRegex = /^\s*(?:void|int|float|double|bool|long|unsigned\s+long)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*\{/;

    for (let i = 0; i < lines.length; i++) {
      const lineStr = lines[i];
      const trimmed = lineStr.trim();

      if (trimmed.startsWith('/*')) inCommentBlock = true;
      if (inCommentBlock) {
        if (trimmed.includes('*/')) inCommentBlock = false;
        continue;
      }
      if (trimmed.startsWith('//')) continue;

      const match = trimmed.match(fnStartRegex);
      if (match) {
        const fnName = match[1];
        // Collect function body by matching braces
        let braceCount = 0;
        const bodyLines: { line: number; text: string }[] = [];
        let foundEnd = false;

        for (let j = i; j < lines.length; j++) {
          const l = lines[j];
          for (let char of l) {
            if (char === '{') braceCount++;
            if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                foundEnd = true;
                break;
              }
            }
          }
          if (j > i) {
            bodyLines.push({ line: j + 1, text: l });
          }
          if (foundEnd) break;
        }

        functionDefs[fnName] = {
          fnName,
          body: bodyLines.map((bl) => bl.text).join('\n'),
          fileId: file.id,
          fileName: file.name,
          startLine: i + 1,
        };
      }
    }
  });

  // 2. Recursive block parser with accurate line tracking
  const parseStatementsWithTracking = (
    text: string,
    fileId: string,
    fileName: string,
    baseLineOffset: number,
    depth = 0
  ) => {
    if (depth > 8) return; // Prevent infinite recursion

    const rawLines = text.split('\n');

    for (let lineIdx = 0; lineIdx < rawLines.length; lineIdx++) {
      const lineText = rawLines[lineIdx];
      const cleanLine = lineText.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/, '').trim();
      if (!cleanLine) continue;

      const currentLineNumber = baseLineOffset + lineIdx;

      // Match statements like func(args);
      const stmtRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*;/g;
      let match: RegExpExecArray | null;

      while ((match = stmtRegex.exec(cleanLine)) !== null) {
        const fnName = match[1];
        const rawArgs = match[2];
        const args = rawArgs ? rawArgs.split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')) : [];
        const codeSnippet = match[0];

        const meta = {
          fileId,
          fileName,
          lineNumber: currentLineNumber,
          codeSnippet,
        };

        // Command Parsers:
        // A) FFE / BBE Encoder Movement
        if (fnName === 'FFE' || fnName === 'FFE_turn') {
          const speed = parseFloat(args[0]) || 60;
          const distance = parseFloat(args[1]) || distancePerGrid;
          // Calculate exact real grid distance proportionally based on configured distance per tile
          // E.g. If distance is 400 and distancePerGrid is 400 -> exactly 1.0 tile (30cm)
          // If distance is less (e.g. 200) -> 0.5 tile (15cm), if 100 -> 0.25 tile (7.5cm)
          const grids = distance / distancePerGrid;

          steps.push({
            type: 'grid_forward',
            grids,
            speed,
            ...meta,
          });

          // Check for turn argument (3rd or 4th arg, e.g. 'L', 'R', 'l', 'r')
          // 'L' / 'R' = Spin turn in place (90° center fixed)
          // 'l' / 'r' = Curve turn (90° swing turn with position shift, robot faces straight)
          const turnArg = args.find((a) => ['L', 'R', 'l', 'r'].includes(a));
          if (turnArg === 'L') {
            steps.push({ type: 'turn', direction: 'left', degrees: 90, speed: 50, turnMode: 'spin', ...meta });
          } else if (turnArg === 'R') {
            steps.push({ type: 'turn', direction: 'right', degrees: 90, speed: 50, turnMode: 'spin', ...meta });
          } else if (turnArg === 'l') {
            steps.push({ type: 'turn', direction: 'left', degrees: 90, speed: 50, turnMode: 'curve', ...meta });
          } else if (turnArg === 'r') {
            steps.push({ type: 'turn', direction: 'right', degrees: 90, speed: 50, turnMode: 'curve', ...meta });
          }
        } else if (fnName === 'BBE' || fnName === 'BBE_turn') {
          const speed = parseFloat(args[0]) || 60;
          const distance = parseFloat(args[1]) || distancePerGrid;
          const grids = distance / distancePerGrid;

          steps.push({
            type: 'grid_forward',
            grids: -grids, // Backward
            speed,
            ...meta,
          });

          const turnArg = args.find((a) => ['L', 'R', 'l', 'r'].includes(a));
          if (turnArg === 'L') {
            steps.push({ type: 'turn', direction: 'left', degrees: 90, speed: 50, turnMode: 'spin', isBackward: true, ...meta });
          } else if (turnArg === 'R') {
            steps.push({ type: 'turn', direction: 'right', degrees: 90, speed: 50, turnMode: 'spin', isBackward: true, ...meta });
          } else if (turnArg === 'l') {
            steps.push({ type: 'turn', direction: 'left', degrees: 90, speed: 50, turnMode: 'curve', isBackward: true, ...meta });
          } else if (turnArg === 'r') {
            steps.push({ type: 'turn', direction: 'right', degrees: 90, speed: 50, turnMode: 'curve', isBackward: true, ...meta });
          }
        }

        // B) FF / BB Time-based Movement
        else if (fnName === 'FF' || fnName === 'FF_turn') {
          const speed = parseFloat(args[0]) || 50;
          const timerMs = parseFloat(args[1]) || 500;
          const grids = Math.max(0.1, (timerMs / 800) * (speed / 50));

          steps.push({
            type: 'grid_forward',
            grids,
            speed,
            ...meta,
          });

          const turnArg = args.find((a) => ['L', 'R', 'l', 'r'].includes(a));
          if (turnArg === 'L') steps.push({ type: 'turn', direction: 'left', degrees: 90, speed: 50, turnMode: 'spin', ...meta });
          else if (turnArg === 'R') steps.push({ type: 'turn', direction: 'right', degrees: 90, speed: 50, turnMode: 'spin', ...meta });
          else if (turnArg === 'l') steps.push({ type: 'turn', direction: 'left', degrees: 90, speed: 50, turnMode: 'curve', ...meta });
          else if (turnArg === 'r') steps.push({ type: 'turn', direction: 'right', degrees: 90, speed: 50, turnMode: 'curve', ...meta });
        } else if (fnName === 'BB' || fnName === 'BB_turn') {
          const speed = parseFloat(args[0]) || 50;
          const timerMs = parseFloat(args[1]) || 500;
          const grids = Math.max(0.1, (timerMs / 800) * (speed / 50));

          steps.push({
            type: 'grid_forward',
            grids: -grids,
            speed,
            ...meta,
          });

          const turnArg = args.find((a) => ['L', 'R', 'l', 'r'].includes(a));
          if (turnArg === 'L') steps.push({ type: 'turn', direction: 'left', degrees: 90, speed: 50, turnMode: 'spin', isBackward: true, ...meta });
          else if (turnArg === 'R') steps.push({ type: 'turn', direction: 'right', degrees: 90, speed: 50, turnMode: 'spin', isBackward: true, ...meta });
          else if (turnArg === 'l') steps.push({ type: 'turn', direction: 'left', degrees: 90, speed: 50, turnMode: 'curve', isBackward: true, ...meta });
          else if (turnArg === 'r') steps.push({ type: 'turn', direction: 'right', degrees: 90, speed: 50, turnMode: 'curve', isBackward: true, ...meta });
        }

        // C) Gyro Turns & Spins
        else if (fnName === 'spinDegree') {
          const deg = parseFloat(args[0]) || 90;
          steps.push({
            type: 'turn',
            direction: deg >= 0 ? 'right' : 'left',
            degrees: Math.abs(deg),
            speed: 55,
            turnMode: 'spin',
            ...meta,
          });
        } else if (fnName === 'turnDegreeFront') {
          const deg = parseFloat(args[0]) || 90;
          steps.push({
            type: 'turn',
            direction: deg >= 0 ? 'right' : 'left',
            degrees: Math.abs(deg),
            speed: 60,
            turnMode: 'curve',
            ...meta,
          });
        } else if (fnName === 'turnDegreeBack') {
          const deg = parseFloat(args[0]) || 90;
          steps.push({
            type: 'turn',
            direction: deg >= 0 ? 'right' : 'left',
            degrees: Math.abs(deg),
            speed: 60,
            turnMode: 'curve',
            isBackward: true,
            ...meta,
          });
        }

        // D) Line Alignment (SetFront / SetBack)
        else if (fnName === 'SetFront' || fnName === 'SetFront_time') {
          const speed = parseFloat(args[0]) || 20;
          const target = parseFloat(args[1]) || 0;
          // Step 1: align forward to line
          steps.push({ type: 'grid_forward', grids: 0.3, speed, ...meta });
          // Step 2: if target back-off given, compute exact proportional grid
          if (target > 0) {
            steps.push({ type: 'grid_forward', grids: -(target / distancePerGrid), speed: 30, ...meta });
          }
          // Step 3: if turn character given
          const turnArg = args.find((a) => ['L', 'R', 'l', 'r'].includes(a));
          if (turnArg === 'L') steps.push({ type: 'turn', direction: 'left', degrees: 90, speed: 50, turnMode: 'spin', ...meta });
          else if (turnArg === 'R') steps.push({ type: 'turn', direction: 'right', degrees: 90, speed: 50, turnMode: 'spin', ...meta });
          else if (turnArg === 'l') steps.push({ type: 'turn', direction: 'left', degrees: 90, speed: 50, turnMode: 'curve', ...meta });
          else if (turnArg === 'r') steps.push({ type: 'turn', direction: 'right', degrees: 90, speed: 50, turnMode: 'curve', ...meta });
        } else if (fnName === 'SetBack' || fnName === 'SetBack_time') {
          const speed = parseFloat(args[0]) || 20;
          const target = parseFloat(args[1]) || 0;
          steps.push({ type: 'grid_forward', grids: -0.3, speed, ...meta });
          if (target > 0) {
            steps.push({ type: 'grid_forward', grids: target / distancePerGrid, speed: 30, ...meta });
          }
          const turnArg = args.find((a) => ['L', 'R', 'l', 'r'].includes(a));
          if (turnArg === 'L') steps.push({ type: 'turn', direction: 'left', degrees: 90, speed: 50, turnMode: 'spin', isBackward: true, ...meta });
          else if (turnArg === 'R') steps.push({ type: 'turn', direction: 'right', degrees: 90, speed: 50, turnMode: 'spin', isBackward: true, ...meta });
          else if (turnArg === 'l') steps.push({ type: 'turn', direction: 'left', degrees: 90, speed: 50, turnMode: 'curve', isBackward: true, ...meta });
          else if (turnArg === 'r') steps.push({ type: 'turn', direction: 'right', degrees: 90, speed: 50, turnMode: 'curve', isBackward: true, ...meta });
        }

        // E) Drop Payload / Servos
        else if (fnName === 'DropF' || fnName === 'DropB') {
          const speed = parseFloat(args[0]) || 0;
          if (speed > 0) {
            steps.push({ type: 'grid_forward', grids: fnName === 'DropF' ? 0.3 : -0.3, speed: 25, ...meta });
          }
          steps.push({ type: 'servo_drop', servoAngle: 90, ...meta });
          steps.push({ type: 'delay', durationMs: 400, ...meta });
        } else if (fnName === 'servoWrite') {
          const angle = parseFloat(args[1]) || 90;
          steps.push({ type: 'servo_drop', servoAngle: angle, ...meta });
        }

        // F) Motor Commands
        else if (fnName === 'motorWrite') {
          if (args.length >= 4) {
            const m1 = parseFloat(args[0]) || 0;
            const m3 = parseFloat(args[2]) || 0;
            steps.push({ type: 'motor', vLeft: m1, vRight: m3, ...meta });
          } else if (args.length === 2) {
            const ch = parseInt(args[0], 10) || 1;
            const spd = parseFloat(args[1]) || 0;
            if (ch <= 2) steps.push({ type: 'motor', vLeft: spd, vRight: 0, ...meta });
            else steps.push({ type: 'motor', vLeft: 0, vRight: spd, ...meta });
          }
        } else if (fnName === 'motorStop') {
          steps.push({ type: 'motor', vLeft: 0, vRight: 0, ...meta });
        } else if (fnName === 'motor') {
          const vl = parseFloat(args[0]) || 0;
          const vr = parseFloat(args[1]) || 0;
          steps.push({ type: 'motor', vLeft: vl, vRight: vr, ...meta });
        }

        // G) Delays & Stops
        else if (fnName === 'delay' || fnName === 'delay_ms') {
          const ms = parseFloat(args[0]) || 500;
          steps.push({ type: 'delay', durationMs: ms, ...meta });
        } else if (fnName === 'STOP' || fnName === 'wait_start') {
          steps.push({ type: 'motor', vLeft: 0, vRight: 0, ...meta });
          steps.push({ type: 'delay', durationMs: 400, ...meta });
        }

        // H) Legacy Grid Movement Support
        else if (fnName === 'move_grid_forward') {
          const grids = parseFloat(args[0]) || 1;
          const speed = parseFloat(args[1]) || 60;
          steps.push({ type: 'grid_forward', grids, speed, ...meta });
        } else if (fnName === 'turn_degree') {
          const dir = (args[0] || '').toUpperCase().includes('LEFT') ? 'left' : 'right';
          const deg = parseFloat(args[1]) || 90;
          const speed = parseFloat(args[2]) || 50;
          steps.push({ type: 'turn', direction: dir, degrees: deg, speed, ...meta });
        } else if (fnName === 'cross_bridge') {
          const uphill = parseFloat(args[0]) || 80;
          const downhill = parseFloat(args[1]) || 45;
          steps.push({ type: 'motor', vLeft: uphill, vRight: uphill, ...meta });
          steps.push({ type: 'delay', durationMs: 1200, ...meta });
          steps.push({ type: 'motor', vLeft: downhill, vRight: downhill, ...meta });
          steps.push({ type: 'delay', durationMs: 800, ...meta });
          steps.push({ type: 'motor', vLeft: 0, vRight: 0, ...meta });
        }

        // I) Custom Function Call Step-In (Multi-File Linking!)
        else if (functionDefs[fnName]) {
          const def = functionDefs[fnName];
          steps.push({ type: 'custom_call', fnName, ...meta });
          // Automatically step into the function body in its originating file!
          parseStatementsWithTracking(def.body, def.fileId, def.fileName, def.startLine + 1, depth + 1);
        }
      }
    }
  };

  // 3. Find Entry Point (Priority: setup/loop in main.ino, or START(), or examples(), or active file)
  let entryFile = files.find((f) => f.id === activeFileId);
  if (!entryFile) {
    entryFile = files.find((f) => f.name.endsWith('.ino') && f.content.includes('setup('));
  }
  if (!entryFile) {
    entryFile = files[0];
  }

  if (entryFile) {
    // If there is a START() or examples() or Box1() function
    if (functionDefs['START']) {
      const def = functionDefs['START'];
      parseStatementsWithTracking(def.body, def.fileId, def.fileName, def.startLine + 1);
    } else if (functionDefs['examples']) {
      const def = functionDefs['examples'];
      parseStatementsWithTracking(def.body, def.fileId, def.fileName, def.startLine + 1);
    } else if (functionDefs['setup'] || functionDefs['loop']) {
      if (functionDefs['setup']) {
        const def = functionDefs['setup'];
        parseStatementsWithTracking(def.body, def.fileId, def.fileName, def.startLine + 1);
      }
      if (functionDefs['loop']) {
        const def = functionDefs['loop'];
        parseStatementsWithTracking(def.body, def.fileId, def.fileName, def.startLine + 1);
      }
    } else {
      // Parse entire entry file content
      parseStatementsWithTracking(entryFile.content, entryFile.id, entryFile.name, 1);
    }
  }

  return steps;
}

/**
 * Backward compatibility wrapper
 */
export function parseCCodeToMotionSteps(code: string, configuredDistancePerGrid?: number): MotionStep[] {
  return parseProjectToMotionSteps(
    [
      {
        id: 'active_file',
        name: 'main.ino',
        content: code,
      },
    ],
    undefined,
    configuredDistancePerGrid
  );
}
