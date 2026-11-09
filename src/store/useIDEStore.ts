import { create } from 'zustand';
import {
  BoardDefinition,
  BuildState,
  EditorMode,
  SerialPortInfo,
  SavedSketch,
  SketchFile,
  ProjectData,
  ProjectSettings,
  ProjectFieldData,
  ProjectVersion,
  ExecutionStepInfo,
  FunctionTemplateItem,
  FastKeyBinding,
  SidebarTab,
  BottomDockTab,
  SerialLogEntry,
} from '../types/ide';
import { extractProjectFromZip, exportProjectToZipBlob } from '../utils/zipProject';
import { useSimulatorStore } from './useSimulatorStore';
import { DEFAULT_FUNCTION_TEMPLATES } from '../constants/defaultFunctions';

export const EMPTY_ARDUINO_INO = `/**
 * โครงงาน Arduino / PTBOT (ว่างเปล่า)
 */

void setup() {
  // โค้ดเริ่มต้นการทำงาน (ทำงานครั้งเดียวเมื่อเปิดเครื่อง)
  
}

void loop() {
  // โค้ดหลัก (ทำงานวนซ้ำตลอดเวลา)
  
}
`;

export const DEFAULT_MAIN_INO = `/**
 * ==========================================================
 * Project: KT-Robotics & PTBOT 3D Competition Mission
 * Target MCU: PTBOT Atom VX (ESP32 240MHz Dual-Core)
 * Multi-file Sketch Structure
 * ==========================================================
 */
#include "robot_config.h"
#include "missions.h"

void setup() {
  // Initialize sensors, motor drivers, and serial communication
  robot_init();
  serial_begin(115200);
  serial_print("=== PTBOT Atom VX Ready! ===\\n");
  serial_print("Arena: 4x8 Grid (120x240cm) 3D Field\\n");
}

void loop() {
  // 1. Move forward 2 grid cells (60 cm)
  serial_print("Step 1: Moving forward 2 grids...\\n");
  move_grid_forward(2, BASE_SPEED);
  delay_ms(300);

  // 2. Turn 90 degrees right towards bridge
  serial_print("Step 2: Turning 90 deg right...\\n");
  turn_degree(DIR_RIGHT, 90, TURN_SPEED);
  delay_ms(300);

  // 3. Move forward 1 grid cell (30 cm) to approach ramp
  move_grid_forward(1, BASE_SPEED);
  delay_ms(300);

  // 4. Climb bridge with high torque
  serial_print("Step 3: Climbing bridge...\\n");
  cross_bridge(BRIDGE_UPHILL_PWR, BRIDGE_DOWNHILL_PWR);
  delay_ms(300);

  // 5. Deliver relief payload cube
  execute_drop_mission();

  // 6. Stop motors and complete run
  motor(0, 0);
  serial_print("Mission Complete! Reached FINISH dock.\\n");

  while(1) {
    delay_ms(1000);
  }
}
`;

export const DEFAULT_ROBOT_CONFIG_H = `#ifndef ROBOT_CONFIG_H
#define ROBOT_CONFIG_H

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

// PTBOT Atom VX Hardware & Speed Configurations
#define BASE_SPEED          60   // Standard grid speed (%)
#define HIGH_TORQUE_SPEED   85   // Ramp climbing speed (%)
#define TURN_SPEED          50   // Turn speed (%)

#define BRIDGE_UPHILL_PWR   85   // Speed to overcome 15 deg incline
#define BRIDGE_DOWNHILL_PWR 45   // Speed on downhill slope

#define SERVO_RELEASE_PIN   18   // Servo PWM pin for drop mechanism
#define SERVO_DROP_ANGLE    90   // Release payload angle

#define DIR_LEFT            0
#define DIR_RIGHT           1

// Hardware Abstraction Layer for PTBOT & Simulator
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
  // Motors 1 & 2 = Left, Motors 3 & 4 = Right
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
  serial_print("Ready! Press button A or B to start...\\n");
  while (switchRead(A) == 0 && switchRead(B) == 0) {
    delay(50);
  }
  beep(100);
  delay(400);
#endif
}

#endif // KT_ROBOT_CORE_FUNCTIONS_DEFINED

#endif // ROBOT_CONFIG_H
`;

export const DEFAULT_MISSIONS_H = `#ifndef MISSIONS_H
#define MISSIONS_H

#include "robot_config.h"

// Drop relief payload cube onto target zone
inline void execute_drop_mission() {
  serial_print(">> Executing payload release...\\n");
  drop_relief_cube(SERVO_DROP_ANGLE);
  delay_ms(500);
  serial_print(">> Payload delivered successfully!\\n");
}

#endif // MISSIONS_H
`;

export const DEFAULT_C_CODE = DEFAULT_MAIN_INO;

export const AVAILABLE_BOARDS: BoardDefinition[] = [
  {
    id: 'ptbot_atom_vx',
    name: 'PTBOT Atom VX (ESP32)',
    fqbn: 'PTBOT_ESP32:esp32:atom_vx',
    mcu: 'esp32',
    fCpu: '240000000L',
    protocol: 'esptool',
    baudRate: 921600,
    core: 'PTBOT_ESP32:esp32',
    variant: 'atom_vx',
    architecture: 'esp32',
    flashSize: '4MB',
    uploadTool: 'esptool.py',
    description: 'PTBOT Atom VX ESP32 240MHz Dual-Core with H-Bridge & Sensor ports',
  },
  {
    id: 'ptbot_atom_mini',
    name: 'PTBOT Atom mini (ESP32)',
    fqbn: 'PTBOT_ESP32:esp32:atom_mini',
    mcu: 'esp32',
    fCpu: '240000000L',
    protocol: 'esptool',
    baudRate: 921600,
    core: 'PTBOT_ESP32:esp32',
    variant: 'atom_mini',
    architecture: 'esp32',
    flashSize: '4MB',
    uploadTool: 'esptool.py',
    description: 'PTBOT Atom mini Compact ESP32 line follower controller',
  },
  {
    id: 'ptbot_strom_mini',
    name: 'PTBOT Strom mini (ESP32)',
    fqbn: 'PTBOT_ESP32:esp32:strom_mini',
    mcu: 'esp32',
    fCpu: '240000000L',
    protocol: 'esptool',
    baudRate: 921600,
    core: 'PTBOT_ESP32:esp32',
    variant: 'strom_mini',
    architecture: 'esp32',
    flashSize: '8MB',
    uploadTool: 'esptool.py',
    description: 'PTBOT Strom mini High Power ESP32 Competition Board',
  },
  {
    id: 'uno',
    name: 'Arduino Uno (ATmega328P)',
    fqbn: 'arduino:avr:uno',
    mcu: 'atmega328p',
    fCpu: '16000000L',
    protocol: 'arduino',
    baudRate: 115200,
    core: 'arduino:avr',
    variant: 'standard',
    architecture: 'avr',
    flashSize: '32KB',
    uploadTool: 'avrdude',
  },
  {
    id: 'mega2560',
    name: 'Arduino Mega 2560 (ATmega2560)',
    fqbn: 'arduino:avr:mega',
    mcu: 'atmega2560',
    fCpu: '16000000L',
    protocol: 'wiring',
    baudRate: 115200,
    core: 'arduino:avr',
    variant: 'mega',
    architecture: 'avr',
    flashSize: '256KB',
    uploadTool: 'avrdude',
  },
  {
    id: 'custom_bot',
    name: 'KT-Bot Pro Differential (Custom AVR)',
    fqbn: 'arduino:avr:nano',
    mcu: 'atmega328p',
    fCpu: '16000000L',
    protocol: 'arduino',
    baudRate: 115200,
    core: 'arduino:avr',
    variant: 'eightanaloginputs',
    architecture: 'avr',
    flashSize: '32KB',
    uploadTool: 'avrdude',
  },
];

export const DEFAULT_DISTANCE_PRESETS = [400, 800, 1200, 1600, 2000, 2400, 2800, 3200];

export const DEFAULT_FAST_KEY_BINDINGS: FastKeyBinding[] = [
  { key: 'f', functionId: 'cmd_ffe', name: 'FFE', description: 'เดินหน้าด้วย Encoder' },
  { key: 'b', functionId: 'cmd_bbe', name: 'BBE', description: 'ถอยหลังด้วย Encoder' },
  { key: 's', functionId: 'cmd_spindegree', name: 'spinDegree', description: 'หมุนตัวด้วยไจโร' },
  { key: 't', functionId: 'cmd_setfront', name: 'SetFront', description: 'จัดหน้าเข้าเส้น' },
  { key: 'p', functionId: 'cmd_dropf', name: 'DropF', description: 'ทิ้งกล่องด้านหน้า' },
  { key: 'w', functionId: 'cmd_waitstart', name: 'wait_start', description: 'รอปุ่มกดเริ่ม' },
  { key: 'm', functionId: 'cmd_motor', name: 'motor', description: 'สั่งมอเตอร์แยกซ้ายขวา' },
  { key: 'c', functionId: 'cmd_crossbridge', name: 'cross_bridge', description: 'ข้ามสะพานเนินชัน' },
];

export interface ConsoleEntry {
  id: string;
  text: string;
  type: 'info' | 'error' | 'success' | 'warn';
  time: string;
}

interface IDEStoreState {
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
  code: string;
  setCode: (code: string) => void;
  insertCodeAtCursor: (snippet: string) => void;
  editorInsertHandler: ((snippet: string) => void) | null;
  setEditorInsertHandler: (handler: (snippet: string) => void) => void;

