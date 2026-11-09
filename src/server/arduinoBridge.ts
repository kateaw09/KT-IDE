import { Plugin } from 'vite';
import { execFile, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface PortData {
  portName: string;
  description: string;
  hardwareId?: string;
  protocol?: string;
  isConnected: boolean;
}

export interface CompileRequest {
  fqbn: string;
  projectName: string;
  files: Array<{ name: string; content: string }>;
}

export interface UploadRequest extends CompileRequest {
  port: string;
}

export interface CompileResult {
  success: boolean;
  log: string;
  flashUsed?: number;
  flashTotal?: number;
  ramUsed?: number;
  ramTotal?: number;
  error?: string;
}

export interface UploadResult {
  success: boolean;
  log: string;
  error?: string;
}

/**
 * Locate arduino-cli binary across Windows standard locations
 */
export function findArduinoCliPath(): string {
  const candidates = [
    'C:\\Program Files\\Arduino IDE\\resources\\app\\lib\\backend\\resources\\arduino-cli.exe',
    'C:\\Program Files (x86)\\Arduino IDE\\resources\\app\\lib\\backend\\resources\\arduino-cli.exe',
    path.join(os.homedir(), 'AppData', 'Local', 'Arduino15', 'bin', 'arduino-cli.exe'),
    path.join(os.homedir(), 'bin', 'arduino-cli.exe'),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return 'arduino-cli';
}

/**
 * Query real serial ports using arduino-cli board list, with PowerShell fallback
 */
export async function getConnectedSerialPorts(): Promise<PortData[]> {
  const cliPath = findArduinoCliPath();

  return new Promise((resolve) => {
    execFile(cliPath, ['board', 'list', '--format', 'json'], { timeout: 4000 }, (err, stdout) => {
      if (!err && stdout) {
        try {
          const data = JSON.parse(stdout);
          const detected = data.detected_ports || [];
          const list: PortData[] = detected
            .filter((item: any) => item.port && item.port.address)
            .map((item: any) => {
              const p = item.port;
              let desc = p.protocol_label || p.label || 'Serial Port';
              if (p.properties?.vid && p.properties?.pid) {
                const vid = p.properties.vid.toLowerCase();
                const pid = p.properties.pid.toLowerCase();
                if (vid.includes('10c4') && pid.includes('ea60')) {
                  desc = 'Silicon Labs CP210x (PTBOT/ESP32)';
                } else if (vid.includes('1a86') && pid.includes('7523')) {
                  desc = 'CH340 USB Serial';
                } else if (vid.includes('2341')) {
                  desc = 'Arduino Official USB';
                } else if (vid.includes('0403')) {
                  desc = 'FTDI Serial USB';
                } else {
                  desc = `${desc} (${p.properties.vid}:${p.properties.pid})`;
                }
              }
              return {
                portName: p.address,
                description: desc,
                hardwareId: p.hardware_id || p.properties?.serialNumber,
                protocol: p.protocol || 'serial',
                isConnected: true,
              };
            });

          if (list.length > 0) {
            return resolve(list);
          }
        } catch (e) {
          // json parse failed, fall through to PowerShell
        }
      }

      // Fallback: Query Windows Registry / PowerShell for COM ports
      try {
        const psCmd = 'powershell.exe -NoProfile -Command "[System.IO.Ports.SerialPort]::GetPortNames()"';
        const psOut = execSync(psCmd, { encoding: 'utf8', timeout: 3000 }).trim();
        const rawPorts = psOut.split(/\r?\n/).filter(Boolean);
        const list: PortData[] = rawPorts.map((p) => ({
          portName: p.trim(),
          description: 'Serial COM Port',
          isConnected: true,
        }));
        return resolve(list);
      } catch (e) {
        // Default fallback if no ports connected
        resolve([]);
      }
    });
  });
}

export const ROBOT_CORE_HEADER_CODE = `
#pragma once
#include <Arduino.h>

#if defined(ESP32)
  #if __has_include(<PTBOTAtomVX.h>)
    #include <PTBOTAtomVX.h>
  #elif __has_include(<PTBOTAtomMini.h>)
    #include <PTBOTAtomMini.h>
  #elif __has_include(<PTBOTStromMini.h>)
    #include <PTBOTStromMini.h>
  #endif
#endif

#ifndef DIR_LEFT
  #define DIR_LEFT 0
#endif
#ifndef DIR_RIGHT
  #define DIR_RIGHT 1
#endif

#ifndef BASE_SPEED
  #define BASE_SPEED 60
#endif
#ifndef TURN_SPEED
  #define TURN_SPEED 50
#endif
#ifndef HIGH_TORQUE_SPEED
  #define HIGH_TORQUE_SPEED 85
#endif
#ifndef BRIDGE_UPHILL_PWR
  #define BRIDGE_UPHILL_PWR 85
#endif
#ifndef BRIDGE_DOWNHILL_PWR
  #define BRIDGE_DOWNHILL_PWR 45
#endif
#ifndef SERVO_RELEASE_PIN
  #define SERVO_RELEASE_PIN 18
#endif
#ifndef SERVO_DROP_ANGLE
  #define SERVO_DROP_ANGLE 90
#endif

#ifndef KT_ROBOT_CORE_FUNCTIONS_DEFINED
#define KT_ROBOT_CORE_FUNCTIONS_DEFINED

inline void robot_init() {
#if defined(ESP32) && __has_include(<PTBOTAtomVX.h>)
  initialize();
#endif
}

inline void serial_begin(unsigned long baud) {
  Serial.begin(baud);
}

inline void serial_print(const char* msg) {
  Serial.print(msg);
}

inline void delay_ms(unsigned long ms) {
  delay(ms);
}

inline void motor(int left, int right) {
#if defined(ESP32) && __has_include(<PTBOTAtomVX.h>)
  motorWrite(1, left);
  motorWrite(2, left);
  motorWrite(3, right);
  motorWrite(4, right);
#endif
}

inline void move_grid_forward(int grids, int speed) {
  motor(speed, speed);
  delay_ms(grids * 500);
  motor(0, 0);
}

inline void turn_degree(int dir, int deg, int speed) {
  if (dir == DIR_RIGHT) {
    motor(speed, -speed);
  } else {
    motor(-speed, speed);
  }
  delay_ms(deg * 5);
  motor(0, 0);
}

inline void cross_bridge(int up_pwr, int down_pwr) {
  motor(up_pwr, up_pwr);
  delay_ms(1000);
  motor(down_pwr, down_pwr);
  delay_ms(800);
  motor(0, 0);
}

inline void drop_relief_cube(int angle) {
#if defined(ESP32) && __has_include(<PTBOTAtomVX.h>)
  servoWrite(0, angle);
#endif
}

inline void wait_start() {
#if defined(ESP32) && __has_include(<PTBOTAtomVX.h>)
  serial_print("Ready! Press button A or B to start...\n");
  while (switchRead(A) == 0 && switchRead(B) == 0) {
    delay(50);
  }
  beep(100);
  delay(400);
#endif
}

#endif // KT_ROBOT_CORE_FUNCTIONS_DEFINED
`;

/**
 * Prepare a sketch directory formatted properly for arduino-cli
 * (Folder name MUST match main .ino file name)
 */
function prepareSketchDir(projectName: string, files: Array<{ name: string; content: string }>): { dir: string; mainIno: string } {
  const sanitizedName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'kt_project';
  const buildRoot = path.join(os.tmpdir(), 'kt_ide_build');
  const sketchDir = path.join(buildRoot, sanitizedName);

  if (fs.existsSync(sketchDir)) {
    try {
      fs.rmSync(sketchDir, { recursive: true, force: true });
    } catch (e) {}
  }
  fs.mkdirSync(sketchDir, { recursive: true });

  // Locate the entry file (e.g. main.ino or matching project name)
  let entryFile = files.find((f) => f.name.toLowerCase() === `${sanitizedName.toLowerCase()}.ino`);
  if (!entryFile) {
    entryFile = files.find((f) => f.name.toLowerCase().endsWith('.ino'));
  }
  if (!entryFile) {
    entryFile = files[0];
  }

  const mainInoName = `${sanitizedName}.ino`;
  const mainInoPath = path.join(sketchDir, mainInoName);

  // Check if project already has a config file or robot_core
  const hasRobotConfig = files.some((f) => f.name.toLowerCase().includes('robot_config') || f.name.toLowerCase().includes('robot_core'));
  const headerToInclude = hasRobotConfig ? 'robot_config.h' : 'robot_core.h';

  // Always write robot_core.h as fallback compatibility
  fs.writeFileSync(path.join(sketchDir, 'robot_core.h'), ROBOT_CORE_HEADER_CODE, 'utf8');

  // Check if main file needs an include
  let mainContent = entryFile?.content || 'void setup() {} void loop() {}';
  if (
    !mainContent.includes('robot_core.h') &&
    !mainContent.includes('robot_config.h') &&
    (mainContent.includes('robot_init') ||
      mainContent.includes('move_grid_forward') ||
      mainContent.includes('serial_print') ||
      mainContent.includes('turn_degree') ||
      mainContent.includes('cross_bridge') ||
      mainContent.includes('motor('))
  ) {
    mainContent = `#include "${headerToInclude}"\n` + mainContent;
  }
  fs.writeFileSync(mainInoPath, mainContent, 'utf8');

  // Write all other files
  files.forEach((f) => {
    if (f === entryFile) return;
    if (f.name.toLowerCase() === entryFile?.name.toLowerCase()) return;
    if (f.name.toLowerCase().endsWith('.ino') && f.name.toLowerCase() === `${sanitizedName.toLowerCase()}.ino`) return;
    const destPath = path.join(sketchDir, f.name);
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    let fileContent = f.content;
    const isConfigOrCore = f.name.toLowerCase().includes('robot_config') || f.name.toLowerCase().includes('robot_core');
    
    // In other header files, if they need symbols but don't include headers yet, include the appropriate header
    if (
      !isConfigOrCore &&
      f.name.endsWith('.h') &&
      !fileContent.includes('robot_core.h') &&
      !fileContent.includes('robot_config.h') &&
      (fileContent.includes('serial_print') ||
        fileContent.includes('drop_relief_cube') ||
        fileContent.includes('delay_ms'))
    ) {
      fileContent = `#include "${headerToInclude}"\n` + fileContent;
    }

    fs.writeFileSync(destPath, fileContent, 'utf8');
  });

  return { dir: sketchDir, mainIno: mainInoPath };
}

/**
 * Compile sketch using arduino-cli
 */
export async function compileSketch(req: CompileRequest): Promise<CompileResult> {
  const cliPath = findArduinoCliPath();
  const { dir: sketchDir } = prepareSketchDir(req.projectName, req.files);

  const args = ['compile', '--fqbn', req.fqbn, sketchDir];

  return new Promise((resolve) => {
    execFile(cliPath, args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      const fullLog = (stdout || '') + (stderr ? '\n' + stderr : '');

      if (err) {
        return resolve({
          success: false,
          log: fullLog,
          error: err.message,
        });
      }

      // Parse memory usage statistics
      let flashUsed: number | undefined;
      let flashTotal: number | undefined;
      let ramUsed: number | undefined;
      let ramTotal: number | undefined;

      const flashMatch = fullLog.match(/Sketch uses (\d+) bytes.*?Maximum is (\d+) bytes/i);
      if (flashMatch) {
        flashUsed = parseInt(flashMatch[1], 10);
        flashTotal = parseInt(flashMatch[2], 10);
      }

      const ramMatch = fullLog.match(/Global variables use (\d+) bytes.*?Maximum is (\d+) bytes/i);
      if (ramMatch) {
        ramUsed = parseInt(ramMatch[1], 10);
        ramTotal = parseInt(ramMatch[2], 10);
      }

      resolve({
        success: true,
        log: fullLog,
        flashUsed,
        flashTotal,
        ramUsed,
        ramTotal,
      });
    });
  });
}

/**
 * Upload firmware using arduino-cli
 */
export async function uploadSketch(req: UploadRequest): Promise<UploadResult> {
  const cliPath = findArduinoCliPath();
  const { dir: sketchDir } = prepareSketchDir(req.projectName, req.files);

  // 1. Compile first to make sure binary is up to date
  const compileRes = await compileSketch(req);
  if (!compileRes.success) {
    return {
      success: false,
      log: compileRes.log,
      error: 'Compilation failed before upload: ' + (compileRes.error || ''),
    };
  }

  // 2. Upload to specified COM port
  const args = ['upload', '-p', req.port, '--fqbn', req.fqbn, sketchDir, '--verbose'];

  return new Promise((resolve) => {
    execFile(cliPath, args, { maxBuffer: 10 * 1024 * 1024, timeout: 60000 }, (err, stdout, stderr) => {
      const fullLog = compileRes.log + '\n\n' + (stdout || '') + (stderr ? '\n' + stderr : '');

      if (err) {
        return resolve({
          success: false,
          log: fullLog,
          error: err.message,
        });
      }

      resolve({
        success: true,
        log: fullLog,
      });
    });
  });
}

/**
 * Vite plugin exposing /api/ports, /api/compile, /api/upload
 */
export function arduinoBridgePlugin(): Plugin {
  return {
    name: 'arduino-bridge-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        // 1. GET /api/ports
        if (url === '/api/ports' && req.method === 'GET') {
          try {
            const ports = await getConnectedSerialPorts();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, ports }));
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: e.message }));
          }
          return;
        }

        // 2. POST /api/compile
        if (url === '/api/compile' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', async () => {
            try {
              const data: CompileRequest = JSON.parse(body);
              const result = await compileSketch(data);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (e: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: e.message }));
            }
          });
          return;
        }

        // 3. POST /api/upload
        if (url === '/api/upload' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', async () => {
            try {
              const data: UploadRequest = JSON.parse(body);
              const result = await uploadSketch(data);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (e: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: e.message }));
            }
          });
          return;
        }

        // 4. GET /api/status
        if (url === '/api/toolchain-status' && req.method === 'GET') {
          const cliPath = findArduinoCliPath();
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              available: fs.existsSync(cliPath),
              path: cliPath,
            })
          );
          return;
        }

        next();
      });
    },
  };
}