  // Project Management (Multi-File & Empty Project Support)
  projectName: string;
  setProjectName: (name: string) => void;
  savedProjects: ProjectData[];
  createNewProject: (name: string, templateType?: 'empty' | 'blank' | 'template') => void;
  saveCurrentProject: (customName?: string, silent?: boolean) => void;
  loadSavedProject: (id: string) => void;
  deleteSavedProject: (id: string) => void;
  exportProjectBundle: () => void;
  importProjectBundle: (jsonString: string) => void;
  importProjectFromZipFile: (file: File) => Promise<boolean>;
  exportProjectAsZip: () => Promise<void>;

  // Project & Field Version Snapshots (Bidirectional Linking)
  projectVersions: ProjectVersion[];
  activeVersionId: string | null;
  isVersionModalOpen: boolean;
  setVersionModalOpen: (open: boolean) => void;
  createProjectVersion: (name: string, source?: 'field' | 'code' | 'unified', notes?: string) => ProjectVersion;
  restoreProjectVersion: (versionId: string, restoreMode?: 'both' | 'field' | 'code') => void;
  deleteProjectVersion: (versionId: string) => void;
  renameProjectVersion: (versionId: string, newName: string) => void;

  // Multi-File Arduino Project Support
  projectFiles: SketchFile[];
  activeFileId: string;
  setActiveFileId: (id: string) => void;
  createFile: (name: string, content?: string) => void;
  deleteFile: (id: string) => void;
  renameFile: (id: string, newName: string) => void;
  updateFileContent: (id: string, content: string) => void;
  getActiveFile: () => SketchFile;
  getMainCode: () => string;
  
  boards: BoardDefinition[];
  selectedBoard: BoardDefinition;
  setSelectedBoard: (board: BoardDefinition) => void;

  // Board Manager
  boardManagerUrls: string[];
  addBoardManagerUrl: (url: string) => void;
  isBoardManagerOpen: boolean;
  setBoardManagerOpen: (open: boolean) => void;
  
  // Sketch file & persistence
  currentSketchName: string;
  setCurrentSketchName: (name: string) => void;
  savedSketches: SavedSketch[];
  saveCurrentSketch: (customTitle?: string) => void;
  loadSavedSketch: (id: string) => void;
  deleteSavedSketch: (id: string) => void;
  importSketchCode: (codeContent: string, name?: string) => void;
  exportSketchFile: () => void;
  
  // Full Builder Split Screen Mode
  isBuilderSplitMode: boolean;
  setBuilderSplitMode: (open: boolean) => void;
  toggleBuilderSplitMode: () => void;

  // App & Editor Settings
  editorFontSize: number;
  setEditorFontSize: (size: number) => void;
  editorFontFamily: string;
  setEditorFontFamily: (family: string) => void;
  uiFontFamily: string;
  setUIFontFamily: (family: string) => void;
  uiFontSize: number;
  setUIFontSize: (size: number) => void;
  editorWordWrap: boolean;
  setEditorWordWrap: (wrap: boolean) => void;
  editorMinimap: boolean;
  setEditorMinimap: (show: boolean) => void;
  isSimulationOnLine: boolean;
  setIsSimulationOnLine: (enabled: boolean) => void;
  toggleSimulationOnLine: () => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  resetSettings: () => void;

  ports: SerialPortInfo[];
  selectedPort: string;
  setSelectedPort: (port: string) => void;
  isAutoPortDetect: boolean;
  setIsAutoPortDetect: (enabled: boolean) => void;
  refreshPorts: (silent?: boolean) => Promise<void>;
  compileCode: () => Promise<boolean>;
  uploadFirmware: () => Promise<boolean>;

  buildState: BuildState;
  setBuildState: (state: BuildState) => void;

  // Real-time Execution Tracking & Code Highlighting
  executionStep: ExecutionStepInfo | null;
  setExecutionStep: (step: ExecutionStepInfo | null) => void;

  // Custom Functions & Command Templates
  customFunctions: FunctionTemplateItem[];
  addCustomFunction: (fn: FunctionTemplateItem) => void;
  deleteCustomFunction: (id: string) => void;
  importCustomFunctions: (jsonStr: string) => boolean;
  exportCustomFunctions: () => string;
  resetCustomFunctions: () => void;
  
  consoleLogs: ConsoleEntry[];
  addConsoleLog: (text: string, type?: 'info' | 'error' | 'success' | 'warn') => void;
  clearConsole: () => void;

  // Robot Defaults & Distance Presets (1-8)
  robotDefaultSpeed: number;
  setRobotDefaultSpeed: (spd: number) => void;
  robotDefaultDistance: number;
  setRobotDefaultDistance: (dist: number) => void;
  distancePresets: number[];
  setDistancePreset: (index: number, val: number) => void;
  setDistancePresets: (presets: number[]) => void;
  selectedDistancePresetIndex: number;
  setSelectedDistancePresetIndex: (index: number) => void;

  // Fast Keyboard Entry Mode (Opt-in toggle)
  isFastKeyboardMode: boolean;
  setIsFastKeyboardMode: (enabled: boolean) => void;
  toggleFastKeyboardMode: () => void;
  fastKeyBindings: FastKeyBinding[];
  setFastKeyBindings: (bindings: FastKeyBinding[]) => void;
  updateFastKeyBinding: (key: string, functionId: string) => void;
  addFastKeyBinding: (binding: FastKeyBinding) => void;
  deleteFastKeyBinding: (key: string) => void;
  resetFastKeyBindings: () => void;
  exportFastKeyBindings: () => string;
  importFastKeyBindings: (jsonStr: string) => boolean;

  // Unified Board & Port Modal
  isHardwareModalOpen: boolean;
  setHardwareModalOpen: (open: boolean) => void;

  // Random Arena Generator Modal
  isRandomArenaModalOpen: boolean;
  setRandomArenaModalOpen: (open: boolean) => void;

  // Enterprise Layout Architecture State
  activeSidebarTab: SidebarTab | null;
  setActiveSidebarTab: (tab: SidebarTab | null) => void;
  toggleSidebarTab: (tab: SidebarTab) => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  bottomDockTab: BottomDockTab;
  setBottomDockTab: (tab: BottomDockTab) => void;
  isBottomDockCollapsed: boolean;
  setIsBottomDockCollapsed: (collapsed: boolean) => void;
  toggleBottomDock: () => void;

  // Serial Monitor State
  serialLogs: SerialLogEntry[];
  addSerialLog: (text: string, type?: 'incoming' | 'outgoing' | 'system' | 'error') => void;
  clearSerialLogs: () => void;
  serialBaudRate: number;
  setSerialBaudRate: (baud: number) => void;
  serialLineEnding: 'none' | 'nl' | 'cr' | 'nlcr';
  setSerialLineEnding: (ending: 'none' | 'nl' | 'cr' | 'nlcr') => void;
  isSerialConnected: boolean;
  setIsSerialConnected: (connected: boolean) => void;
  isSerialAutoscroll: boolean;
  setIsSerialAutoscroll: (autoscroll: boolean) => void;
  showSerialTimestamps: boolean;
  setShowSerialTimestamps: (show: boolean) => void;
}

export const INITIAL_PROJECT_FILES: SketchFile[] = [
  {
    id: 'file_main',
    name: 'main.ino',
    content: DEFAULT_MAIN_INO,
    isEntry: true,
  },
  {
    id: 'file_config',
    name: 'robot_config.h',
    content: DEFAULT_ROBOT_CONFIG_H,
  },
  {
    id: 'file_missions',
    name: 'missions.h',
    content: DEFAULT_MISSIONS_H,
  },
];

// Initial saved projects from localStorage or default
function getInitialSavedProjects(): ProjectData[] {
  try {
    const raw = localStorage.getItem('kt_saved_projects');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [
    {
      id: 'proj_default_competition',
      name: 'KT_Bot_Competition',
      files: INITIAL_PROJECT_FILES,
      activeFileId: 'file_main',
      boardId: 'ptbot_atom_vx',
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('th-TH'),
      description: 'โครงงานมาตรฐานภารกิจสนาม 4x8 พร้อมบอร์ด PTBOT Atom VX (ESP32)',
    },
  ];
}

export interface ActiveProjectPersistence {
  projectName: string;
  projectFiles: SketchFile[];
  activeFileId: string;
  code: string;
  boardId?: string;
  projectId?: string;
  settings?: ProjectSettings;
  field?: ProjectFieldData;
  versions?: ProjectVersion[];
}

const LOCAL_STORAGE_ACTIVE_PROJECT_KEY = 'kt_active_project_state';

function getInitialActiveProjectState(): ActiveProjectPersistence {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_PROJECT_KEY);
    if (raw) {
      const parsed: ActiveProjectPersistence = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.projectFiles) && parsed.projectFiles.length > 0) {
        const activeFile = parsed.projectFiles.find((f) => f.id === parsed.activeFileId) || parsed.projectFiles[0];
        return {
          projectName: parsed.projectName || 'Untitled_Project',
          projectFiles: parsed.projectFiles,
          activeFileId: activeFile.id,
          code: parsed.code !== undefined ? parsed.code : activeFile.content,
          boardId: parsed.boardId || 'ptbot_atom_vx',
          projectId: parsed.projectId,
          settings: parsed.settings,
          field: parsed.field,
          versions: parsed.versions,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse active project from localStorage', e);
  }

  // Fallback: Check if there are any saved projects
  const saved = getInitialSavedProjects();
  if (saved.length > 0) {
    const first = saved[0];
    const activeFile = first.files.find((f) => f.id === first.activeFileId) || first.files[0];
    return {
      projectName: first.name,
      projectFiles: first.files,
      activeFileId: activeFile ? activeFile.id : 'file_main',
      code: activeFile ? activeFile.content : DEFAULT_MAIN_INO,
      boardId: first.boardId || 'ptbot_atom_vx',
      projectId: first.id,
      settings: first.settings,
      field: first.field,
      versions: first.versions,
    };
  }

  return {
    projectName: 'KT_Bot_Competition',
    projectFiles: INITIAL_PROJECT_FILES,
    activeFileId: 'file_main',
    code: DEFAULT_MAIN_INO,
    boardId: 'ptbot_atom_vx',
  };
}

function getInitialCustomFunctions(): FunctionTemplateItem[] {
  try {
    const raw = localStorage.getItem('kt_custom_function_library');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_FUNCTION_TEMPLATES;
}

function getInitialDistancePresets(): number[] {
  try {
    const raw = localStorage.getItem('kt_distance_presets');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 8) {
        // Automatically migrate legacy presets [100, 200, 300, 400...] to 1-tile grid multiples [400, 800, 1200...]
        if (parsed[0] === 100 && parsed[1] === 200 && parsed[2] === 300) {
          return [...DEFAULT_DISTANCE_PRESETS];
        }
        return parsed;
      }
    }
  } catch (e) {}
  return [...DEFAULT_DISTANCE_PRESETS];
}

function getInitialFastKeyBindings(): FastKeyBinding[] {
  try {
    const raw = localStorage.getItem('kt_fast_key_bindings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [...DEFAULT_FAST_KEY_BINDINGS];
}

export function persistActiveProject(data: ActiveProjectPersistence) {
  try {
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROJECT_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save active project to localStorage', e);
  }
}

export function applyAndPersistSettings(
  settings: ProjectSettings | undefined,
  set: (partial: any) => void
) {
  if (!settings) return;
  const updates: Record<string, any> = {};

  if (typeof settings.robotDefaultSpeed === 'number') {
    const spd = Math.max(0, Math.min(100, settings.robotDefaultSpeed));
    updates.robotDefaultSpeed = spd;
    try { localStorage.setItem('kt_robot_default_speed', String(spd)); } catch (e) {}
  }

  if (typeof settings.robotDefaultDistance === 'number') {
    const dist = Math.max(0, settings.robotDefaultDistance);
    updates.robotDefaultDistance = dist;
    try { localStorage.setItem('kt_robot_default_distance', String(dist)); } catch (e) {}
  }

  if (Array.isArray(settings.distancePresets) && settings.distancePresets.length === 8) {
    updates.distancePresets = settings.distancePresets;
    try { localStorage.setItem('kt_distance_presets', JSON.stringify(settings.distancePresets)); } catch (e) {}
  }

  if (Array.isArray(settings.customFunctions)) {
    updates.customFunctions = settings.customFunctions;
    try { localStorage.setItem('kt_custom_function_library', JSON.stringify(settings.customFunctions)); } catch (e) {}
  }

  if (typeof settings.isFastKeyboardMode === 'boolean') {
    updates.isFastKeyboardMode = settings.isFastKeyboardMode;
    try { localStorage.setItem('kt_fast_keyboard_mode', String(settings.isFastKeyboardMode)); } catch (e) {}
  }

  if (Array.isArray(settings.fastKeyBindings)) {
    updates.fastKeyBindings = settings.fastKeyBindings;
    try { localStorage.setItem('kt_fast_key_bindings', JSON.stringify(settings.fastKeyBindings)); } catch (e) {}
  }

  if (typeof settings.isSimulationOnLine === 'boolean') {
    updates.isSimulationOnLine = settings.isSimulationOnLine;
    try { localStorage.setItem('kt_settings_sim_on_line', String(settings.isSimulationOnLine)); } catch (e) {}
  }

  if (typeof settings.editorFontSize === 'number') {
    updates.editorFontSize = settings.editorFontSize;
    try { localStorage.setItem('kt_editor_font_size', String(settings.editorFontSize)); } catch (e) {}
  }

  if (typeof settings.editorWordWrap === 'boolean') {
    updates.editorWordWrap = settings.editorWordWrap;
    try { localStorage.setItem('kt_editor_word_wrap', String(settings.editorWordWrap)); } catch (e) {}
  }

  if (typeof settings.editorMinimap === 'boolean') {
    updates.editorMinimap = settings.editorMinimap;
    try { localStorage.setItem('kt_editor_minimap', String(settings.editorMinimap)); } catch (e) {}
  }

  if (settings.editorFontFamily) {
    updates.editorFontFamily = settings.editorFontFamily;
    try { localStorage.setItem('kt_editor_font_family', settings.editorFontFamily); } catch (e) {}
  }

  if (settings.uiFontFamily) {
    updates.uiFontFamily = settings.uiFontFamily;
    try { localStorage.setItem('kt_ui_font_family', settings.uiFontFamily); } catch (e) {}
  }

  if (typeof settings.uiFontSize === 'number') {
    updates.uiFontSize = settings.uiFontSize;
    try { localStorage.setItem('kt_ui_font_size', String(settings.uiFontSize)); } catch (e) {}
  }

  if (Object.keys(updates).length > 0) {
    set(updates);
  }
}

export function getCurrentProjectSettings(state: any): ProjectSettings {
  return {
    robotDefaultSpeed: state.robotDefaultSpeed,
    robotDefaultDistance: state.robotDefaultDistance,
    distancePresets: state.distancePresets,
    customFunctions: state.customFunctions,
    isFastKeyboardMode: state.isFastKeyboardMode,
    fastKeyBindings: state.fastKeyBindings,
    isSimulationOnLine: state.isSimulationOnLine,
    editorFontSize: state.editorFontSize,
    editorFontFamily: state.editorFontFamily,
    uiFontFamily: state.uiFontFamily,
    uiFontSize: state.uiFontSize,
    editorWordWrap: state.editorWordWrap,
    editorMinimap: state.editorMinimap,
  };
}

const initialActiveProject = getInitialActiveProjectState();

// Initial sketches from localStorage or default
function getInitialSavedSketches(): SavedSketch[] {
  try {
    const raw = localStorage.getItem('kt_saved_sketches');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [
    {
      id: 'default_mission',
      title: 'ภารกิจพิชิตสนาม 4x8 (PTBOT)',
      code: DEFAULT_C_CODE,
      updatedAt: new Date().toLocaleDateString('th-TH'),
      boardId: 'ptbot_atom_vx',
    },
    {
      id: 'line_tracker_esp32',
      title: 'ตัวอย่างโค้ดตรวจจับเส้น Line Follower',
      code: `/**
 * PTBOT Atom VX - Line Tracking & Obstacle Challenge
 */
#include <robot_core.h>

void setup() {
  robot_init();
  serial_begin(115200);
  serial_print("PTBOT Atom VX Initialized!\\n");
}

void loop() {
  // Move along grid
  move_grid_forward(2, 65);
  delay_ms(200);
  
  // Turn toward ramp
  turn_degree(DIR_RIGHT, 90, 50);
  delay_ms(200);
  
  // Cross bridge
  cross_bridge(85, 45);
  
  // Drop relief cube
  drop_relief_cube(90);
  
  motor(0, 0);
  while(1) { delay_ms(1000); }
}
`,
      updatedAt: new Date().toLocaleDateString('th-TH'),
      boardId: 'ptbot_atom_vx',
    }
  ];
}

export const applyUIFontGlobally = (family: string) => {
  if (typeof document === 'undefined') return;
  document.body.style.fontFamily = family;
  document.documentElement.style.fontFamily = family;
  let styleTag = document.getElementById('kt-global-ui-font-style');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'kt-global-ui-font-style';
    document.head.appendChild(styleTag);
  }
  styleTag.innerHTML = `
    body, button, input, select, textarea, div:not(.monaco-editor *):not(.font-mono), span:not(.monaco-editor *):not(.font-mono), p, h1, h2, h3, h4, h5, h6, label, a {
      font-family: ${family} !important;
    }
  `;
};

export const useIDEStore = create<IDEStoreState>((set, get) => ({
  mode: 'code',
  setMode: (mode) => set({ mode }),

  // Enterprise Layout Architecture
  // Unified Board & Port Modal
  isHardwareModalOpen: false,
  setHardwareModalOpen: (open) => set({ isHardwareModalOpen: open }),

  // Random Arena Generator Modal
  isRandomArenaModalOpen: false,
  setRandomArenaModalOpen: (open) => set({ isRandomArenaModalOpen: open }),

  activeSidebarTab: 'files',
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  toggleSidebarTab: (tab) =>
    set((state) => ({ activeSidebarTab: state.activeSidebarTab === tab ? null : tab })),
  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
  bottomDockTab: 'terminal',
  setBottomDockTab: (tab) => set({ bottomDockTab: tab, isBottomDockCollapsed: false }),
  isBottomDockCollapsed: false,
  setIsBottomDockCollapsed: (collapsed) => set({ isBottomDockCollapsed: collapsed }),
  toggleBottomDock: () => set((state) => ({ isBottomDockCollapsed: !state.isBottomDockCollapsed })),

  // Serial Monitor State
  serialLogs: [
    {
      id: 'init_1',
      timestamp: new Date().toLocaleTimeString(),
      text: 'Serial Monitor พร้อมทำงาน เลือกพอร์ตและ Baud rate แล้วกด "เชื่อมต่อ"',
      type: 'system',
    },
  ],
  addSerialLog: (text, type = 'incoming') => {
    const entry: SerialLogEntry = {
      id: `ser_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      text,
      type,
    };
    set((state) => ({
      serialLogs: [...state.serialLogs.slice(-999), entry],
    }));
  },
  clearSerialLogs: () => set({ serialLogs: [] }),
  serialBaudRate: 115200,
  setSerialBaudRate: (baud) => set({ serialBaudRate: baud }),
  serialLineEnding: 'nl',
  setSerialLineEnding: (ending) => set({ serialLineEnding: ending }),
  isSerialConnected: false,
  setIsSerialConnected: (connected) => set({ isSerialConnected: connected }),
  isSerialAutoscroll: true,
  setIsSerialAutoscroll: (autoscroll) => set({ isSerialAutoscroll: autoscroll }),
  showSerialTimestamps: true,
  setShowSerialTimestamps: (show) => set({ showSerialTimestamps: show }),

  isBuilderSplitMode: (() => {
    try {
      return localStorage.getItem('kt_builder_split_mode') === 'true';
    } catch (e) {}
    return false;
  })(),
  setBuilderSplitMode: (open) => {
    try {
      localStorage.setItem('kt_builder_split_mode', String(open));
    } catch (e) {}
    set({ isBuilderSplitMode: open });
  },
  toggleBuilderSplitMode: () => {
    const next = !get().isBuilderSplitMode;
    try {
      localStorage.setItem('kt_builder_split_mode', String(next));
    } catch (e) {}
    set({ isBuilderSplitMode: next });
  },

  // App & Editor Settings Implementation
  editorFontSize: (() => {
    try {
      const saved = localStorage.getItem('kt_settings_editor_font_size');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 10 && val <= 36) return val;
      }
    } catch (e) {}
    return 14;
  })(),
  setEditorFontSize: (size) => {
    const clamped = Math.max(10, Math.min(36, size));
    try { localStorage.setItem('kt_settings_editor_font_size', String(clamped)); } catch (e) {}
    set({ editorFontSize: clamped });
  },

  editorFontFamily: (() => {
    try {
      const saved = localStorage.getItem('kt_settings_editor_font_family');
      if (saved) return saved;
    } catch (e) {}
    return "'JetBrains Mono', 'Fira Code', 'Courier New', monospace";
  })(),
  setEditorFontFamily: (family) => {
    try { localStorage.setItem('kt_settings_editor_font_family', family); } catch (e) {}
    set({ editorFontFamily: family });
  },

  uiFontFamily: (() => {
    try {
      const saved = localStorage.getItem('kt_settings_ui_font_family');
      if (saved) {
        if (typeof document !== 'undefined') document.body.style.fontFamily = saved;
        return saved;
      }
    } catch (e) {}
    return "'Kanit', 'Sarabun', 'Inter', -apple-system, sans-serif";
  })(),
  setUIFontFamily: (family) => {
    try {
      localStorage.setItem('kt_settings_ui_font_family', family);
      applyUIFontGlobally(family);
    } catch (e) {}
    set({ uiFontFamily: family });
  },

  uiFontSize: (() => {
    try {
      const saved = localStorage.getItem('kt_settings_ui_font_size');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 11 && val <= 22) {
          if (typeof document !== 'undefined') {
            document.documentElement.style.fontSize = `${val}px`;
          }
          return val;
        }
      }
    } catch (e) {}
    return 14;
  })(),
  setUIFontSize: (size) => {
    const clamped = Math.max(11, Math.min(22, size));
    try {
      localStorage.setItem('kt_settings_ui_font_size', String(clamped));
      if (typeof document !== 'undefined') {
        document.documentElement.style.fontSize = `${clamped}px`;
      }
    } catch (e) {}
    set({ uiFontSize: clamped });
  },

  editorWordWrap: (() => {
    try {
      const saved = localStorage.getItem('kt_settings_word_wrap');
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return true;
  })(),
  setEditorWordWrap: (wrap) => {
    try { localStorage.setItem('kt_settings_word_wrap', String(wrap)); } catch (e) {}
    set({ editorWordWrap: wrap });
  },

  editorMinimap: (() => {
    try {
      const saved = localStorage.getItem('kt_settings_minimap');
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return true;
  })(),
  setEditorMinimap: (show) => {
    try { localStorage.setItem('kt_settings_minimap', String(show)); } catch (e) {}
    set({ editorMinimap: show });
  },

  isSimulationOnLine: (() => {
    try {
      return localStorage.getItem('kt_settings_sim_on_line') === 'true';
    } catch (e) {}
    return false; // Default is OFF as requested
  })(),
  setIsSimulationOnLine: (enabled) => {
    try { localStorage.setItem('kt_settings_sim_on_line', String(enabled)); } catch (e) {}
    set({ isSimulationOnLine: enabled });
  },
  toggleSimulationOnLine: () => {
    const next = !get().isSimulationOnLine;
    try { localStorage.setItem('kt_settings_sim_on_line', String(next)); } catch (e) {}
    set({ isSimulationOnLine: next });
    get().addConsoleLog(
      `[Simulation] ${next ? 'เปิด' : 'ปิด'}ระบบจำลองตามบรรทัดที่เลือก (Simulation on Line)`,
      next ? 'success' : 'info'
    );
  },

  isSettingsOpen: false,
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),

  resetSettings: () => {
    try {
      localStorage.removeItem('kt_settings_editor_font_size');
      localStorage.removeItem('kt_settings_editor_font_family');
      localStorage.removeItem('kt_settings_ui_font_size');
      localStorage.removeItem('kt_settings_ui_font_family');
      localStorage.removeItem('kt_settings_word_wrap');
      localStorage.removeItem('kt_settings_minimap');
      if (typeof document !== 'undefined') {
        document.documentElement.style.fontSize = '14px';
        document.body.style.fontFamily = "'Kanit', 'Sarabun', 'Inter', -apple-system, sans-serif";
      }
    } catch (e) {}
    set({
      editorFontSize: 14,
      editorFontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      uiFontFamily: "'Kanit', 'Sarabun', 'Inter', -apple-system, sans-serif",
      uiFontSize: 14,
      editorWordWrap: true,
      editorMinimap: true,
    });
  },

  // Multi-File Arduino Project State (Persisted with Active Project)
  projectFiles: initialActiveProject.projectFiles,
  activeFileId: initialActiveProject.activeFileId,

  code: initialActiveProject.code,
  setCode: (code) => {
    const activeId = get().activeFileId;
    const updatedFiles = get().projectFiles.map((f) =>
      f.id === activeId ? { ...f, content: code, isModified: true } : f
    );
    set({
      code,
      projectFiles: updatedFiles,
    });
    // Auto-save active project state in real-time
    persistActiveProject({
      projectName: get().projectName,
      projectFiles: updatedFiles,
      activeFileId: activeId,
      code,
      boardId: get().selectedBoard.id,
    });
  },

  setActiveFileId: (id) => {
    const target = get().projectFiles.find((f) => f.id === id);
    if (target) {
      set({ activeFileId: id, code: target.content });
      persistActiveProject({
        projectName: get().projectName,
        projectFiles: get().projectFiles,
        activeFileId: id,
        code: target.content,
        boardId: get().selectedBoard.id,
      });
    }
  },

  createFile: (name, content = '') => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const newId = 'file_' + Date.now();
    const newFile: SketchFile = {
      id: newId,
      name: cleanName,
      content: content || `// ${cleanName}\n#ifndef ${cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}\n#define ${cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}\n\n// Code here\n\n#endif\n`,
    };
    const nextFiles = [...get().projectFiles, newFile];
    set({
      projectFiles: nextFiles,
      activeFileId: newId,
      code: newFile.content,
    });
    persistActiveProject({
      projectName: get().projectName,
      projectFiles: nextFiles,
      activeFileId: newId,
      code: newFile.content,
      boardId: get().selectedBoard.id,
    });
    get().addConsoleLog(`[Project Manager] Created new file: ${cleanName}`, 'success');
  },

  deleteFile: (id) => {
    const files = get().projectFiles;
    if (files.length <= 1) {
      get().addConsoleLog('[Project Manager] Cannot delete the only remaining file.', 'warn');
      return;
    }
    const target = files.find((f) => f.id === id);
    const updated = files.filter((f) => f.id !== id);
    const nextActive = updated[0];
    set({
      projectFiles: updated,
      activeFileId: nextActive.id,
      code: nextActive.content,
    });
    persistActiveProject({
      projectName: get().projectName,
      projectFiles: updated,
      activeFileId: nextActive.id,
      code: nextActive.content,
      boardId: get().selectedBoard.id,
    });
    get().addConsoleLog(`[Project Manager] Deleted file: ${target?.name}`, 'info');
  },

  renameFile: (id, newName) => {
    const clean = newName.trim();
    if (!clean) return;
    const updated = get().projectFiles.map((f) => (f.id === id ? { ...f, name: clean } : f));
    set({
      projectFiles: updated,
    });
    persistActiveProject({
      projectName: get().projectName,
      projectFiles: updated,
      activeFileId: get().activeFileId,
      code: get().code,
      boardId: get().selectedBoard.id,
    });
    get().addConsoleLog(`[Project Manager] Renamed file to: ${clean}`, 'info');
  },

  updateFileContent: (id, content) => {
    const updated = get().projectFiles.map((f) =>
      f.id === id ? { ...f, content, isModified: false } : f
    );
    const newCode = get().activeFileId === id ? content : get().code;
    set({
      projectFiles: updated,
      code: newCode,
    });
    persistActiveProject({
      projectName: get().projectName,
      projectFiles: updated,
      activeFileId: get().activeFileId,
      code: newCode,
      boardId: get().selectedBoard.id,
    });
  },

  getActiveFile: () => {
    const state = get();
    return state.projectFiles.find((f) => f.id === state.activeFileId) || state.projectFiles[0];
  },

  getMainCode: () => {
    const state = get();
    const mainFile = state.projectFiles.find((f) => f.isEntry || f.name.endsWith('.ino') || f.name.endsWith('.c'));
    return mainFile ? mainFile.content : state.code;
  },

  currentSketchName: `${initialActiveProject.projectName}.ino`,
  setCurrentSketchName: (name) => set({ currentSketchName: name }),

  // Project Management Implementation
  projectName: initialActiveProject.projectName,
  setProjectName: (name) => {
    const clean = name.trim() || 'Untitled_Project';
    set({ projectName: clean, currentSketchName: `${clean}.ino` });
    persistActiveProject({
      projectName: clean,
      projectFiles: get().projectFiles,
      activeFileId: get().activeFileId,
      code: get().code,
      boardId: get().selectedBoard.id,
    });
  },
  savedProjects: getInitialSavedProjects(),

  createNewProject: (name, templateType = 'empty') => {
    const cleanName = name.trim() || 'Untitled_Project';
    let initialFiles: SketchFile[] = [];

    if (templateType === 'blank') {
      // 100% blank file
      initialFiles = [
        {
          id: 'file_' + Date.now(),
          name: 'main.ino',
          content: '',
          isEntry: true,
        },
      ];
    } else if (templateType === 'template') {
      // Full competition template
      initialFiles = [
        { id: 'file_main', name: 'main.ino', content: DEFAULT_MAIN_INO, isEntry: true },
        { id: 'file_config', name: 'robot_config.h', content: DEFAULT_ROBOT_CONFIG_H },
        { id: 'file_missions', name: 'missions.h', content: DEFAULT_MISSIONS_H },
      ];
    } else {
      // 'empty' standard Arduino skeleton with setup() and loop()
      initialFiles = [
        {
          id: 'file_' + Date.now(),
          name: 'main.ino',
          content: EMPTY_ARDUINO_INO,
          isEntry: true,
        },
      ];
    }

    set({
      projectName: cleanName,
      currentSketchName: `${cleanName}.ino`,
      projectFiles: initialFiles,
      activeFileId: initialFiles[0].id,
      code: initialFiles[0].content,
    });

    persistActiveProject({
      projectName: cleanName,
      projectFiles: initialFiles,
      activeFileId: initialFiles[0].id,
      code: initialFiles[0].content,
      boardId: get().selectedBoard.id,
    });

    get().addConsoleLog(
      `[Project Manager] สร้างโปรเจกต์ใหม่: "${cleanName}" (${
        templateType === 'blank'
          ? 'ว่างเปล่า 100%'
          : templateType === 'empty'
          ? 'ว่างเปล่ามาตรฐาน Arduino'
          : 'แม่แบบสนามแข่ง 3D'
      }) สำเร็จ!`,
      'success'
    );
  },

  saveCurrentProject: (customName, silent = false) => {
    const state = get();
    const name = (customName || state.projectName).trim() || 'Untitled_Project';

    // Update active file with current editor code
    const updatedFiles = state.projectFiles.map((f) =>
      f.id === state.activeFileId ? { ...f, content: state.code, isModified: false } : { ...f, isModified: false }
    );

    const existingIndex = state.savedProjects.findIndex((p) => p.name === name);
    const nowStr =
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
      ' ' +
      new Date().toLocaleDateString('th-TH');

    const projectId = existingIndex >= 0 ? state.savedProjects[existingIndex].id : 'proj_' + Date.now();
    const currentSettings = getCurrentProjectSettings(state);

    // Capture current arena field from simulator
    const simStore = useSimulatorStore.getState();
    const currentField: ProjectFieldData = {
      name: simStore.fieldName || 'สนามแข่งขัน 4x8',
      tiles: simStore.tiles || [],
      updatedAt: nowStr,
    };

    const projectObj: ProjectData = {
      format: 'ktproj',
      version: '2.1.0',
      id: projectId,
      name,
      files: updatedFiles,
      activeFileId: state.activeFileId,
      boardId: state.selectedBoard.id,
      updatedAt: nowStr,
      description: `โปรเจกต์ ${name} (${updatedFiles.length} ไฟล์ + บันทึกสนาม + ${state.projectVersions.length} เวอร์ชัน)`,
      settings: currentSettings,
      field: currentField,
      versions: state.projectVersions,
    };

    let updatedList: ProjectData[];
    if (existingIndex >= 0) {
      updatedList = [...state.savedProjects];
      updatedList[existingIndex] = projectObj;
    } else {
      updatedList = [projectObj, ...state.savedProjects];
    }

    set({
      projectName: name,
      projectFiles: updatedFiles,
      savedProjects: updatedList,
      currentSketchName: `${name}.ino`,
    });

    try {
      localStorage.setItem('kt_saved_projects', JSON.stringify(updatedList));
    } catch (e) {}

    // Persist as current active project too!
    persistActiveProject({
      projectName: name,
      projectFiles: updatedFiles,
      activeFileId: state.activeFileId,
      code: state.code,
      boardId: state.selectedBoard.id,
      projectId,
      settings: currentSettings,
      field: currentField,
      versions: state.projectVersions,
    });

    if (!silent) {
      state.addConsoleLog(`[Project Manager] บันทึกโปรเจกต์ "${name}" (${updatedFiles.length} ไฟล์ + บันทึกสนามแข่ง + ${state.projectVersions.length} เวอร์ชัน) เรียบร้อยแล้ว`, 'success');
    }
  },

  loadSavedProject: (id) => {
    const proj = get().savedProjects.find((p) => p.id === id);
    if (!proj) return;
    const activeFile = proj.files.find((f) => f.id === proj.activeFileId) || proj.files[0];
    const targetBoard = get().boards.find((b) => b.id === proj.boardId) || get().selectedBoard;

    // Restore field into simulator if present
    if (proj.field && proj.field.tiles && proj.field.tiles.length > 0) {
      useSimulatorStore.getState().setTiles(proj.field.tiles, proj.field.name);
    }

    set({
      projectName: proj.name,
      currentSketchName: `${proj.name}.ino`,
      projectFiles: proj.files,
      activeFileId: activeFile.id,
      code: activeFile.content,
      selectedBoard: targetBoard,
      projectVersions: proj.versions || [],
      activeVersionId: proj.versions && proj.versions.length > 0 ? proj.versions[0].id : null,
    });

    if (proj.settings) {
      applyAndPersistSettings(proj.settings, set);
    }

    persistActiveProject({
      projectName: proj.name,
      projectFiles: proj.files,
      activeFileId: activeFile.id,
      code: activeFile.content,
      boardId: targetBoard.id,
      projectId: proj.id,
      settings: proj.settings || getCurrentProjectSettings(get()),
      field: proj.field,
      versions: proj.versions || [],
    });

    get().addConsoleLog(`[Project Manager] โหลดโปรเจกต์ "${proj.name}" สำเร็จ (${proj.files.length} ไฟล์ + สนามแข่ง + ${proj.versions?.length || 0} เวอร์ชันย่อย)`, 'info');
  },

  deleteSavedProject: (id) => {
    const updated = get().savedProjects.filter((p) => p.id !== id);
    set({ savedProjects: updated });
    try {
      localStorage.setItem('kt_saved_projects', JSON.stringify(updated));
    } catch (e) {}
    get().addConsoleLog('[Project Manager] ลบโปรเจกต์ออกจากประวัติเรียบร้อย', 'warn');
  },

  exportProjectBundle: () => {
    const state = get();
    const files = state.projectFiles.map((f) =>
      f.id === state.activeFileId ? { ...f, content: state.code } : f
    );
    const simStore = useSimulatorStore.getState();
    const bundle: ProjectData = {
      format: 'ktproj',
      version: '2.1.0',
      id: 'proj_' + Date.now(),
      name: state.projectName,
      files,
      activeFileId: state.activeFileId,
      boardId: state.selectedBoard.id,
      updatedAt: new Date().toISOString(),
      description: `KT-Robotics Unified Project Package (Code + Field + Versions)`,
      settings: getCurrentProjectSettings(state),
      field: {
        name: simStore.fieldName || 'สนามแข่งขัน 4x8',
        tiles: simStore.tiles || [],
        updatedAt: new Date().toISOString(),
      },
      versions: state.projectVersions,
    };
    const jsonStr = JSON.stringify(bundle, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${state.projectName}.ktproj`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    state.addConsoleLog(`[Project Manager] ส่งออกโปรเจกต์รวม "${state.projectName}.ktproj" (โค้ด ${files.length} ไฟล์ + สนามแข่ง + ${state.projectVersions.length} เวอร์ชัน) เรียบร้อย`, 'success');
  },

  importProjectBundle: (jsonString) => {
    try {
      const data: ProjectData = JSON.parse(jsonString);
      if (!data.files || !Array.isArray(data.files) || data.files.length === 0) {
        throw new Error('โครงสร้างไฟล์โปรเจกต์ไม่ถูกต้อง');
      }
      const name = data.name || 'Imported_Project';
      const activeFile = data.files.find((f: any) => f.id === data.activeFileId) || data.files[0];
      const targetBoard = get().boards.find((b) => b.id === data.boardId) || get().selectedBoard;

      // Restore field if present in package
      if (data.field && data.field.tiles && data.field.tiles.length > 0) {
        useSimulatorStore.getState().setTiles(data.field.tiles, data.field.name);
      }

      set({
        projectName: name,
        projectFiles: data.files,
        activeFileId: activeFile.id,
        code: activeFile.content,
        selectedBoard: targetBoard,
        currentSketchName: `${name}.ino`,
        projectVersions: data.versions || [],
        activeVersionId: data.versions && data.versions.length > 0 ? data.versions[0].id : null,
      });

      if (data.settings) {
        applyAndPersistSettings(data.settings, set);
      }

      get().saveCurrentProject(name);
      get().addConsoleLog(`[Project Manager] นำเข้าโปรเจกต์รวม "${name}" สำเร็จ (${data.files.length} ไฟล์ + สนามแข่ง + ${data.versions?.length || 0} เวอร์ชันย่อย)`, 'success');
    } catch (err: any) {
      get().addConsoleLog(`[Project Manager] ไม่สามารถนำเข้าโปรเจกต์ได้: ${err.message}`, 'error');
    }
  },

  importProjectFromZipFile: async (file: File) => {
    try {
      get().addConsoleLog(`[Project Manager] กำลังแตกไฟล์และอ่านข้อมูลจาก ZIP "${file.name}"...`, 'info');
      const result = await extractProjectFromZip(file, file.name);
      const targetBoard = get().boards.find((b) => b.id === result.boardId) || get().selectedBoard;
      const activeFile = result.files.find((f) => f.id === result.activeFileId) || result.files[0];

      // Restore arena from manifest field or arenaJson
      if (result.field && result.field.tiles) {
        useSimulatorStore.getState().setTiles(result.field.tiles, result.field.name);
      } else if (result.arenaJson) {
        useSimulatorStore.getState().loadArenaJson(result.arenaJson);
      }

      set({
        projectName: result.projectName,
        projectFiles: result.files,
        activeFileId: activeFile.id,
        code: activeFile.content,
        selectedBoard: targetBoard,
        currentSketchName: activeFile.name,
        projectVersions: result.versions || [],
        activeVersionId: result.versions && result.versions.length > 0 ? result.versions[0].id : null,
      });

      // Restore bundled settings if present in zip
      if (result.settings) {
        applyAndPersistSettings(result.settings, set);
      }

      get().saveCurrentProject(result.projectName);

      const fileListStr = result.files.map((f) => f.name).join(', ');
      get().addConsoleLog(
        `[Project Manager] เปิดโปรเจกต์จาก ZIP "${result.projectName}" สำเร็จ! (${result.files.length} ไฟล์: ${fileListStr}${result.field ? ' + สนามแข่ง' : ''}${result.versions?.length ? ` + ${result.versions.length} เวอร์ชัน` : ''})`,
        'success'
      );
      return true;
    } catch (err: any) {
      get().addConsoleLog(`[Project Manager] ไม่สามารถเปิดไฟล์ ZIP ได้: ${err.message}`, 'error');
      return false;
    }
  },

  exportProjectAsZip: async () => {
    try {
      const state = get();
      const files = state.projectFiles.map((f) =>
        f.id === state.activeFileId ? { ...f, content: state.code } : f
      );
      const simStore = useSimulatorStore.getState();
      const currentField: ProjectFieldData = {
        name: simStore.fieldName || 'สนามแข่งขัน 4x8',
        tiles: simStore.tiles || [],
        updatedAt: new Date().toISOString(),
      };

      state.addConsoleLog(`[Project Manager] กำลังบีบอัดโปรเจกต์รวม "${state.projectName}.zip"...`, 'info');
      const zipBlob = await exportProjectToZipBlob(
        state.projectName,
        files,
        state.selectedBoard.id,
        simStore.saveArenaJson(),
        getCurrentProjectSettings(state),
        currentField,
        state.projectVersions
      );

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${state.projectName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      state.addConsoleLog(
        `[Project Manager] ส่งออกไฟล์โปรเจกต์รวม "${state.projectName}.zip" (${files.length} ไฟล์ + สนามแข่ง + ${state.projectVersions.length} เวอร์ชัน) เรียบร้อย`,
        'success'
      );
    } catch (err: any) {
      get().addConsoleLog(`[Project Manager] เกิดข้อผิดพลาดในการส่งออก ZIP: ${err.message}`, 'error');
    }
  },

  savedSketches: getInitialSavedSketches(),

  saveCurrentSketch: (customTitle) => {
    const title = customTitle || get().currentSketchName;
    const newSketch: SavedSketch = {
      id: 'sketch_' + Date.now(),
      title,
      code: get().code,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('th-TH'),
      boardId: get().selectedBoard.id,
    };
    const updated = [newSketch, ...get().savedSketches.filter(s => s.title !== title)];
    set({ savedSketches: updated, currentSketchName: title });
    try {
      localStorage.setItem('kt_saved_sketches', JSON.stringify(updated));
    } catch(e) {}
    get().saveCurrentProject(title.replace(/\.[^/.]+$/, ''));
    get().addConsoleLog(`[File Manager] บันทึกโค้ดและโปรเจกต์ "${title}" ลงเครื่องเรียบร้อยแล้ว`, 'success');
  },

  loadSavedSketch: (id) => {
    const sk = get().savedSketches.find(s => s.id === id);
    if (sk) {
      set({ code: sk.code, currentSketchName: sk.title });
      get().addConsoleLog(`[File Manager] โหลดโค้ด "${sk.title}" สำเร็จ`, 'info');
    }
  },

  deleteSavedSketch: (id) => {
    const updated = get().savedSketches.filter(s => s.id !== id);
    set({ savedSketches: updated });
    try {
      localStorage.setItem('kt_saved_sketches', JSON.stringify(updated));
    } catch(e) {}
    get().addConsoleLog(`[File Manager] ลบโปรเจกต์ออกจากประวัติเรียบร้อย`, 'warn');
  },

  importSketchCode: (codeContent, name) => {
    const sketchName = name || 'imported_sketch.c';
    set({ code: codeContent, currentSketchName: sketchName });
    get().saveCurrentSketch(sketchName);
    get().addConsoleLog(`[File Manager] อัปโหลดโค้ดชุดใหม่ "${sketchName}" สำเร็จ พร้อมใช้งาน!`, 'success');
  },

  exportSketchFile: () => {
    const code = get().code;
    const filename = get().currentSketchName.endsWith('.c') || get().currentSketchName.endsWith('.ino') 
      ? get().currentSketchName 
      : `${get().currentSketchName}.c`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    get().addConsoleLog(`[File Manager] บันทึกไฟล์ "${filename}" ดาวน์โหลดลงเครื่องเรียบร้อย`, 'success');
  },

  // Project & Field Version Snapshots (Bidirectional Linking)
  projectVersions: initialActiveProject.versions || [],
  activeVersionId: initialActiveProject.versions && initialActiveProject.versions.length > 0 ? initialActiveProject.versions[0].id : null,
  isVersionModalOpen: false,
  setVersionModalOpen: (open) => set({ isVersionModalOpen: open }),

  createProjectVersion: (name, source = 'unified', notes = '') => {
    const state = get();
    const simStore = useSimulatorStore.getState();
    const currentTiles = simStore.tiles || [];
    const currentFieldName = simStore.fieldName || 'สนามแข่งขัน 4x8';

    // Count non-empty tiles
    const activeTileCount = currentTiles.filter((t) => t.type !== 'normal').length;

    // Snapshot of active files
    const filesSnapshot = state.projectFiles.map((f) =>
      f.id === state.activeFileId ? { ...f, content: state.code, isModified: false } : { ...f, isModified: false }
    );

    const nextVerIndex = state.projectVersions.length + 1;
    const versionTag = `v1.${nextVerIndex - 1}`;

    // Main snippet preview
    const mainFile = filesSnapshot.find((f) => f.id === state.activeFileId) || filesSnapshot[0];
    const snippet = mainFile ? mainFile.content.slice(0, 180) : '';

    const newVersion: ProjectVersion = {
      id: `ver_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      versionTag,
      name: name.trim() || `เวอร์ชัน ${versionTag}`,
      timestamp:
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        ' ' +
        new Date().toLocaleDateString('th-TH'),
      createdFrom: source,
      field: {
        name: currentFieldName,
        tiles: JSON.parse(JSON.stringify(currentTiles)),
        tileCount: activeTileCount,
        description: `สนาม ${currentFieldName} (${activeTileCount} อุปกรณ์/ชิ้นส่วน)`,
      },
      code: {
        files: filesSnapshot,
        activeFileId: state.activeFileId,
        fileCount: filesSnapshot.length,
        mainSnippet: snippet,
      },
      notes: notes.trim(),
    };

    const updatedVersions = [newVersion, ...state.projectVersions];
    set({
      projectVersions: updatedVersions,
      activeVersionId: newVersion.id,
    });

    state.saveCurrentProject(state.projectName, true);

    state.addConsoleLog(
      `[Version System] บันทึกเวอร์ชัน "${newVersion.versionTag} - ${newVersion.name}" สำเร็จ (บันทึกสนาม ${activeTileCount} ช่อง + ลิ้งค์โค้ด ${filesSnapshot.length} ไฟล์)`,
      'success'
    );

    return newVersion;
  },

  restoreProjectVersion: (versionId, restoreMode = 'both') => {
    const ver = get().projectVersions.find((v) => v.id === versionId);
    if (!ver) return;

    // 1. Restore Code if mode is 'both' or 'code'
    if (restoreMode === 'both' || restoreMode === 'code') {
      if (ver.code && ver.code.files && ver.code.files.length > 0) {
        const activeFile = ver.code.files.find((f) => f.id === ver.code.activeFileId) || ver.code.files[0];
        set({
          projectFiles: ver.code.files,
          activeFileId: activeFile.id,
          code: activeFile.content,
          currentSketchName: activeFile.name,
        });
        get().addConsoleLog(`[Version System] คืนค่าโค้ดจากเวอร์ชัน "${ver.versionTag}: ${ver.name}" (${ver.code.files.length} ไฟล์) เรียบร้อย`, 'info');
      }
    }

    // 2. Restore Field if mode is 'both' or 'field'
    if (restoreMode === 'both' || restoreMode === 'field') {
      if (ver.field && ver.field.tiles && ver.field.tiles.length > 0) {
        useSimulatorStore.getState().setTiles(ver.field.tiles, ver.field.name);
        get().addConsoleLog(`[Version System] คืนค่าสนามจากเวอร์ชัน "${ver.versionTag}: ${ver.name}" (${ver.field.name}) เรียบร้อย`, 'info');
      }
    }

    set({ activeVersionId: ver.id });

    if (restoreMode === 'both') {
      get().addConsoleLog(`[Version System] โหลดข้อมูลทั้งสนามและโค้ดของเวอร์ชัน "${ver.versionTag}: ${ver.name}" พร้อมกันสำเร็จ`, 'success');
    }
  },

  deleteProjectVersion: (versionId) => {
    const updated = get().projectVersions.filter((v) => v.id !== versionId);
    set({
      projectVersions: updated,
      activeVersionId: get().activeVersionId === versionId ? (updated[0]?.id || null) : get().activeVersionId,
    });
    get().saveCurrentProject(get().projectName, true);
    get().addConsoleLog('[Version System] ลบประวัติเวอร์ชันเรียบร้อยแล้ว', 'warn');
  },

  renameProjectVersion: (versionId, newName) => {
    if (!newName.trim()) return;
    const updated = get().projectVersions.map((v) =>
      v.id === versionId ? { ...v, name: newName.trim() } : v
    );
    set({ projectVersions: updated });
    get().saveCurrentProject(get().projectName, true);
    get().addConsoleLog(`[Version System] เปลี่ยนชื่อเวอร์ชันเป็น "${newName.trim()}" เรียบร้อย`, 'info');
  },

  // Board Manager state
  boardManagerUrls: [
    'https://raw.githubusercontent.com/pt-robotics/esp32/refs/heads/main/package_ptbot_index.json'
  ],
  addBoardManagerUrl: (url) => {
    if (!get().boardManagerUrls.includes(url)) {
      set((s) => ({ boardManagerUrls: [...s.boardManagerUrls, url] }));
      get().addConsoleLog(`[Boards Manager] Added package index URL: ${url}`, 'info');
    }
  },
  isBoardManagerOpen: false,
  setBoardManagerOpen: (open) => set({ isBoardManagerOpen: open }),

  editorInsertHandler: null,
  setEditorInsertHandler: (handler) => set({ editorInsertHandler: handler }),
  insertCodeAtCursor: (snippet) => {
    const handler = get().editorInsertHandler;
    if (handler) {
      handler(snippet);
    } else {
      set((state) => ({ code: state.code + '\n' + snippet }));
    }
    get().addConsoleLog(`[Quick Macro] Inserted: ${snippet.trim()}`, 'info');
  },

  boards: AVAILABLE_BOARDS,
  selectedBoard: AVAILABLE_BOARDS.find((b) => b.id === initialActiveProject.boardId) || AVAILABLE_BOARDS[0],
  setSelectedBoard: (board) => {
    set({ selectedBoard: board });
    persistActiveProject({
      projectName: get().projectName,
      projectFiles: get().projectFiles,
      activeFileId: get().activeFileId,
      code: get().code,
      boardId: board.id,
    });
  },

  ports: [],
  selectedPort: '',
  setSelectedPort: (port) => set({ selectedPort: port }),
  isAutoPortDetect: true,
  setIsAutoPortDetect: (enabled) => set({ isAutoPortDetect: enabled }),

  refreshPorts: async (silent = false) => {
    try {
      const res = await fetch('/api/ports');
      const data = await res.json();
      if (data.success && Array.isArray(data.ports)) {
        const currentPorts = get().ports;
        const newPorts: SerialPortInfo[] = data.ports.map((p: any) => ({
          portName: p.portName,
          description: p.description,
          hardwareId: p.hardwareId,
        }));

        const previousNames = new Set(currentPorts.map((p) => p.portName));
        const newlyConnected = newPorts.find((p) => !previousNames.has(p.portName));

        set({ ports: newPorts });

        // Auto-select logic
        if (newlyConnected) {
          set({ selectedPort: newlyConnected.portName });
          get().addConsoleLog(
            `[Auto-Detect] ตรวจพบบอร์ดบนพอร์ต ${newlyConnected.portName} (${newlyConnected.description}) เชื่อมต่ออัตโนมัติ!`,
            'success'
          );
        } else if (newPorts.length > 0 && (!get().selectedPort || !newPorts.some((p) => p.portName === get().selectedPort))) {
          set({ selectedPort: newPorts[0].portName });
          if (!silent) {
            get().addConsoleLog(`[Auto-Detect] เลือกพอร์ต ${newPorts[0].portName} (${newPorts[0].description})`, 'info');
          }
        } else if (!silent) {
          get().addConsoleLog(
            `[Auto-Detect] ตรวจสอบพอร์ตเชื่อมต่อแล้ว พบ ${newPorts.length} พอร์ต (${newPorts.map((p) => p.portName).join(', ') || 'ไม่มี'})`,
            'info'
          );
        }
      }
    } catch (e: any) {
      if (!silent) {
        get().addConsoleLog(`[Auto-Detect] ไม่สามารถค้นหาพอร์ต: ${e.message}`, 'warn');
      }
    }
  },

  compileCode: async () => {
    const state = get();
    const board = state.selectedBoard;
    const fqbn = board.fqbn || (board.architecture === 'esp32' ? 'PTBOT_ESP32:esp32:atom_vx' : 'arduino:avr:uno');

    state.setBuildState('compiling');
    state.addConsoleLog(`[Toolchain] เริ่มต้นคอมไพล์โค้ดสำหรับ ${board.name} (FQBN: ${fqbn})...`, 'info');

    const files = state.projectFiles.map((f) =>
      f.id === state.activeFileId ? { ...f, content: state.code } : f
    );

    try {
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fqbn,
          projectName: state.projectName,
          files: files.map((f) => ({ name: f.name, content: f.content })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.log) {
          const lines = data.log.trim().split('\n');
          lines.forEach((line: string) => {
            if (line.trim()) state.addConsoleLog(`  ${line.trim()}`, 'info');
          });
        }
        const flashMsg = data.flashUsed ? `Flash: ${data.flashUsed.toLocaleString()} / ${data.flashTotal?.toLocaleString()} bytes` : '';
        const ramMsg = data.ramUsed ? `RAM: ${data.ramUsed.toLocaleString()} / ${data.ramTotal?.toLocaleString()} bytes` : '';
        state.addConsoleLog(`[Compiler] คอมไพล์โปรแกรมสำเร็จเรียบร้อย! ${flashMsg} ${ramMsg}`, 'success');
        state.setBuildState('success');
        return true;
      } else {
        state.addConsoleLog(`[Compiler] คอมไพล์ไม่ผ่าน กรุณาตรวจสอบโค้ด:`, 'error');
        if (data.log) {
          const lines = data.log.trim().split('\n');
          lines.forEach((line: string) => {
            if (line.trim()) state.addConsoleLog(`  ${line.trim()}`, 'error');
          });
        }
        if (data.error) {
          state.addConsoleLog(`  ${data.error}`, 'error');
        }
        state.setBuildState('error');
        return false;
      }
    } catch (err: any) {
      state.addConsoleLog(`[Compiler] ไม่สามารถเชื่อมต่อกับคอมไพเลอร์: ${err.message}`, 'error');
      state.setBuildState('error');
      return false;
    }
  },

  uploadFirmware: async () => {
    const state = get();
    let port = state.selectedPort;

    // Check port
    if (!port || port === 'NONE') {
      await state.refreshPorts(true);
      const updated = get();
      if (updated.ports.length > 0) {
        port = updated.ports[0].portName;
        state.setSelectedPort(port);
      } else {
        state.addConsoleLog(
          `[Upload] ไม่พบพอร์ต USB ที่เชื่อมต่ออยู่ กรุณาเสียบสาย USB ของหุ่นยนต์/บอร์ดเข้ากับเครื่อง`,
          'error'
        );
        state.setBuildState('error');
        return false;
      }
    }

    const board = state.selectedBoard;
    const fqbn = board.fqbn || (board.architecture === 'esp32' ? 'PTBOT_ESP32:esp32:atom_vx' : 'arduino:avr:uno');

    state.setBuildState('uploading');
    state.addConsoleLog(`[Upload] กำลังคอมไพล์และอัปโหลดไปยัง ${port} (${board.name})...`, 'info');

    const files = state.projectFiles.map((f) =>
      f.id === state.activeFileId ? { ...f, content: state.code } : f
    );

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          port,
          fqbn,
          projectName: state.projectName,
          files: files.map((f) => ({ name: f.name, content: f.content })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.log) {
          const lines = data.log.trim().split('\n');
          lines.forEach((line: string) => {
            if (line.trim()) state.addConsoleLog(`  ${line.trim()}`, 'info');
          });
        }
        state.addConsoleLog(`[Upload] อัปโหลดเฟิร์มแวร์เข้าบอร์ด ${board.name} บน ${port} สำเร็จ 100%!`, 'success');
        state.setBuildState('success');
        return true;
      } else {
        state.addConsoleLog(`[Upload] การอัปโหลดล้มเหลว:`, 'error');
        if (data.log) {
          const lines = data.log.trim().split('\n');
          lines.forEach((line: string) => {
            if (line.trim()) state.addConsoleLog(`  ${line.trim()}`, 'error');
          });
        }
        if (data.error) {
          state.addConsoleLog(`  ${data.error}`, 'error');
        }
        state.setBuildState('error');
        return false;
      }
    } catch (err: any) {
      state.addConsoleLog(`[Upload] เกิดข้อผิดพลาดในการเชื่อมต่ออัปโหลด: ${err.message}`, 'error');
      state.setBuildState('error');
      return false;
    }
  },

  buildState: 'idle',
  setBuildState: (buildState) => set({ buildState }),

  // Real-time Execution Tracking & Code Highlighting
  executionStep: null,
  setExecutionStep: (step) => {
    set({ executionStep: step });
    // Automatically switch active tab / file if execution steps into a different file!
    if (step && step.fileId && step.fileId !== get().activeFileId) {
      const target = get().projectFiles.find((f) => f.id === step.fileId);
      if (target) {
        set({ activeFileId: step.fileId, code: target.content });
      }
    }
  },

  // Custom Functions & Command Templates
  customFunctions: getInitialCustomFunctions(),
  addCustomFunction: (fn) => {
    const updated = [fn, ...get().customFunctions.filter((f) => f.id !== fn.id)];
    set({ customFunctions: updated });
    try {
      localStorage.setItem('kt_custom_function_library', JSON.stringify(updated));
    } catch (e) {}
    get().addConsoleLog(`[Function Builder] เพิ่มฟังก์ชั่น "${fn.name}" เข้าสู่คลังเรียบร้อย`, 'success');
  },
  deleteCustomFunction: (id) => {
    const updated = get().customFunctions.filter((f) => f.id !== id);
    set({ customFunctions: updated });
    try {
      localStorage.setItem('kt_custom_function_library', JSON.stringify(updated));
    } catch (e) {}
    get().addConsoleLog(`[Function Builder] ลบฟังก์ชั่นออกจากคลังเรียบร้อย`, 'info');
  },
  importCustomFunctions: (jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        set({ customFunctions: parsed });
        try {
          localStorage.setItem('kt_custom_function_library', JSON.stringify(parsed));
        } catch (e) {}
        get().addConsoleLog(`[Function Builder] นำเข้าชุดฟังก์ชั่นสำเร็จ (${parsed.length} รายการ)`, 'success');
        return true;
      }
      return false;
    } catch (e: any) {
      get().addConsoleLog(`[Function Builder] นำเข้าไม่สำเร็จ: ${e.message}`, 'error');
      return false;
    }
  },
  exportCustomFunctions: () => {
    const data = JSON.stringify(get().customFunctions, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kt_functions_library_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    get().addConsoleLog(`[Function Builder] ส่งออกไฟล์ชุดฟังก์ชั่นดาวน์โหลดลงเครื่องเรียบร้อย`, 'success');
    return data;
  },
  resetCustomFunctions: () => {
    set({ customFunctions: DEFAULT_FUNCTION_TEMPLATES });
    try {
      localStorage.setItem('kt_custom_function_library', JSON.stringify(DEFAULT_FUNCTION_TEMPLATES));
    } catch (e) {}
    get().addConsoleLog(`[Function Builder] รีเซ็ตชุดคำสั่งเริ่มต้นเรียบร้อย`, 'info');
  },

  // Robot Defaults & Distance Presets (1-8)
  robotDefaultSpeed: (() => {
    try {
      const saved = localStorage.getItem('kt_robot_default_speed');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 0 && val <= 100) return val;
      }
    } catch (e) {}
    return 60;
  })(),
  setRobotDefaultSpeed: (spd) => {
    const clamped = Math.max(0, Math.min(100, spd));
    try { localStorage.setItem('kt_robot_default_speed', String(clamped)); } catch (e) {}
    set({ robotDefaultSpeed: clamped });
  },

  robotDefaultDistance: (() => {
    try {
      const saved = localStorage.getItem('kt_robot_default_distance');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 0) return val;
      }
    } catch (e) {}
    return 400;
  })(),
  setRobotDefaultDistance: (dist) => {
    const clamped = Math.max(0, dist);
    try { localStorage.setItem('kt_robot_default_distance', String(clamped)); } catch (e) {}
    set({ robotDefaultDistance: clamped });
  },

  distancePresets: getInitialDistancePresets(),
  setDistancePreset: (index, val) => {
    if (index < 0 || index >= 8) return;
    const next = [...get().distancePresets];
    next[index] = val;
    set({ distancePresets: next });
    try { localStorage.setItem('kt_distance_presets', JSON.stringify(next)); } catch (e) {}
  },
  setDistancePresets: (presets) => {
    if (presets.length !== 8) return;
    set({ distancePresets: presets });
    try { localStorage.setItem('kt_distance_presets', JSON.stringify(presets)); } catch (e) {}
  },

  selectedDistancePresetIndex: (() => {
    try {
      const saved = localStorage.getItem('kt_selected_distance_preset_idx');
      if (saved !== null) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 0 && val < 8) return val;
      }
    } catch (e) {}
    return 0; // Default to preset 1
  })(),
  setSelectedDistancePresetIndex: (index: number) => {
    const clamped = Math.max(0, Math.min(7, index));
    set({ selectedDistancePresetIndex: clamped });
    try { localStorage.setItem('kt_selected_distance_preset_idx', String(clamped)); } catch (e) {}
  },

  // Fast Keyboard Entry Mode
  isFastKeyboardMode: (() => {
    try {
      return localStorage.getItem('kt_fast_keyboard_mode') === 'true';
    } catch (e) {}
    return false;
  })(),
  setIsFastKeyboardMode: (enabled) => {
    try { localStorage.setItem('kt_fast_keyboard_mode', String(enabled)); } catch (e) {}
    set({ isFastKeyboardMode: enabled });
  },
  toggleFastKeyboardMode: () => {
    const next = !get().isFastKeyboardMode;
    try { localStorage.setItem('kt_fast_keyboard_mode', String(next)); } catch (e) {}
    set({ isFastKeyboardMode: next });
  },

  fastKeyBindings: getInitialFastKeyBindings(),
  setFastKeyBindings: (bindings) => {
    set({ fastKeyBindings: bindings });
    try { localStorage.setItem('kt_fast_key_bindings', JSON.stringify(bindings)); } catch (e) {}
  },
  updateFastKeyBinding: (key, functionId) => {
    const fn = get().customFunctions.find((f) => f.id === functionId);
    const updated = get().fastKeyBindings.map((b) =>
      b.key.toLowerCase() === key.toLowerCase()
        ? {
            ...b,
            functionId,
            name: fn ? fn.name : b.name,
            description: fn ? fn.description : b.description,
          }
        : b
    );
    set({ fastKeyBindings: updated });
    try { localStorage.setItem('kt_fast_key_bindings', JSON.stringify(updated)); } catch (e) {}
  },
  addFastKeyBinding: (binding) => {
    const current = get().fastKeyBindings;
    const exists = current.some((b) => b.key.toLowerCase() === binding.key.toLowerCase());
    let nextList: FastKeyBinding[];
    if (exists) {
      nextList = current.map((b) =>
        b.key.toLowerCase() === binding.key.toLowerCase() ? { ...b, ...binding } : b
      );
    } else {
      nextList = [...current, binding];
    }
    set({ fastKeyBindings: nextList });
    try { localStorage.setItem('kt_fast_key_bindings', JSON.stringify(nextList)); } catch (e) {}
  },
  deleteFastKeyBinding: (key) => {
    const nextList = get().fastKeyBindings.filter((b) => b.key.toLowerCase() !== key.toLowerCase());
    set({ fastKeyBindings: nextList });
    try { localStorage.setItem('kt_fast_key_bindings', JSON.stringify(nextList)); } catch (e) {}
  },
  resetFastKeyBindings: () => {
    set({ fastKeyBindings: [...DEFAULT_FAST_KEY_BINDINGS] });
    try { localStorage.setItem('kt_fast_key_bindings', JSON.stringify(DEFAULT_FAST_KEY_BINDINGS)); } catch (e) {}
    get().addConsoleLog('[Fast Mode] รีเซ็ตปุ่มลัดคีย์บอร์ดกลับสู่ค่าเริ่มต้นเรียบร้อย', 'info');
  },
  exportFastKeyBindings: () => {
    const data = JSON.stringify(get().fastKeyBindings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kt_fast_keybindings_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    get().addConsoleLog('[Fast Mode] ส่งออกปุ่มลัดคีย์บอร์ด (.json) เรียบร้อย', 'success');
    return data;
  },
  importFastKeyBindings: (jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        set({ fastKeyBindings: parsed });
        try { localStorage.setItem('kt_fast_key_bindings', JSON.stringify(parsed)); } catch (e) {}
        get().addConsoleLog(`[Fast Mode] นำเข้าปุ่มลัดคีย์บอร์ดสำเร็จ (${parsed.length} ปุ่ม)`, 'success');
        return true;
      }
      return false;
    } catch (e: any) {
      get().addConsoleLog(`[Fast Mode] นำเข้าปุ่มลัดไม่สำเร็จ: ${e.message}`, 'error');
      return false;
    }
  },

  consoleLogs: [
    {
      id: 'init-1',
      text: 'KT Robotics Offline C IDE & 4x8 Simulator Initialized.',
      type: 'info',
      time: new Date().toLocaleTimeString(),
    },
    {
      id: 'init-2',
      text: 'Offline Mode: 100% Zero-Internet Bundled Toolchain active.',
      type: 'success',
      time: new Date().toLocaleTimeString(),
    },
  ],
  addConsoleLog: (text, type = 'info') =>
    set((state) => ({
      consoleLogs: [
        ...state.consoleLogs,
        {
          id: Math.random().toString(36).substring(2, 9),
          text,
          type,
          time: new Date().toLocaleTimeString(),
        },
      ],
    })),
  clearConsole: () => set({ consoleLogs: [] }),
}));

if (typeof window !== 'undefined') {
  (window as any).__kt_useIDEStore = useIDEStore;
  if (initialActiveProject.field && Array.isArray(initialActiveProject.field.tiles) && initialActiveProject.field.tiles.length > 0) {
    setTimeout(() => {
      try {
        useSimulatorStore.getState().setTiles(initialActiveProject.field!.tiles, initialActiveProject.field!.name);
      } catch (e) {}
    }, 50);
  }
}
